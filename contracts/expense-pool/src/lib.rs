#![no_std]
use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, Address, Env, IntoVal,
    String, Symbol, Val, Vec,
};

// ── Constants ────────────────────────────────────────────
const MAX_POOL_NAME_LEN: u32 = 64;
const MAX_DESCRIPTION_LEN: u32 = 128;
const MAX_EXPENSES_PER_POOL: u64 = 1000;
const MAX_SETTLEMENTS_PER_POOL: u64 = 1000;
const MAX_MEMBERS_PER_POOL: u64 = 200;
const DEFAULT_PAGE_SIZE: u64 = 50;
const MAX_PAGE_SIZE: u64 = 100;

// ── Error Types ──────────────────────────────────────────
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum ContractError {
    PoolNotFound = 1,
    NotPoolCreator = 2,
    InsufficientBalance = 3,
    AmountZero = 4,
    NotPoolMember = 5,
    PoolNameTooLong = 6,
    DescriptionTooLong = 7,
    PoolFull = 8,
    Unauthorized = 9,
    PoolArchived = 10,
    AlreadyMember = 11,
    InvalidPagination = 12,
    SettlementsFull = 13,
    MembersFull = 14,
}

// ── Event Types ──────────────────────────────────────────
#[contractevent]
#[derive(Clone)]
pub struct PoolCreatedEvent {
    pub pool_id: u64,
    pub name: String,
    pub creator: Address,
}

#[contractevent]
#[derive(Clone)]
pub struct MemberAddedEvent {
    pub pool_id: u64,
    pub member: Address,
    pub added_by: Address,
}

#[contractevent]
#[derive(Clone)]
pub struct ExpenseLoggedEvent {
    pub expense_id: u64,
    pub pool_id: u64,
    pub description: String,
    pub amount: i128,
    pub payer: Address,
}

#[contractevent]
#[derive(Clone)]
pub struct SettlementRecordedEvent {
    pub settlement_id: u64,
    pub pool_id: u64,
    pub from: Address,
    pub to: Address,
    pub amount: i128,
}

#[contractevent]
#[derive(Clone)]
pub struct PoolArchivedEvent {
    pub pool_id: u64,
}

#[contractevent]
#[derive(Clone)]
pub struct PoolUpdatedEvent {
    pub pool_id: u64,
    pub name: String,
}

// ── Storage Types ────────────────────────────────────────
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Pool {
    pub id: u64,
    pub name: String,
    pub creator: Address,
    pub total_expenses: u64,
    pub total_settlements: u64,
    pub created_at: u64,
    pub member_count: u64,
    pub is_active: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Expense {
    pub id: u64,
    pub pool_id: u64,
    pub description: String,
    pub amount: i128,
    pub payer: Address,
    pub created_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SettlementRecord {
    pub id: u64,
    pub pool_id: u64,
    pub from: Address,
    pub to: Address,
    pub amount: i128,
    pub created_at: u64,
}

#[contracttype]
pub enum DataKey {
    PoolCount,
    Pool(u64),
    ExpenseCount(u64),
    Expense(u64, u64),
    PoolMembers(u64),
    Member(u64, Address),
    SettlementCount(u64),
    Settlement(u64, u64),
}

// ── Stellar Token Interface (for inter-contract calls) ──
pub struct TokenClient;

impl TokenClient {
    pub fn balance(env: &Env, token_id: &Address, owner: &Address) -> i128 {
        let args: Vec<Val> = (owner.clone(),).into_val(env);
        env.invoke_contract(token_id, &Symbol::new(env, "balance"), args)
    }
}

// ── Contract ─────────────────────────────────────────────
#[contract]
pub struct ExpensePoolContract;

#[contractimpl]
impl ExpensePoolContract {
    /// Create a new expense pool. Creator is automatically enrolled as first member.
    pub fn create_pool(env: Env, name: String, creator: Address) -> Result<Pool, ContractError> {
        creator.require_auth();

        if name.len() > MAX_POOL_NAME_LEN {
            return Err(ContractError::PoolNameTooLong);
        }

        let mut count: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::PoolCount)
            .unwrap_or(0);

        count += 1;
        env.storage().persistent().set(&DataKey::PoolCount, &count);

        let pool = Pool {
            id: count,
            name: name.clone(),
            creator: creator.clone(),
            total_expenses: 0,
            total_settlements: 0,
            created_at: env.ledger().timestamp(),
            member_count: 1,
            is_active: true,
        };

        env.storage().persistent().set(&DataKey::Pool(count), &pool);
        env.storage()
            .persistent()
            .set(&DataKey::ExpenseCount(count), &0u64);
        env.storage()
            .persistent()
            .set(&DataKey::SettlementCount(count), &0u64);

        // Store creator in member list
        let mut members = Vec::<Address>::new(&env);
        members.push_back(creator.clone());
        env.storage()
            .persistent()
            .set(&DataKey::PoolMembers(count), &members);

        // Mark creator as member for fast lookup
        env.storage()
            .persistent()
            .set(&DataKey::Member(count, creator.clone()), &true);

        env.events().publish_event(&PoolCreatedEvent {
            pool_id: count,
            name,
            creator,
        });

        Ok(pool)
    }

    /// Read a pool by ID.
    pub fn get_pool(env: Env, pool_id: u64) -> Option<Pool> {
        env.storage().persistent().get(&DataKey::Pool(pool_id))
    }

    /// Check if an address is a member of a pool.
    pub fn is_pool_member(env: Env, pool_id: u64, member: Address) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::Member(pool_id, member))
            .unwrap_or(false)
    }

    /// Add a member to a pool (only pool creator can do this). Returns error on duplicates.
    pub fn add_pool_member(
        env: Env,
        pool_id: u64,
        caller: Address,
        new_member: Address,
    ) -> Result<(), ContractError> {
        caller.require_auth();

        let mut pool: Pool = env
            .storage()
            .persistent()
            .get(&DataKey::Pool(pool_id))
            .ok_or(ContractError::PoolNotFound)?;

        if !pool.is_active {
            return Err(ContractError::PoolArchived);
        }

        if pool.creator != caller {
            return Err(ContractError::NotPoolCreator);
        }

        let is_member: bool = env
            .storage()
            .persistent()
            .get(&DataKey::Member(pool_id, new_member.clone()))
            .unwrap_or(false);

        if is_member {
            return Err(ContractError::AlreadyMember);
        }

        if pool.member_count >= MAX_MEMBERS_PER_POOL {
            return Err(ContractError::MembersFull);
        }

        // Add to member list and fast-lookup
        env.storage()
            .persistent()
            .set(&DataKey::Member(pool_id, new_member.clone()), &true);

        let mut members: Vec<Address> = env
            .storage()
            .persistent()
            .get(&DataKey::PoolMembers(pool_id))
            .unwrap_or(Vec::<Address>::new(&env));
        members.push_back(new_member.clone());
        env.storage()
            .persistent()
            .set(&DataKey::PoolMembers(pool_id), &members);

        pool.member_count += 1;
        env.storage()
            .persistent()
            .set(&DataKey::Pool(pool_id), &pool);

        env.events().publish_event(&MemberAddedEvent {
            pool_id,
            member: new_member,
            added_by: caller,
        });

        Ok(())
    }

    /// Get all members of a pool.
    pub fn get_pool_members(env: Env, pool_id: u64) -> Vec<Address> {
        env.storage()
            .persistent()
            .get(&DataKey::PoolMembers(pool_id))
            .unwrap_or(Vec::<Address>::new(&env))
    }

    /// Log an expense in a pool. Expense IDs are scoped per pool.
    pub fn log_expense(
        env: Env,
        pool_id: u64,
        description: String,
        amount: i128,
        payer: Address,
    ) -> Result<Expense, ContractError> {
        payer.require_auth();

        if amount <= 0 {
            return Err(ContractError::AmountZero);
        }

        if description.len() > MAX_DESCRIPTION_LEN {
            return Err(ContractError::DescriptionTooLong);
        }

        let mut pool: Pool = env
            .storage()
            .persistent()
            .get(&DataKey::Pool(pool_id))
            .ok_or(ContractError::PoolNotFound)?;

        if !pool.is_active {
            return Err(ContractError::PoolArchived);
        }

        if pool.total_expenses >= MAX_EXPENSES_PER_POOL {
            return Err(ContractError::PoolFull);
        }

        let is_member: bool = env
            .storage()
            .persistent()
            .get(&DataKey::Member(pool_id, payer.clone()))
            .unwrap_or(false);

        if !is_member {
            return Err(ContractError::NotPoolMember);
        }

        let expense_id = pool.total_expenses + 1;
        let expense = Expense {
            id: expense_id,
            pool_id,
            description: description.clone(),
            amount,
            payer: payer.clone(),
            created_at: env.ledger().timestamp(),
        };

        // Store individual expense entry (O(1) write, no vector serialization)
        env.storage()
            .persistent()
            .set(&DataKey::Expense(pool_id, expense_id), &expense);

        pool.total_expenses += 1;
        env.storage()
            .persistent()
            .set(&DataKey::Pool(pool_id), &pool);
        env.storage()
            .persistent()
            .set(&DataKey::ExpenseCount(pool_id), &pool.total_expenses);

        env.events().publish_event(&ExpenseLoggedEvent {
            expense_id,
            pool_id,
            description,
            amount,
            payer,
        });

        Ok(expense)
    }

    /// Inter-contract call: verify payer has >= amount balance in a given token.
    pub fn verify_balance(
        env: Env,
        token_id: Address,
        owner: Address,
        required: i128,
    ) -> Result<bool, ContractError> {
        let bal = TokenClient::balance(&env, &token_id, &owner);
        if bal < required {
            Err(ContractError::InsufficientBalance)
        } else {
            Ok(true)
        }
    }

    /// Fetch expenses for a pool with pagination.
    /// Returns up to `limit` expenses starting from `offset`.
    pub fn get_pool_expenses(
        env: Env,
        pool_id: u64,
        offset: u64,
        limit: u64,
    ) -> Result<Vec<Expense>, ContractError> {
        let effective_limit = if limit == 0 {
            DEFAULT_PAGE_SIZE
        } else {
            limit.min(MAX_PAGE_SIZE)
        };

        let total: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::ExpenseCount(pool_id))
            .unwrap_or(0);

        if offset >= total && total > 0 {
            return Err(ContractError::InvalidPagination);
        }

        let mut result = Vec::<Expense>::new(&env);
        let end = (offset + effective_limit).min(total);

        let mut i = offset;
        while i < end {
            if let Some(expense) = env
                .storage()
                .persistent()
                .get(&DataKey::Expense(pool_id, i + 1))
            {
                result.push_back(expense);
            }
            i += 1;
        }

        Ok(result)
    }

    /// Fetch a single expense by pool ID and pool-local expense ID.
    pub fn get_expense(env: Env, pool_id: u64, expense_id: u64) -> Option<Expense> {
        env.storage()
            .persistent()
            .get(&DataKey::Expense(pool_id, expense_id))
    }

    /// Record a settlement between two members. Both must be pool members.
    pub fn record_settlement(
        env: Env,
        pool_id: u64,
        from: Address,
        to: Address,
        amount: i128,
    ) -> Result<SettlementRecord, ContractError> {
        from.require_auth();

        if amount <= 0 {
            return Err(ContractError::AmountZero);
        }

        let mut pool: Pool = env
            .storage()
            .persistent()
            .get(&DataKey::Pool(pool_id))
            .ok_or(ContractError::PoolNotFound)?;

        if !pool.is_active {
            return Err(ContractError::PoolArchived);
        }

        if pool.total_settlements >= MAX_SETTLEMENTS_PER_POOL {
            return Err(ContractError::SettlementsFull);
        }

        // Both parties must be pool members
        let from_member: bool = env
            .storage()
            .persistent()
            .get(&DataKey::Member(pool_id, from.clone()))
            .unwrap_or(false);
        if !from_member {
            return Err(ContractError::NotPoolMember);
        }

        let to_member: bool = env
            .storage()
            .persistent()
            .get(&DataKey::Member(pool_id, to.clone()))
            .unwrap_or(false);
        if !to_member {
            return Err(ContractError::NotPoolMember);
        }

        let settlement_id = pool.total_settlements + 1;
        let record = SettlementRecord {
            id: settlement_id,
            pool_id,
            from: from.clone(),
            to: to.clone(),
            amount,
            created_at: env.ledger().timestamp(),
        };

        env.storage()
            .persistent()
            .set(&DataKey::Settlement(pool_id, settlement_id), &record);

        pool.total_settlements += 1;
        env.storage()
            .persistent()
            .set(&DataKey::Pool(pool_id), &pool);
        env.storage()
            .persistent()
            .set(&DataKey::SettlementCount(pool_id), &pool.total_settlements);

        env.events().publish_event(&SettlementRecordedEvent {
            settlement_id,
            pool_id,
            from,
            to,
            amount,
        });

        Ok(record)
    }

    /// Fetch settlements for a pool with pagination.
    pub fn get_pool_settlements(
        env: Env,
        pool_id: u64,
        offset: u64,
        limit: u64,
    ) -> Result<Vec<SettlementRecord>, ContractError> {
        let effective_limit = if limit == 0 {
            DEFAULT_PAGE_SIZE
        } else {
            limit.min(MAX_PAGE_SIZE)
        };

        let total: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::SettlementCount(pool_id))
            .unwrap_or(0);

        if offset >= total && total > 0 {
            return Err(ContractError::InvalidPagination);
        }

        let mut result = Vec::<SettlementRecord>::new(&env);
        let end = (offset + effective_limit).min(total);

        let mut i = offset;
        while i < end {
            if let Some(record) = env
                .storage()
                .persistent()
                .get(&DataKey::Settlement(pool_id, i + 1))
            {
                result.push_back(record);
            }
            i += 1;
        }

        Ok(result)
    }

    /// Archive a pool (only creator). Archived pools reject new expenses and members.
    pub fn archive_pool(env: Env, pool_id: u64, caller: Address) -> Result<Pool, ContractError> {
        caller.require_auth();

        let mut pool: Pool = env
            .storage()
            .persistent()
            .get(&DataKey::Pool(pool_id))
            .ok_or(ContractError::PoolNotFound)?;

        if pool.creator != caller {
            return Err(ContractError::NotPoolCreator);
        }

        if !pool.is_active {
            return Err(ContractError::PoolArchived);
        }

        pool.is_active = false;
        env.storage()
            .persistent()
            .set(&DataKey::Pool(pool_id), &pool);

        env.events().publish_event(&PoolArchivedEvent { pool_id });

        Ok(pool)
    }

    /// Update pool name (only creator). Pool must be active.
    pub fn update_pool_name(
        env: Env,
        pool_id: u64,
        caller: Address,
        new_name: String,
    ) -> Result<Pool, ContractError> {
        caller.require_auth();

        if new_name.len() > MAX_POOL_NAME_LEN {
            return Err(ContractError::PoolNameTooLong);
        }

        let mut pool: Pool = env
            .storage()
            .persistent()
            .get(&DataKey::Pool(pool_id))
            .ok_or(ContractError::PoolNotFound)?;

        if !pool.is_active {
            return Err(ContractError::PoolArchived);
        }

        if pool.creator != caller {
            return Err(ContractError::NotPoolCreator);
        }

        pool.name = new_name.clone();
        env.storage()
            .persistent()
            .set(&DataKey::Pool(pool_id), &pool);

        env.events().publish_event(&PoolUpdatedEvent {
            pool_id,
            name: new_name,
        });

        Ok(pool)
    }
}

mod test;
