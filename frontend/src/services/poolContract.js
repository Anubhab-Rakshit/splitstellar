const delay = (ms) => new Promise(res => setTimeout(res, ms));

const POOLS_KEY = 'splitstellar_pools';

const getPools = () => {
  try {
    return JSON.parse(localStorage.getItem(POOLS_KEY) || '[]');
  } catch {
    return [];
  }
};

const savePools = (pools) => {
  localStorage.setItem(POOLS_KEY, JSON.stringify(pools));
};

export const getStoredPools = () => getPools();

export const createPool = async (poolName, creatorAddress) => {
  await delay(800);

  if (!poolName || poolName.trim() === '') {
    throw new Error("Pool name cannot be empty");
  }
  if (!creatorAddress) {
    throw new Error("Connect your wallet first");
  }

  const pool = {
    poolId: `C${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    name: poolName.trim(),
    creator: creatorAddress,
    members: [creatorAddress],
    expenses: [],
    totalXlm: 0,
    createdAt: Date.now()
  };

  const pools = getPools();
  pools.unshift(pool);
  savePools(pools);

  return pool;
};

export const logExpense = async (poolId, description, amountXlm, payerAddress) => {
  await delay(600);

  if (parseFloat(amountXlm) <= 0) {
    throw new Error("Amount must be greater than 0");
  }
  if (!description || !description.trim()) {
    throw new Error("Description cannot be empty");
  }

  const pools = getPools();
  const pool = pools.find(p => p.poolId === poolId);
  if (!pool) throw new Error("Pool not found");

  const expense = {
    id: Math.random().toString(36).substring(2, 9),
    description: description.trim(),
    amount: amountXlm,
    payer: payerAddress,
    timestamp: Date.now()
  };

  pool.expenses.unshift(expense);
  pool.totalXlm = pool.expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  if (!pool.members.includes(payerAddress)) {
    pool.members.push(payerAddress);
  }
  savePools(pools);

  return {
    success: true,
    txHash: `0x${Date.now().toString(36)}${Math.random().toString(36).substring(2, 10)}`,
    expense
  };
};
