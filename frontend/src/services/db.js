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

export const createExpensePool = async (name, createdByAddress) => {
  if (isMock) return { id: `mock-pool-${Date.now()}`, name, created_by: createdByAddress };
  const { data, error } = await supabase
    .from('expense_pools')
    .insert([{ name, created_by: createdByAddress }])
    .select()
    .single();
  if (error) throw error;
  return data;
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


