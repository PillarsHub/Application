import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { gql, useLazyQuery } from "@apollo/client";
import DataLoading from "../../../components/dataLoading";
import DataError from "../../../components/dataError";
import EmptyContent from "../../../components/emptyContent";
import LocalDate from "../../../util/LocalDate";

const PAGE_SIZE = 100;

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

const PendingPayoutsWidget = ({ date, customerId }) => {
  const [loadUnreleasedPage] = useLazyQuery(GET_UNRELEASED_PAGE, { fetchPolicy: "no-cache" });
  const [loadUnreleasedDetails] = useLazyQuery(GET_UNRELEASED_DETAILS, { fetchPolicy: "no-cache" });

  const [unreleasedRows, setUnreleasedRows] = useState([]);
  const [loadingUnreleased, setLoadingUnreleased] = useState(false);
  const [unreleasedError, setUnreleasedError] = useState(null);

  const [expanded, setExpanded] = useState(() => new Set());
  // cache per group key: { [groupKey]: { items, loading, error } }
  const [detailsByGroup, setDetailsByGroup] = useState({});

  /** Page through ALL unreleased once to build groups/totals */
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoadingUnreleased(true);
      setUnreleasedError(null);
      setUnreleasedRows([]);
      setDetailsByGroup({}); // reset cache

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
    if (customerId && date) run();
    return () => { cancelled = true; };
  }, [customerId, date, loadUnreleasedPage]);

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

      g.amount += r.amount ?? 0;
      g.released += r.released ?? 0;
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

  const totalAmount = useMemo(
    () => groups.reduce((t, g) => t + ((g.amount ?? 0) - (g.released ?? 0)), 0),
    [groups]
  );

  /** Expand/collapse & lazy-load details ONLY for that group */
  const onToggleGroup = async (group) => {
    const open = new Set(expanded);
    if (open.has(group.key)) {
      open.delete(group.key);
      setExpanded(open);
      return;
    }
    open.add(group.key);
    setExpanded(open);

    if (!detailsByGroup[group.key]) {
      // fetch details just for this group (period + bonus), then filter by level on the client
      const periodIds = [String(group.period?.id)].filter(Boolean);
      const bonusIds = [String(group.bonusId)].filter(Boolean);

      setDetailsByGroup((m) => ({ ...m, [group.key]: { items: [], loading: true, error: null } }));
      try {
        const { data } = await loadUnreleasedDetails({
          variables: { nodeIds: [customerId], periodIds, bonusIds },
        });

        // flatten results and attach period ctx (begin/end) if needed
        const flat = [];
        for (const plan of data?.compensationPlans ?? []) {
          for (const p of plan.periods ?? []) {
            const periodCtx = { id: p.id, begin: p.begin, end: p.end, status: p.status };
            for (const b of p.bonuses ?? []) {
              for (const d of b.details ?? []) {
                // filter to this group's level (server returns multiple levels per bonus)
                if (group.level == null || d.level === group.level) {
                  flat.push({ ...d, period: periodCtx });
                }
              }
            }
          }
        }
        flat.sort(sortPendingChildren);

        setDetailsByGroup((m) => ({ ...m, [group.key]: { items: flat, loading: false, error: null } }));
      } catch (e) {
        setDetailsByGroup((m) => ({ ...m, [group.key]: { items: [], loading: false, error: e } }));
      }
    }
  };

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
                <th className="text-end">Amount</th>
                <th className="text-end">Released</th>
                <th className="text-end">Amount Due</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => {
                const isOpen = expanded.has(g.key);
                const cache = detailsByGroup[g.key];
                const detailsId = `pending-details-${encodeURIComponent(g.key)}`;

                // compute parent-row percent display
                let percentDisplay = "—";
                if (g.percentMin != null) {
                  percentDisplay = g.percentAllSame
                    ? fmtPercent(g.percentMin * 100)
                    : `${fmtPercent(g.percentMin * 100)}–${fmtPercent(g.percentMax * 100)}`;
                }
                if (g.amount != 0) {
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
                        <td className="align-middle">{g.bonusTitle}</td>
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
                        <td className="text-end align-middle">{currency(g.amount)}</td>
                        <td className="text-end align-middle">{currency(g.released)}</td>
                        <td className="text-end align-middle">{currency(g.amount - g.released)}</td>
                      </tr>

                      {isOpen && (
                        <tr id={detailsId}>
                          {/* header now has 8 columns → colSpan=8 */}
                          <td></td>
                          <td colSpan={8} className="p-0">
                            <div className="p-2">
                              {!cache && <div className="text-muted small mb-2">Loading details…</div>}
                              {cache?.error && <DataError error={cache.error} />}
                              {cache?.loading && <DataLoading />}

                              {cache?.items?.length > 0 && (
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
                                        <th className="text-end">Amount</th>
                                        <th className="text-end">Released</th>
                                        <th className="text-end">Amount Due</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {cache.items.map((child, idx) => {
                                        const rowKey = `${g.key}_${child.period?.id ?? "?"}_${idx}`;
                                        const src = child.source || {};
                                        const buyer = src.customer || {};
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
                                            <td>{src.externalId ?
                                              <a className="text-reset" href={`/customers/${buyer.id}/orders/${src.externalId}`} target="_blank" rel="noreferrer">{src.externalId ?? "—"}</a> : "—"
                                            }</td>
                                            <td>{src.date ? <LocalDate dateString={src.date} hideTime /> : "—"}</td>
                                            <td>{fmtNumber(child.volume)}</td>
                                            <td>{fmtPercent(child.percent)}</td>
                                            <td className="text-end">{currency(child.amount)}</td>
                                            <td className="text-end">{currency(child.released)}</td>
                                            <td className="text-end">{currency(child.amount - child.released)}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                              {cache?.items && cache.items.length === 0 && !cache.loading && !cache.error && (
                                <div className="text-muted small">No details found for this group.</div>
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
              {/* header has 8 columns → total row spans 7 + amount */}
              <tr>
                <td colSpan={8} className="strong">Total Due</td>
                <td className="strong text-end">{currency(totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </>
  );
};

PendingPayoutsWidget.propTypes = {
  date: PropTypes.string.isRequired,
  customerId: PropTypes.string.isRequired,
};

export default PendingPayoutsWidget;
