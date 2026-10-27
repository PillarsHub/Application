import assert from 'node:assert/strict';
import test from 'node:test';
import { describePendingCommission, formatPendingDetailAmount, hasPendingDetailPayment, hasPendingPayment, pendingAmount, releasedAmount } from './pendingCommissionPresentation.mjs';

test('Zero current commission with a positive release explains the deduction', () => {
  const row = { amount: 0, released: 9.99, volume: 0 };
  const presentation = describePendingCommission(row);
  assert.equal(pendingAmount(row), -9.99);
  assert.equal(presentation.label, 'Reversal');
  assert.equal(presentation.bucket, 'deductions');
  assert.match(presentation.explanation, /\$9\.99.*deducted/);
  assert.doesNotMatch(presentation.explanation, /order was returned/i);
});

test('Partial commission reductions explain only the remaining difference', () => {
  const presentation = describePendingCommission({ amount: 5, released: 10 });
  assert.equal(presentation.label, 'Reversal');
  assert.match(presentation.explanation, /current commission is \$5\.00, with \$10\.00 previously released/);
  assert.match(presentation.explanation, /\$5\.00 difference is deducted/);
});

test('Negative releases keep their original sign in balances and reversal labels', () => {
  const presentation = describePendingCommission({ amount: 0, released: -10, volume: 0 });
  assert.equal(presentation.label, 'Reversal');
  assert.equal(presentation.bucket, 'deductions');
  assert.match(presentation.explanation, /-\$10\.00 previously released/);
  assert.match(presentation.explanation, /pending payment \/ adjustment is \$10\.00/);
  assert.equal(releasedAmount({ released: -10 }), -10);
  assert.equal(releasedAmount({ released: '-10' }), -10);
  assert.equal(pendingAmount({ amount: 0, released: -10 }), 10);
  assert.equal(pendingAmount({ amount: -15, released: -10 }), -5);
  assert.equal(describePendingCommission({ amount: -15, released: -10 }).bucket, 'deductions');
  assert.equal(hasPendingPayment({ amount: 10, released: -10 }), true);
  assert.equal(hasPendingPayment({ amount: -10, released: -10 }), false);
});

test('New and increased commissions share the Commission badge; zero balances retain their status', () => {
  assert.equal(describePendingCommission({ amount: 5, released: 0 }).label, 'Commission');
  assert.equal(describePendingCommission({ amount: 10, released: 5 }).label, 'Commission');
  assert.equal(describePendingCommission({ amount: 5, released: 5 }).label, 'Already released');
  assert.equal(describePendingCommission({ amount: 0, released: 0 }).label, 'No pending payment');
  assert.equal(describePendingCommission({ amount: -5, released: 0 }).bucket, 'deductions');
});

test('String numbers, nulls, and floating point cents preserve the balance', () => {
  assert.equal(pendingAmount({ amount: '0', released: '9.99' }), -9.99);
  assert.equal(pendingAmount({}), 0);
  assert.equal(hasPendingPayment({ amount: 0.1 + 0.2, released: 0.3 }), false);
});

test('Detail amounts show a third decimal only when needed and preserve the sign', () => {
  assert.equal(formatPendingDetailAmount(0.013), '$0.013');
  assert.equal(formatPendingDetailAmount(-0.013), '-$0.013');
  assert.equal(formatPendingDetailAmount('0.013'), '$0.013');
  assert.equal(formatPendingDetailAmount(0.01), '$0.01');
  assert.equal(formatPendingDetailAmount(5), '$5.00');
  assert.equal(formatPendingDetailAmount(0.1 + 0.2), '$0.30');
  assert.equal(formatPendingDetailAmount(pendingAmount({ amount: 0.014, released: 0.001 })), '$0.013');
});

test('The detail filter hides balances strictly between -0.005 and 0.005', () => {
  assert.equal(hasPendingDetailPayment({ amount: 0.001, released: 0 }), false);
  assert.equal(hasPendingDetailPayment({ amount: 0, released: 0.001 }), false);
  assert.equal(hasPendingDetailPayment({ amount: 0.004999, released: 0 }), false);
  assert.equal(hasPendingDetailPayment({ amount: 0, released: 0.004999 }), false);
  assert.equal(hasPendingDetailPayment({ amount: 0.005, released: 0 }), true);
  assert.equal(hasPendingDetailPayment({ amount: 0, released: 0.005 }), true);
  assert.equal(hasPendingDetailPayment({ amount: 0.013, released: 0 }), true);
  assert.equal(hasPendingDetailPayment({ amount: 0, released: 0.013 }), true);
  assert.equal(hasPendingDetailPayment({ amount: 0.013, released: 0.013 }), false);
  assert.equal(hasPendingDetailPayment({ amount: 0.1 + 0.2, released: 0.3 }), false);
  assert.equal(hasPendingDetailPayment({ amount: 0.0004 }), false);
});
