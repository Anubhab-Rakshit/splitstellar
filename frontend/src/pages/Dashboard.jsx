import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { useStellarStore } from '../hooks/useStellar';
import ExpenseLogger from '../components/ExpenseLogger';
import { simulateCall, buildAndSubmit, fetchEvents, convertEventTopics } from '../services/soroban';
import { triggerToast } from '../services/toast';
import { track } from '../services/analytics';
import StaggeredText from '../components/StaggeredText';
import { db, getPoolIdByInviteCode, ensurePoolInviteCode } from '../services/db';
import { Loader2, ArrowRight, Copy, Check, UserPlus, CheckCircle, XCircle, Share2 } from 'lucide-react';
import { sanitizeInput } from '../utils/sanitize';

const POLL_MS = 12000;

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
  const [joinRequestStatus, setJoinRequestStatus] = useState(null);
  const [joinPoolInfo, setJoinPoolInfo] = useState(null);
  const [poolMembers, setPoolMembers] = useState([]);
  const eventCursorRef = useRef(null);
  const processedCodeRef = useRef(null);
  const pendingCodeRef = useRef(null);

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
    } catch (err) {
      // Silent fail for event polling - don't spam user with errors
      console.debug('Event poll failed:', err.message);
    }
  }, [address]);

  const syncPendingRequests = useCallback(async () => {
    if (!address) return;
    try {
      const ownedPoolIds = pools.filter(p => p.creator === address).map(p => p.id);
      const requests = await db.getPendingRequests(address, ownedPoolIds);
      setPendingRequests(requests);
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
    
    // Validate invite code format (8 alphanumeric characters)
    const sanitizedCode = input.trim().toUpperCase();
    if (!/^[A-Z0-9]{8}$/.test(sanitizedCode)) {
      triggerToast('Invalid invite code format (8 characters required)', 'error');
      return;
    }
    
    setIsLookingUpCode(true);
    try {
      const poolLookup = await getPoolIdByInviteCode(sanitizedCode);
      if (!poolLookup) {
        triggerToast('Invalid invite code', 'error');
        return;
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
        setJoinPoolInfo({ pool: poolData, inviteCode: sanitizedCode });
        setJoinRequestStatus(status);
        return;
      }

      setJoinPoolInfo({ pool: poolData, inviteCode: sanitizedCode });
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
    const codeParam = searchParams.get('code');
    if (!codeParam) return;

    if (!address) {
      pendingCodeRef.current = codeParam;
      return;
    }

    if (codeParam !== processedCodeRef.current) {
      processedCodeRef.current = codeParam;
      pendingCodeRef.current = null;
      handleJoinByCode(codeParam);
    }
  }, [address, searchParams, handleJoinByCode]);

  useEffect(() => {
    if (!address || pendingCodeRef.current) return;
    if (searchParams.has('pool') || searchParams.has('code')) {
      setSearchParams({}, { replace: true });
    }
  }, [address, searchParams, setSearchParams]);

  useEffect(() => {
    if (!selectedPool) return;
    let cancelled = false;
    const fetchMembers = async () => {
      try {
        const members = await db.getPoolMembers(selectedPool.id);
        if (!cancelled) setPoolMembers(members);
      } catch {
        if (!cancelled) setPoolMembers([]);
      }
    };
    fetchMembers();
    return () => { cancelled = true; };
  }, [selectedPool]);

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
    
    const sanitizedName = sanitizeInput(newPoolName);
    if (sanitizedName.length < 1 || sanitizedName.length > 64) {
      triggerToast('Pool name must be 1-64 characters', 'error');
      return;
    }
    
    try {
      setIsCreating(true);
      const pool = await buildAndSubmit(address, kit, 'create_pool', {
        name: sanitizedName,
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
      track('create_pool', { pool_id: pool.id, pool_name: sanitizedName, wallet_address: address });
      db.logActivity(address, 'create_pool', {
        pool_id: pool.id,
        pool_name: sanitizedName,
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

  const getShareLink = useCallback(async () => {
    const code = await fetchInviteCode(selectedPool.id, selectedPool.name);
    if (!code) {
      triggerToast('Failed to get invite code', 'error');
      return null;
    }
    return `${window.location.origin}/dashboard?code=${code}`;
  }, [selectedPool, fetchInviteCode]);

  const handleCopyInviteLink = async () => {
    const url = await getShareLink();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    triggerToast('Invite link copied', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareInviteLink = async () => {
    const url = await getShareLink();
    if (!url) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${selectedPool.name} on SplitStellar`,
          text: 'Join my expense pool on SplitStellar',
          url,
        });
        triggerToast('Invite shared', 'success');
      } catch {
        // User cancelled share - do nothing
      }
    } else {
      await handleCopyInviteLink();
    }
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
      <div className="min-h-screen pt-24 sm:pt-40 px-4 sm:px-6 flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl sm:text-4xl font-serif italic mb-4">Awaiting Connection</h1>
        <p className="text-xs sm:text-sm font-mono text-[#666] dark:text-[#888] max-w-md">
          Please connect your wallet to access the settlement engine.
        </p>
      </div>
    );
  }

  const showJoinRequestUI = joinPoolInfo && !selectedPool;

  return (
    <div className="min-h-screen pt-24 sm:pt-40 pb-20 sm:pb-32 px-6 lg:px-12 max-w-[1400px] mx-auto">
      <AnimatePresence mode="wait">
        {selectedPool ? (
          <motion.div
            key="detail-view"
            layoutId={`pool-card-${selectedPool.id}`}
            initial={{ opacity: 0, scale: 0.95, borderRadius: 32 }}
            animate={{ opacity: 1, scale: 1, borderRadius: 0 }}
            exit={{ opacity: 0, scale: 0.95, borderRadius: 32 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 bg-[#FAFAFA] dark:bg-[#0A0A0A] overflow-y-auto custom-scrollbar"
            data-lenis-prevent
          >
            <div className="max-w-[1200px] mx-auto pt-24 px-6 lg:px-12 pb-32">
              <button 
                onClick={() => setSelectedPool(null)}
                className="mb-8 font-mono text-xs uppercase tracking-widest text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white transition-colors flex items-center gap-2"
                onMouseEnter={() => import('../services/AudioEngine').then(m => m.audio.playTick())}
              >
                ← Back to Dashboard
              </button>

              <div className="border-b border-[#E5E5E5] dark:border-[#222] pb-6 mb-6 sm:mb-8 transition-colors duration-500 flex justify-between items-end flex-wrap gap-4">
                <div>
                  <span className="block font-mono text-[10px] uppercase tracking-widest text-[#666] dark:text-[#888] mb-2">
                    Partition View
                  </span>
                  <motion.h2 layoutId={`pool-title-${selectedPool.id}`} className="text-3xl sm:text-5xl font-serif italic">
                    {selectedPool.name}
                  </motion.h2>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyInviteLink}
                    className="p-3 bg-white dark:bg-[#111] border border-[#E5E5E5] dark:border-[#333] hover:border-black dark:hover:border-white transition-colors"
                    title="Copy invite link"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleShareInviteLink}
                    className="p-3 bg-white dark:bg-[#111] border border-[#E5E5E5] dark:border-[#333] hover:border-black dark:hover:border-white transition-colors"
                    title="Share invite link"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {inviteCodes[selectedPool.id] && (
                <div className="mb-8 p-4 bg-[#F7F7F7] dark:bg-[#111] border border-[#E5E5E5] dark:border-[#333] flex items-center gap-4">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#666] dark:text-[#888]">
                    Invite Code
                  </span>
                  <code className="font-mono text-sm tracking-wider flex-1">
                    {inviteCodes[selectedPool.id]}
                  </code>
                </div>
              )}

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
                        <div className="font-mono text-xs text-[#666] dark:text-[#888]">
                          {req.requester_address?.substring(0, 12)}...
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleApproveRequest(req)} className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleRejectRequest(req)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
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
                members={poolMembers}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="grid-view"
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-16">
              <StaggeredText 
                text="Command Center" 
                className="text-4xl sm:text-5xl md:text-7xl font-serif italic tracking-tight mb-4" 
              />
              <div className="flex items-center gap-4">
                <p className="font-mono text-sm text-[#666] dark:text-[#888]">
                  Manage cryptographic expense partitions.
                </p>
                <span className="flex items-center gap-1 px-2 py-0.5 border border-emerald-500/30 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-500">Live</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[200px]">
              
              {/* ACTION WIDGET: CREATE */}
              <div className="glass-card flex flex-col justify-between p-6 col-span-1 lg:col-span-2 group">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#666] dark:text-[#888]">
                  Initialize Partition
                </span>
                <form onSubmit={handleCreatePool} className="mt-4">
                  <div className="flex items-end border-b border-[#E5E5E5] dark:border-[#333] pb-2 group-focus-within:border-black dark:group-focus-within:border-white transition-colors">
                    <input
                      type="text"
                      placeholder="ENTER NAME..."
                      value={newPoolName}
                      onChange={(e) => setNewPoolName(e.target.value)}
                      className="flex-1 bg-transparent border-none outline-none font-serif italic text-2xl sm:text-3xl text-black dark:text-white placeholder:text-[#ccc] dark:placeholder:text-[#444]"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isCreating || !kit}
                      className="mb-1 text-black dark:text-white disabled:opacity-50"
                      onMouseEnter={() => import('../services/AudioEngine').then(m => m.audio.playTick())}
                    >
                      {isCreating ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
                    </button>
                  </div>
                </form>
              </div>

              {/* ACTION WIDGET: JOIN */}
              <div className="glass-card flex flex-col justify-between p-6 group">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#666] dark:text-[#888]">
                  Join via Code
                </span>
                <form onSubmit={handleJoinSubmit} className="mt-4">
                  <div className="flex flex-col gap-4">
                    <input
                      type="text"
                      placeholder="PASTE CODE"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="w-full bg-transparent border-b border-[#E5E5E5] dark:border-[#333] outline-none font-mono text-sm py-2 text-black dark:text-white placeholder:text-[#ccc] dark:placeholder:text-[#444]"
                    />
                    <button
                      type="submit"
                      disabled={isLookingUpCode || !kit}
                      className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-mono text-[10px] uppercase tracking-widest"
                      onMouseEnter={() => import('../services/AudioEngine').then(m => m.audio.playTick())}
                    >
                      {isLookingUpCode ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Join'}
                    </button>
                  </div>
                </form>
              </div>

              {/* POOL WIDGETS */}
              {loadingPools ? (
                <div className="glass-card flex flex-col items-center justify-center col-span-1 md:col-span-2 lg:col-span-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#666] dark:text-[#888]" />
                </div>
              ) : pools.length === 0 ? (
                <div className="glass-card flex flex-col items-center justify-center text-center p-8 col-span-1 md:col-span-2 lg:col-span-3">
                  <div className="w-16 h-[1px] bg-black/20 dark:bg-white/20 mb-6" />
                  <p className="font-mono text-xs uppercase tracking-widest text-[#666] dark:text-[#888]">
                    No Active Partitions
                  </p>
                </div>
              ) : (
                pools.map((pool) => (
                  <motion.div
                    key={pool.id}
                    layoutId={`pool-card-${pool.id}`}
                    onClick={() => selectPoolAndClearJoin(pool)}
                    onMouseEnter={() => import('../services/AudioEngine').then(m => m.audio.playTick())}
                    className="glass-card cursor-pointer p-6 flex flex-col justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-[#666] dark:text-[#888]">
                        ID: {pool.id}
                      </span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                    <motion.h3 layoutId={`pool-title-${pool.id}`} className="text-2xl font-serif italic text-black dark:text-white line-clamp-2">
                      {pool.name}
                    </motion.h3>
                  </motion.div>
                ))
              )}

              {showJoinRequestUI && (
                <div className="glass-card p-6 col-span-1 md:col-span-2 lg:col-span-3 border-amber-500/30">
                  <h3 className="font-serif italic text-2xl mb-2">Private Pool</h3>
                  <p className="font-mono text-xs text-[#666] dark:text-[#888] mb-6">
                    You need access to join this pool.
                  </p>
                  {joinRequestStatus === 'pending' ? (
                    <div className="font-mono text-xs text-amber-500 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Request Pending
                    </div>
                  ) : joinRequestStatus === 'rejected' ? (
                    <div className="font-mono text-xs text-red-500">Request Rejected</div>
                  ) : (
                    <button onClick={handleRequestJoin} className="btn-primary">
                      Request Access
                    </button>
                  )}
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
