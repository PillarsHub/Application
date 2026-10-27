export const merchantIdFor = payment => String(payment.customer?.moneyOutMerchant?.id ?? '');

export const merchantName = merchant => merchant?.name?.trim() || (
  merchant?.id != null ? `Merchant ${merchant.id}` : 'Unknown merchant'
);

const STATUS_ORDER = ['PENDING', 'SUCCESS', 'FAILURE'];

export function summarizePayments(payments) {
  const statuses = new Map(STATUS_ORDER.map(status => [
    status, { status, count: 0, totalCents: 0, merchants: new Map() },
  ]));
  const merchantIds = new Set();
  let totalCents = 0;

  for (const payment of payments) {
    const status = String(payment.status || 'UNKNOWN').toUpperCase();
    const merchantId = merchantIdFor(payment);
    const amountCents = Math.round(Number(payment.amount ?? 0) * 100);
    if (!statuses.has(status)) {
      statuses.set(status, { status, count: 0, totalCents: 0, merchants: new Map() });
    }
    const group = statuses.get(status);
    if (!group.merchants.has(merchantId)) {
      group.merchants.set(merchantId, {
        id: merchantId,
        name: merchantName(payment.customer?.moneyOutMerchant),
        count: 0,
        totalCents: 0,
      });
    }
    const merchant = group.merchants.get(merchantId);
    merchant.count += 1;
    merchant.totalCents += amountCents;
    group.count += 1;
    group.totalCents += amountCents;
    merchantIds.add(merchantId);
    totalCents += amountCents;
  }

  const statusRank = status => {
    const index = STATUS_ORDER.indexOf(status);
    return index < 0 ? STATUS_ORDER.length : index;
  };

  return {
    count: payments.length,
    merchantCount: merchantIds.size,
    total: totalCents / 100,
    statuses: [...statuses.values()]
      .sort((a, b) => statusRank(a.status) - statusRank(b.status) || a.status.localeCompare(b.status))
      .map(group => ({
        status: group.status,
        count: group.count,
        total: group.totalCents / 100,
        merchants: [...group.merchants.values()]
          .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
          .map(merchant => ({ id: merchant.id, name: merchant.name, count: merchant.count, total: merchant.totalCents / 100 })),
      })),
  };
}
