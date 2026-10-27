const number = (value) => Number(value ?? 0);
const money = (value) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export const DEFAULT_NEGATIVE_BALANCE_MESSAGE = 'Your commission balance is negative by {amount}. No payment will be released until future commissions cover this balance.';

export const formatNegativeBalanceMessage = (message, balance) => (
  message?.trim() ? message : DEFAULT_NEGATIVE_BALANCE_MESSAGE
).replaceAll('{amount}', () => money(Math.abs(number(balance))));

// Preserve the source sign in both the displayed release and balance calculations.
export const releasedAmount = (row) => number(row.released);
export const pendingAmount = (row) => number(row.amount) - releasedAmount(row);

// Match the two-decimal currency display, including small floating point residues.
export const hasPendingPayment = (row) => Math.abs(pendingAmount(row)) >= 0.005;

export const formatPendingDetailAmount = (amount) => number(amount).toLocaleString('en-US', {
  style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 3,
});

// Hide detail balances within half a cent of zero while retaining boundary values.
export const hasPendingDetailPayment = (row) => Math.abs(pendingAmount(row)) >= 0.005;

export function describePendingCommission(row) {
  const amount = number(row.amount);
  const released = releasedAmount(row);
  const due = pendingAmount(row);
  if (due < 0 || released < 0) {
    return {
      label: 'Reversal',
      tone: 'secondary',
      bucket: 'deductions',
      explanation: released < 0
        ? `The current commission is ${money(amount)}, with ${money(released)} previously released. The pending payment / adjustment is ${money(due)}.`
        : released > 0
        ? `The current commission is ${money(amount)}, with ${money(released)} previously released. The ${money(-due)} difference is deducted from your pending commissions.`
        : `This commission adjustment deducts ${money(-due)} from your pending commissions.`,
    };
  }
  if (due > 0) {
    return {
      label: 'Commission',
      tone: 'green',
      bucket: 'commissions',
      explanation: `${money(due)} is pending release.`,
    };
  }
  return {
    label: released > 0 ? 'Already released' : 'No pending payment',
    tone: 'secondary',
    bucket: 'commissions',
    explanation: released > 0 ? 'This commission has already been released. No further payment is pending.' : 'There is no pending payment for this item.',
  };
}

