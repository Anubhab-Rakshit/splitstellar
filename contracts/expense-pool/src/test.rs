#![cfg(test)]

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Address, Env, String};

fn setup() -> (Env, ExpensePoolContractClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(ExpensePoolContract, ());
    let client = ExpensePoolContractClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    (env, client, creator)
}

fn setup_pool() -> (Env, ExpensePoolContractClient<'static>, Address, Pool) {
    let (env, client, creator) = setup();
    let pool = client.create_pool(&String::from_str(&env, "Test Pool"), &creator);
    (env, client, creator, pool)
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
    assert_eq!(pool.total_settlements, 0);
    assert_eq!(pool.member_count, 1);
    assert!(pool.is_active);
}

#[test]
fn test_create_pool_name_too_long() {
    let (env, client, creator) = setup();

    let long_name = String::from_str(&env, &"A".repeat(65));
    let result = client.try_create_pool(&long_name, &creator);

    assert!(matches!(
        result,
        Err(Ok(ContractError::PoolNameTooLong))
    ));
}

#[test]
fn test_create_pool_exact_max_name() {
    let (env, client, creator) = setup();

    let name = String::from_str(&env, &"B".repeat(64));
    let pool = client.create_pool(&name, &creator);
    assert_eq!(pool.name, name);
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
    assert_eq!(
        client.get_pool(&1).unwrap().name,
        String::from_str(&env, "Pool A")
    );
    assert_eq!(
        client.get_pool(&2).unwrap().name,
        String::from_str(&env, "Pool B")
    );
    assert_eq!(
        client.get_pool(&3).unwrap().name,
        String::from_str(&env, "Pool C")
    );
}

// ── Member Tests ─────────────────────────────────────────

#[test]
fn test_is_pool_member() {
    let (env, client, creator) = setup();
    let pool = client.create_pool(&String::from_str(&env, "Test Pool"), &creator);

    assert!(client.is_pool_member(&pool.id, &creator));

    let other = Address::generate(&env);
    assert!(!client.is_pool_member(&pool.id, &other));
}

#[test]
fn test_add_pool_member() {
    let (env, client, creator, pool) = setup_pool();
    let new_member = Address::generate(&env);

    client.add_pool_member(&pool.id, &creator, &new_member);

    assert!(client.is_pool_member(&pool.id, &new_member));
    assert_eq!(client.get_pool(&pool.id).unwrap().member_count, 2);
}

#[test]
fn test_add_pool_member_not_creator() {
    let (env, client, _creator, pool) = setup_pool();
    let unauthorized = Address::generate(&env);
    let new_member = Address::generate(&env);

    let result = client.try_add_pool_member(&pool.id, &unauthorized, &new_member);

    assert!(matches!(
        result,
        Err(Ok(ContractError::NotPoolCreator))
    ));
}

#[test]
fn test_add_pool_member_duplicate() {
    let (env, client, creator, pool) = setup_pool();

    let result = client.try_add_pool_member(&pool.id, &creator, &creator);
    assert!(matches!(result, Err(Ok(ContractError::AlreadyMember))));
}

#[test]
fn test_add_pool_member_pool_not_found() {
    let (env, client, creator) = setup();
    let new_member = Address::generate(&env);

    let result = client.try_add_pool_member(&999, &creator, &new_member);
    assert!(matches!(result, Err(Ok(ContractError::PoolNotFound))));
}

#[test]
fn test_get_pool_members() {
    let (env, client, creator, pool) = setup_pool();
    let m1 = Address::generate(&env);
    let m2 = Address::generate(&env);

    client.add_pool_member(&pool.id, &creator, &m1);
    client.add_pool_member(&pool.id, &creator, &m2);

    let members = client.get_pool_members(&pool.id);
    assert_eq!(members.len(), 3);
    assert_eq!(members.get(0).unwrap(), creator);
    assert_eq!(members.get(1).unwrap(), m1);
    assert_eq!(members.get(2).unwrap(), m2);
}

#[test]
fn test_get_pool_members_empty_pool() {
    let (_env, client, _) = setup();
    let members = client.get_pool_members(&999);
    assert_eq!(members.len(), 0);
}

// ── Expense Tests ────────────────────────────────────────

#[test]
fn test_log_expense() {
    let (env, client, creator, pool) = setup_pool();

    let expense = client.log_expense(
        &pool.id,
        &String::from_str(&env, "Pizza"),
        &i128::from(500),
        &creator,
    );

    assert_eq!(expense.id, 1);
    assert_eq!(expense.pool_id, pool.id);
    assert_eq!(expense.description, String::from_str(&env, "Pizza"));
    assert_eq!(expense.amount, 500);
    assert_eq!(expense.payer, creator);
}

#[test]
fn test_log_expense_not_member() {
    let (env, client, _creator, pool) = setup_pool();
    let non_member = Address::generate(&env);

    let result = client.try_log_expense(
        &pool.id,
        &String::from_str(&env, "Unauthorized"),
        &i128::from(100),
        &non_member,
    );

    assert!(matches!(result, Err(Ok(ContractError::NotPoolMember))));
}

#[test]
fn test_log_expense_description_too_long() {
    let (env, client, creator, pool) = setup_pool();

    let long_desc = String::from_str(&env, &"A".repeat(129));
    let result = client.try_log_expense(&pool.id, &long_desc, &i128::from(100), &creator);

    assert!(matches!(
        result,
        Err(Ok(ContractError::DescriptionTooLong))
    ));
}

#[test]
fn test_log_expense_pool_not_found() {
    let (env, client, creator) = setup();

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
    let (env, client, creator, pool) = setup_pool();

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
    let (env, client, creator, pool) = setup_pool();

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
    let (env, client, creator, pool) = setup_pool();

    client.log_expense(
        &pool.id,
        &String::from_str(&env, "E1"),
        &i128::from(10),
        &creator,
    );
    assert_eq!(client.get_pool(&pool.id).unwrap().total_expenses, 1);

    client.log_expense(
        &pool.id,
        &String::from_str(&env, "E2"),
        &i128::from(20),
        &creator,
    );
    assert_eq!(client.get_pool(&pool.id).unwrap().total_expenses, 2);
}

#[test]
fn test_expense_ids_are_pool_scoped() {
    let (env, client, creator) = setup();

    let p1 = client.create_pool(&String::from_str(&env, "Pool A"), &creator);
    let p2 = client.create_pool(&String::from_str(&env, "Pool B"), &creator);

    let e1 = client.log_expense(
        &p1.id,
        &String::from_str(&env, "Expense A1"),
        &i128::from(100),
        &creator,
    );
    let e2 = client.log_expense(
        &p2.id,
        &String::from_str(&env, "Expense B1"),
        &i128::from(200),
        &creator,
    );

    assert_eq!(e1.id, 1);
    assert_eq!(e2.id, 1);

    let fetched1 = client.get_expense(&p1.id, &e1.id).unwrap();
    let fetched2 = client.get_expense(&p2.id, &e2.id).unwrap();

    assert_eq!(fetched1.description, String::from_str(&env, "Expense A1"));
    assert_eq!(fetched2.description, String::from_str(&env, "Expense B1"));
    assert_ne!(fetched1.amount, fetched2.amount);
}

// ── Pagination Tests ─────────────────────────────────────

#[test]
fn test_get_pool_expenses_pagination() {
    let (env, client, creator, pool) = setup_pool();

    for i in 0..5 {
        let desc = String::from_str(&env, "Exp");
        client.log_expense(
            &pool.id,
            &desc,
            &i128::from(i * 100 + 100),
            &creator,
        );
    }

    let page1 = client.get_pool_expenses(&pool.id, &0, &2);
    assert_eq!(page1.len(), 2);
    assert_eq!(page1.get(0).unwrap().id, 1);
    assert_eq!(page1.get(1).unwrap().id, 2);

    let page2 = client.get_pool_expenses(&pool.id, &2, &2);
    assert_eq!(page2.len(), 2);
    assert_eq!(page2.get(0).unwrap().id, 3);
    assert_eq!(page2.get(1).unwrap().id, 4);

    let page3 = client.get_pool_expenses(&pool.id, &4, &2);
    assert_eq!(page3.len(), 1);
    assert_eq!(page3.get(0).unwrap().id, 5);
}

#[test]
fn test_get_pool_expenses_default_page_size() {
    let (_env, client, _creator, pool) = setup_pool();
    let result = client.get_pool_expenses(&pool.id, &0, &0);
    assert_eq!(result.len(), 0);
}

#[test]
fn test_get_pool_expenses_empty_pool() {
    let (_env, client, _creator, pool) = setup_pool();
    let result = client.get_pool_expenses(&pool.id, &0, &10);
    assert_eq!(result.len(), 0);
}

#[test]
fn test_get_pool_expenses_offset_past_total() {
    let (env, client, creator, pool) = setup_pool();

    client.log_expense(
        &pool.id,
        &String::from_str(&env, "Only expense"),
        &i128::from(100),
        &creator,
    );

    let result = client.try_get_pool_expenses(&pool.id, &10, &10);
    assert!(matches!(result, Err(Ok(ContractError::InvalidPagination))));
}

// ── Settlement Tests ─────────────────────────────────────

#[test]
fn test_record_settlement() {
    let (env, client, creator, pool) = setup_pool();
    let member = Address::generate(&env);
    client.add_pool_member(&pool.id, &creator, &member);

    let record = client.record_settlement(&pool.id, &creator, &member, &i128::from(500));

    assert_eq!(record.id, 1);
    assert_eq!(record.pool_id, pool.id);
    assert_eq!(record.from, creator);
    assert_eq!(record.to, member);
    assert_eq!(record.amount, 500);
    assert_eq!(client.get_pool(&pool.id).unwrap().total_settlements, 1);
}

#[test]
fn test_record_settlement_not_member() {
    let (env, client, creator, pool) = setup_pool();
    let stranger = Address::generate(&env);

    let result = client.try_record_settlement(&pool.id, &stranger, &creator, &i128::from(100));
    assert!(matches!(result, Err(Ok(ContractError::NotPoolMember))));
}

#[test]
fn test_record_settlement_to_non_member() {
    let (env, client, creator, pool) = setup_pool();
    let stranger = Address::generate(&env);

    let result = client.try_record_settlement(&pool.id, &creator, &stranger, &i128::from(100));
    assert!(matches!(result, Err(Ok(ContractError::NotPoolMember))));
}

#[test]
fn test_record_settlement_zero_amount() {
    let (env, client, creator, pool) = setup_pool();

    let result = client.try_record_settlement(&pool.id, &creator, &creator, &i128::from(0));
    assert!(matches!(result, Err(Ok(ContractError::AmountZero))));
}

#[test]
fn test_record_settlement_pool_not_found() {
    let (env, client, creator) = setup();

    let result = client.try_record_settlement(&999, &creator, &creator, &i128::from(100));
    assert!(matches!(result, Err(Ok(ContractError::PoolNotFound))));
}

#[test]
fn test_get_pool_settlements() {
    let (env, client, creator, pool) = setup_pool();
    let m1 = Address::generate(&env);
    let m2 = Address::generate(&env);
    client.add_pool_member(&pool.id, &creator, &m1);
    client.add_pool_member(&pool.id, &creator, &m2);

    client.record_settlement(&pool.id, &creator, &m1, &i128::from(100));
    client.record_settlement(&pool.id, &m1, &m2, &i128::from(200));

    let settlements = client.get_pool_settlements(&pool.id, &0, &10);
    assert_eq!(settlements.len(), 2);
    assert_eq!(settlements.get(0).unwrap().amount, 100);
    assert_eq!(settlements.get(1).unwrap().amount, 200);
}

#[test]
fn test_get_pool_settlements_pagination() {
    let (env, client, creator, pool) = setup_pool();
    let m1 = Address::generate(&env);
    client.add_pool_member(&pool.id, &creator, &m1);

    for _ in 0..3 {
        client.record_settlement(&pool.id, &creator, &m1, &i128::from(50));
    }

    let page1 = client.get_pool_settlements(&pool.id, &0, &2);
    assert_eq!(page1.len(), 2);

    let page2 = client.get_pool_settlements(&pool.id, &2, &2);
    assert_eq!(page2.len(), 1);
}

// ── Archive Tests ────────────────────────────────────────

#[test]
fn test_archive_pool() {
    let (env, client, creator, pool) = setup_pool();

    let archived = client.archive_pool(&pool.id, &creator);
    assert!(!archived.is_active);

    let fetched = client.get_pool(&pool.id).unwrap();
    assert!(!fetched.is_active);
}

#[test]
fn test_archive_pool_not_creator() {
    let (env, client, _creator, pool) = setup_pool();
    let stranger = Address::generate(&env);

    let result = client.try_archive_pool(&pool.id, &stranger);
    assert!(matches!(result, Err(Ok(ContractError::NotPoolCreator))));
}

#[test]
fn test_archive_pool_already_archived() {
    let (env, client, creator, pool) = setup_pool();

    client.archive_pool(&pool.id, &creator);
    let result = client.try_archive_pool(&pool.id, &creator);
    assert!(matches!(result, Err(Ok(ContractError::PoolArchived))));
}

#[test]
fn test_archived_pool_rejects_expenses() {
    let (env, client, creator, pool) = setup_pool();

    client.archive_pool(&pool.id, &creator);

    let result = client.try_log_expense(
        &pool.id,
        &String::from_str(&env, "After archive"),
        &i128::from(100),
        &creator,
    );
    assert!(matches!(result, Err(Ok(ContractError::PoolArchived))));
}

#[test]
fn test_archived_pool_rejects_members() {
    let (env, client, creator, pool) = setup_pool();
    let new_member = Address::generate(&env);

    client.archive_pool(&pool.id, &creator);

    let result = client.try_add_pool_member(&pool.id, &creator, &new_member);
    assert!(matches!(result, Err(Ok(ContractError::PoolArchived))));
}

#[test]
fn test_archived_pool_rejects_settlements() {
    let (env, client, creator, pool) = setup_pool();

    client.archive_pool(&pool.id, &creator);

    let result = client.try_record_settlement(&pool.id, &creator, &creator, &i128::from(100));
    assert!(matches!(result, Err(Ok(ContractError::PoolArchived))));
}

// ── Update Pool Name Tests ───────────────────────────────

#[test]
fn test_update_pool_name() {
    let (env, client, creator, pool) = setup_pool();

    let updated = client.update_pool_name(&pool.id, &creator, &String::from_str(&env, "New Name"));
    assert_eq!(updated.name, String::from_str(&env, "New Name"));

    let fetched = client.get_pool(&pool.id).unwrap();
    assert_eq!(fetched.name, String::from_str(&env, "New Name"));
}

#[test]
fn test_update_pool_name_too_long() {
    let (env, client, creator, pool) = setup_pool();

    let long_name = String::from_str(&env, &"X".repeat(65));
    let result = client.try_update_pool_name(&pool.id, &creator, &long_name);
    assert!(matches!(
        result,
        Err(Ok(ContractError::PoolNameTooLong))
    ));
}

#[test]
fn test_update_pool_name_archived() {
    let (env, client, creator, pool) = setup_pool();

    client.archive_pool(&pool.id, &creator);

    let result =
        client.try_update_pool_name(&pool.id, &creator, &String::from_str(&env, "Too Late"));
    assert!(matches!(result, Err(Ok(ContractError::PoolArchived))));
}

#[test]
fn test_update_pool_name_pool_not_found() {
    let (env, client, creator) = setup();

    let result = client.try_update_pool_name(&999, &creator, &String::from_str(&env, "Ghost"));
    assert!(matches!(result, Err(Ok(ContractError::PoolNotFound))));
}

// ── Inter-Contract Call Tests ────────────────────────────

#[test]
fn test_verify_balance_sufficient() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(ExpensePoolContract, ());
    let client = ExpensePoolContractClient::new(&env, &contract_id);

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
    assert!(matches!(
        result,
        Err(Ok(ContractError::InsufficientBalance))
    ));
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
