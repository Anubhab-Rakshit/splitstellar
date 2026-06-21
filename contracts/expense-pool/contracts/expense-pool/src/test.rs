#![cfg(test)]

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Env, String, Address};

fn setup() -> (Env, ExpensePoolContractClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(ExpensePoolContract, ());
    let client = ExpensePoolContractClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    (env, client, creator)
}

// ── Pool Tests ───────────────────────────────────────────

#[test]
fn test_create_pool() {
    let (env, client, creator) = setup();

    let pool = client.create_pool(&String::from_str(&env, "Bali Trip 2026"), &creator);

    assert_eq!(pool.id, 1);
    assert_eq!(pool.name, String::from_str(&env, "Bali Trip 2026"));
    assert_eq!(pool.creator, creator);
    assert_eq!(pool.total_expenses, 0);


}

#[test]
fn test_get_pool() {
    let (env, client, creator) = setup();
    client.create_pool(&String::from_str(&env, "Test Pool"), &creator);

    let pool = client.get_pool(&1).unwrap();
    assert_eq!(pool.name, String::from_str(&env, "Test Pool"));
}

#[test]
fn test_get_pool_not_found() {
    let (_env, client, _) = setup();
    let pool = client.get_pool(&999);
    assert_eq!(pool, None);
}

#[test]
fn test_multiple_pools() {
    let (env, client, creator) = setup();

    let p1 = client.create_pool(&String::from_str(&env, "Pool A"), &creator);
    let p2 = client.create_pool(&String::from_str(&env, "Pool B"), &creator);
    let p3 = client.create_pool(&String::from_str(&env, "Pool C"), &creator);

    assert_eq!(p1.id, 1);
    assert_eq!(p2.id, 2);
    assert_eq!(p3.id, 3);
    assert_eq!(client.get_pool(&1).unwrap().name, String::from_str(&env, "Pool A"));
    assert_eq!(client.get_pool(&2).unwrap().name, String::from_str(&env, "Pool B"));
    assert_eq!(client.get_pool(&3).unwrap().name, String::from_str(&env, "Pool C"));
}

// ── Expense Tests ────────────────────────────────────────

#[test]
fn test_log_expense() {
    let (env, client, creator) = setup();

    let pool = client.create_pool(&String::from_str(&env, "Team Lunch"), &creator);

    let expense = client.log_expense(
        &pool.id,
        &String::from_str(&env, "Pizza"),
        &i128::from(500),
        &creator,
    );

    assert_eq!(expense.id, 1);
    assert_eq!(expense.description, String::from_str(&env, "Pizza"));
    assert_eq!(expense.amount, 500);
}

#[test]
fn test_get_pool_expenses() {
    let (env, client, creator) = setup();

    let pool = client.create_pool(&String::from_str(&env, "Road Trip"), &creator);

    client.log_expense(&pool.id, &String::from_str(&env, "Gas"), &i128::from(200), &creator);
    client.log_expense(&pool.id, &String::from_str(&env, "Food"), &i128::from(150), &creator);
    client.log_expense(&pool.id, &String::from_str(&env, "Hotel"), &i128::from(800), &creator);

    let expenses = client.get_pool_expenses(&pool.id);
    assert_eq!(expenses.len(), 3);
    assert_eq!(expenses.get(0).unwrap().description, String::from_str(&env, "Gas"));
    assert_eq!(expenses.get(1).unwrap().description, String::from_str(&env, "Food"));
    assert_eq!(expenses.get(2).unwrap().description, String::from_str(&env, "Hotel"));
}

#[test]
fn test_get_single_expense() {
    let (env, client, creator) = setup();

    let pool = client.create_pool(&String::from_str(&env, "Party"), &creator);
    let expense = client.log_expense(&pool.id, &String::from_str(&env, "Cake"), &i128::from(300), &creator);

    let fetched = client.get_expense(&expense.id).unwrap();
    assert_eq!(fetched.id, expense.id);
    assert_eq!(fetched.payer, expense.payer);
    assert_eq!(fetched.amount, 300);
}

#[test]
fn test_expense_not_found() {
    let (_env, client, _) = setup();
    assert_eq!(client.get_expense(&999), None);
}

// ── Error Tests ──────────────────────────────────────────

#[test]
fn test_log_expense_pool_not_found() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(ExpensePoolContract, ());
    let client = ExpensePoolContractClient::new(&env, &contract_id);
    let creator = Address::generate(&env);

    let result = client.try_log_expense(
        &999,
        &String::from_str(&env, "Ghost expense"),
        &i128::from(100),
        &creator,
    );

    assert!(matches!(result, Err(Ok(ContractError::PoolNotFound))));
}

#[test]
fn test_log_expense_zero_amount() {
    let (env, client, creator) = setup();
    let pool = client.create_pool(&String::from_str(&env, "Free Stuff"), &creator);

    let result = client.try_log_expense(
        &pool.id,
        &String::from_str(&env, "Free item"),
        &i128::from(0),
        &creator,
    );

    assert!(matches!(result, Err(Ok(ContractError::AmountZero))));
}

#[test]
fn test_log_expense_negative_amount() {
    let (env, client, creator) = setup();
    let pool = client.create_pool(&String::from_str(&env, "Refunds"), &creator);

    let result = client.try_log_expense(
        &pool.id,
        &String::from_str(&env, "Negative"),
        &i128::from(-50),
        &creator,
    );

    assert!(matches!(result, Err(Ok(ContractError::AmountZero))));
}

#[test]
fn test_pool_total_expenses_update() {
    let (env, client, creator) = setup();
    let pool = client.create_pool(&String::from_str(&env, "Counter test"), &creator);

    client.log_expense(&pool.id, &String::from_str(&env, "E1"), &i128::from(10), &creator);
    assert_eq!(client.get_pool(&pool.id).unwrap().total_expenses, 1);

    client.log_expense(&pool.id, &String::from_str(&env, "E2"), &i128::from(20), &creator);
    assert_eq!(client.get_pool(&pool.id).unwrap().total_expenses, 2);
}

// ── Inter-Contract Call Tests ────────────────────────────

#[test]
fn test_verify_balance_sufficient() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(ExpensePoolContract, ());
    let client = ExpensePoolContractClient::new(&env, &contract_id);

    // Register a mock token with unlimited balance
    let token_id = env.register(MockToken, ());
    let owner = Address::generate(&env);

    let result = client.verify_balance(&token_id, &owner, &i128::from(1000));
    assert_eq!(result, true);
}

#[test]
fn test_verify_balance_insufficient() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(ExpensePoolContract, ());
    let client = ExpensePoolContractClient::new(&env, &contract_id);

    let token_id = env.register(MockTokenEmpty, ());
    let owner = Address::generate(&env);

    let result = client.try_verify_balance(&token_id, &owner, &i128::from(1000));
    assert!(matches!(result, Err(Ok(ContractError::InsufficientBalance))));
}

// ── Mock Token Contracts ─────────────────────────────────

#[contract]
pub struct MockToken;

#[contractimpl]
impl MockToken {
    pub fn balance(_env: Env, _owner: Address) -> i128 {
        i128::MAX
    }
}

#[contract]
pub struct MockTokenEmpty;

#[contractimpl]
impl MockTokenEmpty {
    pub fn balance(_env: Env, _owner: Address) -> i128 {
        0
    }
}
