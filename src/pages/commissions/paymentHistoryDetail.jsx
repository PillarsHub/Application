import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from "react-router-dom";
import { useQuery, gql } from "@apollo/client";
import { SendRequest } from "../../hooks/usePost";
import PageHeader, { CardHeader } from "../../components/pageHeader.jsx";
import LocalDate from '../../util/LocalDate.jsx';
import Modal from '../../components/modal.jsx';
import Avatar from '../../components/avatar';

// ---------- Config ----------
const PAYMENTS_PAGE_SIZE = 300;
const DETAIL_PAGE_SIZE = 100;

// ---------- GraphQL ----------

// Parent summaries per customer (includes customer info)
const GET_PAYMENTS_PAGED = gql`
  query ($batchId: String!, $offset: Int!, $first: Int!) {
    batches(batchIds: [$batchId]) {
      id
      created
      status
      totalPayments
      payments (offset: $offset, first: $first) {
        id
        nodeId
        amount
        batchId
        status
        totalDetails
        customer { id fullName profileImage }
      }
    }
  }
`;

// Details for a specific node/customer with server-side pagination
const GET_NODE_RELEASES = gql`
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
          released
          volume
        }
        period { id end }
        customer { id fullName profileImage }
      }
    }
  }
`;

// ---- Helpers for stable row identity ----
const paymentRowKey = (p) => `${p?.id ?? 'noPay'}|${p?.nodeId ?? 'noNode'}`;
const paymentDomId = (p) => `details-${paymentRowKey(p).replace(/[^a-zA-Z0-9_-]/g, '')}`;

const renderStatusBadge = (st) => (
  <>
    {st === "SUCCESS" && <><span className="badge bg-success me-1" /> Paid</>}
    {st === "PENDING" && <><span className="badge bg-warning me-1" /> Pending</>}
    {st === "FAILURE" && <><span className="badge bg-danger me-1" /> Failed</>}
  </>
);

const fmtMoney = (n) =>
  (n ?? 0).toLocaleString("en-US", { style: 'currency', currency: 'USD' });

const fmtNumber = (n) => (n == null || isNaN(n) ? '—' : Number(n).toLocaleString());

const PaymentHistoryDetail = () => {
  const params = useParams();

  // ---------- State (fixed order) ----------
  const [processing, setProcessing] = useState(false);
  const [showRetry, setShowRetry] = useState(false);

  // aggregated payments + batch meta
  const [payments, setPayments] = useState([]);
  const [batchMeta, setBatchMeta] = useState({ created: null, status: null, totalPayments: 0 });

  // loader state for the aggregation step
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [paymentsError, setPaymentsError] = useState(null);
  const [loadProgress, setLoadProgress] = useState({ loaded: 0, total: 0 });
  const [selectedPaymentIds, setSelectedPaymentIds] = useState(() => new Set());

  // expanded rows keyed by composite rowKey
  const [expanded, setExpanded] = useState(() => new Set());

  // per-rowKey details cache:
  // { items: Release[], loading: bool, error: string|null, hasMore: bool }
  const [detailMap, setDetailMap] = useState(() => new Map());

  // bulk modal
  const [bulkModal, setBulkModal] = useState({
    show: false,
    action: null,                // 'markPaid' | 'markFailed' | 'moveBatch'
    selectedPayables: 0,
    selectedReleases: 0,
    paymentIds: [],
    newBatchId: ''
  });

  // ---------- Data queries ----------
  const { refetch: refetchPaymentsPage } = useQuery(GET_PAYMENTS_PAGED, { skip: true });
  const { refetch: refetchDetails } = useQuery(GET_NODE_RELEASES, { skip: true });

  useEffect(() => {
    let cancelled = false;

    (async function loadAllPayments() {
      try {
        setLoadingPayments(true);
        setPaymentsError(null);
        setPayments([]);
        setLoadProgress({ loaded: 0, total: 0 });

        const first = PAYMENTS_PAGE_SIZE;

        // ---- Page 0: get meta and total ----
        const page0Res = await refetchPaymentsPage({
          batchId: params.batchId,
          offset: 0,
          first
        });

        const b0 = page0Res?.data?.batches?.[0];
        const created = b0?.created ?? null;
        const status = b0?.status ?? null;
        const total = b0?.totalPayments ?? (b0?.payments?.length || 0);
        const page0 = b0?.payments || [];

        // We’ll store pages in order, then flatten once (no pushing while fetching)
        const pagesOrdered = [page0];

        let offset = page0.length;
        setLoadProgress({ loaded: offset, total });

        // ---- Remaining pages (sequential) ----
        while (offset < total) {
          const res = await refetchPaymentsPage({
            batchId: params.batchId,
            offset,
            first
          });
          const b = res?.data?.batches?.[0];
          const page = b?.payments || [];

          // If API ever returns overlaps or fewer rows than requested,
          // we still advance by page.length and keep order deterministic.
          pagesOrdered.push(page);
          offset += page.length;
          setLoadProgress({ loaded: Math.min(offset, total), total });

          // Defensive break in case API returns empty pages repeatedly
          if (page.length === 0) break;
        }

        // ---- Flatten with de-dup by id (defensive in case of overlaps) ----
        const uniqueById = new Map();
        for (const page of pagesOrdered) {
          for (const item of page) {
            if (item?.id != null && !uniqueById.has(item.id)) {
              uniqueById.set(item.id, item);
            }
          }
        }
        const all = Array.from(uniqueById.values());

        if (!cancelled) {
          setBatchMeta({ created, status, totalPayments: total });
          setPayments(all);
          setLoadingPayments(false);
        }
      } catch (e) {
        if (!cancelled) {
          setPaymentsError(String(e));
          setLoadingPayments(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [params.batchId, refetchPaymentsPage]);



  // ---------- Derivations (hooks run every render) ----------
  const batchCreated = batchMeta.created;
  const paymentsRaw = payments; // aggregated array from state

  // Unpaid detail count = sum(totalDetails) for payments not SUCCESS
  const unpaidCount = useMemo(
    () => paymentsRaw.reduce((sum, p) => sum + (p.status !== 'SUCCESS' ? (p.totalDetails || 0) : 0), 0),
    [paymentsRaw]
  );
  const hasUnpaid = unpaidCount > 0;

  // Sort by name if available, else by nodeId
  const sortedPayments = useMemo(() => {
    return [...paymentsRaw].sort((a, b) => {
      const an = (a.customer?.fullName || a.nodeId || '').toLocaleLowerCase();
      const bn = (b.customer?.fullName || b.nodeId || '').toLocaleLowerCase();
      if (an < bn) return -1;
      if (an > bn) return 1;
      return 0;
    });
  }, [paymentsRaw]);

  // Selection aggregate
  const isAllSelected = useMemo(() => (
    sortedPayments.length > 0 && sortedPayments.every(p => selectedPaymentIds.has(p.id))
  ), [sortedPayments, selectedPaymentIds]);

  // ---------- Early returns AFTER hooks ----------
  if (paymentsError) return `Error! ${paymentsError}`;

  // ---------- Selection helpers ----------
  const toggleSelect = (paymentId) => {
    setSelectedPaymentIds(prev => {
      const next = new Set(prev);
      next.has(paymentId) ? next.delete(paymentId) : next.add(paymentId);
      return next;
    });
  };

  const selectAllOnPage = (checked) => {
    if (checked) {
      const next = new Set(selectedPaymentIds);
      sortedPayments.forEach(p => next.add(p.id));
      setSelectedPaymentIds(next);
    } else {
      const next = new Set(selectedPaymentIds);
      sortedPayments.forEach(p => next.delete(p.id));
      setSelectedPaymentIds(next);
    }
  };

  // ---------- Expand + lazy details (server-paged) ----------
  const toggleExpand = async (payment) => {
    const rowKey = paymentRowKey(payment);
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(rowKey) ? next.delete(rowKey) : next.add(rowKey);
      return next;
    });

    if (!detailMap.has(rowKey)) {
      await loadNodeReleasesInitial(payment);
    }
  };

  const loadNodeReleasesInitial = async (payment) => {
    const rowKey = paymentRowKey(payment);
    const nodeId = payment.nodeId;

    setDetailMap(prev => {
      const current = new Map(prev);
      current.set(rowKey, { items: [], loading: true, error: null, hasMore: true });
      return current;
    });

    try {
      const { data } = await refetchDetails({
        batchId: params.batchId,
        nodeId,
        offset: 0,
        first: DETAIL_PAGE_SIZE
      });

      const page = data?.batches?.[0]?.releases || [];
      setDetailMap(prev => {
        const current = new Map(prev);
        current.set(rowKey, {
          items: page,                 // rely on server's ordering for paging
          loading: false,
          error: null,
          hasMore: page.length === DETAIL_PAGE_SIZE
        });
        return current;
      });
    } catch (err) {
      setDetailMap(prev => {
        const current = new Map(prev);
        current.set(rowKey, { items: [], loading: false, error: String(err), hasMore: false });
        return current;
      });
    }
  };

  const loadMoreDetails = async (payment) => {
    const rowKey = paymentRowKey(payment);
    const nodeId = payment.nodeId;
    const entry = detailMap.get(rowKey) || { items: [], loading: false, error: null, hasMore: true };
    if (entry.loading || !entry.hasMore) return;

    const currentCount = entry.items.length;

    setDetailMap(prev => {
      const current = new Map(prev);
      current.set(rowKey, { ...entry, loading: true, error: null });
      return current;
    });

    try {
      const { data } = await refetchDetails({
        batchId: params.batchId,
        nodeId,
        offset: currentCount,
        first: DETAIL_PAGE_SIZE
      });

      const page = data?.batches?.[0]?.releases || [];
      setDetailMap(prev => {
        const current = new Map(prev);
        const latest = current.get(rowKey) || entry;
        current.set(rowKey, {
          items: [...(latest.items || []), ...page],
          loading: false,
          error: null,
          hasMore: page.length === DETAIL_PAGE_SIZE
        });
        return current;
      });
    } catch (err) {
      setDetailMap(prev => {
        const current = new Map(prev);
        const latest = current.get(rowKey) || entry;
        current.set(rowKey, { ...latest, loading: false, error: String(err) });
        return current;
      });
    }
  };

  // ---------- Bulk helpers ----------
  const computeBulk = () => {
    const selected = sortedPayments.filter(p => selectedPaymentIds.has(p.id));
    const paymentIds = selected.map(p => p.id);
    const selectedPayables = selected.length;
    const selectedReleases = selected.reduce((sum, p) => sum + (p.totalDetails || 0), 0);
    return { paymentIds, selectedPayables, selectedReleases };
  };

  const openBulk = (action) => {
    if (selectedPaymentIds.size === 0) {
      alert('Select at least one customer payable.');
      return;
    }
    const stats = computeBulk();
    if (stats.paymentIds.length === 0) {
      alert('No items found under the selected customers.');
      return;
    }
    setBulkModal({ show: true, action, ...stats, newBatchId: '' });
  };

  const closeBulk = () => {
    setBulkModal({
      show: false, action: null,
      selectedPayables: 0, selectedReleases: 0,
      paymentIds: [], newBatchId: ''
    });
  };

  const clearSelection = () => setSelectedPaymentIds(new Set());

  // ---------- Actions ----------
  const handleProcessBatch = () => {
    const batchId = params.batchId;
    setProcessing(true);
    SendRequest('POST', `/api/v1/Batches/${batchId}/process`, {}, () => {
      location = '/commissions/paid/' + batchId;
    }, (err) => { alert(err); setProcessing(false); });
  };

  // Replace your submitBulk with this version
  const submitBulk = () => {
    const { action, paymentIds } = bulkModal;
    const batchId = params.batchId;

    let status = 'PENDING';
    if (action === 'moveBatch') {
      alert('not supported');
      return;
    } else if (action === 'markPaid') {
      status = 'SUCCESS';
    } else if (action === 'markFailed') {
      status = 'FAILURE';
    }

    const uniqueIds = Array.from(new Set(paymentIds || []));
    if (uniqueIds.length === 0) {
      alert('Select at least one customer.');
      return;
    }

    // API body: [{ detailId: <paymentId>, status }]
    const body = uniqueIds.map(id => ({
      detailId: id,
      status
    }));

    SendRequest('PUT', `/api/v1/Batches/${batchId}`, body, () => {
      // --- SUCCESS: optimistic UI updates ---

      // 1) Update parent payments
      const selected = new Set(uniqueIds);
      setPayments(prev =>
        prev.map(p => (selected.has(p.id) ? { ...p, status } : p))
      );

      // 2) Update any already-loaded detail rows for those parents
      // detailMap keys look like `${paymentId}|${nodeId}` in our earlier code.
      setDetailMap(prev => {
        const next = new Map(prev);
        next.forEach((entry, key) => {
          // extract paymentId from composite key safely
          const paymentIdFromKey = String(key).split('|')[0];
          if (selected.has(paymentIdFromKey) && entry?.items?.length) {
            const items = entry.items.map(r => ({ ...r, status }));
            next.set(key, { ...entry, items });
          }
        });
        return next;
      });

      // 3) Close modal + clear selection
      closeBulk();
      clearSelection();

      // Note: unpaid count, badges, etc. will recompute from updated state.
    },
      (e) => alert(e)
    );
  };


  // ---------- Render ----------
  return (
    <PageHeader title="Commissions Paid">
      <CardHeader>
        <div className="d-flex align-items-center gap-2">

          {/* Bulk actions (parent-only selection) */}
          {selectedPaymentIds.size > 0 && <div className="dropdown">
            <button className="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" >
              Bulk actions {selectedPaymentIds.size > 0 ? `(${selectedPaymentIds.size})` : ''}
            </button>
            <div className="dropdown-menu">
              {/* <button className="dropdown-item" onClick={() => openBulk('moveBatch')}>
                Move to New Batch
              </button>
              <div className="dropdown-divider"></div> */}
              <button className="dropdown-item" onClick={() => openBulk('markPaid')}>
                Mark as Paid
              </button>
              <button className="dropdown-item" onClick={() => openBulk('markFailed')}>
                Mark as Failed
              </button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item text-danger" onClick={clearSelection}>
                Clear selection
              </button>
            </div>
          </div>}

          {loadingPayments && (
            <div className="ms-2 small text-muted">
              Loading customers… <strong>{loadProgress.loaded}</strong> / <strong>{loadProgress.total || '—'}</strong>
            </div>
          )}

          <button className="btn btn-border-secondary" onClick={() => setShowRetry(true)} disabled={!hasUnpaid || processing} title={hasUnpaid ? "Retries all pending/failed items in this batch" : "Nothing to retry"} aria-label="Retry unpaid items in this batch" >
            {processing ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Submit Batch
              </>
            ) : (
              <>
                Submit Batch
              </>
            )}
          </button>

          {/* <div className="dropdown">
            <a href="#" className="btn btn-default btn-icon" data-bs-toggle="dropdown" aria-expanded="false">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="19" r="1"></circle><circle cx="12" cy="5" r="1"></circle></svg>
            </a>
            <div className="dropdown-menu dropdown-menu-end">
              <a href="/Customers/813269/Edit" className="dropdown-item">Edit Details</a>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item">Download CSV</button>
              <button className="dropdown-item">Download Nacha</button>
              <button className="dropdown-item">Download PayQuicker</button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item text-danger">Delete Batch</button>
            </div>
          </div> */}

        </div>
      </CardHeader>

      <div className="container-xl">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><span className="me-auto">Batch Detail</span></h3>
            <span className="card-actions btn-actions">{batchCreated && <LocalDate dateString={batchCreated} />}</span>
          </div>

          {loadingPayments ? (
            <div className="py-5 text-center">
              <span className="spinner-border" role="status" aria-hidden="true" />
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover card-table table-vcenter text-nowrap datatable">
                <thead>
                  <tr>
                    <th className="w-1">
                      <label className="form-check mb-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={(e) => selectAllOnPage(e.target.checked)}
                          aria-label="Select all customers on this page"
                        />
                      </label>
                    </th>
                    <th>Customer</th>
                    <th>Customer Id</th>
                    <th>Payment Id</th>
                    <th className="text-end">Total Bonus</th>
                    <th>Status</th>
                    <th>Payment Date</th>
                    <th>Items</th>
                    <th className="w-1"></th>
                  </tr>
                </thead>

                <tbody>
                  {sortedPayments.map((p) => {
                    const rowKey = paymentRowKey(p);
                    const isOpen = expanded.has(rowKey);
                    const selected = selectedPaymentIds.has(p.id);
                    const totalFormatted = fmtMoney(p.amount);

                    const dstate = detailMap.get(rowKey);

                    return (
                      <React.Fragment key={rowKey}>
                        <tr className={`cursor-pointer ${selected ? 'table-active' : ''}`} onClick={() => toggleSelect(p.id)} role="button" aria-pressed={selected}>

                          <td className="d-done" onClick={(e) => e.stopPropagation()}>
                            <label className="form-check mb-0">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleSelect(p.id)}
                                aria-label={`Select ${p.customer?.fullName || p.nodeId}`}
                              />
                            </label>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="me-2">
                                <Avatar name={p.customer?.fullName || p.nodeId} url={p.customer?.profileImage} size="xs" />
                              </span>
                              <div>
                                <a className="text-reset" href={`/Customers/${p.nodeId}/commissions`} onClick={(e) => e.stopPropagation()}>
                                  {p.customer?.fullName || p.nodeId}
                                </a>
                              </div>
                            </div>
                          </td>
                          <td>{p.customer.id}</td>
                          <td>{p.id}</td>
                          <td className="text-end fw-bold">{totalFormatted}</td>
                          <td>{renderStatusBadge(p.status)}</td>
                          <td>{batchCreated && <LocalDate dateString={batchCreated} hideTime="true" />}</td>
                          <td>{p.totalDetails ?? 0}</td>
                          <td className="text-end" onClick={(e) => e.stopPropagation()}>
                            <button className="btn-action btn-icon" aria-expanded={isOpen} aria-controls={paymentDomId(p)} onClick={() => toggleExpand(p)} >
                              {!isOpen &&
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-chevron-down"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M6 9l6 6l6 -6" /></svg>
                              }
                              {isOpen &&
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-chevron-up"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M6 15l6 -6l6 6" /></svg>
                              }
                            </button>
                          </td>
                        </tr>

                        {isOpen && (
                          <tr className="bg-body-tertiary">
                            <td></td>
                            <td colSpan={8} className="p-0">
                              <div id={paymentDomId(p)} className="p-3">
                                {/* If the very first page is loading and there are no items yet */}
                                {(!dstate || (dstate.items?.length === 0 && dstate.loading)) && (
                                  <div className="text-center my-3">
                                    <span className="spinner-border" role="status" aria-hidden="true" />
                                  </div>
                                )}

                                {/* If we have items (even if loading more), render the table and append a spinner row while loading */}
                                {dstate?.items?.length > 0 && (
                                  <div className="table-responsive">
                                    <table className="table table-sm table-bordered">
                                      <thead>
                                        <tr>
                                          <th>Release Id</th>
                                          <th>Status</th>
                                          <th>Bonus Title</th>
                                          <th className="text-end">Level</th>
                                          <th className="text-end">Volume</th>
                                          <th className="text-end">Percent</th>
                                          <th className="text-end">Amount</th>
                                          <th className="text-end">Commission Date</th>
                                          <th className="text-end">Period End Date</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {dstate.items.map((s) => (
                                          <tr key={s.id}>
                                            <td className="text-monospace">{s.id}</td>
                                            <td>{renderStatusBadge(s.status)}</td>
                                            <td>{s.bonus?.bonusTitle || '—'}</td>
                                            <td className="text-end">{fmtNumber(s.bonus?.level)}</td>
                                            <td className="text-end">{fmtNumber(s.bonus?.volume)}</td>
                                            <td className="text-end">{s.bonus?.percent}</td>
                                            <td className="text-end">{fmtMoney(s.amount)}</td>
                                            <td className="text-end">
                                              {s.bonus?.commissionDate
                                                ? <LocalDate dateString={s.bonus.commissionDate} hideTime="true" />
                                                : '—'}
                                            </td>
                                            <td className="text-end"><LocalDate dateString={s.period?.end} hideTime="true" /></td>
                                          </tr>
                                        ))}

                                        {/* Append spinner row when loading more */}
                                        {dstate.loading && dstate.items.length > 0 && (
                                          <tr>
                                            <td colSpan={9} className="text-center py-2">
                                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                                              Loading more…
                                            </td>
                                          </tr>
                                        )}

                                        {/* Optional: show an inline error row if a load-more failed */}
                                        {!dstate.loading && dstate.error && dstate.items.length > 0 && (
                                          <tr>
                                            <td colSpan={9} className="text-center text-danger py-2">
                                              Failed to load more: {dstate.error}
                                            </td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>

                                    {/* Only show the button when not currently loading and there is more to fetch */}
                                    {dstate.hasMore && !dstate.loading && (
                                      <div className="d-flex justify-content-center my-2">
                                        <button
                                          className="btn btn-outline"
                                          onClick={() => loadMoreDetails(p)}
                                        >
                                          Load more
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Initial-load error (no items yet) */}
                                {!dstate?.loading && dstate?.error && (!dstate.items || dstate.items.length === 0) && (
                                  <div className="alert alert-danger">Failed to load details: {dstate.error}</div>
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
          )}
        </div>
      </div>

      {/* Retry (all-unpaid) modal */}
      <Modal showModal={showRetry} size="md" onHide={() => setShowRetry(false)}>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        <div className="modal-status bg-danger"></div>

        <div className="modal-body py-4">
          <h3 className="mb-2">Retry unpaid items with the processor?</h3>

          <div className="mb-3 text-muted">
            This will resubmit <strong>all Pending/Failed</strong> details in this batch to your merchant processor
            (currently <strong>{unpaidCount}</strong>). Row selections are ignored; items already marked Paid are skipped.
          </div>

          <div id="retry-warning" className="alert alert-warning d-flex align-items-start" role="alert">
            <i className="ti ti-alert-triangle me-2 mt-1" aria-hidden="true"></i>
            <div>
              <strong>Note:</strong> This action initiates real payment attempts with your processor.
              Make sure these items weren’t already settled outside Pillars to avoid duplicate charges or mismatches.
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-link link-secondary" data-bs-dismiss="modal">
            Cancel
          </button>
          <button type="button" className="btn btn-danger ms-auto" onClick={handleProcessBatch} aria-describedby="retry-warning" >
            Submit Batch
          </button>
        </div>
      </Modal>


      {/* Bulk edit modal */}
      <Modal showModal={bulkModal.show} size="md" onHide={() => setBulkModal(m => ({ ...m, show: false }))}>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>

        {(() => {
          const isMarkPaid = bulkModal.action === 'markPaid';
          const isMarkFailed = bulkModal.action === 'markFailed';
          const barClass = isMarkPaid ? 'bg-success' : isMarkFailed ? 'bg-danger' : 'bg-primary';
          const actionLabel = isMarkPaid ? 'Paid' : isMarkFailed ? 'Failed' : null;

          return (
            <>
              <div className={`modal-status ${barClass}`}></div>

              <div className="modal-body py-4">
                <h3 className="mb-2">
                  {isMarkPaid && 'Mark as Paid'}
                  {isMarkFailed && 'Mark as Failed'}
                  {bulkModal.action === 'moveBatch' && 'Move to New Batch'}
                </h3>

                <div className="mb-2">
                  Selected customers: <strong>{bulkModal.selectedPayables}</strong>
                </div>
                <div className="mb-3">
                  Total affected releases: <strong>{bulkModal.selectedReleases}</strong>
                </div>

                {(isMarkPaid || isMarkFailed) && (
                  <div id="bulk-warning" className="alert alert-warning d-flex align-items-start" role="alert">
                    <i className="ti ti-alert-triangle me-2 mt-1" aria-hidden="true"></i>
                    <div>
                      <strong>Warning:</strong> Marking payments as <em>{actionLabel}</em> does <u>not</u> submit the items to the merchant processor — this update affects <strong>Pillars</strong> only.
                      By marking these as {actionLabel.toLowerCase()}, Pillars may be out of sync with what was actually done in your merchant processor.
                    </div>
                  </div>
                )}

                {bulkModal.action === 'moveBatch' && (
                  <div className="mb-3">
                    <label className="form-label">Destination Batch Id</label>
                    <input
                      type="text"
                      className="form-control"
                      value={bulkModal.newBatchId}
                      onChange={(e) => setBulkModal(m => ({ ...m, newBatchId: e.target.value }))}
                      placeholder="Enter batch id…"
                    />
                    <div className="form-hint">
                      All releases under the selected customers will be moved (status is ignored).
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn btn-link link-secondary" data-bs-dismiss="modal" onClick={() => setBulkModal(m => ({ ...m, show: false }))} >
                  Cancel
                </button>
                <button className="btn btn-primary ms-auto" onClick={submitBulk} aria-describedby={(isMarkPaid || isMarkFailed) ? 'bulk-warning' : undefined} >
                  Confirm
                </button>
              </div>
            </>
          );
        })()}
      </Modal>


    </PageHeader>
  );
};

export default PaymentHistoryDetail;
