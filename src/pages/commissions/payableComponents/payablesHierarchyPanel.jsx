/* import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
      customerPaidCount
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
      period {
        id
      }
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

const earningsColor = (earningsClass) =>
  earningsClass === "HOLD" ? "orange" : earningsClass === "FORFEIT" ? "red" : "green";

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

const getSelectionState = (items) => {
  if (!items?.length) return { all: false, none: true, some: false };
  const selectedCount = items.reduce((t, x) => t + (x.selected ? 1 : 0), 0);
  const all = selectedCount === items.length;
  const none = selectedCount === 0;
  const some = !all && !none;
  return { all, none, some };
};

const InlineLoading = ({ text = "Loading…" }) => (
  <div className="d-flex align-items-center gap-2 p-3 text-muted">
    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
    <span>{text}</span>
  </div>
);

InlineLoading.propTypes = { text: PropTypes.string };

const TriStateCheckBox = ({ checked, indeterminate, disabled, onChange, ariaLabel }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);

  const stop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <label className="form-check m-0" onClick={stop} onMouseDown={stop}>
      <input
        ref={ref}
        className="form-check-input"
        type="checkbox"
        checked={!!checked}
        disabled={!!disabled}
        aria-label={ariaLabel}
        onPointerDown={stop}
        onMouseDown={stop}
        onClick={stop}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") stop(e);
        }}
        onChange={(e) => onChange(e.target.checked)}
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

const PayablesHierarchyPanel = ({
  date,
  setCurrentBatch,
  handleViewCustomer,
  selectionMap, // not used directly, but intentionally passed for rerender consistency
  setSelected,
  getSelected,
}) => {
  const client = useApolloClient();

  const [summaryRows, setSummaryRows] = useState([]);
  const [expandedPeriods, setExpandedPeriods] = useState(() => new Set());
  const [expandedBonuses, setExpandedBonuses] = useState(() => new Set());

  /**
   * bonusDetails[bonusKey] = { loading, error, payables, page }
   * payables = [{ id, customer, amount, released, selected, earningsClass, periodId, bonusTitle }]
   *
  const [bonusDetails, setBonusDetails] = useState({});

  const { loading, error, data } = useQuery(GET_SUMMARY, { variables: { date } });

  useEffect(() => {
    if (!data?.unreleasedSummary) return;

    const grouped = data.unreleasedSummary.reduce((acc, current) => {
      const key = toBonusKey(current.earningsClass, current.period?.id, current.bonusTitle);

      if (!acc[key]) {
        acc[key] = {
          ...current,
          key,
          // default “selected” used only as fallback when leaf rows are not explicitly selected
          selected: asClass(current.earningsClass) !== "HOLD",
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

    setSummaryRows(rows);
  }, [data]);

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

      for (const p of periods) {
        p.bonuses.sort((x, y) =>
          String(x.bonusTitle ?? "").localeCompare(String(y.bonusTitle ?? ""))
        );
      }

      return { earningsClass: c, periods };
    });
  }, [summaryRows]);

  const togglePeriod = (periodKey) => {
    setExpandedPeriods((prev) => {
      const next = new Set(prev);
      if (next.has(periodKey)) next.delete(periodKey);
      else next.add(periodKey);
      return next;
    });
  };

  const expandBonus = (bonusRow) => {
    const bonusKey = bonusRow.key;
    setExpandedBonuses((prev) => {
      const next = new Set(prev);
      next.add(bonusKey);
      return next;
    });

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
      const periodId = summaryRow.period?.id;
      const bonusTitle = summaryRow.bonusTitle;
      const bonusKey = summaryRow.key;

      // Lock this bonusKey into loading state atomically to avoid duplicate fetches
      let shouldFetch = false;
      setBonusDetails((prev) => {
        const existing = prev[bonusKey];
        if (existing?.loading || existing?.payables) return prev;

        shouldFetch = true;
        return {
          ...prev,
          [bonusKey]: {
            loading: true,
            error: null,
            payables: null,
            page: existing?.page ?? { offset: 0, count: 10 },
          },
        };
      });

      if (!shouldFetch) return;

      try {
        const res = await client.query({
          query: GET_BONUSES,
          variables: { date, bonusTitle, earningsClass: cls, periodId },
          fetchPolicy: "network-only",
        });

        const raw = res?.data?.unreleased ?? [];

        // Group by customerId
        const grouped = raw.reduce((acc, current) => {
          const customerId = current.customer?.id;
          if (!customerId) return acc;

          if (!acc[customerId]) {
            acc[customerId] = { ...current, amount: 0, released: 0 };
          }

          acc[customerId].amount += current.amount ?? 0;
          acc[customerId].released += current.released ?? 0;

          return acc;
        }, {});

        const payables = Object.values(grouped)
          .map((p) => {
            const customerId = p.customer?.id;

            // If explicitly selected in global map => honor it
            // Otherwise default to the summaryRow.selected (unless HOLD)
            const explicit = getSelected(cls, periodId, bonusTitle, customerId);
            const selected = cls === "HOLD" ? false : (explicit || false) || (!!summaryRow.selected && !explicit);

            return {
              ...p,
              id: `${bonusKey}_${customerId}`,
              selected,
              earningsClass: cls,
              periodId,
              bonusTitle,
            };
          })
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
    [client, date, getSelected]
  );

  // Local leaf update + global selection update
  const updatePayableSelected = (bonusKey, payableId, value) => {
    const detail = bonusDetails[bonusKey];
    if (!detail?.payables) return;

    const target = detail.payables.find((p) => p.id === payableId);
    if (!target) return;

    // Update local UI
    setBonusDetails((prev) => {
      const d = prev[bonusKey];
      if (!d?.payables) return prev;
      return {
        ...prev,
        [bonusKey]: {
          ...d,
          payables: d.payables.map((p) => (p.id === payableId ? { ...p, selected: value } : p)),
        },
      };
    });

    // Update global selection
    setSelected(target.earningsClass, target.periodId, target.bonusTitle, target.customer?.id, value);
  };

  // Summary-level selection toggles:
  // If leaf is loaded => apply to all leaf rows (local + global)
  // If leaf not loaded => just flip summaryRows.selected (and will become the default on load)
  const setSummarySelected = (bonusRow, value) => {
    const bonusKey = bonusRow.key;
    const cls = asClass(bonusRow.earningsClass);

    setSummaryRows((prev) => prev.map((r) => (r.key === bonusKey ? { ...r, selected: value } : r)));

    const d = bonusDetails[bonusKey];
    if (!d?.payables) return;

    // Update local + global for loaded leaf rows
    setBonusDetails((prev) => {
      const current = prev[bonusKey];
      if (!current?.payables) return prev;

      const nextPayables = current.payables.map((p) => ({
        ...p,
        selected: cls === "HOLD" ? false : value,
      }));

      // push global selection
      for (const p of nextPayables) {
        setSelected(p.earningsClass, p.periodId, p.bonusTitle, p.customer?.id, p.selected);
      }

      return { ...prev, [bonusKey]: { ...current, payables: nextPayables } };
    });
  };

  const setSelectedForPeriod = (earningsClass, periodId, value) => {
    const cls = asClass(earningsClass);

    setSummaryRows((prev) =>
      prev.map((r) => {
        if (asClass(r.earningsClass) !== cls) return r;
        if (r.period?.id !== periodId) return r;
        if (cls === "HOLD") return { ...r, selected: false };
        return { ...r, selected: value };
      })
    );

    // Update any loaded leaf tables in this period
    setBonusDetails((prev) => {
      const next = { ...prev };

      for (const [bonusKey, d] of Object.entries(next)) {
        if (!d?.payables) continue;
        if (!bonusKey.startsWith(`${cls}_${String(periodId)}_`)) continue;

        const updated = d.payables.map((p) => ({
          ...p,
          selected: cls === "HOLD" ? false : value,
        }));

        // push global selection
        for (const p of updated) {
          setSelected(p.earningsClass, p.periodId, p.bonusTitle, p.customer?.id, p.selected);
        }

        next[bonusKey] = { ...d, payables: updated };
      }

      return next;
    });
  };

  const setSelectedForClass = (earningsClass, value) => {
    const cls = asClass(earningsClass);

    setSummaryRows((prev) =>
      prev.map((r) => {
        if (asClass(r.earningsClass) !== cls) return r;
        if (cls === "HOLD") return { ...r, selected: false };
        return { ...r, selected: value };
      })
    );

    setBonusDetails((prev) => {
      const next = { ...prev };

      for (const [bonusKey, d] of Object.entries(next)) {
        if (!d?.payables) continue;
        if (!bonusKey.startsWith(`${cls}_`)) continue;

        const updated = d.payables.map((p) => ({
          ...p,
          selected: cls === "HOLD" ? false : value,
        }));

        for (const p of updated) {
          setSelected(p.earningsClass, p.periodId, p.bonusTitle, p.customer?.id, p.selected);
        }

        next[bonusKey] = { ...d, payables: updated };
      }

      return next;
    });
  };

  // Selection state (leaf-aware when loaded)
  const getBonusSelectionState = (summaryRow) => {
    const d = bonusDetails[summaryRow.key];
    if (d?.payables) return getSelectionState(d.payables);
    return { all: !!summaryRow.selected, none: !summaryRow.selected, some: false };
  };

  const getPeriodSelectionState = (earningsClass, period) => {
    const cls = asClass(earningsClass);
    const periodId = period?.id;

    const bonuses = summaryRows.filter(
      (r) => asClass(r.earningsClass) === cls && r.period?.id === periodId
    );

    const flattenedLeaf = [];
    let hasAnyLeaf = false;

    for (const b of bonuses) {
      const d = bonusDetails[b.key];
      if (d?.payables) {
        hasAnyLeaf = true;
        flattenedLeaf.push(...d.payables);
      }
    }

    if (hasAnyLeaf) return getSelectionState(flattenedLeaf);
    return getSelectionState(bonuses);
  };

  const getClassSelectionState = (earningsClass) => {
    const cls = asClass(earningsClass);
    const bonuses = summaryRows.filter((r) => asClass(r.earningsClass) === cls);

    const flattenedLeaf = [];
    let hasAnyLeaf = false;

    for (const b of bonuses) {
      const d = bonusDetails[b.key];
      if (d?.payables) {
        hasAnyLeaf = true;
        flattenedLeaf.push(...d.payables);
      }
    }

    if (hasAnyLeaf) return getSelectionState(flattenedLeaf);
    return getSelectionState(bonuses);
  };

  // Batch totals:
  // - If leaf loaded => honor leaf selection
  // - Else => honor summary selection (coarser)
  useEffect(() => {
    if (!summaryRows?.length) return;

    let total = 0;
    let forfeitTotal = 0;
    let totalCustomers = 0;

    const bonusGroups = [];
    const nodeIdsByBonus = {};

    for (const r of summaryRows) {
      const cls = asClass(r.earningsClass);
      if (cls === "HOLD") continue;

      const d = bonusDetails[r.key];

      if (d?.payables) {
        const selectedLeaf = d.payables.filter((p) => p.selected);
        if (selectedLeaf.length === 0) continue;

        bonusGroups.push({ bonusTitle: r.bonusTitle, earningsClass: cls, periodId: r.period?.id });

        totalCustomers += selectedLeaf.length;

        const due = selectedLeaf.reduce((t, x) => t + ((x.amount ?? 0) - (x.released ?? 0)), 0);
        if (cls === "RELEASE") total += due;
        if (cls === "FORFEIT") forfeitTotal += due;

        nodeIdsByBonus[r.key] = selectedLeaf.map((x) => x.customer?.id).filter(Boolean);
      } else {
        if (!r.selected) continue;

        bonusGroups.push({ bonusTitle: r.bonusTitle, earningsClass: cls, periodId: r.period?.id });

        const due = (r.paidAmount ?? 0) - (r.released ?? 0);
        if (cls === "RELEASE") total += due;
        if (cls === "FORFEIT") forfeitTotal += due;

        totalCustomers += r.customerPaidCount ?? 0;
      }
    }

    setCurrentBatch({
      cutoffDate: date,
      bonusGroups,
      total,
      forfeitTotal,
      totalCustomers,
      nodeIdsByBonus,
    });
  }, [summaryRows, bonusDetails, date, setCurrentBatch, selectionMap]);

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
              const openByDefault = earningsClass !== "HOLD";

              const classSel = getClassSelectionState(earningsClass);
              const meta = sectionMeta(earningsClass);

              const classSummaryRows = summaryRows.filter((r) => asClass(r.earningsClass) === earningsClass);
              const summaryCustomers = classSummaryRows.reduce((t, x) => t + (x.customerPaidCount ?? 0), 0);
              const summaryDue = classSummaryRows.reduce((t, x) => t + ((x.paidAmount ?? 0) - (x.released ?? 0)), 0);

              // Header checkbox moved to accordion header (visible when collapsed)
              return (
                <div className="card mb-3" key={earningsClass}>
                  <div className="accordion-item">
                    <h2 className="accordion-header" id={headerId}>
                      <div className="d-flex align-items-stretch">
                        <div className="px-3 d-flex align-items-center">
                          <TriStateCheckBox
                            checked={classSel.all}
                            indeterminate={classSel.some}
                            disabled={isHold}
                            onChange={(checked) => setSelectedForClass(earningsClass, checked)}
                            ariaLabel="Select/unselect all in this section"
                          />
                        </div>

                        <button
                          className={`accordion-button flex-grow-1 ${openByDefault ? "" : "collapsed"}`}
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target={`#${collapseId}`}
                          aria-expanded={openByDefault ? "true" : "false"}
                          aria-controls={collapseId}
                        >
                          <div className="d-flex w-100 align-items-center gap-3">
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center gap-2">
                                <div className="fw-semibold">{meta.title}</div>
                                <span className={`badge ${meta.badgeClass}`}>{meta.badgeText}</span>
                              </div>
                              <div className="text-muted small">{meta.subtitle}</div>
                            </div>

                            <div className="d-none d-md-flex align-items-center gap-3">
                              <div className="text-end">
                                <div className="text-muted small">Payables</div>
                                <div className="fw-semibold">{formatInt(summaryCustomers)}</div>
                              </div>
                              <div className="text-end pe-3">
                                <div className="text-muted small">Amount Due</div>
                                <div className="fw-semibold">{formatMoney(summaryDue)}</div>
                              </div>
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
                              <th className="w-1"></th>
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
                                  <tr className={isPeriodOpen ? "bg-light" : ""}>
                                    <td onClick={(e) => e.stopPropagation()}>
                                      <TriStateCheckBox
                                        checked={periodSel.all}
                                        indeterminate={periodSel.some}
                                        disabled={isHold}
                                        onChange={(checked) => setSelectedForPeriod(earningsClass, period.id, checked)}
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

                                  {isPeriodOpen && (
                                    <tr className="no-hover">
                                      <td
                                        colSpan={5}
                                        className="p-2 ps-3 bg-white"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <div className="border rounded-2 bg-white">
                                          <div className="table-responsive">
                                            <table className="table mb-0">
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
                                                  const bonusSel = getBonusSelectionState(b);
                                                  const detail = bonusDetails[bonusKey];

                                                  const bonusDue = (b.paidAmount ?? 0) - (b.released ?? 0);
                                                  const bonusPayablesCount = b.customerPaidCount ?? 0;

                                                  return (
                                                    <React.Fragment key={bonusKey}>
                                                      <tr className={isBonusOpen ? "bg-light" : ""}>
                                                        <td onClick={(e) => e.stopPropagation()}>
                                                          <TriStateCheckBox
                                                            checked={bonusSel.all}
                                                            indeterminate={bonusSel.some}
                                                            disabled={isHold}
                                                            onChange={(checked) => setSummarySelected(b, checked)}
                                                            ariaLabel="Select/unselect all customers in this bonus"
                                                          />
                                                        </td>

                                                        <td>
                                                          <div className="d-flex align-items-center gap-2">
                                                            <button
                                                              onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleViewCustomer?.(null);
                                                              }}
                                                              className="btn-link text-reset p-0 d-none"
                                                            >
                                                              {/* placeholder *}
                                                            </button>

                                                            <span className="fw-semibold">{b.bonusTitle}</span>

                                                            <span className={`status status-${earningsColor(asClass(b.earningsClass))} status-lite`}>
                                                              <span className="status-dot"></span> {asClass(b.earningsClass)}
                                                            </span>
                                                          </div>
                                                        </td>

                                                        <td className="d-none d-sm-table-cell text-start">
                                                          {formatInt(bonusPayablesCount)}
                                                        </td>

                                                        <td className="text-end fw-semibold">
                                                          {formatMoney(bonusDue)}
                                                        </td>

                                                        <td className="text-end">
                                                          <button
                                                            type="button"
                                                            className="btn-action btn-icon"
                                                            onClick={(e) => {
                                                              e.preventDefault();
                                                              e.stopPropagation();
                                                              if (isBonusOpen) collapseBonus(bonusKey);
                                                              else expandBonus(b);
                                                            }}
                                                            aria-expanded={isBonusOpen}
                                                            aria-label={isBonusOpen ? "Collapse bonus" : "Expand bonus"}
                                                          >
                                                            {detail?.loading ? (
                                                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                            ) : !isBonusOpen ? (
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

                                                      {isBonusOpen && (
                                                        <tr className="no-hover">
                                                          <td colSpan={5} className="p-2 ps-3 bg-white">
                                                            {detail?.loading && <InlineLoading text="Loading payables…" />}
                                                            {detail?.error && <DataError error={detail.error} />}

                                                            {!detail?.loading && detail?.payables && detail.payables.length === 0 && (
                                                              <div className="p-3">
                                                                <EmptyContent
                                                                  title="No payables found"
                                                                  text="There are no payables for this bonus in the selected period."
                                                                />
                                                              </div>
                                                            )}

                                                            {!detail?.loading && detail?.payables && detail.payables.length > 0 && (
                                                              <>
                                                                <div className="table-responsive">
                                                                  <table className="table card-table table-vcenter text-nowrap datatable mb-0">
                                                                    <thead>
                                                                      <tr>
                                                                        <th></th>
                                                                        <th>Customer</th>
                                                                        <th className="d-none d-sm-table-cell">Handle</th>
                                                                        <th className="d-none d-sm-table-cell">Customer Type</th>
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
                                                                                value={p.selected}
                                                                                disabled={isHold}
                                                                                onChange={(name, value) =>
                                                                                  updatePayableSelected(bonusKey, name, value)
                                                                                }
                                                                              />
                                                                            </td>

                                                                            <td>
                                                                              <button
                                                                                onClick={(e) => {
                                                                                  e.stopPropagation();
                                                                                  handleViewCustomer?.(p.customer?.id);
                                                                                }}
                                                                                className="btn-link text-reset p-0"
                                                                              >
                                                                                {p.customer?.fullName}
                                                                              </button>
                                                                            </td>

                                                                            <td className="d-none d-sm-table-cell text-start">
                                                                              <button
                                                                                onClick={(e) => {
                                                                                  e.stopPropagation();
                                                                                  handleViewCustomer?.(p.customer?.id);
                                                                                }}
                                                                                className="btn-link text-reset p-0"
                                                                              >
                                                                                {p.customer?.webAlias}
                                                                              </button>
                                                                            </td>

                                                                            <td className="d-none d-sm-table-cell text-start">
                                                                              {p.customer?.customerType?.name}
                                                                            </td>

                                                                            <td className="d-none d-sm-table-cell text-start">
                                                                              <span className={`status status-${statusColor(p.customer?.status?.statusClass)} status-lite`}>
                                                                                <span className="status-dot"></span> {p.customer?.status?.name}
                                                                              </span>
                                                                            </td>

                                                                            <td className="d-none d-sm-table-cell text-end">{formatMoney(p.amount)}</td>
                                                                            <td className="d-none d-sm-table-cell text-end">{formatMoney(p.released)}</td>
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
      )}
    </>
  );
};

export default PayablesHierarchyPanel;

PayablesHierarchyPanel.propTypes = {
  date: PropTypes.string.isRequired,
  setCurrentBatch: PropTypes.func.isRequired,
  handleViewCustomer: PropTypes.func,
  selectionMap: PropTypes.object.isRequired,
  setSelected: PropTypes.func.isRequired,
  getSelected: PropTypes.func.isRequired,
};
 */