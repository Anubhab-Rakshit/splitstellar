import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { useStellarStore } from '../hooks/useStellar';
import ExpenseLogger from '../components/ExpenseLogger';
import { simulateCall, buildAndSubmit, fetchEvents, convertEventTopics } from '../services/soroban';
import { triggerToast } from '../services/toast';
import { db, getPoolIdByInviteCode, ensurePoolInviteCode } from '../services/db';
import { Loader2, Plus, ArrowRight, Link2, Copy, Check, Bell, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import { track } from '../services/analytics';

const POLL_MS = 10000;

function storageKey(address) {
  return `splitstellar_known_pools_${address}`;
}

function loadKnownPoolIds(address) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(address)) || '[]');
  } catch {
    return [];
  }
}

function saveKnownPoolId(address, id) {
  const ids = loadKnownPoolIds(address);
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem(storageKey(address), JSON.stringify(ids));
  }
}

export default function Dashboard() {
  const { address, kit } = useStellarStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pools, setPools] = useState([]);
  const [newPoolName, setNewPoolName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPool, setSelectedPool] = useState(null);
  const [loadingPools, setLoadingPools] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [isLookingUpCode, setIsLookingUpCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inviteCodes, setInviteCodes] = useState({});
  const inviteCodeCache = useRef({});
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [joinRequestStatus, setJoinRequestStatus] = useState(null);
  const [joinPoolInfo, setJoinPoolInfo] = useState(null);
  const eventCursorRef = useRef(null);
  const processedCodeRef = useRef(null);
  const processedPoolRef = useRef(null);

  const fetchPoolById = useCallback(async (poolId) => {
    try {
      return await simulateCall(address, 'get_pool', { poolId });
    } catch {
      return null;
    }
  }, [address]);

  const syncPools = useCallback(async (forceDiscovery) => {
    const remoteIds = await db.getUserPoolIds(address);
    const localIds = loadKnownPoolIds(address);
    const allIds = [...new Set([...remoteIds, ...localIds])];

    let discoveredIds = [];
    if (forceDiscovery || (allIds.length === 0 && address)) {
      const batch = Array.from({ length: 50 }, (_, i) => i + 1);
      const results = await Promise.allSettled(
        batch.map((id) => simulateCall(address, 'get_pool', { poolId: id })),
      );
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        if (r.status === 'fulfilled' && r.value && r.value.creator === address) {
          const pool = r.value;
          discoveredIds.push(pool.id);
          saveKnownPoolId(address, pool.id);
          try { await ensurePoolInviteCode(pool.id, pool.name, pool.creator); } catch { /* ignore */ }
        }
      }
    }

    const finalIds = [...new Set([...allIds, ...discoveredIds])];
    const results = await Promise.allSettled(
      finalIds.map((id) => fetchPoolById(id)),
    );
    const loaded = results
      .filter((r) => r.status === 'fulfilled' && r.value)
      .map((r) => r.value);
    setPools(loaded);
    setLoadingPools(false);
    return loaded;
  }, [address, fetchPoolById]);

  const pollEvents = useCallback(async () => {
    try {
      const result = await fetchEvents(address, eventCursorRef.current);
      if (result.events?.length) {
        for (const event of result.events) {
          const { id } = convertEventTopics(event);
          eventCursorRef.current = id;
        }
      }
    } catch {
      /* silent */
    }
  }, [address]);

  const syncPendingRequests = useCallback(async () => {
    if (!address) return;
    try {
      const ownedPoolIds = pools.filter(p => p.creator === address).map(p => p.id);
      const requests = await db.getPendingRequests(address, ownedPoolIds);
      setPendingRequests(requests);
      setPendingCount(requests.length);
    } catch {
      /* silent */
    }
  }, [address, pools]);

  const fetchInviteCode = useCallback(async (poolId, poolName) => {
    if (inviteCodeCache.current[poolId]) return inviteCodeCache.current[poolId];
    try {
      const code = await ensurePoolInviteCode(poolId, poolName, address);
      inviteCodeCache.current[poolId] = code;
      return code;
    } catch {
      return null;
    }
  }, [address]);

  const handleJoinByCode = useCallback(async (input) => {
    if (!input || !address) return;
    setIsLookingUpCode(true);
    try {
      let poolLookup = await getPoolIdByInviteCode(input);
      if (!poolLookup) {
        const poolId = Number(input);
        if (isNaN(poolId) || poolId < 1 || !Number.isInteger(poolId)) {
          triggerToast('Invalid invite code', 'error');
          return;
        }
        const poolData = await fetchPoolById(poolId);
        if (!poolData) {
          triggerToast('Pool not found', 'error');
          return;
        }
        await ensurePoolInviteCode(poolId, poolData.name, poolData.creator);
        poolLookup = { id: poolId, name: poolData.name, created_by: poolData.creator };
      }

      const poolData = await fetchPoolById(poolLookup.id);
      if (!poolData) {
        triggerToast('Pool not found on-chain', 'error');
        return;
      }

      if (poolData.creator === address) {
        await db.addPoolMember(poolData.id, address);
        saveKnownPoolId(address, poolData.id);
        setPools((prev) => (prev.some((p) => p.id === poolData.id) ? prev : [poolData, ...prev]));
        setSelectedPool(poolData);
        setJoinCode('');
        triggerToast(`Joined "${poolData.name}"`, 'success');
        return;
      }

      const isMember = await db.isPoolMember(poolData.id, address);
      if (isMember) {
        setSelectedPool(poolData);
        setJoinCode('');
        return;
      }

      const status = await db.getJoinRequestStatus(poolData.id, address);
      if (status === 'approved') {
        await db.addPoolMember(poolData.id, address);
        saveKnownPoolId(address, poolData.id);
        setPools((prev) => (prev.some((p) => p.id === poolData.id) ? prev : [poolData, ...prev]));
        setSelectedPool(poolData);
        setJoinCode('');
        triggerToast("You're now a member!", 'success');
        return;
      }

      if (status === 'pending' || status === 'rejected') {
        setJoinPoolInfo({ pool: poolData, inviteCode: input });
        setJoinRequestStatus(status);
        return;
      }

      setJoinPoolInfo({ pool: poolData, inviteCode: input });
      setJoinRequestStatus(null);
    } catch {
      triggerToast('Failed to look up invite code', 'error');
    } finally {
      setIsLookingUpCode(false);
    }
  }, [address, fetchPoolById]);

  const handleRequestJoin = async () => {
    if (!joinPoolInfo || !address) return;
    try {
      await db.createJoinRequest(joinPoolInfo.pool.id, joinPoolInfo.inviteCode, address);
      setJoinRequestStatus('pending');
      triggerToast('Join request sent!', 'success');
      track('join_request', { pool_id: joinPoolInfo.pool.id, wallet_address: address });
    } catch {
      triggerToast('Failed to send join request', 'error');
    }
  };

  const handleApproveRequest = async (request) => {
    try {
      await db.approveJoinRequest(request.id, request.pool_id, request.requester_address);
      triggerToast('Request approved', 'success');
      syncPendingRequests();
    } catch {
      triggerToast('Failed to approve', 'error');
    }
  };

  const handleRejectRequest = async (request) => {
    try {
      await db.rejectJoinRequest(request.id);
      triggerToast('Request rejected', 'info');
      syncPendingRequests();
    } catch {
      triggerToast('Failed to reject', 'error');
    }
  };

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    const tick = async () => {
      await syncPools();
      if (cancelled) return;
      syncPendingRequests();
      pollEvents();
    };
    const id = setInterval(tick, POLL_MS);
    tick();
    return () => { cancelled = true; clearInterval(id); };
  }, [address, syncPools, pollEvents, syncPendingRequests]);

  useEffect(() => {
    if (!address) return;
    const codeParam = searchParams.get('code');
    if (codeParam && codeParam !== processedCodeRef.current) {
      processedCodeRef.current = codeParam;
      handleJoinByCode(codeParam);
    }
  }, [address, searchParams, handleJoinByCode]);

  useEffect(() => {
    if (!address || searchParams.has('code')) return;
    const poolParam = searchParams.get('pool');
    if (!poolParam) return;
    const poolId = Number(poolParam);
    if (isNaN(poolId) || poolId < 1 || !Number.isInteger(poolId)) return;
    if (processedPoolRef.current === poolId) return;
    processedPoolRef.current = poolId;
    if (selectedPool && selectedPool.id === poolId) return;

    fetchPoolById(poolId).then(async (pool) => {
      if (!pool) return;
      const isMember = await db.isPoolMember(pool.id, address);
      if (isMember || pool.creator === address) {
        setSelectedPool(pool);
      } else {
        setSelectedPool(null);
        setJoinPoolInfo({ pool, inviteCode: String(poolId) });
        setJoinRequestStatus(null);
      }
    });
  }, [address, searchParams, selectedPool, fetchPoolById]);

  useEffect(() => {
    if (selectedPool) {
      setSearchParams({ pool: selectedPool.id }, { replace: true });
    }
  }, [selectedPool, setSearchParams]);

  useEffect(() => {
    if (!selectedPool) return;
    const id = selectedPool.id;
    if (inviteCodeCache.current[id]) return;
    let cancelled = false;
    ensurePoolInviteCode(id, selectedPool.name, selectedPool.creator).then((code) => {
      if (!cancelled && code) {
        inviteCodeCache.current[id] = code;
        setInviteCodes((prev) => ({ ...prev, [id]: code }));
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [selectedPool, address]);

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    if (!joinCode.trim() || !address) return;
    await handleJoinByCode(joinCode.trim().toUpperCase());
  };

  const handleCreatePool = async (e) => {
    e.preventDefault();
    if (!newPoolName.trim() || !address || !kit) return;
    try {
      setIsCreating(true);
      const pool = await buildAndSubmit(address, kit, 'create_pool', {
        name: newPoolName.trim(),
        creator: address,
      });
      if (!pool) throw new Error('Pool creation returned empty');
      const code = await ensurePoolInviteCode(pool.id, pool.name, address);
      await db.addPoolMember(pool.id, address);
      saveKnownPoolId(address, pool.id);
      setPools((prev) => [pool, ...prev]);
      setInviteCodes((prev) => ({ ...prev, [pool.id]: code }));
      setNewPoolName('');
      setSelectedPool(pool);
      track('create_pool', { pool_id: pool.id, pool_name: newPoolName.trim(), wallet_address: address });
      db.logActivity(address, 'create_pool', {
        pool_id: pool.id,
        pool_name: newPoolName.trim(),
        tx_hash: pool.txHash,
      });
      triggerToast(`Pool created — tx: ${pool.txHash?.slice(0, 12)}...`, 'success');
    } catch (err) {
      console.error(err);
      triggerToast(err.message || 'Failed to create pool', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyInviteLink = async () => {
    const code = await fetchInviteCode(selectedPool.id, selectedPool.name);
    if (!code) {
      triggerToast('Failed to get invite code', 'error');
      return;
    }
    const url = `${window.location.origin}/dashboard?code=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    triggerToast('Invite link copied', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const selectPoolAndClearJoin = (pool) => {
    setSelectedPool(pool);
    setJoinPoolInfo(null);
    setJoinRequestStatus(null);
  };

  const filteredPendingRequests = selectedPool
    ? pendingRequests.filter((r) => r.pool_id === selectedPool.id)
    : [];

  if (!address) {
    return (
      <div className="min-h-screen pt-24 sm:pt-40 px-6 flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-serif italic mb-4">Awaiting Connection</h1>
        <p className="text-sm font-mono text-[#888]">
          Please connect your wallet to access the settlement engine.
        </p>
      </div>
    );
  }

  const showJoinRequestUI = joinPoolInfo && !selectedPool;

  return (
    <div className="min-h-screen pt-24 sm:pt-40 pb-20 sm:pb-32 px-6 lg:px-12 max-w-[1200px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif italic tracking-tight mb-4">
            Command Center
          </h1>
          <p className="font-mono text-sm text-[#888]">
            Manage cryptographic expense partitions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif italic">Active Partitions</h2>
              <div className="flex items-center gap-2">
                {pendingCount > 0 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 border border-amber-500/30 rounded-full">
                    <Bell className="w-3 h-3 text-amber-500" />
                    <span className="text-[9px] font-mono text-amber-500">{pendingCount}</span>
                  </span>
                )}
                <span className="flex items-center gap-1 px-2 py-0.5 border border-emerald-500/30 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-500">
                    Live
                  </span>
                </span>
              </div>
            </div>

            <form onSubmit={handleCreatePool} className="mb-4">
              <div className="flex items-center border border-[#E5E5E5] dark:border-[#333] transition-colors duration-500 bg-white dark:bg-black group">
                <input
                  type="text"
                  placeholder="NEW PARTITION NAME"
                  value={newPoolName}
                  onChange={(e) => setNewPoolName(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none p-4 font-mono text-xs text-black dark:text-white uppercase placeholder:text-[#888]"
                  required
                />
                <button
                  type="submit"
                  disabled={isCreating || !kit}
                  className="p-4 border-l border-[#E5E5E5] dark:border-[#333] hover:bg-[#F7F7F7] dark:hover:bg-[#111] transition-colors text-black dark:text-white disabled:opacity-50"
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>

            <form onSubmit={handleJoinSubmit} className="mb-8">
              <div className="flex items-center border border-[#E5E5E5] dark:border-[#333] transition-colors duration-500 bg-white dark:bg-black group">
                <input
                  type="text"
                  placeholder="INVITE CODE OR PARTITION ID"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-transparent border-none outline-none p-4 font-mono text-xs text-black dark:text-white uppercase placeholder:text-[#888]"
                />
                <button
                  type="submit"
                  disabled={isLookingUpCode || !kit}
                  className="p-4 border-l border-[#E5E5E5] dark:border-[#333] hover:bg-[#F7F7F7] dark:hover:bg-[#111] transition-colors text-black dark:text-white disabled:opacity-50"
                >
                  {isLookingUpCode ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Link2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>

            <div className="space-y-4">
              {loadingPools ? (
                <div className="flex justify-center p-12 border border-[#E5E5E5] dark:border-[#222]">
                  <Loader2 className="w-6 h-6 animate-spin text-[#888]" />
                </div>
              ) : pools.length === 0 ? (
                <div className="p-6 border border-[#E5E5E5] dark:border-[#222] text-center transition-colors duration-500">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#888]">
                    No Partitions Found
                  </p>
                </div>
              ) : (
                pools.map((pool) => (
                  <button
                    key={pool.id}
                    onClick={() => selectPoolAndClearJoin(pool)}
                    className={`w-full text-left p-4 sm:p-6 border transition-all duration-300 ${
                      selectedPool?.id === pool.id
                        ? 'border-black dark:border-white bg-[#F7F7F7] dark:bg-[#111]'
                        : 'border-[#E5E5E5] dark:border-[#222] hover:border-[#CCC] dark:hover:border-[#444] bg-white dark:bg-black'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-serif italic text-xl">
                        {pool.name}
                      </span>
                      <ArrowRight
                        className={`w-4 h-4 transition-transform duration-300 ${selectedPool?.id === pool.id ? 'translate-x-1' : ''}`}
                      />
                    </div>
                    <div className="font-mono text-[10px] text-[#888] break-all">
                      ID: {pool.id}
                    </div>
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => syncPools(true)}
              className="mt-4 w-full p-3 border border-dashed border-[#E5E5E5] dark:border-[#333] font-mono text-[10px] uppercase tracking-widest text-[#888] hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition-colors"
            >
              {loadingPools ? (
                <Loader2 className="w-3 h-3 animate-spin mx-auto" />
              ) : (
                'Scan On-Chain for My Pools'
              )}
            </button>
          </div>

          <div className="lg:col-span-8">
            {showJoinRequestUI ? (
              <div className="border border-[#E5E5E5] dark:border-[#222] bg-white dark:bg-black p-8 text-center transition-colors duration-500">
                <div className="w-16 h-[1px] bg-black dark:bg-white mb-6 mx-auto" />
                <h3 className="font-serif italic text-2xl mb-2">{joinPoolInfo.pool.name}</h3>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#888] mb-6">
                  You need access to this pool
                </p>
                {joinRequestStatus === 'pending' ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 border border-amber-500/30 rounded-full">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                    <span className="font-mono text-xs text-amber-500">Request pending approval</span>
                  </div>
                ) : joinRequestStatus === 'rejected' ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 border border-red-500/30 rounded-full">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="font-mono text-xs text-red-500">Request was rejected</span>
                  </div>
                ) : (
                  <button onClick={handleRequestJoin} className="btn-primary inline-flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Request to Join
                  </button>
                )}
              </div>
            ) : selectedPool ? (
              <div className="border border-[#E5E5E5] dark:border-[#222] bg-white dark:bg-[#030303] p-4 sm:p-8 transition-colors duration-500 overflow-x-hidden">
                <div className="border-b border-[#E5E5E5] dark:border-[#222] pb-6 mb-6 sm:mb-8 transition-colors duration-500">
                  <span className="block font-mono text-[10px] uppercase tracking-widest text-[#888] mb-2">
                    Partition View
                  </span>
                  <div className="flex items-center gap-4 flex-wrap">
                    <h2 className="text-2xl sm:text-4xl font-serif italic">
                      {selectedPool.name}
                    </h2>
                    <button
                      onClick={handleCopyInviteLink}
                      className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                      title="Copy invite link"
                    >
                      {copiedLink ? (
                        <Check className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Copy className="w-5 h-5 text-[#888] hover:text-black dark:hover:text-white" />
                      )}
                    </button>
                  </div>
                  {inviteCodes[selectedPool.id] && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-[#888]">
                        Invite Code:
                      </span>
                      <code className="font-mono text-xs px-2 py-0.5 bg-[#F7F7F7] dark:bg-[#111] border border-[#E5E5E5] dark:border-[#333] tracking-wider">
                        {inviteCodes[selectedPool.id]}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(inviteCodes[selectedPool.id]);
                          triggerToast('Code copied', 'success');
                        }}
                        className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors"
                      >
                        <Copy className="w-3 h-3 text-[#888]" />
                      </button>
                    </div>
                  )}
                </div>

                {filteredPendingRequests.length > 0 && (
                  <div className="mb-8 border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/10 p-4 sm:p-6">
                    <h3 className="font-serif italic text-lg mb-4 flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Pending Join Requests
                      <span className="px-2 py-0.5 text-[9px] font-mono border border-amber-500/30 rounded-full text-amber-500">
                        {filteredPendingRequests.length}
                      </span>
                    </h3>
                    <div className="space-y-3">
                      {filteredPendingRequests.map((req) => (
                        <div key={req.id} className="flex items-center justify-between p-3 border border-[#E5E5E5] dark:border-[#333] bg-white dark:bg-black">
                          <div className="font-mono text-xs text-[#888]">
                            {req.requester_address?.substring(0, 12)}...
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApproveRequest(req)}
                              className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded transition-colors text-emerald-600 dark:text-emerald-400"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectRequest(req)}
                              className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors text-red-600 dark:text-red-400"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <ExpenseLogger
                  poolId={selectedPool.id}
                  poolName={selectedPool.name}
                  poolCreator={selectedPool.creator}
                />
              </div>
            ) : (
              <div className="h-full min-h-[400px] border border-[#E5E5E5] dark:border-[#222] bg-white dark:bg-black flex flex-col items-center justify-center p-8 text-center transition-colors duration-500">
                <div className="w-16 h-[1px] bg-black dark:bg-white mb-6" />
                <h3 className="font-serif italic text-2xl mb-2">
                  Select a Partition
                </h3>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#888]">
                  Initialize a new ledger partition or select an existing one to
                  begin cryptographic settlement.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
