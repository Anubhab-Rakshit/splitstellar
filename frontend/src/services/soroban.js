import {
  Contract,
  nativeToScVal,
  scValToNative,
  rpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Account,
} from '@stellar/stellar-sdk';

const RPC_URL =
  import.meta.env.VITE_SOROBAN_RPC_URL ||
  'https://soroban-testnet.stellar.org';
const CONTRACT_ID = import.meta.env.VITE_SOROBAN_CONTRACT_ID;
const NETWORK_PASSPHRASE = Networks.TESTNET;

let serverInstance = null;
let contractInstance = null;

export function getServer() {
  if (!serverInstance) serverInstance = new rpc.Server(RPC_URL);
  return serverInstance;
}

export function getContract() {
  if (!contractInstance) contractInstance = new Contract(CONTRACT_ID);
  return contractInstance;
}

async function getAccount(publicKey) {
  if (!publicKey) return new Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0');
  const server = getServer();
  try {
    return await server.getAccount(publicKey);
  } catch {
    return new Account(publicKey, '0');
  }
}

function toScVal(method, args) {
  switch (method) {
    case 'create_pool':
      return [
        nativeToScVal(args.name, { type: 'string' }),
        nativeToScVal(args.creator, { type: 'address' }),
      ];
    case 'log_expense':
      return [
        nativeToScVal(BigInt(args.poolId), { type: 'u64' }),
        nativeToScVal(args.description, { type: 'string' }),
        nativeToScVal(BigInt(args.amount), { type: 'i128' }),
        nativeToScVal(args.payer, { type: 'address' }),
      ];
    case 'get_pool':
    case 'get_pool_expenses':
      return [nativeToScVal(BigInt(args.poolId), { type: 'u64' })];
    case 'get_expense':
      return [nativeToScVal(BigInt(args.expenseId), { type: 'u64' })];
    default:
      throw new Error(`Unknown method: ${method}`);
  }
}

function parseNative(method, native) {
  if (native === null || native === undefined) return null;

  const normalize = (n) => {
    if (n === null || n === undefined) return null;
    if (typeof n === 'bigint') return Number(n);
    return n;
  };

  switch (method) {
    case 'get_pool':
    case 'create_pool':
      return native
        ? {
            id: normalize(native.pool_id ?? native.id),
            name: native.name,
            creator: native.creator,
            total_expenses: normalize(native.total_expenses ?? 0),
            created_at: normalize(native.created_at ?? 0),
          }
        : null;
    case 'get_pool_expenses':
      return (Array.isArray(native) ? native : []).map((e) => ({
        id: normalize(e.expense_id ?? e.id),
        pool_id: normalize(e.pool_id),
        description: e.description,
        amount: normalize(e.amount),
        payer: e.payer,
        created_at: normalize(e.created_at),
      }));
    case 'get_expense':
      return native
        ? {
            id: normalize(native.expense_id ?? native.id),
            pool_id: normalize(native.pool_id),
            description: native.description,
            amount: normalize(native.amount),
            payer: native.payer,
            created_at: normalize(native.created_at),
          }
        : null;
    case 'log_expense':
      return native
        ? {
            id: normalize(native.expense_id ?? native.id),
            pool_id: normalize(native.pool_id),
            description: native.description,
            amount: normalize(native.amount),
            payer: native.payer,
            created_at: normalize(native.created_at),
          }
        : null;
    default:
      return native;
  }
}

export async function simulateCall(publicKey, method, args) {
  const server = getServer();
  const contract = getContract();
  const account = await getAccount(publicKey);
  const scValArgs = toScVal(method, args);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...scValArgs))
    .setTimeout(30)
    .build();

  const simulation = await server.simulateTransaction(tx);

  if (simulation.error) {
    throw new Error(simulation.error);
  }

  if (!simulation.result || !simulation.result.retval) {
    return null;
  }

  return parseNative(method, scValToNative(simulation.result.retval));
}

export async function buildAndSubmit(publicKey, kit, method, args) {
  const server = getServer();
  const contract = getContract();
  const account = await getAccount(publicKey);
  const scValArgs = toScVal(method, args);

  let tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...scValArgs))
    .setTimeout(30)
    .build();

  const simulation = await server.simulateTransaction(tx);

  if (simulation.error) {
    throw new Error(simulation.error);
  }

  tx = rpc.assembleTransaction(tx, simulation).build();

  const txXdr = tx.toEnvelope().toXDR('base64');
  const { signedTxXdr, error } = await kit.signTransaction(txXdr, {
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  if (error) {
    throw new Error(`Signing rejected: ${error}`);
  }

  const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
  const sendResult = await server.sendTransaction(signedTx);

  if (sendResult.status === 'PENDING') {
    const pollResult = await pollTransaction(server, sendResult.hash);
    if (pollResult.status === 'SUCCESS') {
      return parseNative(method, scValToNative(simulation.result.retval));
    }
    throw new Error('Transaction failed on network');
  }
  throw new Error(`Send failed: ${sendResult.status}`);
}

async function pollTransaction(server, hash, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const result = await server.getTransaction(hash);
    if (result.status === 'SUCCESS' || result.status === 'FAILED') {
      return result;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('Transaction poll timeout');
}

export function fetchEvents(publicKey, cursor) {
  const server = getServer();
  const params = {
    filters: [{ contractId: CONTRACT_ID, type: 'contract' }],
    limit: 50,
  };
  if (cursor) params.cursor = cursor;
  return server.getEvents(params);
}

export function convertEventTopics(contractEvent) {
  const rawTopics = contractEvent.topic || [];
  const topics = rawTopics.map((t) => {
    try {
      return scValToNative(t);
    } catch {
      return null;
    }
  });
  let value;
  try {
    value = scValToNative(contractEvent.value);
  } catch {
    value = null;
  }
  return { topics, value, ledger: contractEvent.ledger, id: contractEvent.id };
}
