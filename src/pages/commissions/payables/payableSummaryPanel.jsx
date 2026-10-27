import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import EmptyContent from '../../../components/emptyContent.jsx';
import LocalDate, { ToLocalDate } from '../../../util/LocalDate.jsx';
import Pagination from '../../../components/pagination.jsx';
import { CLASS_ORDER, asClass } from './batchSelection.mjs';
import { formatMoney as detailMoney } from './formatMoney.mjs';
import { getCustomerPage, getPeriodDueTotals, groupCustomerPeriods, groupCustomers } from './customerGroups.mjs';
import { merchantName } from './merchantScope.mjs';

const money = value => (value ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export const SECTION_META = {
  RELEASE: { title: 'Bonuses to Release', subtitle: 'Included in the next payout batch', badge: 'bg-green-lt text-green' },
  FORFEIT: { title: 'Bonuses to Forfeit', subtitle: 'Excluded from payout', badge: 'bg-yellow-lt text-yellow' },
  HOLD: { title: 'Bonuses on Hold', subtitle: 'Pending administrator action', badge: 'bg-secondary-lt text-secondary' },
};

function CustomerDetails({ earningsClass, customerId, payableRecords }) {
  const [expandedPeriods, setExpandedPeriods] = useState(() => new Set());
  const periods = useMemo(() => groupCustomerPeriods(payableRecords, customerId, earningsClass), [payableRecords, customerId, earningsClass]);
  const togglePeriod = id => setExpandedPeriods(previous => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  if (!periods.length) return <div className="p-3 text-muted">No payables found for this customer.</div>;
  return (
    <div className="table-responsive border rounded-2 bg-white">
      <table className="table table-vcenter mb-0">
        <thead>
          <tr>
            <th className="w-100">Period</th>
            <th className="text-end text-nowrap">Amount Due</th>
            <th className="text-end text-nowrap">Running Balance</th>
            <th className="w-1"></th>
          </tr>
        </thead>
        {periods.map(group => {
          const periodId = String(group.period.id);
          const expanded = expandedPeriods.has(periodId);
          const bonusesId = `payables_${earningsClass}_customer_${encodeURIComponent(customerId)}_period_${encodeURIComponent(periodId)}`;
          return (
            <React.Fragment key={periodId}>
              <tbody>
                <tr>
                  <td className="py-1">
                    <div className="d-flex align-items-baseline gap-3 text-nowrap">
                      <LocalDate dateString={group.period.end} hideTime />
                      <span className="small text-muted fw-normal">Starts: <LocalDate dateString={group.period.begin} hideTime /></span>
                    </div>
                  </td>
                  <td className="py-1 text-end text-nowrap">{detailMoney(group.amount - group.released)}</td>
                  <td className="py-1 text-end text-nowrap">{detailMoney(group.runningBalance)}</td>
                  <td className="py-1 text-end">
                    <button type="button" className="btn-action" style={{ width: '1.5rem', height: '1.5rem' }} onClick={() => togglePeriod(periodId)}
                      aria-expanded={expanded} aria-controls={bonusesId}
                      aria-label={`${expanded ? 'Collapse' : 'Expand'} bonuses for period ${ToLocalDate(group.period.end, true)}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                        className={`icon icon-tabler icons-tabler-outline icon-tabler-chevron-${expanded ? 'up' : 'down'}`}>
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d={expanded ? 'M6 15l6 -6l6 6' : 'M6 9l6 6l6 -6'} />
                      </svg>
                    </button>
                  </td>
                </tr>
              </tbody>
              <tbody id={bonusesId} hidden={!expanded}>
                <tr className="no-hover">
                  <td colSpan={4} className="p-3 bg-light">
                    <div className="ms-md-3 border rounded-2 bg-white table-responsive">
                      <table className="table table-sm table-vcenter mb-0">
                        <caption className="caption-top px-3 py-2 small fw-semibold">Bonuses for <LocalDate dateString={group.period.end} hideTime /></caption>
                        <thead>
                          <tr>
                            <th>Bonus</th>
                            <th className="text-end">Bonus Amount</th>
                            <th className="text-end">Released</th>
                            <th className="text-end border-start">Amount Due</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.bonuses.map(bonus => (
                            <tr key={bonus.bonusTitle}>
                              <td>{bonus.bonusTitle}</td>
                              <td className="text-end">{detailMoney(bonus.amount)}</td>
                              <td className="text-end">{detailMoney(bonus.released)}</td>
                              <td className="text-end border-start">{detailMoney(bonus.amount - bonus.released)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </tbody>
            </React.Fragment>
          );
        })}
      </table>
    </div>
  );
}
CustomerDetails.propTypes = {
  payableRecords: PropTypes.array.isRequired,
  earningsClass: PropTypes.string.isRequired,
  customerId: PropTypes.string.isRequired,
};

function SectionHeader({ date, selectedPeriodId, earningsClass, summaryRows, getSelected, setClassSelected, selectionDisabled, onView, periodFilter, onBack }) {
  const meta = SECTION_META[earningsClass];
  const totals = getPeriodDueTotals(summaryRows, selectedPeriodId);
  return (
    <div className="card-header align-items-start gap-3 flex-wrap">
      {onBack ? (
        <button type="button" className="btn-action btn-icon flex-shrink-0" onClick={onBack}
          aria-label="Back to all payables" title="Back to all payables">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="icon icon-tabler icons-tabler-outline icon-tabler-arrow-left" aria-hidden="true">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M5 12h14M5 12l6 6M5 12l6 -6" />
          </svg>
        </button>
      ) : <input type="checkbox" className="form-check-input flex-shrink-0" style={{ margin: '0.375rem 0 0' }}
        checked={getSelected(earningsClass)} disabled={selectionDisabled}
        aria-label={`Select all ${earningsClass.toLowerCase()} payables`}
        onChange={event => setClassSelected(earningsClass, event.target.checked)} />}
      <div className="flex-grow-1">
        {periodFilter == null ? (
          <h2 className="card-title mb-0"><button type="button" className="btn-link text-reset p-0 text-start" onClick={() => onView('all')}>
            <span className="fw-semibold">{meta.title}</span><span className={`badge ms-2 ${meta.badge}`}>{earningsClass}</span>
          </button></h2>
        ) : <h2 className="card-title mb-0">{meta.title}<span className={`badge ms-2 ${meta.badge}`}>{earningsClass}</span></h2>}
        <div className="text-muted small">{meta.subtitle}</div>
      </div>
      <div className="d-flex flex-wrap align-items-start gap-4 ms-auto" aria-label="Filter customers by period">
        {[
          { filter: 'selected', label: <LocalDate dateString={date} hideTime />, amount: totals.selectedPeriod },
          { filter: 'other', label: 'Previous periods', amount: totals.otherPeriods },
          { filter: 'all', label: 'Total', amount: totals.total },
        ].map(item => (
          <button key={item.filter} type="button" className={`btn text-start d-block ${periodFilter === item.filter ? 'btn-primary' : 'text-reset'}`} style={{ textDecoration: 'none' }}
            aria-pressed={periodFilter == null ? undefined : periodFilter === item.filter} onClick={() => onView(item.filter)}>
            <span className={`subheader d-block mb-1 ${periodFilter === item.filter ? 'text-reset' : ''}`}>{item.label}</span>
            <span className={`h3 d-block mb-0 text-nowrap ${item.filter === 'all' ? 'fw-bold' : 'fw-normal'}`}>{money(item.amount)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
SectionHeader.propTypes = {
  date: PropTypes.string.isRequired,
  selectedPeriodId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  earningsClass: PropTypes.string.isRequired,
  summaryRows: PropTypes.array.isRequired,
  getSelected: PropTypes.func.isRequired,
  setClassSelected: PropTypes.func.isRequired,
  selectionDisabled: PropTypes.bool,
  onView: PropTypes.func.isRequired,
  onBack: PropTypes.func,
  periodFilter: PropTypes.string,
};

const periodSortColumn = filter => filter === 'selected' ? 'selectedPeriodDue' : filter === 'other' ? 'otherPeriodsDue' : 'due';

function SortableHeader({ column, sort, onSort, children, className = '' }) {
  const active = sort.column === column;
  return (
    <th scope="col" className={className} aria-sort={active ? (sort.direction === 'desc' ? 'descending' : 'ascending') : 'none'}>
      <button type="button" className={`btn-link text-reset p-0 d-inline-flex align-items-center gap-1 ${active ? 'fw-bold' : ''}`}
        onClick={() => onSort(column)}>
        {children}
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0">
          {active ? <path d={sort.direction === 'desc' ? 'M6 9l6 6l6 -6' : 'M6 15l6 -6l6 6'} /> : <path d="M8 9l4 -4l4 4M8 15l4 4l4 -4" />}
        </svg>
      </button>
    </th>
  );
}
SortableHeader.propTypes = {
  column: PropTypes.string.isRequired,
  sort: PropTypes.shape({ column: PropTypes.string.isRequired, direction: PropTypes.string.isRequired }).isRequired,
  onSort: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

function CustomerSection({ date, selectedPeriodId, earningsClass, summaryRows, getSelected, setClassSelected, selectionDisabled, handleViewCustomer, search, periodFilter, onSectionChange, onFilterChange, payableRecords }) {
  const [expandedCustomers, setExpandedCustomers] = useState(() => new Set());
  const [page, setPage] = useState({ offset: 0, count: 25 });
  const [sort, setSort] = useState(() => ({ column: periodSortColumn(periodFilter), direction: 'desc' }));
  const rows = useMemo(() => payableRecords.filter(row => asClass(row.earningsClass) === earningsClass), [payableRecords, earningsClass]);
  const customers = useMemo(() => groupCustomers(rows, selectedPeriodId), [rows, selectedPeriodId]);
  useEffect(() => { setPage(previous => ({ ...previous, offset: 0 })); }, [search, sort, periodFilter]);
  const result = useMemo(() => getCustomerPage(customers, {
    ...page, search, periodFilter, sortBy: sort.column,
    sort: `${sort.column === 'name' ? 'name' : 'due'}-${sort.direction}`,
  }), [customers, page, search, sort, periodFilter]);
  const sectionId = `payables_${earningsClass}`;

  const toggleCustomer = id => setExpandedCustomers(previous => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  const handleSort = column => setSort(previous => ({
    column,
    direction: previous.column === column ? (previous.direction === 'desc' ? 'asc' : 'desc') : (column === 'name' ? 'asc' : 'desc'),
  }));
  const handleFilterChange = filter => {
    setSort({ column: periodSortColumn(filter), direction: 'desc' });
    onFilterChange(filter);
  };


  return (
    <>
      <div className="card mb-3">
        <SectionHeader date={date} selectedPeriodId={selectedPeriodId} earningsClass={earningsClass} summaryRows={summaryRows}
          getSelected={getSelected} setClassSelected={setClassSelected} selectionDisabled={selectionDisabled}
          periodFilter={periodFilter} onView={handleFilterChange} onBack={() => onSectionChange(null)} />
        <div className="card-body py-2 text-muted small">
          Search and period filters affect this list.
        </div>
        <div id={sectionId}>
            <>
              {!result.total ? (
                <div className="card-body"><EmptyContent title="No customers found" text="No customers match this search and period filter." /></div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="table card-table table-vcenter mb-0">
                      <thead><tr>
                        <SortableHeader column="name" sort={sort} onSort={handleSort}>Customer</SortableHeader>
                        <th>Customer ID</th><th className="d-none d-md-table-cell">Status</th>
                        <th>Merchant</th>
                        <SortableHeader column="selectedPeriodDue" sort={sort} onSort={handleSort} className="text-end text-nowrap"><LocalDate dateString={date} hideTime /></SortableHeader>
                        <SortableHeader column="otherPeriodsDue" sort={sort} onSort={handleSort} className="text-end text-nowrap">Previous periods</SortableHeader>
                        <SortableHeader column="due" sort={sort} onSort={handleSort} className="text-end text-nowrap">Total</SortableHeader>
                        <th className="w-1"></th></tr></thead>
                      <tbody>
                        {result.rows.map(row => {
                          const expanded = expandedCustomers.has(row.id);
                          const detailsId = `${sectionId}_customer_${encodeURIComponent(row.id)}`;
                          return (
                            <React.Fragment key={row.id}>
                              <tr className={expanded ? 'bg-light' : ''}>
                                <td>
                                  <button type="button" className="btn-link text-reset p-0 fw-semibold" onClick={() => handleViewCustomer?.(row.id)}>
                                    {row.customer.fullName || row.id}
                                  </button>
                                  {row.customer.webAlias && <div className="small text-muted">{row.customer.webAlias}</div>}
                                </td>
                                <td>{row.id}</td>
                                <td className="d-none d-md-table-cell">{row.customer.status?.name}</td>
                                <td>{merchantName(row.customer.moneyOutMerchant)}</td>
                                <td className={`text-end text-nowrap ${periodFilter === 'selected' ? 'fw-bold' : ''}`}>{money(row.selectedPeriodDue)}</td>
                                <td className={`text-end text-nowrap ${periodFilter === 'other' ? 'fw-bold' : ''}`}>{money(row.otherPeriodsDue)}</td>
                                <td className={`text-end text-nowrap ${periodFilter === 'all' ? 'fw-bold' : ''}`}>{money(row.due)}</td>
                                <td className="text-end">
                                  <button type="button" className="btn-action btn-icon" onClick={() => toggleCustomer(row.id)}
                                    aria-expanded={expanded} aria-controls={detailsId} aria-label={`${expanded ? 'Collapse' : 'Expand'} payables for ${row.customer.fullName || row.id}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                                      className={`icon icon-tabler icons-tabler-outline icon-tabler-chevron-${expanded ? 'up' : 'down'}`}>
                                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                      <path d={expanded ? 'M6 15l6 -6l6 6' : 'M6 9l6 6l6 -6'} />
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                              {expanded && <tr className="no-hover"><td colSpan={8} className="p-3"><div id={detailsId}>
                                <CustomerDetails earningsClass={earningsClass} customerId={row.id} payableRecords={rows} />
                              </div></td></tr>}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="card-footer d-flex align-items-center">
                    <Pagination variables={{ ...page, offset: result.offset }} total={result.total}
                      refetch={next => setPage(previous => ({ ...previous, offset: next.offset }))} />
                  </div>
                </>
              )}
            </>
        </div>
      </div>
    </>
  );
}

CustomerSection.propTypes = {
  payableRecords: PropTypes.array.isRequired,
  date: PropTypes.string.isRequired,
  selectedPeriodId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  earningsClass: PropTypes.string.isRequired,
  summaryRows: PropTypes.array.isRequired,
  getSelected: PropTypes.func.isRequired,
  setClassSelected: PropTypes.func.isRequired,
  selectionDisabled: PropTypes.bool,
  handleViewCustomer: PropTypes.func,
  search: PropTypes.string.isRequired,
  periodFilter: PropTypes.oneOf(['all', 'selected', 'other']).isRequired,
  onSectionChange: PropTypes.func.isRequired,
  onFilterChange: PropTypes.func.isRequired,
};

const PayableSummaryPanel = ({ date, summaryRows, activeSection, onSectionChange, ...props }) => {
  if (!summaryRows.length) return <div className="card-body"><EmptyContent title="No payables found" text="Try choosing a different period or including more bonuses." /></div>;
  if (activeSection) {
    return <CustomerSection key={activeSection} date={date} earningsClass={activeSection}
      summaryRows={summaryRows.filter(row => asClass(row.earningsClass) === activeSection)}
      onSectionChange={onSectionChange} {...props} />;
  }
  return (
    <div>
      {CLASS_ORDER.map(earningsClass => {
        const rows = summaryRows.filter(row => asClass(row.earningsClass) === earningsClass);
        return rows.length ? (
          <div className="card mb-3" key={earningsClass}>
            <SectionHeader date={date} earningsClass={earningsClass} summaryRows={rows}
              selectedPeriodId={props.selectedPeriodId} getSelected={props.getSelected} setClassSelected={props.setClassSelected}
              selectionDisabled={props.selectionDisabled} onView={filter => onSectionChange(earningsClass, filter)} />
          </div>
        ) : null;
      })}
    </div>
  );
};

PayableSummaryPanel.propTypes = {
  payableRecords: PropTypes.array.isRequired,
  date: PropTypes.string.isRequired,
  selectedPeriodId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  summaryRows: PropTypes.array.isRequired,
  getSelected: PropTypes.func.isRequired,
  setClassSelected: PropTypes.func.isRequired,
  selectionDisabled: PropTypes.bool,
  handleViewCustomer: PropTypes.func,
  activeSection: PropTypes.oneOf(CLASS_ORDER),
  search: PropTypes.string.isRequired,
  periodFilter: PropTypes.oneOf(['all', 'selected', 'other']).isRequired,
  onSectionChange: PropTypes.func.isRequired,
  onFilterChange: PropTypes.func.isRequired,
};

export default PayableSummaryPanel;
