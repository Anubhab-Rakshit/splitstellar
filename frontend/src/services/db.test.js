import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@supabase/supabase-js', () => {
  const mockFrom = vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  }));
  return {
    createClient: vi.fn(() => ({
      from: mockFrom,
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      },
    })),
  };
});

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe('db service (mock mode)', () => {
  it('ensureProfile returns profile in mock mode', async () => {
    const { ensureProfile } = await import('./db');
    const result = await ensureProfile('GABC123');
    expect(result.wallet_address).toBe('GABC123');
    expect(result.alias).toBe('Anonymous');
  });

  it('ensureProfile accepts custom alias', async () => {
    const { ensureProfile } = await import('./db');
    const result = await ensureProfile('GABC123', 'Alice');
    expect(result.alias).toBe('Alice');
  });

  it('createExpensePool returns mock pool', async () => {
    const { createExpensePool } = await import('./db');
    const pool = await createExpensePool('Test Pool', 'GABC123');
    expect(pool.name).toBe('Test Pool');
    expect(pool.created_by).toBe('GABC123');
    expect(pool.id).toMatch(/^mock-pool-/);
  });

  it('logExpense returns mock expense', async () => {
    const { logExpense } = await import('./db');
    const exp = await logExpense('pool-1', 'GABC123', 500, 'Pizza', 'txhash123');
    expect(exp.pool_id).toBe('pool-1');
    expect(exp.payer_address).toBe('GABC123');
    expect(exp.amount).toBe(500);
    expect(exp.description).toBe('Pizza');
    expect(exp.tx_hash).toBe('txhash123');
  });

  it('getPoolExpenses returns empty array in mock mode', async () => {
    const { getPoolExpenses } = await import('./db');
    const expenses = await getPoolExpenses('pool-1');
    expect(expenses).toEqual([]);
  });

  describe('db backward-compatible object', () => {
    it('db.createProfile and db.getProfile round-trip', async () => {
      const { db } = await import('./db');
      const profile = await db.createProfile('GABC123', 'Alice');
      expect(profile.name).toBe('Alice');

      const fetched = await db.getProfile('GABC123');
      expect(fetched.name).toBe('Alice');
    });

    it('db.logActivity and db.getRecentActivities round-trip', async () => {
      const { db } = await import('./db');
      await db.logActivity('GABC123', 'login', {});
      await db.logActivity('GABC123', 'create_pool', { pool: 1 });

      const activities = await db.getRecentActivities();
      expect(activities.length).toBe(2);
      expect(activities[0].type).toBe('create_pool');
      expect(activities[1].type).toBe('login');
    });

    it('db.getProfile returns null for unknown address', async () => {
      const { db } = await import('./db');
      const result = await db.getProfile('UNKNOWN');
      expect(result).toBeNull();
    });
  });
});
