#![no_std]
use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, Address, Env, IntoVal,
    String, Symbol, Val, Vec,
};

// ── Constants ────────────────────────────────────────────
const MAX_POOL_NAME_LEN: u32 = 64;
const MAX_DESCRIPTION_LEN: u32 = 128;
const MAX_EXPENSES_PER_POOL: u64 = 1000;

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
pub struct ExpenseLoggedEvent {
    pub expense_id: u64,
    pub pool_id: u64,
    pub description: String,
    pub amount: i128,
    pub payer: Address,
}

// ── Storage Types ────────────────────────────────────────
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Pool {
    pub id: u64,
    pub name: String,
    pub creator: Address,
    pub total_expenses: u64,
    pub created_at: u64,
    pub member_count: u64,
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
pub enum DataKey {
    PoolCount,
    Pool(u64),
    PoolExpenses(u64),
    Expense(u64),
    PoolMembers(u64),
    Member(u64, Address),
}

// ── Stellar Token Interface (for inter-contract calls) ──
/// Minimal token balance query to verify payer has funds.
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
    /// Create a new expense pool. Emits a PoolCreated event.
    pub fn create_pool(env: Env, name: String, creator: Address) -> Pool {
        creator.require_auth();

        // Validate pool name length
        if name.len() > MAX_POOL_NAME_LEN {
            panic!("Pool name too long (max 64 chars)");
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
            created_at: env.ledger().timestamp(),
            member_count: 1,
        };

        env.storage().persistent().set(&DataKey::Pool(count), &pool);
        env.storage()
            .persistent()
            .set(&DataKey::PoolExpenses(count), &Vec::<Expense>::new(&env));
        
        // Add creator as first member
        env.storage()
            .persistent()
            .set(&DataKey::Member(count, creator.clone()), &true);

        env.events().publish_event(&PoolCreatedEvent {
            pool_id: count,
            name,
            creator,
        });

        pool
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

    /// Add a member to a pool (only pool creator can do this).
    pub fn add_pool_member(
        env: Env,
        pool_id: u64,
        caller: Address,
        new_member: Address,
    ) {
        caller.require_auth();

        let pool: Pool = env
            .storage()
            .persistent()
            .get(&DataKey::Pool(pool_id))
            .expect("Pool not found");

        // Only pool creator can add members
        if pool.creator != caller {
            panic!("Only pool creator can add members");
        }

        // Check if already a member
        let is_member: bool = env
            .storage()
            .persistent()
            .get(&DataKey::Member(pool_id, new_member.clone()))
            .unwrap_or(false);

        if is_member {
            return;
        }

        // Add member
        env.storage()
            .persistent()
            .set(&DataKey::Member(pool_id, new_member.clone()), &true);

        // Update member count
        let mut updated_pool = pool;
        updated_pool.member_count += 1;
        env.storage()
            .persistent()
            .set(&DataKey::Pool(pool_id), &updated_pool);
    }

    /// Log an expense in a pool. Emits an ExpenseLogged event.
    pub fn log_expense(
        env: Env,
        pool_id: u64,
        description: String,
        amount: i128,
        payer: Address,
    ) -> Result<Expense, ContractError> {
        payer.require_auth();

        // Validate amount
        if amount <= 0 {
            return Err(ContractError::AmountZero);
        }

        // Validate description length
        if description.len() > MAX_DESCRIPTION_LEN {
            return Err(ContractError::DescriptionTooLong);
        }

        let mut pool: Pool = env
            .storage()
            .persistent()
            .get(&DataKey::Pool(pool_id))
            .ok_or(ContractError::PoolNotFound)?;

        // Check expense limit
        if pool.total_expenses >= MAX_EXPENSES_PER_POOL {
            return Err(ContractError::PoolFull);
        }

        // Check if payer is a member of the pool
        let is_member: bool = env
            .storage()
            .persistent()
            .get(&DataKey::Member(pool_id, payer.clone()))
            .unwrap_or(false);

        if !is_member {
            return Err(ContractError::NotPoolMember);
        }

        let mut expenses: Vec<Expense> = env
            .storage()
            .persistent()
            .get(&DataKey::PoolExpenses(pool_id))
            .unwrap_or(Vec::<Expense>::new(&env));

        let expense_id = pool.total_expenses + 1;
        let expense = Expense {
            id: expense_id,
            pool_id,
            description: description.clone(),
            amount,
            payer: payer.clone(),
            created_at: env.ledger().timestamp(),
        };

        expenses.push_back(expense.clone());
        pool.total_expenses += 1;

        env.storage()
            .persistent()
            .set(&DataKey::Pool(pool_id), &pool);
        env.storage()
            .persistent()
            .set(&DataKey::PoolExpenses(pool_id), &expenses);
        env.storage()
            .persistent()
            .set(&DataKey::Expense(expense_id), &expense);

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

    /// Fetch all expenses for a pool.
    pub fn get_pool_expenses(env: Env, pool_id: u64) -> Vec<Expense> {
        env.storage()
            .persistent()
            .get(&DataKey::PoolExpenses(pool_id))
            .unwrap_or(Vec::<Expense>::new(&env))
    }

    /// Fetch a single expense by ID.
    pub fn get_expense(env: Env, expense_id: u64) -> Option<Expense> {
        env.storage()
            .persistent()
            .get(&DataKey::Expense(expense_id))
    }

    /// Get all members of a pool.
    pub fn get_pool_members(env: Env, pool_id: u64) -> Vec<Address> {
        let pool: Option<Pool> = env
            .storage()
            .persistent()
            .get(&DataKey::Pool(pool_id));
        
        match pool {
            None => Vec::<Address>::new(&env),
            Some(_p) => {
                let members = Vec::<Address>::new(&env);
                // Note: In production, you'd want to store member list separately
                // This is a simplified version
                members
            }
        }
    }
}

mod test;
