import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

export const supabase = createClient(supabaseUrl, supabaseKey);

const isMock = supabaseUrl.includes('placeholder');

function isTableNotFound(err) {
  if (!err) return false;
  if (err.code === 'PGRST116') return true;
  if (typeof err === 'object' && (err.status === 404 || err.statusCode === 404)) return true;
  return false;
}

const readMockDb = (table) => {
  const data = localStorage.getItem(`mock_db_${table}`);
  return data ? JSON.parse(data) : [];
};

const writeMockDb = (table, data) => {
  localStorage.setItem(`mock_db_${table}`, JSON.stringify(data));
};

async function withFallback(fn, fallback) {
  if (isMock) return fallback();
  try {
    return await fn();
  } catch (err) {
    if (isTableNotFound(err)) return fallback();
    throw err;
  }
}

export const ensureProfile = async (walletAddress, alias = null) => {
  if (isMock) {
    return { wallet_address: walletAddress, alias: alias || 'Anonymous' };
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('wallet_address', walletAddress)
    .maybeSingle();
  if (error && !isTableNotFound(error)) throw error;
  if (data) {
    if (alias && data.alias !== alias) {
      await supabase
        .from('profiles')
        .update({ alias })
        .eq('wallet_address', walletAddress);
      return { wallet_address: walletAddress, alias };
    }
    return data;
  }
  const { data: newProfile, error: insertError } = await supabase
    .from('profiles')
    .insert([{ wallet_address: walletAddress, alias: alias || 'Anonymous' }])
    .select()
    .single();
  if (insertError) throw insertError;
  return newProfile;
};

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const createExpensePool = async (name, createdByAddress) => {
  if (isMock) return { id: `mock-pool-${Date.now()}`, name, created_by: createdByAddress, invite_code: generateInviteCode() };
  const inviteCode = generateInviteCode();
  const { data, error } = await supabase
    .from('expense_pools')
    .insert([{ name, created_by: createdByAddress, invite_code: inviteCode }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const ensurePoolInviteCode = async (poolId, name, createdBy) => {
  if (isMock) return `MOCK${poolId}`;
  const { data: existing } = await supabase
    .from('expense_pools')
    .select('invite_code')
    .eq('id', poolId)
    .maybeSingle();
  if (existing?.invite_code) return existing.invite_code;
  const code = generateInviteCode();
  const record = { id: poolId, name: name || `Pool ${poolId}`, invite_code: code };
  if (createdBy) record.created_by = createdBy;
  const { error } = await supabase.from('expense_pools').upsert(record, { onConflict: 'id' });
  if (error && !isTableNotFound(error)) throw error;
  return code;
};

export const getPoolIdByInviteCode = async (code) => {
  if (isMock) {
    const pools = readMockDb('expense_pools');
    return pools.find(p => p.invite_code === code) || null;
  }
  const { data, error } = await supabase
    .from('expense_pools')
    .select('id, name, created_by')
    .eq('invite_code', code)
    .maybeSingle();
  if (error && !isTableNotFound(error)) throw error;
  return data;
};

export const getInviteCodeForPool = async (poolId) => {
  if (isMock) {
    const pools = readMockDb('expense_pools');
    return pools.find(p => p.id === poolId)?.invite_code || null;
  }
  const { data, error } = await supabase
    .from('expense_pools')
    .select('invite_code')
    .eq('id', poolId)
    .maybeSingle();
  if (error && !isTableNotFound(error)) throw error;
  return data?.invite_code || null;
};

export const logExpense = async (poolId, payerAddress, amount, description, txHash) => {
  if (isMock) return { id: `mock-exp-${Date.now()}`, pool_id: poolId, payer_address: payerAddress, amount, description, tx_hash: txHash };
  const { data, error } = await supabase
    .from('expenses')
    .insert([{ pool_id: poolId, payer_address: payerAddress, amount, description, tx_hash: txHash }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getPoolExpenses = async (poolId) => {
  if (isMock) return [];
  const { data, error } = await supabase
    .from('expenses')
    .select('*, profiles ( alias )')
    .eq('pool_id', poolId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const db = {
  getProfile: async (wallet_address) =>
    withFallback(
      async () => {
        const { data, error } = await supabase.from('profiles').select('*').eq('wallet_address', wallet_address).single();
        if (error && !isTableNotFound(error)) throw error;
        return data;
      },
      () => {
        const profiles = readMockDb('profiles');
        return profiles.find(p => p.wallet_address === wallet_address) || null;
      },
    ),

  createProfile: async (wallet_address, name) =>
    withFallback(
      async () => {
        const { data, error } = await supabase.from('profiles').insert([{ wallet_address, name, created_at: new Date().toISOString() }]).select().single();
        if (error) throw error;
        return data;
      },
      () => {
        const profile = { wallet_address, name, created_at: new Date().toISOString() };
        const profiles = readMockDb('profiles');
        profiles.push(profile);
        writeMockDb('profiles', profiles);
        return profile;
      },
    ),

  updateProfile: async (wallet_address, name) =>
    withFallback(
      async () => {
        const { data, error } = await supabase
          .from('profiles')
          .update({ name })
          .eq('wallet_address', wallet_address)
          .select()
          .single();
        if (error) throw error;
        return data;
      },
      () => {
        const profiles = readMockDb('profiles');
        const idx = profiles.findIndex(p => p.wallet_address === wallet_address);
        if (idx !== -1) {
          profiles[idx].name = name;
          writeMockDb('profiles', profiles);
          return profiles[idx];
        }
        return null;
      },
    ),

  addPoolMember: async (pool_id, wallet_address) => {
    const entry = { pool_id, wallet_address, joined_at: new Date().toISOString() };
    if (isMock) {
      const members = readMockDb('pool_members');
      if (!members.some(m => m.pool_id === pool_id && m.wallet_address === wallet_address)) {
        members.push(entry);
        writeMockDb('pool_members', members);
      }
      return;
    }
    const { error } = await supabase.from('pool_members').insert([entry]);
    if (error && error.code !== '23505') {
      if (!isTableNotFound(error)) throw error;
    }
  },

  isPoolMember: async (pool_id, wallet_address) =>
    withFallback(
      async () => {
        const { data, error } = await supabase
          .from('pool_members')
          .select('id')
          .eq('pool_id', pool_id)
          .eq('wallet_address', wallet_address)
          .maybeSingle();
        if (error) throw error;
        return !!data;
      },
      () => {
        const members = readMockDb('pool_members');
        return members.some(m => m.pool_id === pool_id && m.wallet_address === wallet_address);
      },
    ),

  getUserPoolIds: async (wallet_address) =>
    withFallback(
      async () => {
        const { data, error } = await supabase
          .from('pool_members')
          .select('pool_id')
          .eq('wallet_address', wallet_address);
        if (error) throw error;
        return (data || []).map(r => r.pool_id);
      },
      () => {
        const members = readMockDb('pool_members');
        return members.filter(m => m.wallet_address === wallet_address).map(m => m.pool_id);
      },
    ),

  createJoinRequest: async (pool_id, invite_code, requester_address) => {
    if (isMock) {
      const requests = readMockDb('join_requests');
      const existing = requests.find(r => r.pool_id === pool_id && r.requester_address === requester_address && r.status === 'pending');
      if (existing) return existing;
      const req = { id: Math.random().toString(36).substring(2, 15), pool_id, invite_code, requester_address, status: 'pending', created_at: new Date().toISOString() };
      requests.push(req);
      writeMockDb('join_requests', requests);
      return req;
    }
    const { data: existing } = await supabase
      .from('join_requests')
      .select('id')
      .eq('pool_id', pool_id)
      .eq('requester_address', requester_address)
      .eq('status', 'pending')
      .maybeSingle();
    if (existing) return existing;
    const { data, error } = await supabase.from('join_requests').insert([
      { pool_id, invite_code, requester_address, status: 'pending' },
    ]).select().single();
    if (error && error.code !== '23505') {
      if (!isTableNotFound(error)) throw error;
    }
    return data || { id: 'stub', status: 'pending' };
  },

  getPendingRequests: async (wallet_address, ownedPoolIds) =>
    withFallback(
      async () => {
        let ids = ownedPoolIds;
        if (!ids || ids.length === 0) {
          const owned = await supabase.from('expense_pools').select('id').eq('created_by', wallet_address);
          if (owned.error) throw owned.error;
          ids = (owned.data || []).map(r => r.id);
        }
        if (!ids.length) return [];
        const { data, error } = await supabase
          .from('join_requests')
          .select('*')
          .in('pool_id', ids)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      },
      () => {
        const all = readMockDb('join_requests');
        const pools = readMockDb('expense_pools');
        const ownedIds = pools.filter(p => p.created_by === wallet_address).map(p => p.id);
        return all.filter(r => ownedIds.includes(r.pool_id) && r.status === 'pending')
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      },
    ),

  getPendingCount: async (wallet_address, ownedPoolIds) => {
    const requests = await db.getPendingRequests(wallet_address, ownedPoolIds);
    return requests.length;
  },

  getJoinRequestStatus: async (pool_id, requester_address) =>
    withFallback(
      async () => {
        const { data, error } = await supabase
          .from('join_requests')
          .select('status')
          .eq('pool_id', pool_id)
          .eq('requester_address', requester_address)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        return data?.status || null;
      },
      () => {
        const requests = readMockDb('join_requests');
        const reqs = requests
          .filter(r => r.pool_id === pool_id && r.requester_address === requester_address)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return reqs[0]?.status || null;
      },
    ),

  approveJoinRequest: async (request_id, pool_id, requester_address) => {
    if (isMock) {
      const requests = readMockDb('join_requests');
      const req = requests.find(r => r.id === request_id);
      if (req) req.status = 'approved';
      writeMockDb('join_requests', requests);
      await db.addPoolMember(pool_id, requester_address);
      return;
    }
    const { error } = await supabase.from('join_requests').update({ status: 'approved' }).eq('id', request_id);
    if (error) throw error;
    await db.addPoolMember(pool_id, requester_address);
  },

  rejectJoinRequest: async (request_id) => {
    if (isMock) {
      const requests = readMockDb('join_requests');
      const req = requests.find(r => r.id === request_id);
      if (req) req.status = 'rejected';
      writeMockDb('join_requests', requests);
      return;
    }
    const { error } = await supabase.from('join_requests').update({ status: 'rejected' }).eq('id', request_id);
    if (error) throw error;
  },

  logActivity: async (wallet_address, type, details) => {
    const activity = { id: Math.random().toString(36).substring(2, 15), wallet_address, type, details, timestamp: new Date().toISOString() };
    if (isMock) {
      const activities = readMockDb('activities');
      activities.unshift(activity);
      writeMockDb('activities', activities);
      return;
    }
    const { error } = await supabase.from('activities').insert([activity]);
    if (error && !isTableNotFound(error)) throw error;
  },

  getRecentActivities: async () =>
    withFallback(
      async () => {
        const { data, error } = await supabase.from('activities').select('*').order('timestamp', { ascending: false }).limit(20);
        if (error) throw error;
        return data;
      },
      () => readMockDb('activities').slice(0, 20),
    ),
};


