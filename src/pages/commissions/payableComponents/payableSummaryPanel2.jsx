import React, { useEffect, useMemo, useLayoutEffect, useRef, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { gql, useApolloClient, useQuery } from "@apollo/client";

import DataLoading from "../../../components/dataLoading.jsx";
import DataError from "../../../components/dataError.jsx";
import CheckBox from "../../../components/checkbox.jsx";
import EmptyContent from "../../../components/emptyContent.jsx";
import LocalDate from "../../../util/LocalDate.jsx";
import Pagination from "../../../components/pagination.jsx";

const GET_SUMMARY = gql`
  query ($date: Date!) {
    unreleasedSummary(date: $date) {
      bonusTitle
      earningsClass
      released
      paidAmount
      paidCount
      customerPaidCount
      totalVolume
      period {
        id
        begin
        end
      }
    }
  }
`;

const GET_BONUSES = gql`
  query ($date: Date, $bonusTitle: String, $earningsClass: EarningsClass, $periodId: BigInt) {
    unreleased(
      date: $date
      bonusTitle: $bonusTitle
      earningsClass: $earningsClass
      periodId: $periodId
      offset: 0
      first: 10000
    ) {
      amount
      bonusTitle
      released
      period { id }
      customer {
        id
        fullName
        webAlias
        status {
          name
          statusClass
          earningsClass
        }
        customerType {
          id
          name
        }
      }
    }
  }
`;


const CLASS_ORDER = ["RELEASE", "FORFEIT", "HOLD"];

const formatMoney = (v) =>
  (v ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" });

const formatInt = (v) => (v ?? 0).toLocaleString("en-US");

const asClass = (v) => String(v ?? "").toUpperCase();

const toBonusKey = (earningsClass, periodId, bonusTitle) =>
  `${asClass(earningsClass)}_${String(periodId)}_${String(bonusTitle ?? "")
    .trim()
    .toLowerCase()}`;

const normalizeBonus = (v) => String(v ?? "").trim().toLowerCase();

const toBonusKeyUnderscore = (earningsClass, periodId, bonusTitle) =>
  `${String(earningsClass ?? "").toUpperCase()}_${String(periodId)}_${normalizeBonus(bonusTitle)}`;

const triStateFromCounts = (selected, total) => {
  if (total <= 0) return { all: false, none: true, some: false };
  if (selected <= 0) return { all: false, none: true, some: false };
  if (selected >= total) return { all: true, none: false, some: false };
  return { all: false, none: false, some: true };
};

const TriStateCheckBox = ({ checked, indeterminate, disabled, onChange, ariaLabel }) => {
  const inputRef = useRef(null);

  // Keep a stable ref callback (do NOT depend on checked/indeterminate)
  const setRef = useCallback((el) => {
    inputRef.current = el;
  }, []);

  // Enforce on every commit (no dependency array)
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    // Never allow indeterminate to remain true when checked is true
    el.indeterminate = !!indeterminate && !checked;

    // Optional: if something is racing you, enforce again next frame
    // requestAnimationFrame(() => {
    //   if (inputRef.current) inputRef.current.indeterminate = !!indeterminate && !checked;
    // });
  });

  return (
    <label className="form-check m-0">
      <input
        ref={setRef}
        className="form-check-input"
        type="checkbox"
        checked={!!checked}
        disabled={!!disabled}
        onChange={(e) => {
          // Clear immediately before state updates
          if (inputRef.current) inputRef.current.indeterminate = false;
          onChange(e.target.checked);
        }}
        aria-label={ariaLabel}
      />
    </label>
  );
};

TriStateCheckBox.propTypes = {
  checked: PropTypes.bool,
  indeterminate: PropTypes.bool,
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string,
};

const getSelectionState = (items) => {
  if (!items?.length) return { all: false, none: true, some: false };
  const selectedCount = items.reduce((t, x) => t + (x.selected ? 1 : 0), 0);
  const all = selectedCount === items.length;
  const none = selectedCount === 0;
  const some = !all && !none;
  return { all, none, some };
};

const statusColor = (statusClass) =>
  statusClass === "INACTIVE" ? "orange" : statusClass === "DELETED" ? "red" : "green";

const sectionMeta = (earningsClass) => {
  const cls = asClass(earningsClass);

  const title =
    cls === "RELEASE"
      ? "Bonuses to Release"
      : cls === "FORFEIT"
        ? "Bonuses to Forfeit"
        : "Bonuses on Hold";

  const subtitle =
    cls === "RELEASE"
      ? "Included in the next payout batch"
      : cls === "FORFEIT"
        ? "Excluded from payout"
        : "Pending administrator action";

  const badgeClass =
    cls === "RELEASE"
      ? "bg-green-lt text-green"
      : cls === "FORFEIT"
        ? "bg-yellow-lt text-yellow"
        : "bg-secondary-lt text-secondary";

  return { title, subtitle, badgeClass, badgeText: cls };
};

/**
 * Merged hierarchy component
 *
 * Props:
 * - date
 * - setCurrentBatch
 * - handleViewCustomer(customerId)
 * - handleViewBonus({ bonus, earningsClass })  (still used on bonus name click if you want)
 */
const PayableSummaryPanel2 = ({
  date,
  handleViewCustomer,
  selectionState,

  summaryRows,
  setSummaryRows,
  bonusDetails,
  setBonusDetails,
  getDefaultSelected,
  getSelected,

  setClassSelected,
  setPeriodSelected,
  setBonusSelected,
  setLeafDue,
  setLeafSelected
}) => {

  const client = useApolloClient();

  // Expanded state:
  const [expandedPeriods, setExpandedPeriods] = useState(() => new Set()); // key: `${class}_${periodId}`
  const [expandedBonuses, setExpandedBonuses] = useState(() => new Set()); // key: bonusKey

  const { loading, error, data } = useQuery(GET_SUMMARY, { variables: { date } });

  // Build / rebuild summary rows, BUT preserve prior selection state by key.
  useEffect(() => {
    if (!data?.unreleasedSummary) return;

    setSummaryRows((prev) => {
      const prevSelectedByKey = new Map((prev ?? []).map(r => [r.key, !!r.selected]));

      const grouped = data.unreleasedSummary.reduce((acc, current) => {
        const key = toBonusKey(current.earningsClass, current.period?.id, current.bonusTitle);

        if (!acc[key]) {
          const cls = asClass(current.earningsClass);

          acc[key] = {
            ...current,
            key,
            // ensure numeric
            paidAmount: 0,
            released: 0,
            customerPaidCount: 0,
          };
        }

        acc[key].paidAmount += current.paidAmount ?? 0;
        acc[key].released += current.released ?? 0;
        acc[key].customerPaidCount += current.customerPaidCount ?? 0;

        return acc;
      }, {});

      const rows = Object.values(grouped).sort((a, b) => {
        const classSort =
          CLASS_ORDER.indexOf(asClass(a.earningsClass)) - CLASS_ORDER.indexOf(asClass(b.earningsClass));
        if (classSort !== 0) return classSort;
        return new Date(a.period?.end) - new Date(b.period?.end);
      });

      return rows;
    });
  }, [data, setSummaryRows]);

  // View model: class -> periods -> bonuses (summary rows)
  const viewModel = useMemo(() => {
    const byClass = new Map();

    for (const r of summaryRows ?? []) {
      const cls = asClass(r.earningsClass);
      if (!byClass.has(cls)) byClass.set(cls, new Map());

      const byPeriod = byClass.get(cls);
      const periodId = r.period?.id;

      if (!byPeriod.has(periodId)) byPeriod.set(periodId, { period: r.period, bonuses: [] });
      byPeriod.get(periodId).bonuses.push(r);
    }

    return CLASS_ORDER.filter((c) => byClass.has(c)).map((c) => {
      const periodsMap = byClass.get(c);
      const periods = Array.from(periodsMap.values()).sort(
        (a, b) => new Date(a.period?.end) - new Date(b.period?.end)
      );

      // Sort bonuses inside period by title
      for (const p of periods) {
        p.bonuses.sort((x, y) => String(x.bonusTitle ?? "").localeCompare(String(y.bonusTitle ?? "")));
      }

      return { earningsClass: c, periods };
    });
  }, [summaryRows]);

  const excludedCountByBonus = useMemo(() => {
    // key: `${CLS}_${periodId}_${bonusLower}` -> count of excluded customers
    const map = Object.create(null);

    for (const [leafKey, selected] of Object.entries(selectionState?.overrides ?? {})) {
      if (selected !== false) continue; // only exclusions when defaultSelected is true

      // leafKey format: CLS|periodId|bonusLower|customerId
      const parts = leafKey.split("|");
      if (parts.length < 4) continue;

      const cls = parts[0];
      const periodId = parts[1];
      const bonusLower = parts[2];

      const ukey = `${cls}_${periodId}_${bonusLower}`;
      map[ukey] = (map[ukey] ?? 0) + 1;
    }

    return map;
  }, [selectionState]);

  const includedCountByBonus = useMemo(() => {
    // key: `${CLS}_${periodId}_${bonusLower}` -> count of included customers (override === true)
    const map = Object.create(null);

    for (const [leafKey, selected] of Object.entries(selectionState?.overrides ?? {})) {
      if (selected !== true) continue;

      // leafKey format: CLS|periodId|bonusLower|customerId
      const parts = leafKey.split("|");
      if (parts.length < 4) continue;

      const cls = parts[0];
      const periodId = parts[1];
      const bonusLower = parts[2];

      const ukey = `${cls}_${periodId}_${bonusLower}`;
      map[ukey] = (map[ukey] ?? 0) + 1;
    }

    return map;
  }, [selectionState]);

  const togglePeriod = (periodKey) => {
    setExpandedPeriods((prev) => {
      const next = new Set(prev);
      if (next.has(periodKey)) next.delete(periodKey);
      else next.add(periodKey);
      return next;
    });
  };

  const toggleBonus = (bonusKey) => {
    setExpandedBonuses((prev) => {
      const next = new Set(prev);
      if (next.has(bonusKey)) next.delete(bonusKey);
      else next.add(bonusKey);
      return next;
    });
  };

  const expandBonus = (bonusRow) => {
    const bonusKey = bonusRow.key;

    // 1) Open immediately so the loading UI can render
    setExpandedBonuses((prev) => {
      const next = new Set(prev);
      next.add(bonusKey);
      return next;
    });

    // 2) Kick off loading (do NOT await)
    void ensureBonusLoaded(bonusRow);
  };

  const collapseBonus = (bonusKey) => {
    setExpandedBonuses((prev) => {
      const next = new Set(prev);
      next.delete(bonusKey);
      return next;
    });
  };

  const ensureBonusLoaded = useCallback(
    async (summaryRow) => {
      const cls = asClass(summaryRow.earningsClass);
      const periodId = Number(summaryRow.period?.id);
      const bonusTitle = summaryRow.bonusTitle;

      const bonusKey = toBonusKey(cls, periodId, bonusTitle);

      // Already loaded or in-flight
      if (bonusDetails[bonusKey]?.loading || bonusDetails[bonusKey]?.payables) return;

      setBonusDetails((prev) => ({
        ...prev,
        [bonusKey]: {
          loading: true,
          error: null,
          payables: null,
          page: { offset: 0, count: 10 },
        },
      }));

      try {
        const res = await client.query({
          query: GET_BONUSES,
          variables: { date, bonusTitle, earningsClass: cls, periodId },
          fetchPolicy: "network-only",
        });

        const raw = res?.data?.unreleased ?? [];

        const grouped = raw.reduce((acc, current) => {
          const customerId = current.customer?.id;
          if (!customerId) return acc;

          if (!acc[customerId]) {
            acc[customerId] = {
              ...current,
              amount: 0,
              released: 0,
            };
          }

          acc[customerId].amount += current.amount ?? 0;
          acc[customerId].released += current.released ?? 0;

          return acc;
        }, {});

        const payables = Object.values(grouped)
          .map((p) => ({
            ...p,
            // stable leaf id
            id: `${bonusKey}_${p.customer?.id}`,
            // selection comes from getSelected; keep no selected flag here
            earningsClass: cls,
            periodId,
          }))
          .sort((a, b) => String(a.customer?.fullName ?? "").localeCompare(String(b.customer?.fullName ?? "")));

        setBonusDetails((prev) => ({
          ...prev,
          [bonusKey]: {
            loading: false,
            error: null,
            payables,
            page: prev[bonusKey]?.page ?? { offset: 0, count: 10 },
          },
        }));
      } catch (e) {
        setBonusDetails((prev) => ({
          ...prev,
          [bonusKey]: {
            loading: false,
            error: e,
            payables: null,
            page: prev[bonusKey]?.page ?? { offset: 0, count: 10 },
          },
        }));
      }
    },
    [bonusDetails, client, date]
  );

  const getBonusSelectionState = (summaryRow) => {
    const cls = asClass(summaryRow.earningsClass);
    const periodId = summaryRow.period?.id;
    const bonusTitle = summaryRow.bonusTitle;

    const d = bonusDetails[summaryRow.key];
    if (d?.payables?.length) {
      const leaves = d.payables.map(p => ({
        selected: getSelected(cls, periodId, bonusTitle, p.customer?.id),
      }));
      return getSelectionState(leaves);
    }

    const defaultSelected = getDefaultSelected(cls, periodId, bonusTitle);
    const total = summaryRow.customerPaidCount ?? 0;

    if (total <= 0) return { all: true, none: false, some: false };

    const ukey = toBonusKeyUnderscore(cls, periodId, bonusTitle);

    if (defaultSelected) {
      const excluded = excludedCountByBonus?.[ukey] ?? 0;
      const selectedCount = Math.max(0, total - excluded);
      return triStateFromCounts(selectedCount, total);
    } else {
      const included = includedCountByBonus?.[ukey] ?? 0;
      const selectedCount = Math.min(total, included);
      return triStateFromCounts(selectedCount, total);
    }

    /* 
        const prefix = `${cls}|${String(periodId)}|${String(bonusTitle ?? "").trim().toLowerCase()}|`;
        let excluded = 0;
    
        for (const [leafKey, selected] of Object.entries(selectionState.overrides)) {
          if (!leafKey.startsWith(prefix)) continue;
          if (selected === false) excluded += 1; // defaultSelected === true
        }
    
        if (excluded <= 0) return { all: true, none: false, some: false };
        if (excluded >= total) return { all: false, none: true, some: false };
        return { all: false, none: false, some: true }; */
  };

  // Period checkbox state aggregates its bonuses (leaf-aware where loaded)
  const getPeriodSelectionState = (earningsClass, period) => {
    const cls = asClass(earningsClass);
    const periodId = period?.id;
    if (periodId == null) return { all: false, none: true, some: false };

    const bonuses = (summaryRows ?? []).filter(
      (r) => asClass(r.earningsClass) === cls && r.period?.id === periodId
    );

    let total = 0;
    let selected = 0;

    for (const b of bonuses) {
      const bonusTotal = b.customerPaidCount ?? 0;
      total += bonusTotal;

      const d = bonusDetails?.[b.key];

      if (d?.payables?.length) {
        // Count loaded leaves
        let loadedSelected = 0;
        for (const p of d.payables) {
          const cid = p.customer?.id;
          if (!cid) continue;
          if (getSelected(cls, periodId, b.bonusTitle, cid)) loadedSelected += 1;
        }

        // Assume unseen customers follow the bonus default
        const loadedCount = d.payables.length;
        const unseen = Math.max(0, bonusTotal - loadedCount);
        const defaultSelected = getDefaultSelected(cls, periodId, b.bonusTitle);

        selected += loadedSelected + (defaultSelected ? unseen : 0);
        continue;
      }

      // Unloaded bonus: summary default + exclusions
      const defaultSelected = getDefaultSelected(cls, periodId, b.bonusTitle);
      const ukey = toBonusKeyUnderscore(cls, periodId, b.bonusTitle);

      if (defaultSelected) {
        const excluded = excludedCountByBonus?.[ukey] ?? 0;
        selected += Math.max(0, bonusTotal - excluded);
      } else {
        const included = includedCountByBonus?.[ukey] ?? 0;
        selected += Math.min(bonusTotal, included);
      }
    }

    return triStateFromCounts(selected, total);
  };

  // Class checkbox state aggregates all bonuses in class (leaf-aware where loaded)
  const getClassSelectionState = (earningsClass) => {
    const cls = asClass(earningsClass);

    const bonuses = (summaryRows ?? []).filter((r) => asClass(r.earningsClass) === cls);

    let total = 0;
    let selected = 0;

    for (const b of bonuses) {
      const periodId = b.period?.id;
      if (periodId == null) continue;

      const bonusTotal = b.customerPaidCount ?? 0;
      total += bonusTotal;

      const d = bonusDetails?.[b.key];

      if (d?.payables?.length) {
        let loadedSelected = 0;
        for (const p of d.payables) {
          const cid = p.customer?.id;
          if (!cid) continue;
          if (getSelected(cls, periodId, b.bonusTitle, cid)) loadedSelected += 1;
        }

        const loadedCount = d.payables.length;
        const unseen = Math.max(0, bonusTotal - loadedCount);
        const defaultSelected = getDefaultSelected(cls, periodId, b.bonusTitle);

        selected += loadedSelected + (defaultSelected ? unseen : 0);
        continue;
      }

      const defaultSelected = getDefaultSelected(cls, periodId, b.bonusTitle);
      const ukey = toBonusKeyUnderscore(cls, periodId, b.bonusTitle);

      if (defaultSelected) {
        const excluded = excludedCountByBonus?.[ukey] ?? 0;
        selected += Math.max(0, bonusTotal - excluded);
      } else {
        const included = includedCountByBonus?.[ukey] ?? 0;
        selected += Math.min(bonusTotal, included);
      }
    }

    return triStateFromCounts(selected, total);
  };

  if (loading) return <DataLoading />;
  if (error) return <DataError error={error} />;

  return (
    <>
      {(!summaryRows || summaryRows.length === 0) && (
        <div className="card-body">
          <EmptyContent
            title="No payables found"
            text="Try adjusting your search or filter to find what you're looking for."
          />
        </div>
      )}

      {summaryRows && summaryRows.length > 0 && (
        <div className="card-body">
          <div className="accordion" id="earningsClassAccordion">
            {viewModel.map(({ earningsClass, periods }) => {
              const isHold = earningsClass === "HOLD";
              const collapseId = `collapse_${earningsClass}`;
              const headerId = `heading_${earningsClass}`;
              const openByDefault = earningsClass === "RELEASE";

              const classSel = getClassSelectionState(earningsClass);
              const meta = sectionMeta(earningsClass);

              // KPI totals shown in header: use summary totals (fast) but leaf overrides will affect batch totals.
              const classSummaryRows = summaryRows.filter((r) => asClass(r.earningsClass) === earningsClass);
              const summaryCustomers = classSummaryRows.reduce((t, x) => t + (x.customerPaidCount ?? 0), 0);
              const summaryDue = classSummaryRows.reduce((t, x) => t + ((x.paidAmount ?? 0) - (x.released ?? 0)), 0);

              // "Selected" KPI: if any leaf loaded, approximate with leaf-selected customers; else summary selected customers
              const leafSelectedCount = classSummaryRows.reduce((t, r) => {
                const cls = asClass(r.earningsClass);
                const periodId = r.period?.id;
                const bonusTitle = r.bonusTitle;

                const d = bonusDetails[r.key];
                if (d?.payables?.length) {
                  return t + d.payables.reduce((tt, p) => {
                    const cid = p.customer?.id;
                    if (!cid) return tt;
                    return tt + (getSelected(cls, periodId, bonusTitle, cid) ? 1 : 0);
                  }, 0);
                }

                return t + (getDefaultSelected(cls, periodId, bonusTitle) ? (r.customerPaidCount ?? 0) : 0);
              }, 0);


              return (
                <div className="card mb-3" key={earningsClass}>
                  <div className="accordion-item">
                    <h2 className="accordion-header" id={headerId}>
                      <div className="d-flex w-100 align-items-center">
                        <div
                          className="px-3 d-flex align-items-center pe-0 ps-3"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        >
                          <TriStateCheckBox
                            checked={classSel.all}
                            indeterminate={classSel.some}
                            disabled={isHold}
                            onChange={(checked) => setClassSelected(earningsClass, checked)}
                            ariaLabel="Select/unselect all rows in this section"
                          />
                        </div>

                        <button
                          className={`accordion-button ${openByDefault ? "" : "collapsed"}`}
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target={`#${collapseId}`}
                          aria-expanded={openByDefault ? "true" : "false"}
                          aria-controls={collapseId}
                        >
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center gap-2">
                              <div className="fw-semibold">{meta.title}</div>
                              <span className={`badge ${meta.badgeClass}`}>{meta.badgeText}</span>
                            </div>
                            <div className="text-muted small">{meta.subtitle}</div>
                          </div>

                          <div className="d-none d-md-flex align-items-center gap-3">
                            <div className="text-end">
                              <div className="text-muted small">Selected</div>
                              <div className="fw-semibold">{formatInt(leafSelectedCount)}</div>
                            </div>
                            <div className="text-end">
                              <div className="text-muted small">Payables</div>
                              <div className="fw-semibold">{formatInt(summaryCustomers)}</div>
                            </div>
                            <div className="text-end pe-3">
                              <div className="text-muted small">Amount Due</div>
                              <div className="fw-semibold">{formatMoney(summaryDue)}</div>
                            </div>
                          </div>
                        </button>
                      </div>
                    </h2>

                    <div
                      id={collapseId}
                      className={`accordion-collapse collapse ${openByDefault ? "show" : ""}`}
                      aria-labelledby={headerId}
                      data-bs-parent="#earningsClassAccordion"
                    >
                      <div className="table-responsive">
                        <table className="table table-hover card-table table-vcenter text-nowrap datatable mb-0">
                          <thead>
                            <tr>
                              <th className="w-1">
                              </th>
                              <th>Period</th>
                              <th>Payables</th>
                              <th className="text-end">Total Bonus</th>
                              <th className="w-1"></th>
                            </tr>
                          </thead>

                          <tbody>
                            {periods.map(({ period, bonuses }) => {
                              const periodKey = `${earningsClass}_${period.id}`;
                              const isPeriodOpen = expandedPeriods.has(periodKey);

                              const periodCustomers = bonuses.reduce((t, x) => t + (x.customerPaidCount ?? 0), 0);
                              const periodDue = bonuses.reduce((t, x) => t + ((x.paidAmount ?? 0) - (x.released ?? 0)), 0);

                              const periodSel = getPeriodSelectionState(earningsClass, period);

                              return (
                                <React.Fragment key={periodKey}>
                                  {/* Period row */}
                                  <tr className={isPeriodOpen ? "bg-light" : ""}>
                                    <td onClick={(e) => e.stopPropagation()}>
                                      <TriStateCheckBox
                                        checked={periodSel.all}
                                        indeterminate={periodSel.some}
                                        disabled={isHold}
                                        onChange={(checked) => setPeriodSelected(earningsClass, period.id, checked)}
                                        ariaLabel="Select/unselect all bonuses in this period"
                                      />
                                    </td>

                                    <td role="button" onClick={() => togglePeriod(periodKey)}>
                                      <LocalDate dateString={period.end} />
                                      <div className="small text-muted">
                                        Starts: <LocalDate dateString={period.begin} />
                                      </div>
                                    </td>

                                    <td role="button" onClick={() => togglePeriod(periodKey)}>
                                      {formatInt(periodCustomers)}
                                    </td>

                                    <td className="text-end" role="button" onClick={() => togglePeriod(periodKey)}>
                                      {formatMoney(periodDue)}
                                    </td>

                                    <td className="text-end">
                                      <button
                                        type="button"
                                        className="btn-action btn-icon"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          togglePeriod(periodKey);
                                        }}
                                        aria-expanded={isPeriodOpen}
                                        aria-label={isPeriodOpen ? "Collapse period" : "Expand period"}
                                      >
                                        {!isPeriodOpen ? (
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="icon icon-tabler icons-tabler-outline icon-tabler-chevron-down"
                                          >
                                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                            <path d="M6 9l6 6l6 -6" />
                                          </svg>
                                        ) : (
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="icon icon-tabler icons-tabler-outline icon-tabler-chevron-up"
                                          >
                                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                            <path d="M6 15l6 -6l6 6" />
                                          </svg>
                                        )}
                                      </button>
                                    </td>
                                  </tr>

                                  {/* Bonuses for period */}
                                  {isPeriodOpen && (
                                    <tr className="no-hover bg-grey">
                                      <td colSpan={5} className="p-2 ps-3 bg-white">
                                        <div className="border rounded-2 bg-white">
                                          <div className="table-responsive">
                                            <table className="table mb-0 table-vcenter text-nowrap">
                                              <thead className="table-light">
                                                <tr>
                                                  <th style={{ width: 42 }}></th>
                                                  <th>Bonus</th>
                                                  <th className="text-start d-none d-sm-table-cell" style={{ width: 140 }}>
                                                    Payables
                                                  </th>
                                                  <th className="text-end" style={{ width: 160 }}>
                                                    Amount Due
                                                  </th>
                                                  <th className="w-1"></th>
                                                </tr>
                                              </thead>

                                              <tbody>
                                                {bonuses.map((b) => {
                                                  const bonusKey = b.key;
                                                  const isBonusOpen = expandedBonuses.has(bonusKey);

                                                  const bonusDue = (b.paidAmount ?? 0) - (b.released ?? 0);
                                                  const bonusPayablesCount = b.customerPaidCount ?? 0;

                                                  const bonusSel = getBonusSelectionState(b);

                                                  const detail = bonusDetails[bonusKey];

                                                  return (
                                                    <React.Fragment key={bonusKey}>
                                                      <tr className={isBonusOpen ? "bg-light" : ""}>
                                                        <td onClick={(e) => e.stopPropagation()}>
                                                          <TriStateCheckBox
                                                            checked={bonusSel.all}
                                                            indeterminate={bonusSel.some}
                                                            disabled={isHold}
                                                            onChange={(checked) => setBonusSelected(b.earningsClass, b.period?.id, b.bonusTitle, checked)}
                                                            ariaLabel="Select/unselect all customers in this bonus"
                                                          />
                                                        </td>

                                                        <td role="button"
                                                          onClick={async () => {
                                                            // Load details on expand
                                                            if (isBonusOpen) collapseBonus(bonusKey);
                                                            else expandBonus(b);
                                                          }}
                                                        >
                                                          {b.bonusTitle}
                                                        </td>

                                                        <td className="d-none d-sm-table-cell text-start" role="button"
                                                          onClick={async () => {
                                                            if (isBonusOpen) collapseBonus(bonusKey);
                                                            else expandBonus(b);
                                                          }}
                                                        >
                                                          {formatInt(bonusPayablesCount)}
                                                        </td>

                                                        <td className="text-end fw-semibold" role="button"
                                                          onClick={async () => {
                                                            if (isBonusOpen) collapseBonus(bonusKey);
                                                            else expandBonus(b);
                                                          }}
                                                        >
                                                          {formatMoney(bonusDue)}
                                                        </td>

                                                        <td className="text-end">
                                                          <button
                                                            type="button"
                                                            className="btn-action btn-icon"
                                                            onClick={async (e) => {
                                                              e.preventDefault();
                                                              e.stopPropagation();
                                                              if (isBonusOpen) collapseBonus(bonusKey);
                                                              else expandBonus(b);
                                                            }}
                                                            aria-expanded={isBonusOpen}
                                                            aria-label={isBonusOpen ? "Collapse bonus" : "Expand bonus"}
                                                          >
                                                            {!isBonusOpen ? (
                                                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                                                strokeLinecap="round" strokeLinejoin="round"
                                                                className="icon icon-tabler icons-tabler-outline icon-tabler-chevron-down">
                                                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                                <path d="M6 9l6 6l6 -6" />
                                                              </svg>
                                                            ) : (
                                                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                                                strokeLinecap="round" strokeLinejoin="round"
                                                                className="icon icon-tabler icons-tabler-outline icon-tabler-chevron-up">
                                                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                                <path d="M6 15l6 -6l6 6" />
                                                              </svg>
                                                            )}
                                                          </button>
                                                        </td>
                                                      </tr>

                                                      {/* Payables for bonus */}
                                                      {isBonusOpen && (
                                                        <tr className="no-hover">
                                                          <td colSpan={5} className="p-2 ps-3 bg-white">
                                                            <div className="border rounded-2 bg-white">
                                                              {detail?.loading && <DataLoading />}
                                                              {detail?.error && <DataError error={detail.error} />}

                                                              {detail?.payables && (
                                                                <>
                                                                  <div className="table-responsive">
                                                                    <table className="table mb-0 table-vcenter text-nowrap">
                                                                      <thead>
                                                                        <tr>
                                                                          <th></th>
                                                                          <th>Customer</th>
                                                                          <th className="d-none d-sm-table-cell">Handle</th>
                                                                          <th className="d-none d-sm-table-cell">Status</th>
                                                                          <th className="d-none d-sm-table-cell text-end w-4">Bonus Amount</th>
                                                                          <th className="d-none d-sm-table-cell text-end w-4">Released</th>
                                                                          <th className="border-start text-center w-3">Amount Due</th>
                                                                        </tr>
                                                                      </thead>

                                                                      <tbody>
                                                                        {detail.payables.map((p, index) => {
                                                                          const { offset, count } = detail.page ?? { offset: 0, count: 10 };
                                                                          if (index < offset || index >= offset + count) return null;

                                                                          return (
                                                                            <tr key={p.id}>
                                                                              <td className="w-1">
                                                                                <CheckBox
                                                                                  name={p.id}
                                                                                  disabled={isHold}
                                                                                  value={getSelected(b.earningsClass, b.period?.id, b.bonusTitle, p.customer?.id)}
                                                                                  onChange={(name, value) => {
                                                                                    const due = (p.amount ?? 0) - (p.released ?? 0);
                                                                                    setLeafDue(b.earningsClass, b.period?.id, b.bonusTitle, p.customer?.id, due);
                                                                                    setLeafSelected(b.earningsClass, b.period?.id, b.bonusTitle, p.customer?.id, value);
                                                                                  }}
                                                                                />
                                                                              </td>

                                                                              <td>
                                                                                <button
                                                                                  onClick={() => handleViewCustomer?.(p.customer?.id)}
                                                                                  className="btn-link text-reset p-0"
                                                                                >
                                                                                  {p.customer?.fullName}
                                                                                </button>
                                                                              </td>

                                                                              <td className="d-none d-sm-table-cell text-start">
                                                                                <button
                                                                                  onClick={() => handleViewCustomer?.(p.customer?.id)}
                                                                                  className="btn-link text-reset p-0"
                                                                                >
                                                                                  {p.customer?.webAlias}
                                                                                </button>
                                                                              </td>

                                                                              <td className="d-none d-sm-table-cell text-start">
                                                                                <span className={`status status-${statusColor(p.customer?.status?.statusClass)} status-lite`}>
                                                                                  <span className="status-dot"></span> {p.customer?.status?.name}
                                                                                </span>
                                                                              </td>

                                                                              <td className="d-none d-sm-table-cell text-end">
                                                                                {formatMoney(p.amount)}
                                                                              </td>

                                                                              <td className="d-none d-sm-table-cell text-end">
                                                                                {formatMoney(p.released)}
                                                                              </td>

                                                                              <td className="border-start text-end strong">
                                                                                {formatMoney((p.amount ?? 0) - (p.released ?? 0))}
                                                                              </td>
                                                                            </tr>
                                                                          );
                                                                        })}
                                                                      </tbody>
                                                                    </table>
                                                                  </div>

                                                                  <div className="card-footer d-flex align-items-center">
                                                                    <Pagination
                                                                      variables={detail.page ?? { offset: 0, count: 10 }}
                                                                      total={detail.payables.length}
                                                                      refetch={(page) => {
                                                                        setBonusDetails((prev) => ({
                                                                          ...prev,
                                                                          [bonusKey]: {
                                                                            ...prev[bonusKey],
                                                                            page: { offset: page.offset, count: 10 },
                                                                          },
                                                                        }));
                                                                      }}
                                                                    />
                                                                  </div>
                                                                </>
                                                              )}
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      )}
                                                    </React.Fragment>
                                                  );
                                                })}
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )
      }
    </>
  );
};

export default PayableSummaryPanel2;

PayableSummaryPanel2.propTypes = {
  date: PropTypes.string.isRequired,
  handleViewCustomer: PropTypes.func,
  handleViewBonus: PropTypes.func,
  setLeafDue: PropTypes.func,
};
