import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { gql, useLazyQuery, useQuery } from "@apollo/client";
import DataLoading from "../../../components/dataLoading";
import DataError from "../../../components/dataError";
import LocalDate from "../../../util/LocalDate";
import EmptyContent from "../../../components/emptyContent";

const PAGE_SIZE = 100;

/** Queries */
const GET_CUSTOMER = gql`
  query ($nodeId: String) {
    customers(customerId: { eq: $nodeId }) {
      id
      fullName
      payments {
        id
        batchId
        nodeId
        status
        amount
        totalDetails
        created: date
      }
    }
  }
`;

const GET_NODE_RELEASEES = gql`
  query ($batchId: String!, $nodeId: String!, $offset: Int!, $first: Int!) {
    batches(batchIds: [$batchId]) {
      id
      releases(nodeIds: [$nodeId], offset: $offset, first: $first) {
        id
        amount
        status
        bonus {
          amount
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
        period { id end }
        customer { id fullName profileImage }
      }
    }
  }
`;

/** helpers */
const currency = (n) => (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
const s = (v) => (v == null ? "" : String(v));
const fmtNumber = (n) => (n == null ? 0 : Number(n)).toLocaleString("en-US");
const fmtPercent = (p) => {
  if (p == null || p === "") return "—";
  let val = Number(p);
  if (!isFinite(val)) return "—";
  // normalize to 3 decimals to avoid values like 7.000000000000001
  val = Math.round(val * 1000) / 1000;
  const hasFraction = Math.abs(val % 1) > 0;
  return hasFraction ? `${val.toFixed(2)}%` : `${val.toFixed(0)}%`;
};
const sortPaidReleases = (a, b) => {
  const ad = a.bonus?.commissionDate ? new Date(a.bonus.commissionDate).getTime() : 0;
  const bd = b.bonus?.commissionDate ? new Date(b.bonus.commissionDate).getTime() : 0;
  if (ad !== bd) return ad - bd;
  const aLevel = a.bonus?.level ?? 0;
  const bLevel = b.bonus?.level ?? 0;
  return aLevel - bLevel;
};

const PaymentsWidget = ({ date, customerId, setCurrentBatch }) => {
  const { loading, error, data } = useQuery(GET_CUSTOMER, {
    variables: { date, nodeId: customerId },
    fetchPolicy: "no-cache",
  });
  const [loadReleases, releasesState] = useLazyQuery(GET_NODE_RELEASEES, { fetchPolicy: "no-cache" });

  const customer = data?.customers?.[0] ?? null;
  const payments = customer?.payments ?? [];

  const [expandedPaymentId, setExpandedPaymentId] = useState(null);
  const [releasesByBatch, setReleasesByBatch] = useState({});
  const [pagingByBatch, setPagingByBatch] = useState({});

  const sortedPayments = useMemo(() => {
    return payments.slice().sort((a, b) => {
      const ad = a.created ? new Date(a.created).getTime() : 0;
      const bd = b.created ? new Date(b.created).getTime() : 0;
      if (ad !== bd) return bd - ad;
      return s(b.id).localeCompare(s(a.id));
    });
  }, [payments]);

  const primeBatchIfNeeded = async (pmt) => {
    if (releasesByBatch[pmt.batchId]) return;
    // optimistic placeholder to block concurrent calls
    setReleasesByBatch((m) => ({ ...m, [pmt.batchId]: m[pmt.batchId] ?? [] }));
    const { data: relData } = await loadReleases({
      variables: { batchId: pmt.batchId, nodeId: pmt.nodeId, offset: 0, first: PAGE_SIZE },
    });
    const list = relData?.batches?.[0]?.releases ?? [];
    setReleasesByBatch((m) => ({ ...m, [pmt.batchId]: list }));
    setPagingByBatch((m) => ({ ...m, [pmt.batchId]: { offset: list.length, hasMore: list.length === PAGE_SIZE } }));
  };

  const onTogglePayment = async (pmt) => {
    const isOpen = expandedPaymentId === pmt.id;
    if (isOpen) {
      setExpandedPaymentId(null);
      return;
    }
    setExpandedPaymentId(pmt.id);
    setCurrentBatch?.(pmt.batchId);
    await primeBatchIfNeeded(pmt);
  };

  const onLoadMore = async (pmt) => {
    const paging = pagingByBatch[pmt.batchId] ?? { offset: 0, hasMore: true };
    if (!paging.hasMore) return;
    const { data: relData } = await loadReleases({
      variables: { batchId: pmt.batchId, nodeId: pmt.nodeId, offset: paging.offset, first: PAGE_SIZE },
    });
    const next = relData?.batches?.[0]?.releases ?? [];
    setReleasesByBatch((m) => ({ ...m, [pmt.batchId]: [...(m[pmt.batchId] ?? []), ...next] }));
    setPagingByBatch((m) => ({
      ...m,
      [pmt.batchId]: { offset: paging.offset + next.length, hasMore: next.length === PAGE_SIZE },
    }));
  };

  if (error) return <DataError error={error} />;
  if (loading) return <DataLoading />;

  if (!payments.length) {
    return (
      <EmptyContent
        title="No commission payments yet"
        text="Once commissions are calculated and released, your payment history will show up here."
      />
    );
  }

  return (
    <div className="table-responsive">
      <table className="table card-table table-vcenter text-nowrap">
        <thead>
          <tr>
            <th className="w-1"></th>
            <th>Date Paid</th>
            <th className="text-center">Status</th>
            <th>Payment Id</th>
            <th>Batch</th>
            <th className="text-center">Items</th>
            <th className="text-end">Amount</th>
          </tr>
        </thead>
        <tbody>
          {sortedPayments.map((pmt) => {
            const isOpen = expandedPaymentId === pmt.id;
            const releases = releasesByBatch[pmt.batchId] ?? [];
            const paging = pagingByBatch[pmt.batchId];

            return (
              <React.Fragment key={pmt.id}>
                <tr style={{ cursor: "pointer" }} onClick={() => onTogglePayment(pmt)} tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onTogglePayment(pmt);
                    }
                  }}
                  aria-expanded={isOpen}
                >
                  <td className="text-end">
                    {!isOpen &&
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-caret-right"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M10 18l6 -6l-6 -6v12" /></svg>
                    }
                    {isOpen &&
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-caret-down"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M6 10l6 6l6 -6h-12" /></svg>
                    }
                  </td>
                  <td className="">{pmt.created ? <LocalDate dateString={pmt.created} hideTime={true} /> : "—"}</td>
                  <td className="text-center">
                    <span className={`badge ${pmt.status === "Paid" ? "bg-green-lt" : pmt.status === "Pending" ? "bg-yellow-lt" : "bg-secondary-lt"}`} >
                      {pmt.status}
                    </span>
                  </td>
                  <td>Payment {pmt.id}</td>
                  <td>{pmt.batchId}</td>
                  <td className="text-center">{pmt.totalDetails ?? 0}</td>
                  <td className="text-end fw-bold">{currency(pmt.amount)}</td>
                </tr>

                {isOpen && (
                  <tr>
                    {/* parent header now has 6 columns */}
                    <td colSpan={7} className="p-0">
                      <div className="p-2">
                        {releasesState.loading && !releases.length && <DataLoading />}
                        {releasesState.error && <DataError error={releasesState.error} />}

                        {releases.length > 0 && (
                          <div className="table-responsive">
                            <table className="table table-sm mb-2">
                              <thead>
                                <tr>
                                  <th>Bonus</th>
                                  <th className="d-none d-sm-table-cell">Level</th>
                                  <th className="d-none d-md-table-cell">Commission Date</th>
                                  <th className="d-none d-xl-table-cell">Order Customer</th>
                                  <th>Order Number</th>
                                  <th>Order Date</th>
                                  <th>Volume</th>
                                  <th>Percent</th>
                                  <th className="text-end">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {releases
                                  .slice()
                                  .sort(sortPaidReleases)
                                  .map((rel) => {
                                    const b = rel.bonus || {};
                                    const src = b.source || {};
                                    const buyer = src.customer || {};
                                    return (
                                      <tr key={rel.id}>
                                        <td>{b.bonusTitle ?? b.bonusId ?? "Bonus"}</td>
                                        <td className="d-none d-sm-table-cell">{b.level ?? "—"}</td>
                                        <td className="d-none d-md-table-cell">
                                          {b.commissionDate ? (
                                            <LocalDate dateString={b.commissionDate} hideTime />
                                          ) : (
                                            "—"
                                          )}
                                        </td>
                                        <td className="d-none d-xl-table-cell">
                                          <span className="d-inline-flex align-items-center gap-2">
                                            <span className="text-truncate" style={{ maxWidth: 220 }}>
                                              {buyer.fullName ?? buyer.id ?? "—"}
                                            </span>
                                          </span>
                                        </td>
                                        <td>{src.externalId ?
                                          <a className="text-reset" href={`/customers/${buyer.id}/orders/${src.externalId}`} target="_blank" rel="noreferrer">{src.externalId ?? "—"}</a> : "—"
                                        }</td>
                                        <td>{src.externalId ? <LocalDate dateString={src.date} hideTime /> : "—"}</td>
                                        <td>{fmtNumber(b.volume)}</td>
                                        <td>{fmtPercent(b.percent)}</td>
                                        <td className="text-end">{currency(rel.amount)}</td>
                                      </tr>
                                    );
                                  })}
                              </tbody>

                            </table>
                          </div>
                        )}

                        {(() => {
                          const total = pmt.totalDetails ?? 0;
                          const loaded = releases.length;
                          const remaining = Math.max(0, total - loaded);
                          const canLoadMore = (!paging || paging.hasMore) && remaining > 0;

                          return canLoadMore ? (
                            <div className="d-flex justify-content-center">
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm ps-3 pe-3"
                                onClick={() => onLoadMore(pmt)}
                                disabled={releasesState.loading}
                              >
                                {releasesState.loading ? "Loading…" : `Load more (${remaining} left)`}
                              </button>
                            </div>
                          ) : total > 0 ? (
                            <div className="text-center text-muted small">
                              All {loaded.toLocaleString()} items loaded.
                            </div>
                          ) : null;
                        })()}
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
  );
};

PaymentsWidget.propTypes = {
  date: PropTypes.string.isRequired,
  customerId: PropTypes.string.isRequired,
  setCurrentBatch: PropTypes.func,
};

export default PaymentsWidget;
