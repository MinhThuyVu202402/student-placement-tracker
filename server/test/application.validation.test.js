const test = require('node:test');
const assert = require('node:assert/strict');

const {
  isValidDate,
  isValidRequiredFields,
  isValidDateFields
} = require('../src/validation/application');

test('required fields accept a valid company, role, and status', () => {
  const error = isValidRequiredFields(
    'Canva',
    'Software Engineering Intern',
    'saved'
  );

  assert.equal(error, null);
});

test('required fields reject a blank company', () => {
  const error = isValidRequiredFields('   ', 'Intern', 'saved');

  assert.equal(error, 'Company name is required');
});

test('required fields reject a blank role', () => {
  const error = isValidRequiredFields('Canva', '   ', 'saved');

  assert.equal(error, 'Role is required');
});

test('required fields reject an unsupported status', () => {
  const error = isValidRequiredFields('Canva', 'Intern', 'unknown');

  assert.equal(error, 'Status is invalid');
});

test('date validation accepts a real date in YYYY-MM-DD format', () => {
  assert.equal(isValidDate('2026-08-22'), true);
});

test('date validation accepts February 29 in a leap year', () => {
  assert.equal(isValidDate('2024-02-29'), true);
});

test('date validation rejects February 29 outside a leap year', () => {
  assert.equal(isValidDate('2025-02-29'), false);
});

test('date validation rejects an impossible calendar date', () => {
  assert.equal(isValidDate('2026-02-31'), false);
});

test('date validation rejects a non-ISO date format', () => {
  assert.equal(isValidDate('22/08/2026'), false);
});

test('date fields accept omitted optional dates', () => {
  const error = isValidDateFields(null, 'saved', null, null);

  assert.equal(error, null);
});

test('date fields reject an invalid applied date', () => {
  const error = isValidDateFields('2026-02-31', 'applied', null, null);

  assert.equal(
    error,
    'Applied date must be a valid date in YYYY-MM-DD format'
  );
});

test('date fields reject a future applied date', () => {
  const error = isValidDateFields('2099-01-01', 'applied', null, null);

  assert.equal(error, 'Applied date cannot be in the future');
});

test('date fields reject an applied date for a saved application', () => {
  const error = isValidDateFields('2020-01-01', 'saved', null, null);

  assert.equal(
    error,
    'Applied date is not allowed for saved or preparing applications'
  );
});

test('date fields reject an invalid deadline when applied date is omitted', () => {
  const error = isValidDateFields(null, 'saved', '2026-02-31', null);

  assert.equal(
    error,
    'Deadline date must be a valid date in YYYY-MM-DD format'
  );
});

test('date fields reject an invalid next-action date', () => {
  const error = isValidDateFields(null, 'saved', null, '2026-13-01');

  assert.equal(
    error,
    'Next action date must be a valid date in YYYY-MM-DD format'
  );
});

test('date fields accept valid applied, deadline, and next-action dates', () => {
  const error = isValidDateFields(
    '2020-01-01',
    'applied',
    '2099-01-01',
    '2099-01-02'
  );

  assert.equal(error, null);
});
