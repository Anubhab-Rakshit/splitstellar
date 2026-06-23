#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, IntoVal,
    String, Symbol, Val, Vec,
};

// ── Error Types ──────────────────────────────────────────
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum ContractError {
    PoolNotFound = 1,
    NotPoolCreator = 2,
    InsufficientBalance = 3,
    AmountZero = 4,
}

// ── Event Types ──────────────────────────────────────────
#[contracttype]
#[derive(Clone)]
pub struct PoolCreatedEvent {
    pub pool_id: u64,
    pub name: String,
    pub creator: Address,
}

#[contracttype]
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
        };

        env.storage().persistent().set(&DataKey::Pool(count), &pool);
        env.storage()
            .persistent()
            .set(&DataKey::PoolExpenses(count), &Vec::<Expense>::new(&env));

        env.events().publish(
            (symbol_short!("CREATE"), creator.clone()),
            PoolCreatedEvent {
                pool_id: count,
                name,
                creator,
            },
        );

        pool
    }

    /// Read a pool by ID.
    pub fn get_pool(env: Env, pool_id: u64) -> Option<Pool> {
        env.storage().persistent().get(&DataKey::Pool(pool_id))
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

        if amount <= 0 {
            return Err(ContractError::AmountZero);
        }

        let mut pool: Pool = env
            .storage()
            .persistent()
            .get(&DataKey::Pool(pool_id))
            .ok_or(ContractError::PoolNotFound)?;

        let mut expenses: Vec<Expense> = env
            .storage()
            .persistent()
            .get(&DataKey::PoolExpenses(pool_id))
            .unwrap_or(Vec::<Expense>::new(&env));

        let expense_id = (pool.total_expenses + 1) as u64;
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

        env.events().publish(
            (symbol_short!("EXPENSE"), payer.clone(), pool_id),
            ExpenseLoggedEvent {
                expense_id,
                pool_id,
                description,
                amount,
                payer,
            },
        );

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
}

mod test;
