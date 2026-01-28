import React, { useState, useEffect } from 'react';
import { SendRequest } from "../../hooks/usePost.js";
import PageHeader from "../../components/pageHeader.jsx";
import AutoComplete from '../../components/autocomplete.jsx';
import DateTimeInput from '../../components/dateTimeInput.jsx';
import DataLoading from '../../components/dataLoading.jsx';

import PayablesModal2 from './payableComponents/payablesModal2.jsx';
import PayableSummaryPanel2 from './payableComponents/payableSummaryPanel2.jsx';
import CustomerPayablePanel2 from './payableComponents/customerPayablePanel2.jsx';


const asClass = (v) => String(v ?? '').toUpperCase();
const normalizeBonus = (v) => String(v ?? '').trim().toLowerCase();

const toLeafKey = (earningsClass, periodId, bonusTitle, customerId) =>
  `${asClass(earningsClass)}|${String(periodId)}|${normalizeBonus(bonusTitle)}|${String(customerId)}`;

const toBonusKeyPipe = (earningsClass, periodId, bonusTitle) =>
  `${asClass(earningsClass)}|${String(periodId)}|${normalizeBonus(bonusTitle)}`;

const toPeriodKey = (earningsClass, periodId) =>
  `${asClass(earningsClass)}|${String(periodId)}`;

const toBonusKeyUnderscore = (earningsClass, periodId, bonusTitle) =>
  `${asClass(earningsClass)}_${String(periodId)}_${normalizeBonus(bonusTitle)}`;

// Your default rule:
const baseDefaultSelected = (earningsClass) => asClass(earningsClass) !== "HOLD";

// 1) Compute the UI batch model (this is your existing logic, extracted verbatim)
const computeCurrentBatchUi = ({
  currentDate,
  summaryRows,
  bonusDetails,
  selectionState,
  leafDueByKey,
  getSelected,
  getDefaultSelected,
}) => {
  if (!currentDate || !summaryRows?.length) {
    return {
      totalCustomers: 0,
      forfeitTotal: 0,
      total: 0,
      bonusGroups: [],
      nodeIdsByBonus: {},
      notNodeIdsByBonus: {},
      cutoffDate: currentDate,
    };
  }

  let total = 0;
  let forfeitTotal = 0;
  let totalCustomers = 0;

  const bonusGroupsMap = new Map(); // bgKey -> { bonusTitle, earningsClass, periodId }
  const nodeIdsByBonus = {};        // underscoreBonusKey -> [customerId...]
  const notNodeIdsByBonus = {};     // underscoreBonusKey -> [customerId...]

  for (const r of summaryRows) {
    const cls = asClass(r.earningsClass);
    if (cls === "HOLD") continue;

    const periodId = r.period?.id;
    const bonusTitle = r.bonusTitle;
    const bonusLower = normalizeBonus(bonusTitle);

    const underscoreBonusKey = toBonusKeyUnderscore(cls, periodId, bonusTitle);
    const bgKey = `${cls}|${String(periodId)}|${bonusLower}`;

    const d = bonusDetails?.[r.key];

    if (d?.payables?.length) {
      // leaf-aware: iterate known customers (authoritative)
      for (const leaf of d.payables) {
        const custId = leaf.customer?.id;
        if (!custId) continue;

        if (!getSelected(cls, periodId, bonusTitle, custId)) {
          continue;
        }

        totalCustomers += 1;

        const due = (leaf.amount ?? 0) - (leaf.released ?? 0);
        if (cls === "RELEASE") total += due;
        if (cls === "FORFEIT") forfeitTotal += due;

        if (!bonusGroupsMap.has(bgKey)) {
          bonusGroupsMap.set(bgKey, { bonusTitle, earningsClass: cls, periodId: String(periodId) });
        }

        if (!nodeIdsByBonus[underscoreBonusKey]) nodeIdsByBonus[underscoreBonusKey] = [];
        if (!nodeIdsByBonus[underscoreBonusKey].includes(String(custId))) {
          nodeIdsByBonus[underscoreBonusKey].push(String(custId));
        }
      }
    } else {
      // summary fallback: no leaf list loaded for this bonus
      const defaultSelected = getDefaultSelected(cls, periodId, bonusTitle);

      const prefix = `${cls}|${String(periodId)}|${normalizeBonus(bonusTitle)}|`; // leafKey prefix

      if (defaultSelected) {
        // CURRENT BEHAVIOR: start from summary totals then subtract explicit exclusions
        const dueSummary = (r.paidAmount ?? 0) - (r.released ?? 0);
        const countSummary = r.customerPaidCount ?? 0;

        let excludedCount = 0;
        let excludedDue = 0;

        for (const [leafKey, selected] of Object.entries(selectionState?.overrides ?? {})) {
          if (!leafKey.startsWith(prefix)) continue;
          if (selected === false) {
            excludedCount += 1;
            excludedDue += (leafDueByKey?.[leafKey] ?? 0);

            const custId = leafKey.split("|")[3];
            if (custId) {
              if (!notNodeIdsByBonus[underscoreBonusKey]) notNodeIdsByBonus[underscoreBonusKey] = [];
              if (!notNodeIdsByBonus[underscoreBonusKey].includes(String(custId))) {
                notNodeIdsByBonus[underscoreBonusKey].push(String(custId));
              }
            }
          }
        }

        const finalCount = Math.max(0, countSummary - excludedCount);
        const finalDue = dueSummary - excludedDue;

        if (cls === "RELEASE") total += finalDue;
        if (cls === "FORFEIT") forfeitTotal += finalDue;

        totalCustomers += finalCount;
      } else {
        // NEW BEHAVIOR: default is false, so include ONLY explicit inclusions (selected === true)
        let includedCount = 0;
        let includedDue = 0;

        for (const [leafKey, selected] of Object.entries(selectionState.overrides)) {
          if (!leafKey.startsWith(prefix)) continue;
          if (selected === true) {
            includedCount += 1;
            includedDue += (leafDueByKey?.[leafKey] ?? 0);

            const custId = leafKey.split("|")[3];
            if (custId) {
              if (!nodeIdsByBonus[underscoreBonusKey]) nodeIdsByBonus[underscoreBonusKey] = [];
              if (!nodeIdsByBonus[underscoreBonusKey].includes(String(custId))) {
                nodeIdsByBonus[underscoreBonusKey].push(String(custId));
              }
            }
          }
        }

        if (includedCount > 0) {
          if (!bonusGroupsMap.has(bgKey)) {
            bonusGroupsMap.set(bgKey, { bonusTitle, earningsClass: cls, periodId: String(periodId) });
          }

          if (cls === "RELEASE") total += includedDue;
          if (cls === "FORFEIT") forfeitTotal += includedDue;

          totalCustomers += includedCount;
        }
      }
    }
  }

  return {
    cutoffDate: currentDate,
    bonusGroups: Array.from(bonusGroupsMap.values()),
    total,
    forfeitTotal,
    totalCustomers,
    nodeIdsByBonus,
    notNodeIdsByBonus,
  };
};


const normalizeBonusTitleForPayload = (v) => String(v ?? "").trim();

const uniqSorted = (arr) => {
  if (!arr?.length) return [];
  const set = new Set();
  for (const x of arr) {
    const s = String(x ?? "").trim();
    if (s) set.add(s);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
};

// Helper: parse leaf override key "CLS|periodId|bonusLower|customerId"
const parseLeafKey = (leafKey) => {
  const parts = String(leafKey ?? "").split("|");
  if (parts.length < 4) return null;
  return {
    cls: parts[0],
    periodId: parts[1],
    bonusLower: parts[2],
    customerId: parts[3],
  };
};

const buildCurrentBatchPayload = ({
  currentDate,
  summaryRows,
  selectionState,
  getDefaultSelected,
  allowNegativeNetPayments = false,
}) => {
  const cutoffDate = currentDate ?? null;

  // Build lookup maps of overrides by bonus (underscore key)
  const includeNodeIdsByBonus = Object.create(null);
  const excludeNodeIdsByBonus = Object.create(null);

  for (const [leafKey, selected] of Object.entries(selectionState?.overrides ?? {})) {
    const parsed = parseLeafKey(leafKey);
    if (!parsed) continue;

    const ukey = `${parsed.cls}_${parsed.periodId}_${parsed.bonusLower}`;
    const cid = String(parsed.customerId ?? "").trim();
    if (!cid) continue;

    if (selected === true) {
      if (!includeNodeIdsByBonus[ukey]) includeNodeIdsByBonus[ukey] = [];
      includeNodeIdsByBonus[ukey].push(cid);
    } else if (selected === false) {
      if (!excludeNodeIdsByBonus[ukey]) excludeNodeIdsByBonus[ukey] = [];
      excludeNodeIdsByBonus[ukey].push(cid);
    }
  }

  const groups = [];

  for (const r of summaryRows ?? []) {
    const earningsClass = String(r?.earningsClass ?? "").toUpperCase();
    if (earningsClass !== "RELEASE" && earningsClass !== "FORFEIT") continue;

    const periodId = String(r?.period?.id ?? "").trim();
    if (!periodId) continue;

    const bonusTitle = normalizeBonusTitleForPayload(r?.bonusTitle);
    if (!bonusTitle) continue;

    const bonusLower = normalizeBonus(bonusTitle); // uses your existing normalizeBonus()
    const ukey = `${earningsClass}_${periodId}_${bonusLower}`;

    const defaultSelected = !!getDefaultSelected(earningsClass, periodId, bonusTitle);

    const included = uniqSorted(includeNodeIdsByBonus[ukey]);
    const excluded = uniqSorted(excludeNodeIdsByBonus[ukey]);

    // If default selected: ALL or ALL_EXCEPT
    if (defaultSelected) {
      const selection =
        excluded.length > 0
          ? { mode: "ALL_EXCEPT", excludeNodeIds: excluded }
          : { mode: "ALL" };

      groups.push({ earningsClass, periodId, bonusTitle, selection });
      continue;
    }

    // If default not selected: ONLY if there are explicit inclusions
    if (included.length > 0) {
      groups.push({
        earningsClass,
        periodId,
        bonusTitle,
        selection: { mode: "ONLY", includeNodeIds: included },
      });
    }
  }

  // De-dupe groups defensively (summaryRows aggregation can produce duplicates in edge cases)
  const seen = new Set();
  const dedupedGroups = [];
  for (const g of groups) {
    const key = `${g.earningsClass}|${g.periodId}|${normalizeBonus(g.bonusTitle)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    dedupedGroups.push(g);
  }

  return {
    cutoffDate,
    groups: dedupedGroups,
    options: {
      allowNegativeNetPayments: !!allowNegativeNetPayments,
      failOnUnknownNodeIds: true,
      failOnUnknownBonusTitles: true,
    },
  };
};

const sendRequestAsync = (method, url, data) =>
  new Promise((resolve, reject) => {
    SendRequest(method, url, data, resolve, reject);
  });

const Payables2 = () => {
  const [show, setShow] = useState(false);
  const [currentDate, setCurrentDate] = useState();
  const [customerId, setCustomerId] = useState('');

  const [currentBatch, setCurrentBatch] = useState({ totalCustomers: 0, forfeitTotal: 0, total: 0 });
  const [currentBatchPayload, setCurrentBatchPayload] = useState(null);

  const [allowNegativeOverrideOnce, setAllowNegativeOverrideOnce] = useState(false);
  const [batchValidation, setBatchValidation] = useState({
    status: "idle", // idle | validating | valid | invalid | error
    message: null,
    negativeItems: [], // [{ nodeId, netDue }]
    computedAt: null,
  });

  /**
   * Lifted state from PayableSummaryPanel so it persists when the panel unmounts
   * (when switching to Customer view).
   *
   * This preserves your existing selection model:
   * - summaryRows[].selected (bonus-level default)
   * - bonusDetails[bonusKey].payables[].selected (leaf selections)
   */
  const [summaryRows, setSummaryRows] = useState([]);
  const [bonusDetails, setBonusDetails] = useState({});
  const [leafDueByKey, setLeafDueByKey] = useState({});

  const [selectionState, setSelectionState] = useState({
    defaults: { class: {}, period: {}, bonus: {} },
    overrides: {}
  });

  const setLeafDue = (earningsClass, periodId, bonusTitle, customerId, due) => {
    const cls = asClass(earningsClass);
    const key = toLeafKey(cls, periodId, bonusTitle, customerId);
    setLeafDueByKey(prev => ({ ...prev, [key]: Number(due ?? 0) }));
  };

  const getDefaultSelected = (earningsClass, periodId, bonusTitle) => {
    const cls = asClass(earningsClass);
    if (cls === "HOLD") return false;

    const bKey = toBonusKeyPipe(cls, periodId, bonusTitle);
    const pKey = toPeriodKey(cls, periodId);

    const { defaults } = selectionState;

    if (bKey in defaults.bonus) return !!defaults.bonus[bKey];
    if (pKey in defaults.period) return !!defaults.period[pKey];
    if (cls in defaults.class) return !!defaults.class[cls];

    return baseDefaultSelected(cls);
  };

  const getSelected = (earningsClass, periodId, bonusTitle, customerId) => {
    const cls = asClass(earningsClass);
    if (cls === "HOLD") return false;

    const leafKey = toLeafKey(cls, periodId, bonusTitle, customerId);
    if (leafKey in selectionState.overrides) return !!selectionState.overrides[leafKey];

    return getDefaultSelected(cls, periodId, bonusTitle);
  };

  const setClassSelected = (earningsClass, value) => {
    const cls = asClass(earningsClass);
    if (cls === "HOLD") return;

    setSelectionState(prev => {
      const next = structuredClone(prev);

      // Set class default
      next.defaults.class[cls] = !!value;

      // Clear period defaults for this class
      const periodPrefix = `${cls}|`;
      for (const k of Object.keys(next.defaults.period)) {
        if (k.startsWith(periodPrefix)) delete next.defaults.period[k];
      }

      // Clear bonus defaults for this class
      const bonusPrefix = `${cls}|`;
      for (const k of Object.keys(next.defaults.bonus)) {
        if (k.startsWith(bonusPrefix)) delete next.defaults.bonus[k];
      }

      // Clear ALL leaf overrides under this class (bulk action is authoritative)
      const leafPrefix = `${cls}|`;
      for (const k of Object.keys(next.overrides)) {
        if (k.startsWith(leafPrefix)) delete next.overrides[k];
      }

      // (Optional) keep cleanup pass if you want, but now it's redundant because we deleted all in-scope overrides.
      return next;
    });
  };

  const setPeriodSelected = (earningsClass, periodId, value) => {
    const cls = asClass(earningsClass);
    if (cls === "HOLD") return;
    if (periodId == null) return;

    setSelectionState(prev => {
      const next = structuredClone(prev);

      // Set period default
      const pKey = toPeriodKey(cls, periodId);
      next.defaults.period[pKey] = !!value;

      // Clear bonus defaults under this period
      const bonusPrefix = `${cls}|${String(periodId)}|`;
      for (const k of Object.keys(next.defaults.bonus)) {
        if (k.startsWith(bonusPrefix)) delete next.defaults.bonus[k];
      }

      // Clear ALL leaf overrides under this period
      const leafPrefix = `${cls}|${String(periodId)}|`;
      for (const k of Object.keys(next.overrides)) {
        if (k.startsWith(leafPrefix)) delete next.overrides[k];
      }

      return next;
    });
  };

  const setBonusSelected = (earningsClass, periodId, bonusTitle, value) => {
    const cls = asClass(earningsClass);
    if (cls === "HOLD") return;
    if (periodId == null) return;

    setSelectionState(prev => {
      const next = structuredClone(prev);

      // Set bonus default
      next.defaults.bonus[toBonusKeyPipe(cls, periodId, bonusTitle)] = !!value;

      // Clear ALL leaf overrides under this bonus
      const leafPrefix = `${cls}|${String(periodId)}|${normalizeBonus(bonusTitle)}|`;
      for (const k of Object.keys(next.overrides)) {
        if (k.startsWith(leafPrefix)) delete next.overrides[k];
      }

      return next;
    });
  };

  const setLeafSelected = (earningsClass, periodId, bonusTitle, customerId, value) => {
    const cls = asClass(earningsClass);
    if (cls === "HOLD") return;

    setSelectionState(prev => {
      const next = structuredClone(prev);
      const leafKey = toLeafKey(cls, periodId, bonusTitle, customerId);
      const d = getDefaultSelected(cls, periodId, bonusTitle);

      if (!!value === !!d) delete next.overrides[leafKey];
      else next.overrides[leafKey] = !!value;

      return next;
    });
  };

  useEffect(() => {
    const value = new Date(Date.now());
    value.setHours(23, 59, 59);
    setCurrentDate(value.toISOString());
  }, []);

  useEffect(() => {
    const batchUi = computeCurrentBatchUi({
      currentDate,
      summaryRows,
      bonusDetails,
      selectionState,
      leafDueByKey,
      getSelected,
      getDefaultSelected,
    });

    setCurrentBatch(batchUi);

    const payload = buildCurrentBatchPayload({
      currentDate,
      summaryRows,
      selectionState,
      getDefaultSelected,
      allowNegativeNetPayments: allowNegativeOverrideOnce,
    });

    setCurrentBatchPayload(payload);
  }, [currentDate, summaryRows, bonusDetails, selectionState, leafDueByKey]);

  useEffect(() => {
    setAllowNegativeOverrideOnce(false);
  }, [selectionState]);

  const handlePeriodChange = (name, value) => {
    setCurrentDate(value);
    setSelectionState({ defaults: { class: {}, period: {}, bonus: {} }, overrides: {} });

    // Clear batch + lifted summary state when date changes
    setCurrentBatch({ totalCustomers: 0, forfeitTotal: 0, total: 0 });
    setCurrentBatchPayload(null);
    setSummaryRows([]);
    setBonusDetails({});
    setLeafDueByKey({});

    setAllowNegativeOverrideOnce(false);
    setBatchValidation({ status: "idle", message: null, negativeItems: [], computedAt: null });
  };

  const handleSearch = async (name, value) => {
    setCustomerId(value && value !== '' ? value : null);
  };

  const handleRefetch = () => {
    //Do nothing
  };

  const handleClose = () => {
    setShow(false);
  };

  const handleCreateBatchClick = async () => {

    if (!currentBatchPayload) {
      setBatchValidation({
        status: "error",
        message: "Batch is not ready yet. Please try again.",
        negativeItems: [],
        computedAt: null
      });
      return;
    }

    // If the user has explicitly opted in after a failed validation,
    // skip validation ONCE and proceed to modal.
    if (allowNegativeOverrideOnce && batchValidation.status === "invalid") {
      setAllowNegativeOverrideOnce(false); // one-time use
      setShow(true);
      return;
    }

    // Normal path: validate first
    setBatchValidation({
      status: "validating",
      message: "Validating batch for negative payments…",
      negativeItems: [],
      computedAt: null
    });

    try {
      const res = await sendRequestAsync("POST", "/api/v1/Batches/validate", currentBatchPayload);

      if (res?.hasNegatives) {
        setBatchValidation({
          status: "invalid",
          message: "Some customers are below the minimum payout threshold",
          totals: res.totals,
          negativeItems: res.negativeItems ?? [],
          computedAt: res.computedAt ?? null
        });

        setShow(false);
        return;
      }

      setBatchValidation({
        status: "valid",
        message: "Validation passed.",
        totals: res.totals,
        negativeItems: [],
        computedAt: res.computedAt ?? null
      });

      setShow(true);
    } catch (e) {
      setBatchValidation({
        status: "error",
        message: "We couldn’t validate this batch.",
        negativeItems: [],
        computedAt: null
      });
      setShow(false);
    }
  };

  const isValidating = batchValidation.status === "validating";
  const invalid = batchValidation.status === "invalid";
  const overrideReady = invalid && allowNegativeOverrideOnce;
  const belowThresholdCount = batchValidation.negativeItems?.length ?? 0;

  const buttonLabel = (() => {
    if (isValidating) return "Validating…";
    if (overrideReady) return "Create Payment Batch";
    if (invalid) return "Re-validate Batch";
    return "Create Payment Batch";
  })();

  return (
    <>
      <PageHeader title="Commission Payables">
        <div className="container-xl">
          <div className="row row-cards">
            <div className="col-xl-9">
              <div className="mb-3">
                <div className="row g-2 align-items-center">
                  <div className="col-sm-auto">
                    <DateTimeInput name="currentDate" value={currentDate} onChange={handlePeriodChange} />
                  </div>
                  <div className="col-sm">
                    <div className="w-100">
                      <AutoComplete
                        placeholder="Search Payables"
                        value={customerId}
                        allowNull={true}
                        showClear={true}
                        onChange={handleSearch}
                      />
                    </div>
                  </div>
                  <div className="col-sm-auto"></div>
                </div>
              </div>

              {customerId && (
                <div className="card">
                  <CustomerPayablePanel2
                    date={currentDate}
                    customerId={customerId}

                    summaryRows={summaryRows}
                    setLeafDue={setLeafDue}
                    setSummaryRows={setSummaryRows}
                    bonusDetails={bonusDetails}
                    setBonusDetails={setBonusDetails}

                    getSelected={getSelected}
                    setLeafSelected={setLeafSelected}
                    setPeriodSelected={setPeriodSelected}
                  />
                </div>
              )}

              {!customerId && currentDate && (
                <PayableSummaryPanel2
                  date={currentDate}
                  handleViewCustomer={(id) => handleSearch(null, id)}
                  selectionState={selectionState}

                  summaryRows={summaryRows}
                  setSummaryRows={setSummaryRows}
                  bonusDetails={bonusDetails}
                  setBonusDetails={setBonusDetails}

                  getSelected={getSelected}
                  getDefaultSelected={getDefaultSelected}
                  setLeafDue={setLeafDue}
                  setLeafSelected={setLeafSelected}
                  setBonusSelected={setBonusSelected}
                  setPeriodSelected={setPeriodSelected}
                  setClassSelected={setClassSelected}
                />
              )}
            </div>

            <div className="col-xl-3">
              <div className="card payable-summary-sticky">
                {!currentBatch && <DataLoading />}

                {currentBatch && (
                  <>
                    <div className="card-header d-none d-sm-block">
                      <h3 className="card-title">Payable Summary</h3>
                    </div>

                    <div className="card-body">
                      <div className="d-flex justify-content-between">
                        <p className="mb-2 text-muted">Payables</p>
                        <p className="mb-2 text-muted">{currentBatch.totalCustomers}</p>
                      </div>

                      <div className="d-flex justify-content-between">
                        <p className="mb-2 text-muted">Forfeited</p>
                        <p className="mb-2 text-muted">
                          {(currentBatch.forfeitTotal ?? 0).toLocaleString("en-US", { style: 'currency', currency: 'USD' })}
                        </p>
                      </div>

                      <div className="d-flex justify-content-between">
                        <p className="mb-2">Release Total</p>
                        <p className="mb-2 fw-bold">
                          {(currentBatch.total ?? 0).toLocaleString("en-US", { style: 'currency', currency: 'USD' })}
                        </p>
                      </div>

                      {batchValidation.status === "error" && (
                        <div className="alert alert-danger mt-3 mb-0 p-0" role="alert">
                          <div className="p-2">
                            <div className="fw-semibold">Validation failed</div>

                            <div className="small text-muted mt-1">
                              We couldn&apos;t validate this batch. Please try again.
                            </div>

                            <div className="d-flex gap-2 mt-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={handleCreateBatchClick}
                                disabled={batchValidation.status === "validating"}
                              >
                                Try again
                              </button>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => {
                                  // Optional: clear the error state so the panel returns to normal
                                  setBatchValidation({
                                    status: "idle",
                                    message: null,
                                    negativeItems: [],
                                    computedAt: null,
                                  });
                                }}
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>

                          {batchValidation?.message && (
                            <div className="small text-muted border-top px-2 py-1">
                              {batchValidation.message}
                            </div>
                          )}
                        </div>
                      )}

                      {batchValidation.status === "invalid" && (
                        <div className="alert alert-warning mt-3 mb-0 p-0" role="alert">
                          <div className="p-2">
                            <div className="fw-semibold">Below payout threshold</div>
                            <div className="small text-muted mt-1">
                              {belowThresholdCount} customer{belowThresholdCount === 1 ? "" : "s"} below the minimum payout.
                            </div>
                          </div>
                          <div className="mt-2" style={{ maxHeight: 160, overflow: "auto" }}>
                            <table className="table table-sm mb-0">
                              <thead>
                                <tr>
                                  <th>Customer Id</th>
                                  <th className="text-end">Amount Due</th>
                                  <th className="text-end"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {(batchValidation.negativeItems ?? []).map(x => (
                                  <tr key={x.nodeId}>
                                    <td className="text-muted">{x.nodeId}</td>
                                    <td className="text-end fw-semibold">
                                      {(x.netDue ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                                    </td>
                                    <td className="text-end">
                                      <button
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => handleSearch(null, x.nodeId)}
                                      >
                                        Review
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {batchValidation.computedAt && (
                            <div className="small text-muted mt-2 ps-2 pb-1 text-center">
                              Validated at: {new Date(batchValidation.computedAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                      )}

                      {batchValidation.status === "invalid" && (
                        <div className="mt-3">
                          <label className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={allowNegativeOverrideOnce}
                              onChange={(e) => setAllowNegativeOverrideOnce(e.target.checked)}
                            />
                            <span className="form-check-label">
                              Include below-threshold payouts
                            </span>
                          </label>

                          <div className="small text-muted mt-1">
                            Allows this batch to be created even if some customers are below the threshold amount.
                          </div>
                        </div>
                      )}

                      <div className="mt-3 ms-auto">
                        {(currentBatch.totalCustomers === 0) ? (
                          <button className="btn btn-success mb-2 w-100" disabled={true}>
                            Create Payment Batch
                          </button>
                        ) : (
                          <button
                            className={`btn mb-2 w-100 ${overrideReady ? "btn-warning" : "btn-success"}`}
                            onClick={handleCreateBatchClick}
                            disabled={isValidating}
                          >
                            {isValidating && <span className="spinner-border spinner-border-sm me-2" role="status"></span>}
                            {buttonLabel}
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </PageHeader>

      <PayablesModal2 showModal={show} onHide={handleClose} batchData={currentBatchPayload} validation={batchValidation} />
    </>
  );
};

export default Payables2;
