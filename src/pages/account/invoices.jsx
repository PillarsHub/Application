import React, { useState } from "react";
import PageHeader from "../../components/pageHeader.jsx";
import { useFetch } from "../../hooks/useFetch.js";
import DataError from "../../components/dataError.jsx";
import DataLoading from "../../components/dataLoading.jsx";
import LocalDate from "../../util/LocalDate.jsx";

const PAGE_SIZE = 10;
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const buildQuery = ({ search, overdueOnly, hasBalance, offset }) => {
  const query = {
    offset,
    count: PAGE_SIZE,
  };

  if (search) query.Search = search;
  if (overdueOnly) query.OverdueOnly = true;
  if (hasBalance) query.HasBalance = true;

  return query;
};

const Invoices = () => {
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [hasBalance, setHasBalance] = useState(false);
  const [offset, setOffset] = useState(0);

  const query = buildQuery({ search, overdueOnly, hasBalance, offset });

  const {
    loading: invoicesLoading,
    error: invoicesError,
    data: invoicesData,
    refetch,
  } = useFetch("/api/v1/EnvironmentInvoices", query, []);

  if (invoicesLoading) return <DataLoading title="Loading invoices..." />;
  if (invoicesError) return <DataError title="Unable to load invoices." error={invoicesError} />;

  const invoices = Array.isArray(invoicesData) ? invoicesData : [];
  const now = new Date();
  const summary = invoices.reduce(
    (acc, invoice) => {
      const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
      const isPastDueDate = dueDate instanceof Date && !Number.isNaN(dueDate.getTime()) && dueDate < now;
      const paid = (invoice.payments || []).reduce((paymentSum, payment) => paymentSum + (payment.amount || 0), 0);
      const amount = invoice.amount || 0;
      const balance = Math.max(0, amount - paid);
      const isOpen = balance > 0;
      const isOverdue = isOpen && isPastDueDate;

      acc.totalOutstanding += balance;
      if (isOpen) acc.openInvoiceCount += 1;
      if (isOverdue) {
        acc.overdueInvoiceCount += 1;
        acc.overdueBalance += balance;
      }

      return acc;
    },
    {
      totalOutstanding: 0,
      openInvoiceCount: 0,
      overdueInvoiceCount: 0,
      overdueBalance: 0,
    },
  );

  const totalOutstanding = summary.totalOutstanding;
  const openInvoiceCount = summary.openInvoiceCount;
  const overdueInvoiceCount = summary.overdueInvoiceCount;
  const overdueBalance = summary.overdueBalance;

  const formatCurrency = (value) => currencyFormatter.format(value || 0);

  const getInvoiceTotals = (invoice) => {
    const paid = (invoice.payments || []).reduce((paymentSum, payment) => paymentSum + (payment.amount || 0), 0);
    const amount = invoice.amount || 0;
    const balance = Math.max(0, amount - paid);
    return { paid, amount, balance };
  };
  const canPrev = offset > 0;
  const canNext = invoices.length === PAGE_SIZE;

  const onSearchSubmit = (event) => {
    event.preventDefault();
    const nextSearch = searchText.trim();
    setOffset(0);
    setSearch(nextSearch);
    refetch(buildQuery({ search: nextSearch, overdueOnly, hasBalance, offset: 0 }));
  };

  const onOverdueOnlyChange = (event) => {
    const value = event.target.checked;
    setOffset(0);
    setOverdueOnly(value);
    refetch(buildQuery({ search, overdueOnly: value, hasBalance, offset: 0 }));
  };

  const onHasBalanceChange = (event) => {
    const value = event.target.checked;
    setOffset(0);
    setHasBalance(value);
    refetch(buildQuery({ search, overdueOnly, hasBalance: value, offset: 0 }));
  };

  const onPrev = () => {
    const nextOffset = Math.max(0, offset - PAGE_SIZE);
    setOffset(nextOffset);
    refetch(buildQuery({ search, overdueOnly, hasBalance, offset: nextOffset }));
  };

  const onNext = () => {
    const nextOffset = offset + PAGE_SIZE;
    setOffset(nextOffset);
    refetch(buildQuery({ search, overdueOnly, hasBalance, offset: nextOffset }));
  };

  return (
    <PageHeader title="Invoices" preTitle="Account">
      <div className="page-body">
        <div className="container-xl">
          <div className="row row-cards">
            <div className="col-12 d-none">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex flex-column flex-md-row gap-3">
                    <form className="input-group" onSubmit={onSearchSubmit}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search invoices"
                        value={searchText}
                        onChange={(event) => setSearchText(event.target.value)}
                      />
                      <button className="btn btn-primary" type="submit">
                        Search
                      </button>
                    </form>
                    <label className="form-check m-0 align-self-center">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={overdueOnly}
                        onChange={onOverdueOnlyChange}
                      />
                      <span className="form-check-label">Overdue only</span>
                    </label>
                    <label className="form-check m-0 align-self-center">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={hasBalance}
                        onChange={onHasBalanceChange}
                      />
                      <span className="form-check-label">Has balance</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                    <div>
                      <div className="text-muted">Total outstanding balance</div>
                      <div className="h2 m-0">{formatCurrency(totalOutstanding)}</div>
                    </div>
                    <div className="d-flex flex-wrap gap-3">
                      <div>
                        <div className="small text-muted">Open invoices</div>
                        <div className="fw-semibold">{openInvoiceCount}</div>
                      </div>
                      <div>
                        <div className="small text-muted">Overdue invoices</div>
                        <div className="fw-semibold">{overdueInvoiceCount}</div>
                      </div>
                      <div>
                        <div className="small text-muted">Overdue balance</div>
                        <div className="fw-semibold">{formatCurrency(overdueBalance)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Environment invoices</h3>
                </div>
                {invoices.length === 0 ? (
                  <div className="card-body">
                    <div className="empty">
                      <p className="empty-title">No invoices found</p>
                      <p className="empty-subtitle text-muted">
                        Try adjusting your filters or search text.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table table-vcenter card-table">
                        <thead>
                          <tr>
                            <th>Invoice ID</th>
                            <th>Invoice date</th>
                            <th>Due date</th>
                            <th className="text-end">Amount</th>
                            <th className="text-end">Paid</th>
                            <th className="text-end">Balance</th>
                            <th>Status</th>
                            <th className="w-1">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
	                          {invoices.map((invoice) => {
	                            const { paid, amount, balance } = getInvoiceTotals(invoice);
	                            const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
	                            const isPastDueDate = dueDate instanceof Date && !Number.isNaN(dueDate.getTime()) && dueDate < new Date();
	                            const isOverdue = balance > 0 && isPastDueDate;

                            return (
                              <tr key={invoice.id}>
                                <td>{invoice.id}</td>
                                <td>
                                  <LocalDate dateString={invoice.invoiceDate} hideTime />
                                </td>
                                <td>
                                  <LocalDate dateString={invoice.dueDate} hideTime />
                                </td>
                                <td className="text-end">{formatCurrency(amount)}</td>
                                <td className="text-end">{formatCurrency(paid)}</td>
                                <td className="text-end">{formatCurrency(balance)}</td>
                                <td>
                                  {isOverdue ? (
                                    <span className="badge bg-red-lt">Overdue</span>
                                  ) : balance > 0 ? (
                                    <span className="badge bg-yellow-lt">Open</span>
                                  ) : (
                                    <span className="badge bg-green-lt">Paid</span>
                                  )}
                                </td>
                                <td>
                                  {invoice.paymentUrl ? (
                                    <a className="btn btn-sm btn-outline-primary" href={invoice.paymentUrl} target="_blank" rel="noreferrer">
                                      Pay Invoice
                                    </a>
                                  ) : (
                                    <span className="text-muted">N/A</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="card-footer d-flex justify-content-between">
                      <button className="btn btn-outline-secondary" onClick={onPrev} disabled={!canPrev}>
                        Previous
                      </button>
                      <div className="text-muted align-self-center">
                        Showing {offset + 1} - {offset + invoices.length}
                      </div>
                      <button className="btn btn-outline-secondary" onClick={onNext} disabled={!canNext}>
                        Next
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageHeader>
  );
};

export default Invoices;
