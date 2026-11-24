import { defaultWidgetText } from '../widgetText.mjs';

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

export function describePendingCommission(row, widgetText = defaultWidgetText) {
  const amount = number(row.amount);
  const released = releasedAmount(row);
  const due = pendingAmount(row);
  if (due < 0 || released < 0) {
    return {
      label: widgetText('Reversal'),
      tone: 'secondary',
      bucket: 'deductions',
      explanation: released < 0
        ? widgetText('The current commission is {amount}, with {released} previously released. The pending payment / adjustment is {pending}.', { amount: money(amount), released: money(released), pending: money(due) })
        : released > 0
        ? widgetText('The current commission is {amount}, with {released} previously released. The {deduction} difference is deducted from your pending commissions.', { amount: money(amount), released: money(released), deduction: money(-due) })
        : widgetText('This commission adjustment deducts {amount} from your pending commissions.', { amount: money(-due) }),
    };
  }
  if (due > 0) {
    return {
      label: widgetText('Commission'),
      tone: 'green',
      bucket: 'commissions',
      explanation: widgetText('{amount} is pending release.', { amount: money(due) }),
    };
  }
  return {
    label: released > 0 ? widgetText('Already released') : widgetText('No pending payment'),
    tone: 'secondary',
    bucket: 'commissions',
    explanation: released > 0 ? widgetText('This commission has already been released. No further payment is pending.') : widgetText('There is no pending payment for this item.'),
  };
}

