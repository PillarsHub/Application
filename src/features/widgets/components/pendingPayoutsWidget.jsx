import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { gql, useApolloClient, useLazyQuery } from "@apollo/client";
import DataLoading from "../../../components/dataLoading";
import DataError from "../../../components/dataError";
import EmptyContent from "../../../components/emptyContent";
import LocalDate from "../../../util/LocalDate";
import { describePendingCommission, formatNegativeBalanceMessage, formatPendingDetailAmount, hasPendingDetailPayment, hasPendingPayment, pendingAmount, releasedAmount } from "./pendingCommissionPresentation.mjs";

const PAGE_SIZE = 100;

const createPreviewRows = (date) => {
  const requestedDate = new Date(date ?? Date.now());
  const previewDate = Number.isNaN(requestedDate.getTime()) ? new Date() : requestedDate;
  const year = previewDate.getUTCFullYear();
  const month = previewDate.getUTCMonth();
  const periods = [-1, 0].map((offset) => ({
    id: `preview-${offset + 1}`,
    begin: new Date(Date.UTC(year, month + offset, 1)).toISOString(),
    end: new Date(Date.UTC(year, month + offset + 1, 1) - 1).toISOString(),
  }));

  return [
    { bonusId: "preview-retail", bonusTitle: "Retail Commission", period: periods[0], amount: 0, released: 175, volume: 0, percent: 0.1 },
    { bonusId: "preview-team", bonusTitle: "Team Commission", period: periods[0], amount: 0, released: 65, volume: 0, percent: 0.05 },
    { bonusId: "preview-retail", bonusTitle: "Retail Commission", period: periods[1], amount: 120, released: 0, volume: 1200, percent: 0.1 },
    { bonusId: "preview-team", bonusTitle: "Team Commission", period: periods[1], amount: 80, released: 0, volume: 1600, percent: 0.05 },
  ].map((row, index) => {
    const commissionDate = new Date(new Date(row.period.begin).getTime() + 9 * 86400000).toISOString();
    return {
      ...row,
      nodeId: "EX456",
      level: 1,
      commissionDate,
      source: {
        externalId: `EX-${1001 + index}`,
        date: commissionDate,
        customer: { id: "EX456", fullName: "Example Customer", profileImage: "" },
      },
    };
  });
};

/** Queries */
const GET_UNRELEASED_PAGE = gql`
  query ($nodeId: String!, $date: Date!, $offset: Int!, $first: Int!) {
    unreleased(date: $date, nodeIds: [$nodeId], offset: $offset, first: $first) {
      bonusId
      nodeId
      amount
      released
      volume
      percent
      bonusTitle
      level
      commissionDate
      period { id begin end }
    }
  }
`;

const GET_UNRELEASED_DETAILS = gql`
  query ($nodeIds: [String]!, $periodIds: [String]!, $bonusIds: [String]!) {
    compensationPlans {
      periods(idList: $periodIds) {
        id
        begin
        end
        status
        bonuses(nodeIds: $nodeIds, idList: $bonusIds) {
          bonusId
          bonusTitle
          level
          details {
            amount
            released
            bonusId
            bonusTitle
            commissionDate
            level
            nodeId
            percent
            volume
            source {
              externalId
              date
              customer { id fullName profileImage }
            }
          }
        }
      }
    }
  }
`;

/** helpers */
const currency = (n) => (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
const s = (v) => (v == null ? "" : String(v));
const num = (n) => (n == null ? 0 : Number(n));
const fmtNumber = (n) => num(n).toLocaleString("en-US");
const fmtPercent = (p) => {
  if (p == null || p === "") return "—";
  let val = Number(p);
  if (!isFinite(val)) return "—";

  val = Math.round(val * 1000) / 1000;

  // Only show decimals if needed
  const hasFraction = Math.abs(val % 1) > 0;
  return hasFraction ? `${val.toFixed(2)}%` : `${val.toFixed(0)}%`;
};


/** sorters */
const sortGroups = (a, b) => {
  // Bonus -> period begin -> level
  const byBonus = s(a.bonusTitle).localeCompare(s(b.bonusTitle));
  if (byBonus !== 0) return byBonus;
  const ad = a.period?.begin ? new Date(a.period.begin).getTime() : 0;
  const bd = b.period?.begin ? new Date(b.period.begin).getTime() : 0;
  if (ad !== bd) return ad - bd;
  return (a.level ?? 0) - (b.level ?? 0);
};

const sortPendingChildren = (a, b) => {
  // period begin (or id) -> level
  const aKey =
    (a.period?.begin ? new Date(a.period.begin).getTime() : 0) ||
    (a.period?.id ?? 0);
  const bKey =
    (b.period?.begin ? new Date(b.period.begin).getTime() : 0) ||
    (b.period?.id ?? 0);
  if (aKey !== bKey) return aKey - bKey;
  return (a.level ?? 0) - (b.level ?? 0);
};

const PendingPayoutsWidget = ({
  date,
  customerId,
  isPreview = false,
  showCommissionSummary = false,
  showNegativeBalanceMessage = false,
  negativeBalanceMessage,
}) => {
  const [loadUnreleasedPage] = useLazyQuery(GET_UNRELEASED_PAGE, { fetchPolicy: "no-cache" });
  const client = useApolloClient();

  const [unreleasedRows, setUnreleasedRows] = useState([]);
  const [loadingUnreleased, setLoadingUnreleased] = useState(false);
  const [unreleasedError, setUnreleasedError] = useState(null);

  const [expanded, setExpanded] = useState(() => new Set());
  // cache per group key: { [groupKey]: { items, loading, error } }
  const [detailsByGroup, setDetailsByGroup] = useState({});
  const detailRequests = useRef(new Set());

  /** Page through ALL unreleased once to build groups/totals */
  useEffect(() => {
    let cancelled = false;
    detailRequests.current = new Set();
    setLoadingUnreleased(false);
    setUnreleasedError(null);
    setUnreleasedRows([]);
    setDetailsByGroup({});
    setExpanded(new Set());

    const run = async () => {
      setLoadingUnreleased(true);

      try {
        let offset = 0;
        let page = [];
        do {
          const { data: pageData } = await loadUnreleasedPage({
            variables: { nodeId: customerId, date, offset, first: PAGE_SIZE },
          });
          if (cancelled) return;
          page = pageData?.unreleased ?? [];
          if (page.length) {
            setUnreleasedRows((prev) => [...prev, ...page]);
            offset += page.length;
          }
        } while (page.length === PAGE_SIZE);
      } catch (e) {
        if (!cancelled) setUnreleasedError(e);
      } finally {
        if (!cancelled) setLoadingUnreleased(false);
      }
    };
    if (isPreview) setUnreleasedRows(createPreviewRows(date));
    else if (customerId && date) run();
    return () => {
      cancelled = true;
      detailRequests.current = new Set();
    };
  }, [customerId, date, isPreview, loadUnreleasedPage]);

  const groups = useMemo(() => {
    if (!unreleasedRows.length) return [];
    const map = new Map();
    for (const r of unreleasedRows) {
      const bonusTitle = r.bonusTitle ?? "(Unnamed Bonus)";
      const periodId = r.period?.id ?? "unknown";
      const lvl = r.level ?? null;
      const key = `${bonusTitle}||${r.bonusId ?? ""}||${periodId}||${lvl ?? ""}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          bonusId: r.bonusId,
          bonusTitle,
          level: r.level,
          period: r.period, // { id, begin, end }
          amount: 0,
          released: 0,
          items: [],
          // NEW aggregates
          volumeSum: 0,
          percentMin: null,
          percentMax: null,
          percentAllSame: true,
          _firstPercent: null,
        });
      }
      const g = map.get(key);

      g.amount += num(r.amount);
      g.released += releasedAmount(r);
      g.items.push(r);

      // NEW: accumulate volume
      if (r.volume != null) g.volumeSum += Number(r.volume) || 0;

      // NEW: track percent sameness & range
      if (r.percent != null && r.percent !== "") {
        const p = Number(r.percent);
        if (isFinite(p)) {
          if (g._firstPercent == null) g._firstPercent = p;
          if (g._firstPercent !== p) g.percentAllSame = false;
          g.percentMin = g.percentMin == null ? p : Math.min(g.percentMin, p);
          g.percentMax = g.percentMax == null ? p : Math.max(g.percentMax, p);
        }
      }
    }

    const arr = Array.from(map.values()).sort(sortGroups);
    for (const g of arr) g.items.sort(sortPendingChildren);
    return arr;
  }, [unreleasedRows]);

  const totalAmount = useMemo(() => groups.reduce((total, group) => total + pendingAmount(group), 0), [groups]);

  // Fetch only the expanded group's details and reuse them when it is reopened.
  const loadGroupDetails = async (group) => {
    const requests = detailRequests.current;
    const cache = detailsByGroup[group.key];
    if (requests.has(group.key) || (cache && !cache.error)) return;
    if (isPreview) {
      setDetailsByGroup((previous) => ({ ...previous, [group.key]: {
        // Summary percentages are fractions; detail percentages are whole numbers.
        items: group.items.map((row) => ({ ...row, percent: row.percent * 100 })),
        loading: false,
        error: null,
      } }));
      return;
    }
    requests.add(group.key);
    setDetailsByGroup((previous) => ({ ...previous, [group.key]: { items: [], loading: true, error: null } }));
    try {
      const { data } = await client.query({
        query: GET_UNRELEASED_DETAILS,
        fetchPolicy: "no-cache",
        variables: { nodeIds: [customerId], periodIds: [String(group.period?.id)], bonusIds: [String(group.bonusId)] },
      });
      if (requests !== detailRequests.current) return;

      const flat = [];
      for (const plan of data?.compensationPlans ?? []) {
        for (const p of plan.periods ?? []) {
          const periodCtx = { id: p.id, begin: p.begin, end: p.end, status: p.status };
          for (const b of p.bonuses ?? []) {
            for (const d of b.details ?? []) {
              flat.push({ ...d, bonusId: d.bonusId ?? b.bonusId, period: periodCtx });
            }
          }
        }
      }
      setDetailsByGroup((previous) => ({ ...previous, [group.key]: {
        items: flat.filter((d) => String(d.period.id) === String(group.period?.id)
          && d.bonusId === group.bonusId && (group.level == null || d.level === group.level)).sort(sortPendingChildren),
        loading: false,
        error: null,
      } }));
    } catch (e) {
      if (requests === detailRequests.current) {
        setDetailsByGroup((previous) => ({ ...previous, [group.key]: { items: [], loading: false, error: e } }));
      }
    } finally {
      requests.delete(group.key);
    }
  };

  const onToggleGroup = (group) => {
    setExpanded((previous) => {
      const open = new Set(previous);
      if (open.has(group.key)) open.delete(group.key);
      else open.add(group.key);
      return open;
    });
    if (!expanded.has(group.key)) loadGroupDetails(group);
  };

  const summaryItems = [
    { label: "Commission earned", amount: null, hint: "New commissions and commission increases" },
    { label: "Commission reversals", amount: null, hint: "Reversals of commissions" },
    { label: "Net payment", amount: totalAmount, hint: "Pending commissions minus commission reversals" },
  ];
  const showBalanceMessage = showNegativeBalanceMessage && !loadingUnreleased && totalAmount < 0;
  const nothingToShow = !loadingUnreleased && !unreleasedRows.length;

  return (
    <>
      {unreleasedError && <DataError error={unreleasedError} />}
      {loadingUnreleased && !unreleasedRows.length && <DataLoading />}

      {nothingToShow && (
        <div className="card-body pt-2">
          <EmptyContent title="No pending items" text="No unreleased items were found for this period." />
        </div>
      )}

      {!nothingToShow && (
        <>
        {(showCommissionSummary || showBalanceMessage) && <div className="card-body border-bottom">
          {showCommissionSummary && <dl className="row g-3 mb-0" aria-live="polite" aria-busy={loadingUnreleased}>
            {summaryItems.map((item) => (
              <div key={item.label} className="col-12 col-md-4">
                <dt className="text-secondary fw-normal">{item.label}</dt>
                <dd className={`h3 mb-1 ${!loadingUnreleased && item.amount < 0 ? "text-danger" : ""}`}>
                  {item.amount == null ? <span aria-label="Not available yet">—</span> : loadingUnreleased ? "Loading…" : currency(item.amount)}
                </dd>
                <div className="small text-secondary">{item.hint}</div>
              </div>
            ))}
          </dl>}
          {showBalanceMessage && <p className={`small text-secondary mb-0 ${showCommissionSummary ? "mt-3" : ""}`}>{formatNegativeBalanceMessage(negativeBalanceMessage, totalAmount)}</p>}
        </div>}
        <div className="table-responsive">
          <table className="table card-table table-vcenter text-nowrap">
            <thead>
              <tr>
                <th className="w-1"></th>
                <th>Bonus</th>
                <th className="d-none d-sm-table-cell">Level</th>
                <th className="d-none d-md-table-cell">Period</th>
                <th>Volume</th>
                <th>Percent</th>
                <th className="text-end">Pending payment</th>
              </tr>
            </thead>
            <tbody>
              {!loadingUnreleased && !groups.some(hasPendingPayment) && (
                <tr><td colSpan={7} className="text-center text-secondary py-3">No pending payments or adjustments to display.</td></tr>
              )}
              {groups.map((g) => {
                const isOpen = expanded.has(g.key);
                const cache = detailsByGroup[g.key];
                const visibleDetails = (cache?.items ?? []).filter(hasPendingDetailPayment);
                const detailsId = `pending-details-${encodeURIComponent(g.key)}`;
                const groupDue = pendingAmount(g);

                // compute parent-row percent display
                let percentDisplay = "—";
                if (g.percentMin != null) {
                  percentDisplay = g.percentAllSame
                    ? fmtPercent(g.percentMin * 100)
                    : `${fmtPercent(g.percentMin * 100)}–${fmtPercent(g.percentMax * 100)}`;
                }
                if (hasPendingPayment(g)) {
                  return (
                    <React.Fragment key={g.key}>
                      <tr style={{ cursor: "pointer" }} onClick={() => onToggleGroup(g)} tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onToggleGroup(g);
                          }
                        }}
                        aria-expanded={isOpen}
                        aria-controls={detailsId}
                      >
                        <td className="text-end">
                          {!isOpen &&
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-caret-right"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M10 18l6 -6l-6 -6v12" /></svg>
                          }
                          {isOpen &&
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-caret-down"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M6 10l6 6l6 -6h-12" /></svg>
                          }
                        </td>
                        <td className="align-middle">
                          <div>{g.bonusTitle}</div>
                        </td>
                        <td className="d-none d-sm-table-cell align-middle">{g.level ?? "—"}</td>
                        <td className="d-none d-md-table-cell align-middle">
                          {g.period?.begin ? (
                            <>
                              <LocalDate dateString={g.period.begin} hideTime />{" – "}
                              {g.period?.end ? <LocalDate dateString={g.period.end} hideTime /> : "—"}
                            </>
                          ) : (
                            g.period?.id ?? "—"
                          )}
                        </td>

                        {/* NEW: Volume & Percent */}
                        <td className="align-middle">{fmtNumber(g.volumeSum)}</td>
                        <td className="align-middle">{percentDisplay}</td>
                        <td className={`text-end align-middle ${groupDue < 0 ? "text-danger fw-semibold" : ""}`}>{currency(groupDue)}</td>
                      </tr>

                      {isOpen && (
                        <tr id={detailsId}>
                          <td></td>
                          <td colSpan={6} className="p-0">
                            <div className="p-2">
                              {!cache && <div className="text-muted small mb-2">Loading details…</div>}
                              {cache?.error && <>
                                <DataError error={cache.error} />
                                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => loadGroupDetails(g)}>Retry details</button>
                              </>}
                              {cache?.loading && <DataLoading />}

                              {visibleDetails.length > 0 && (
                                <div className="table-responsive">
                                  <table className="table table-sm mb-0">
                                    <thead>
                                      <tr>
                                        <th className="d-none d-md-table-cell">Commission Date</th>
                                        <th>Order Customer</th>
                                        <th>Order Number</th>
                                        <th>Order Date</th>
                                        <th>Volume</th>
                                        <th>Percent</th>
                                        <th>Type</th>
                                        <th className="text-end">Pending payment</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {visibleDetails.map((child, idx) => {
                                        const rowKey = `${g.key}_${child.period?.id ?? "?"}_${idx}`;
                                        const src = child.source || {};
                                        const buyer = src.customer || {};
                                        const presentation = describePendingCommission(child);
                                        const childDue = pendingAmount(child);
                                        return (
                                          <tr key={rowKey}>
                                            <td className="d-none d-md-table-cell">
                                              {child.commissionDate ? (
                                                <LocalDate dateString={child.commissionDate} hideTime />
                                              ) : "—"}
                                            </td>
                                            <td>
                                              <span className="d-inline-flex align-items-center gap-2">
                                                <span className="text-truncate" style={{ maxWidth: 220 }}>
                                                  {buyer.fullName ?? buyer.id ?? "—"}
                                                </span>
                                              </span>
                                            </td>
                                            <td>{isPreview ? src.externalId : src.externalId ?
                                              <a className="text-reset" href={`/customers/${buyer.id}/orders/${src.externalId}`} target="_blank" rel="noreferrer">{src.externalId ?? "—"}</a> : "—"
                                            }</td>
                                            <td>{src.date ? <LocalDate dateString={src.date} hideTime /> : "—"}</td>
                                            <td>{fmtNumber(child.volume)}</td>
                                            <td>{fmtPercent(child.percent)}</td>
                                            <td>
                                              <span className="badge bg-secondary-lt text-secondary">{presentation.label}</span>
                                            </td>
                                            <td className={`text-end ${childDue < 0 ? "text-danger fw-semibold" : ""}`}>{formatPendingDetailAmount(childDue)}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                              {cache?.items && visibleDetails.length === 0 && !cache.loading && !cache.error && (
                                <div className="text-muted small">No pending payments or adjustments to display for this group.</div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                }
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={6} className="strong">Net pending payment</td>
                <td className={`strong text-end ${totalAmount < 0 ? "text-danger" : ""}`}>{currency(totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        </>
      )}
    </>
  );
};

PendingPayoutsWidget.propTypes = {
  date: PropTypes.string.isRequired,
  customerId: PropTypes.string.isRequired,
  isPreview: PropTypes.bool,
  showCommissionSummary: PropTypes.bool,
  showNegativeBalanceMessage: PropTypes.bool,
  negativeBalanceMessage: PropTypes.string,
};

export default PendingPayoutsWidget;
