import { supabase } from './db';

const STORAGE_KEY = 'splitstellar_analytics';

function isTableNotFound(err) {
  if (!err) return false;
  if (err.code === 'PGRST116') return true;
  if (typeof err === 'object' && (err.status === 404 || err.statusCode === 404)) return true;
  return false;
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function save(events) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function istDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function track(event, properties = {}) {
  const entry = {
    event,
    properties,
    url: window.location.href,
    timestamp: new Date().toISOString(),
  };

  const events = load();
  events.push(entry);
  if (events.length > 500) events.splice(0, events.length - 500);
  save(events);

  supabase.from('analytics_events').insert([{
    event,
    properties,
    url: entry.url,
    created_at: entry.timestamp,
  }]).then(({ error }) => {
    if (error && !isTableNotFound(error)) {
      console.warn('analytics: supabase insert failed', error);
    }
  }).catch(() => {});
}

export function getAll() {
  return load();
}

export function getStats() {
  const events = load();
  const total = events.length;
  const uniqueWallets = new Set(
    events
      .filter((e) => e.properties?.wallet_address)
      .map((e) => e.properties.wallet_address),
  ).size;
  const byEvent = {};
  for (const e of events) {
    byEvent[e.event] = (byEvent[e.event] || 0) + 1;
  }
  const byDate = {};
  for (const e of events) {
    const day = istDate(e.timestamp);
    if (day) byDate[day] = (byDate[day] || 0) + 1;
  }
  return { total, uniqueWallets, byEvent, byDate };
}

export async function syncAnalytics() {
  try {
    const { data, error } = await supabase
      .from('analytics_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      if (!isTableNotFound(error)) console.warn('analytics: sync failed', error);
      return;
    }

    if (!data || data.length === 0) return;

    const remote = data.map((r) => ({
      event: r.event,
      properties: r.properties || {},
      url: r.url || '',
      timestamp: r.created_at,
    }));

    const local = load();
    const seen = new Set(local.map((e) => e.timestamp));
    const merged = [...remote.filter((e) => !seen.has(e.timestamp)), ...local];
    merged.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
    if (merged.length > 500) merged.length = 500;
    save(merged);
  } catch {
    /* silent */
  }
}

export function clearAnalytics() {
  localStorage.removeItem(STORAGE_KEY);
  supabase.from('analytics_events').delete().neq('id', 0).then(({ error }) => {
    if (error && !isTableNotFound(error)) {
      console.warn('analytics: supabase clear failed', error);
    }
  }).catch(() => {});
}

export function getInteractionData(days = 14) {
  const events = load();
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const recent = events.filter((e) => new Date(e.timestamp) >= cutoff);

  const eventLabels = {
    wallet_connect: 'Wallet Connect',
    create_pool: 'Create Pool',
    join_request: 'Join Request',
    log_expense: 'Log Expense',
    settle_payment: 'Settle Payment',
    update_profile: 'Update Profile',
  };

  const eventColors = {
    wallet_connect: '#22c55e',
    create_pool: '#3b82f6',
    join_request: '#a855f7',
    log_expense: '#f59e0b',
    settle_payment: '#ef4444',
    update_profile: '#06b6d4',
  };

  const days_data = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    days_data.push({ key, label, total: 0, byEvent: {} });
  }

  for (const e of recent) {
    const dayKey = new Date(e.timestamp).toISOString().slice(0, 10);
    const bucket = days_data.find((d) => d.key === dayKey);
    if (bucket) {
      bucket.total += 1;
      bucket.byEvent[e.event] = (bucket.byEvent[e.event] || 0) + 1;
    }
  }

  const uniqueByDay = {};
  for (const e of recent) {
    const dayKey = new Date(e.timestamp).toISOString().slice(0, 10);
    if (!uniqueByDay[dayKey]) uniqueByDay[dayKey] = new Set();
    if (e.properties?.wallet_address) uniqueByDay[dayKey].add(e.properties.wallet_address);
  }
  for (const bucket of days_data) {
    bucket.uniqueWallets = uniqueByDay[bucket.key]?.size || 0;
  }

  const eventTypes = [...new Set(recent.map((e) => e.event))];
  const maxTotal = Math.max(...days_data.map((d) => d.total), 1);

  return { days_data, eventTypes, eventLabels, eventColors, maxTotal };
}
