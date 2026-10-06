import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { gql, useApolloClient } from "@apollo/client";

import DataLoading from "../../../components/dataLoading.jsx";
import DataError from "../../../components/dataError.jsx";
import EmptyContent from "../../../components/emptyContent.jsx";
import LocalDate from "../../../util/LocalDate.jsx";
import Pagination from "../../../components/pagination.jsx";

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

const PayableSummaryPanel3 = ({
  date,
  handleViewCustomer,
  summaryRows,
  bonusDetails,
  setBonusDetails,
  getSelected,
  setClassSelected,
  selectionDisabled,
}) => {
  const client = useApolloClient();
  const active = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  // Expanded state:
  const [expandedPeriods, setExpandedPeriods] = useState(() => new Set()); // key: `${class}_${periodId}`
  const [expandedBonuses, setExpandedBonuses] = useState(() => new Set()); // key: bonusKey

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
        (a, b) => new Date(b.period?.end) - new Date(a.period?.end)
      );

      // Sort bonuses inside period by title
      for (const p of periods) {
        p.bonuses.sort((x, y) => String(x.bonusTitle ?? "").localeCompare(String(y.bonusTitle ?? "")));
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

        if (!active.current) return;
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
        if (!active.current) return;
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
              const collapseId = `collapse_${earningsClass}`;
              const headerId = `heading_${earningsClass}`;
              const openByDefault = earningsClass === "RELEASE";

              const classSelected = getSelected(earningsClass);
              const meta = sectionMeta(earningsClass);

              // Both the section and batch totals use the complete summary.
              const classSummaryRows = summaryRows.filter((r) => asClass(r.earningsClass) === earningsClass);
              const summaryCustomers = classSummaryRows.reduce((t, x) => t + (x.customerPaidCount ?? 0), 0);
              const summaryDue = classSummaryRows.reduce((t, x) => t + ((x.paidAmount ?? 0) - (x.released ?? 0)), 0);

              const selectedCount = classSelected ? summaryCustomers : 0;

              return (
                <div className="card mb-3" key={earningsClass}>
                  <div className="accordion-item">
                    <h2 className="accordion-header" id={headerId}>
                      <div className="d-flex w-100 align-items-center">
                        <div
                          className="px-3 d-flex align-items-center pe-0 ps-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            className="form-check-input m-0"
                            checked={classSelected}
                            disabled={selectionDisabled}
                            onChange={(event) => setClassSelected(earningsClass, event.target.checked)}
                            aria-label={`Select all ${earningsClass.toLowerCase()} payables`}
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
                              <div className="fw-semibold">{formatInt(selectedCount)}</div>
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

                              return (
                                <React.Fragment key={periodKey}>
                                  {/* Period row */}
                                  <tr className={isPeriodOpen ? "bg-light" : ""}>

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
                                      <td colSpan={4} className="p-2 ps-3 bg-white">
                                        <div className="border rounded-2 bg-white">
                                          <div className="table-responsive">
                                            <table className="table mb-0 table-vcenter text-nowrap">
                                              <thead className="table-light">
                                                <tr>
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

                                                  const detail = bonusDetails[bonusKey];

                                                  return (
                                                    <React.Fragment key={bonusKey}>
                                                      <tr className={isBonusOpen ? "bg-light" : ""}>

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
                                                          <td colSpan={4} className="p-2 ps-3 bg-white">
                                                            <div className="border rounded-2 bg-white">
                                                              {detail?.loading && <DataLoading />}
                                                              {detail?.error && <DataError error={detail.error} />}

                                                              {detail?.payables && (
                                                                <>
                                                                  <div className="table-responsive">
                                                                    <table className="table mb-0 table-vcenter text-nowrap">
                                                                      <thead>
                                                                        <tr>
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
      )}
    </>
  );
};

export default PayableSummaryPanel3;

PayableSummaryPanel3.propTypes = {
  date: PropTypes.string.isRequired,
  handleViewCustomer: PropTypes.func,
  summaryRows: PropTypes.array.isRequired,
  bonusDetails: PropTypes.object.isRequired,
  setBonusDetails: PropTypes.func.isRequired,
  getSelected: PropTypes.func.isRequired,
  setClassSelected: PropTypes.func.isRequired,
  selectionDisabled: PropTypes.bool,
};
