import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Ensures a profile exists for a given wallet address.
 */
export const ensureProfile = async (walletAddress, alias = null) => {
  if (supabaseUrl.includes('placeholder')) {
    console.warn("Supabase credentials not configured. Using placeholder mock.");
    return { wallet_address: walletAddress, alias: alias || 'Anonymous' };
  }

  // Check if profile exists
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('wallet_address', walletAddress)
    .maybeSingle();

  if (data) {
    // If we passed an alias and it's different, update it
    if (alias && data.alias !== alias) {
      await supabase
        .from('profiles')
        .update({ alias })
        .eq('wallet_address', walletAddress);
      return { wallet_address: walletAddress, alias };
    }
    return data;
  }

  // Create new profile
  const { data: newProfile, error: insertError } = await supabase
    .from('profiles')
    .insert([{ wallet_address: walletAddress, alias: alias || 'Anonymous' }])
    .select()
    .single();

  if (insertError) throw insertError;
  return newProfile;
};

/**
 * Creates a new expense pool.
 */
export const createExpensePool = async (name, createdByAddress) => {
  if (supabaseUrl.includes('placeholder')) {
    return { id: `mock-pool-${Date.now()}`, name, created_by: createdByAddress };
  }

  const { data, error } = await supabase
    .from('expense_pools')
    .insert([{ name, created_by: createdByAddress }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Logs an expense inside a pool.
 */
export const logExpense = async (poolId, payerAddress, amount, description, txHash) => {
  if (supabaseUrl.includes('placeholder')) {
    return { id: `mock-exp-${Date.now()}`, pool_id: poolId, payer_address: payerAddress, amount, description, tx_hash: txHash };
  }

  const { data, error } = await supabase
    .from('expenses')
    .insert([{ pool_id: poolId, payer_address: payerAddress, amount, description, tx_hash: txHash }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Fetches all expenses for a specific pool.
 */
/**
 * Backward-compatible db object for components still using db.*
 */
const readMockDb = (table) => {
  const data = localStorage.getItem(`mock_db_${table}`);
  return data ? JSON.parse(data) : [];
};

const writeMockDb = (table, data) => {
  localStorage.setItem(`mock_db_${table}`, JSON.stringify(data));
};

export const db = {
  getProfile: async (wallet_address) => {
    if (supabaseUrl.includes('placeholder')) {
      const profiles = readMockDb('profiles');
      return profiles.find(p => p.wallet_address === wallet_address) || null;
    }
    const { data, error: err } = await supabase.from('profiles').select('*').eq('wallet_address', wallet_address).single();
    if (err && err.code !== 'PGRST116') throw err;
    return data;
  },
  createProfile: async (wallet_address, name) => {
    const profile = { wallet_address, name, created_at: new Date().toISOString() };
    if (supabaseUrl.includes('placeholder')) {
      const profiles = readMockDb('profiles');
      profiles.push(profile);
      writeMockDb('profiles', profiles);
      return profile;
    }
    const { data, error } = await supabase.from('profiles').insert([profile]).select().single();
    if (error) throw error;
    return data;
  },
  logActivity: async (wallet_address, type, details) => {
    const activity = { id: Math.random().toString(36).substring(2, 15), wallet_address, type, details, timestamp: new Date().toISOString() };
    if (supabaseUrl.includes('placeholder')) {
      const activities = readMockDb('activities');
      activities.unshift(activity);
      writeMockDb('activities', activities);
    } else {
      await supabase.from('activities').insert([activity]);
    }
  },
  getRecentActivities: async () => {
    if (supabaseUrl.includes('placeholder')) {
      return readMockDb('activities').slice(0, 20);
    }
    const { data, error } = await supabase.from('activities').select('*').order('timestamp', { ascending: false }).limit(20);
    if (error) throw error;
    return data;
  },
};

export const getPoolExpenses = async (poolId) => {
  if (supabaseUrl.includes('placeholder')) {
    return []; // Return empty for mock if unconfigured
  }

  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      profiles ( alias )
    `)
    .eq('pool_id', poolId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};
