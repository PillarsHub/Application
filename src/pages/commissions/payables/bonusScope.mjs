export const normalizeBonusTitle = value => String(value ?? '').trim().toLowerCase();

export function filterPlanBonuses(rows = [], compensationPlanId) {
  const planId = String(compensationPlanId ?? '').trim();
  if (!planId) return [];
  return (rows ?? []).filter(row => String(row.period?.compensationPlanId ?? '').trim() === planId);
}

export function getBonusOptions(rows = []) {
  const bonuses = new Map();
  for (const row of rows) {
    const key = normalizeBonusTitle(row.bonusTitle);
    if (key && !bonuses.has(key)) bonuses.set(key, { key, title: String(row.bonusTitle).trim() });
  }
  return [...bonuses.values()].sort((a, b) => a.title.localeCompare(b.title));
}

export function filterIncludedBonuses(rows = [], excludedBonuses = []) {
  if (!excludedBonuses.length) return rows;
  const excluded = new Set(excludedBonuses.map(normalizeBonusTitle));
  return rows.filter(row => !excluded.has(normalizeBonusTitle(row.bonusTitle)));
}

// Sum decimal values without binary floating-point residue turning an exact
// zero (for example, 0.3 - 0.2 - 0.1) into a negative balance.
function addDecimal(balance, value, sign = 1n) {
  const [coefficient, exponent = '0'] = String(value ?? 0).toLowerCase().split('e');
  const [whole, fraction = ''] = coefficient.split('.');
  let scale = fraction.length - Number(exponent);
  let units = BigInt(whole + fraction) * sign;
  if (scale < 0) {
    units *= 10n ** BigInt(-scale);
    scale = 0;
  }
  const commonScale = Math.max(balance.scale, scale);
  return {
    units: balance.units * 10n ** BigInt(commonScale - balance.scale) + units * 10n ** BigInt(commonScale - scale),
    scale: commonScale,
  };
}

export function applyNegativeHolds(rows = []) {
  const balances = new Map();
  for (const row of rows) {
    if (String(row.sourceEarningsClass ?? row.earningsClass ?? '').toUpperCase() !== 'RELEASE') continue;
    const id = String(row.nodeId ?? '').trim();
    const balance = balances.get(id) ?? { units: 0n, scale: 0 };
    balances.set(id, addDecimal(addDecimal(balance, row.amount), row.released, -1n));
  }
  return rows.map(row => {
    const sourceEarningsClass = String(row.sourceEarningsClass ?? row.earningsClass ?? '').toUpperCase();
    const negative = (balances.get(String(row.nodeId ?? '').trim())?.units ?? 0n) < 0n;
    return {
      ...row,
      sourceEarningsClass,
      earningsClass: sourceEarningsClass === 'RELEASE' && negative ? 'HOLD' : sourceEarningsClass,
    };
  });
}
