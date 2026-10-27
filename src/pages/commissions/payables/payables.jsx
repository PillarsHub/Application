import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery } from '@apollo/client';
import { SendRequest } from '../../../hooks/usePost.js';
import PageHeader, { CardHeader } from '../../../components/pageHeader.jsx';
import AddPayableModal from '../payableComponents/addPayableModal.jsx';
import AutoComplete from '../../../components/autocomplete.jsx';
import DataLoading from '../../../components/dataLoading.jsx';
import DataError from '../../../components/dataError.jsx';
import PeriodPicker from '../../../components/periodPicker.jsx';
import BonusPicker from './bonusPicker.jsx';
import MerchantPicker from './merchantPicker.jsx';
import PayablesModal from './payablesModal.jsx';
import PayableSummaryPanel, { SECTION_META } from './payableSummaryPanel.jsx';
import CustomerPayablePanel, { GET_CUSTOMER } from './customerPayablePanel.jsx';
import { asClass, buildBatchSelection, defaultClassSelection, summarizePayables } from './batchSelection.mjs';
import { applyNegativeHolds, filterIncludedBonuses, filterPlanBonuses, getBonusOptions } from './bonusScope.mjs';
import usePayables from './usePayables.js';
import { filterIncludedMerchants, getMerchantOptions } from './merchantScope.mjs';

const idleValidation = () => ({ status: 'idle', message: null, negativeItems: [], computedAt: null });
const PERIOD_PICKER_OPTIONS = { tabbedUI: true, hideTime: true };
const sendRequestAsync = (method, url, data) =>
  new Promise((resolve, reject) => SendRequest(method, url, data, resolve, reject));

const Payables = () => {
  const [show, setShow] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const currentDate = selectedPeriod?.end;
  const compensationPlanId = selectedPeriod?.compensationPlanId ?? null;
  const [customerId, setCustomerId] = useState('');
  const [activeSection, setActiveSection] = useState(null);
  const [periodFilter, setPeriodFilter] = useState('all');
  const [sectionSearch, setSectionSearch] = useState('');
  const [excludedBonuses, setExcludedBonuses] = useState([]);
  const [excludedMerchantIds, setExcludedMerchantIds] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState(defaultClassSelection);
  const [detailsVersion, setDetailsVersion] = useState(0);
  const [allowNegativeOverrideOnce, setAllowNegativeOverrideOnce] = useState(false);
  const [batchValidation, setBatchValidation] = useState(idleValidation);

  const { rows: loadedPayables, loading: summaryLoading, error: summaryError, refetch } = usePayables(currentDate);
  const planPayables = useMemo(() => filterPlanBonuses(loadedPayables, compensationPlanId), [loadedPayables, compensationPlanId]);
  const payableRecords = useMemo(() => applyNegativeHolds(filterIncludedBonuses(filterIncludedMerchants(planPayables, excludedMerchantIds), excludedBonuses)), [planPayables, excludedBonuses, excludedMerchantIds]);
  const { data: customerData, loading: customerLoading, error: customerError, refetch: refetchCustomer } = useQuery(GET_CUSTOMER, {
    variables: { nodeId: customerId },
    skip: !currentDate || !customerId,
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });
  const customerPayables = useMemo(() => {
    if (!customerId || summaryLoading || summaryError || customerLoading || customerError) return [];
    if (!customerData?.customers?.some(customer => String(customer.id) === String(customerId))) return [];
    return payableRecords.filter(row => String(row.nodeId) === String(customerId));
  }, [customerId, customerData, customerLoading, customerError, summaryLoading, summaryError, payableRecords]);
  const scopedCustomerData = useMemo(() => customerData ? {
    ...customerData, unreleased: customerPayables,
  } : customerData, [customerData, customerPayables]);
  const batchLoading = summaryLoading || (!!customerId && customerLoading);
  const batchError = summaryError || (customerId ? customerError : null);
  const bonuses = useMemo(() => getBonusOptions(planPayables), [planPayables]);
  const merchants = useMemo(() => getMerchantOptions(planPayables), [planPayables]);
  const summaryRows = useMemo(() => summarizePayables(payableRecords), [payableRecords]);
  const batch = useMemo(() => buildBatchSelection({
    cutoffDate: currentDate,
    selectedClasses,
    customerId,
    payableRecords: customerId ? customerPayables : payableRecords,
    excludedMerchantIds,
  }), [currentDate, selectedClasses, customerId, customerPayables, payableRecords, excludedMerchantIds]);
  const currentBatch = batch.totals;
  const currentBatchPayload = useMemo(() => ({
    ...batch.payload,
    options: { ...batch.payload.options, allowNegativeNetPayments: allowNegativeOverrideOnce },
  }), [batch, allowNegativeOverrideOnce]);
  const latestBatch = useRef(batch);
  const validationVersion = useRef(0);
  latestBatch.current = batch;

  useEffect(() => {
    setAllowNegativeOverrideOnce(false);
    setBatchValidation(idleValidation());
    setShow(false);
  }, [batch]);

  const getSelected = useCallback(earningsClass => !!selectedClasses[asClass(earningsClass)], [selectedClasses]);
  const setClassSelected = (earningsClass, checked) => {
    validationVersion.current += 1;
    setSelectedClasses(previous => ({ ...previous, [asClass(earningsClass)]: !!checked }));
  };

  const resetPayablesView = useCallback(() => {
    validationVersion.current += 1;
    setCustomerId('');
    setActiveSection(null);
    setPeriodFilter('all');
    setSectionSearch('');
    setSelectedClasses(defaultClassSelection());
    setDetailsVersion(version => version + 1);
    setAllowNegativeOverrideOnce(false);
    setBatchValidation(idleValidation());
    setShow(false);
  }, []);
  const handlePeriodChange = useCallback((periodId, userInitiated, period, plan) => {
    if (!period?.end || plan?.id == null) return;
    setSelectedPeriod({ ...period, compensationPlanId: plan.id });
    resetPayablesView();
  }, [resetPayablesView]);
  const handleBonusesChange = next => {
    setExcludedBonuses(next);
    resetPayablesView();
  };
  const handleMerchantsChange = next => {
    setExcludedMerchantIds(next);
    resetPayablesView();
  };

  const handleSearch = (name, value) => {
    validationVersion.current += 1;
    setCustomerId(value ? String(value) : null);
    setActiveSection(null);
    setSectionSearch('');
    if (!value) setSelectedClasses(defaultClassSelection());
    setAllowNegativeOverrideOnce(false);
    setBatchValidation(idleValidation());
    setShow(false);
  };
  const handleSectionChange = (earningsClass, filter = 'all') => {
    setActiveSection(earningsClass);
    setPeriodFilter(filter);
    setSectionSearch('');
  };
  const handleRefetch = () => {
    validationVersion.current += 1;
    setDetailsVersion(version => version + 1);
    setAllowNegativeOverrideOnce(false);
    setBatchValidation(idleValidation());
    setShow(false);
    if (currentDate) {
      refetch();
      if (customerId) void refetchCustomer().catch(() => {});
    }
  };
  const handleClose = () => {
    setShow(false);
    setAllowNegativeOverrideOnce(false);
  };

  const handleCreateBatchClick = async () => {

    if (!currentDate || batchLoading || batchError || !currentBatchPayload.groups.length) {
      setBatchValidation({
        status: "error",
        message: "Batch is not ready yet. Please try again.",
        negativeItems: [],
        computedAt: null
      });
      return;
    }

    // Preserve the approved override in the payload until confirmation closes.
    if (allowNegativeOverrideOnce && batchValidation.status === "invalid") {
      setShow(true);
      return;
    }

    const validatingBatch = batch;
    const validatingVersion = ++validationVersion.current;

    // Normal path: validate first
    setBatchValidation({
      status: "validating",
      message: "Validating batch for negative payments…",
      negativeItems: [],
      computedAt: null
    });

    try {
      const res = await sendRequestAsync("POST", "/api/v1/Batches/validate", currentBatchPayload);

      if (latestBatch.current !== validatingBatch || validationVersion.current !== validatingVersion) return;

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
      if (latestBatch.current !== validatingBatch || validationVersion.current !== validatingVersion) return;
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
        <CardHeader>
          <AddPayableModal refetch={handleRefetch} />
        </CardHeader>
        <div className="container-xl">
          <div className="row row-cards">
            <div className="col-xl-9">
              <div className="mb-3">
                <div className="row g-2 align-items-center">
                  <div className="col-sm-auto">
                    <PeriodPicker periodId={selectedPeriod?.id ?? 0} setPeriodId={handlePeriodChange} options={PERIOD_PICKER_OPTIONS} disabled={isValidating} />
                  </div>
                  <div className="col-sm-auto">
                    <BonusPicker bonuses={bonuses} excludedBonuses={excludedBonuses} onChange={handleBonusesChange}
                      disabled={!currentDate || summaryLoading || !!summaryError || isValidating} />
                  </div>
                  <div className="col-sm-auto">
                    <MerchantPicker merchants={merchants} excludedMerchantIds={excludedMerchantIds} onChange={handleMerchantsChange}
                      disabled={!currentDate || summaryLoading || !!summaryError || isValidating} />
                  </div>
                  <div className="col-sm">
                    <div className="w-100">
                      {activeSection && !customerId ? (
                        <input type="search" className="form-control" value={sectionSearch}
                          placeholder={`Search customers in ${SECTION_META[activeSection].title}`}
                          aria-label={`Search customers in ${SECTION_META[activeSection].title}`}
                          onChange={event => setSectionSearch(event.target.value)} />
                      ) : <AutoComplete
                        placeholder="Search Payables"
                        value={customerId}
                        allowNull={true}
                        showClear={true}
                        onChange={handleSearch}
                      />}
                    </div>
                  </div>
                  <div className="col-sm-auto"></div>
                </div>
              </div>

              {!customerId && summaryLoading && <DataLoading />}
              {!customerId && summaryError && <DataError error={summaryError} />}
              {customerId && currentDate && (
                <div className="card">
                  <CustomerPayablePanel
                    key={String(selectedPeriod.id) + '_' + customerId + '_' + detailsVersion}
                    customerId={customerId}
                    data={scopedCustomerData}
                    loading={batchLoading}
                    error={batchError}
                    getSelected={getSelected}
                    onStatusChanged={handleRefetch}
                  />
                </div>
              )}
              {currentDate && !summaryLoading && !summaryError && (
                <div hidden={!!customerId}>
                  <PayableSummaryPanel
                    key={String(selectedPeriod.id) + '_' + detailsVersion}
                    date={currentDate}
                    selectedPeriodId={selectedPeriod.id}
                    payableRecords={payableRecords}
                    activeSection={activeSection}
                    periodFilter={periodFilter}
                    search={sectionSearch}
                    onSectionChange={handleSectionChange}
                    onFilterChange={setPeriodFilter}
                    handleViewCustomer={(id) => handleSearch(null, id)}
                    summaryRows={summaryRows}
                    getSelected={getSelected}
                    setClassSelected={setClassSelected}
                    selectionDisabled={isValidating}
                  />
                </div>
              )}
            </div>

            <div className="col-xl-3">
              <div className="card payable-summary-sticky">
                {batchLoading && <DataLoading />}

                {currentBatch && (
                  <>
                    <div className="card-header d-none d-sm-block">
                      <h3 className="card-title">Payable Summary</h3>
                    </div>

                    <div className="card-body">
                      {customerId && <p className="small text-muted">Payment batch limited to customer {customerId}.</p>}
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

                      {batch.merchantTotals.length > 0 && (
                        <div className="bg-light border rounded-2 p-3 mt-3 mb-3" aria-label="Payments by merchant">
                          <div className="subheader mb-3">Payments by merchant</div>
                          <div className="d-flex flex-column gap-3">
                            {batch.merchantTotals.map(merchant => (
                              <div key={merchant.id} className="d-flex justify-content-between gap-3">
                                <div>
                                  <div>{merchant.name}</div>
                                  {merchant.serviceType && <div className="small text-muted">{merchant.serviceType}</div>}
                                </div>
                                <div className="text-nowrap">
                                  {merchant.total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="d-flex justify-content-between align-items-center gap-3 border-top pt-3 mt-3">
                        <p className="mb-0">Payment Total</p>
                        <p className="h3 mb-0 fw-bold text-nowrap">
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
                        {(batchLoading || batchError || !currentDate || currentBatch.totalCustomers === 0) ? (
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

      <PayablesModal showModal={show} onHide={handleClose} batchData={currentBatchPayload} validation={batchValidation} />
    </>
  );
};

export default Payables;
