export const UNKNOWN_MERCHANT_ID = '__unknown_merchant__';

const SERVICE_TYPES = ['None', 'Pillars', 'Custom', 'TygaPay', 'PayQuicker', 'MassPay'];
const serviceTypeName = value => {
  const type = String(value ?? '').trim();
  if (!type) return null;
  return SERVICE_TYPES.find((name, index) => String(index) === type || name.toLowerCase() === type.toLowerCase().replace(/[_\s-]/g, '')) ?? type;
};

export const merchantIdFor = row => String(row.customer?.moneyOutMerchant?.id ?? '').trim() || UNKNOWN_MERCHANT_ID;

export const merchantName = merchant => {
  const id = String(merchant?.id ?? '').trim();
  return id ? String(merchant.name ?? '').trim() || `Merchant ${id}` : 'Unknown merchant';
};

export function getMerchantOptions(rows = []) {
  const merchants = new Map();
  for (const row of rows) {
    const id = merchantIdFor(row);
    if (!merchants.has(id)) merchants.set(id, {
      id,
      name: merchantName(row.customer?.moneyOutMerchant),
      serviceType: serviceTypeName(row.customer?.moneyOutMerchant?.serviceType),
    });
  }
  return [...merchants.values()].sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}

export function filterIncludedMerchants(rows = [], excludedMerchantIds = []) {
  if (!excludedMerchantIds.length) return rows;
  const excluded = new Set(excludedMerchantIds.map(id => String(id).trim()));
  return rows.filter(row => !excluded.has(merchantIdFor(row)));
}

// Resolve a merchant once per distinct customer, rather than once for every
// payable record. Publish only after every batch has completed successfully.
export async function loadPayableMerchants({ rows, queryCustomers, isCurrent = () => true, batchSize = 200 }) {
  const nodeIds = [...new Set(rows.map(row => String(row.nodeId ?? '').trim()).filter(Boolean))];
  const merchants = new Map();
  for (let offset = 0; isCurrent() && offset < nodeIds.length; offset += batchSize) {
    const customers = await queryCustomers(nodeIds.slice(offset, offset + batchSize));
    if (!isCurrent()) return null;
    if (!Array.isArray(customers)) throw new Error('Unable to load customer merchants.');
    for (const customer of customers) merchants.set(String(customer.id ?? '').trim(), customer.moneyOutMerchant ?? null);
  }
  if (!isCurrent()) return null;
  return rows.map(row => ({
    ...row,
    customer: { ...row.customer, moneyOutMerchant: merchants.get(String(row.nodeId ?? '').trim()) ?? null },
  }));
}
