import React, { useMemo, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useQuery, gql } from "@apollo/client";
import DataLoading from "../../../components/dataLoading.jsx";
import DataError from '../../../components/dataError.jsx';
import EmptyContent from '../../../components/emptyContent.jsx';
import Avatar from '../../../components/avatar.jsx';
import LocalDate from "../../../util/LocalDate.jsx";
import CheckBox from '../../../components/checkbox.jsx';
import Modal from '../../../components/modal.jsx';
import { SendRequest } from "../../../hooks/usePost.js";

const GET_CUSTOMER = gql`query ($nodeId: String, $date: Date) {
  customers (idList: [$nodeId]) {
    id
    fullName
    webAlias
    profileImage
    status {
      id
      name
      statusClass
      earningsClass
      customData
    }
    customerType {
      id
      name
    }
  }
  unreleased(date: $date, nodeIds: [$nodeId], offset: 0, first: 10000) {
    bonusId
    nodeId
    amount
    bonusTitle
    level
    released
    commissionDate
    period {
      id
      begin
      end
    }
  }
  customerStatuses {
    id
    name
    statusClass
    earningsClass
  }
}`;

const asClass = (v) => String(v ?? '').toUpperCase();
const normalizeBonus = (v) => String(v ?? '').trim().toLowerCase();

const toBonusKey = (earningsClass, periodId, bonusTitle) =>
  `${asClass(earningsClass)}_${String(periodId)}_${normalizeBonus(bonusTitle)}`;

const formatMoney = (v) =>
  (v ?? 0).toLocaleString("en-US", { style: 'currency', currency: 'USD' });

const TriStateCheckBox = ({ checked, indeterminate, disabled, onChange, ariaLabel }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);

  return (
    <label className="form-check m-0">
      <input
        ref={ref}
        className="form-check-input"
        type="checkbox"
        checked={!!checked}
        disabled={!!disabled}
        onChange={(e) => onChange(e.target.checked)}
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

const CustomerPayablePanel2 = ({
  date,
  customerId,

  summaryRows,
  setLeafDue,
  bonusDetails,
  getSelected,
  setLeafSelected
}) => {
  const [show, setShow] = useState(false);
  const [statusUpdatedId, setStatusUpdatedId] = useState();
  const [customer, setCustomer] = useState();

  // view model in this panel: periods -> items (bonus rows)
  const [periods, setPeriods] = useState([]);

  const { loading, error, data, refetch } = useQuery(GET_CUSTOMER, {
    variables: { date: date, nodeId: customerId },
    fetchPolicy: "no-cache"
  });

  // Build the customer panel view model WITHOUT resetting selection
  useEffect(() => {
    if (!data?.customers?.length) return;

    const c = data.customers[0];
    setCustomer(c);
    setStatusUpdatedId(c.status?.id);

    const raw = data.unreleased ?? [];

    // Group by period first
    const byPeriod = raw.reduce((acc, item) => {
      const pid = item.period?.id;
      if (!pid) return acc;

      if (!acc[pid]) {
        acc[pid] = {
          period: item.period,
          items: {}
        };
      }

      const key = normalizeBonus(item.bonusTitle);
      if (!acc[pid].items[key]) {
        acc[pid].items[key] = {
          bonusTitle: item.bonusTitle,
          earningsClass: c.status?.earningsClass,
          period: item.period,
          amount: 0,
          released: 0,
          level: item.level,
        };
      }

      acc[pid].items[key].amount += item.amount ?? 0;
      acc[pid].items[key].released += item.released ?? 0;

      return acc;
    }, {});

    const periodList = Object.values(byPeriod)
      .map(p => {
        const items = Object.values(p.items).map(row => ({
          ...row,
          id: `${p.period.id}_${normalizeBonus(row.bonusTitle)}`,
        }))
          .sort((a, b) => String(a.bonusTitle ?? "").localeCompare(String(b.bonusTitle ?? "")));

        return {
          period: p.period,
          items,
        };
      })
      .sort((a, b) => new Date(a.period?.end) - new Date(b.period?.end));

    setPeriods(periodList);
  }, [data, customerId, bonusDetails, summaryRows]); // depend on lifted selection state so UI updates correctly

  const setPeriodSelectedLocal = (periodId, checked) => {
    const p = periods.find(x => x.period?.id === periodId);
    if (!p) return;

    for (const it of p.items) {
      const due = (it.amount ?? 0) - (it.released ?? 0);
      setLeafDue(it.earningsClass, periodId, it.bonusTitle, customerId, due);
      setLeafSelected(it.earningsClass, periodId, it.bonusTitle, customerId, checked);
    }
  };

  const setAllSelectedLocal = (checked) => {
    for (const p of periods) {
      const periodId = p.period?.id;
      if (!periodId) continue;

      for (const it of p.items) {
        const due = (it.amount ?? 0) - (it.released ?? 0);
        setLeafDue(it.earningsClass, periodId, it.bonusTitle, customerId, due);
        setLeafSelected(it.earningsClass, periodId, it.bonusTitle, customerId, checked);
      }
    }
  };

  const isHold = asClass(customer?.status?.earningsClass) === 'HOLD';

  const customerTotals = useMemo(() => {
    let totalDue = 0;
    let totalSelected = 0;

    for (const p of periods ?? []) {
      const periodId = p.period?.id;
      if (!periodId) continue;

      for (const it of p.items ?? []) {
        const due = (it.amount ?? 0) - (it.released ?? 0);
        totalDue += due;

        if (getSelected(it.earningsClass, periodId, it.bonusTitle, customerId)) {
          totalSelected += due;
        }
      }
    }

    return { totalDue, totalSelected };
  }, [periods, getSelected, customerId]);

  const allBonusRows = useMemo(() => {
    const rows = [];
    for (const p of periods ?? []) {
      const periodId = p.period?.id;
      if (!periodId) continue;
      for (const it of p.items ?? []) {
        rows.push({ it, periodId });
      }
    }
    return rows;
  }, [periods]);

  const customerSel = useMemo(() => {
    return getSelectionState(
      allBonusRows.map(({ it, periodId }) => ({
        selected: getSelected(it.earningsClass, periodId, it.bonusTitle, customerId),
      }))
    );
  }, [allBonusRows, getSelected, customerId]);

  const handleHide = () => setShow(false);
  const handleShow = () => setShow(true);

  const UpdateStatus = (e) => {
    e.preventDefault();
    const now = new Date();

    const source = {
      nodeId: customerId,
      sourceGroupId: "Status",
      date: now.toISOString(),
      value: statusUpdatedId,
      externalId: now.toISOString()
    };

    SendRequest("POST", "/api/v1/Sources", source, () => {
      refetch();
    }, (err) => {
      alert(err);
    });
  };

  if (error) return <DataError error={error} />;
  if (loading || !customer) return <DataLoading />;

  const statusClass = customer.status?.earningsClass === 'HOLD'
    ? 'orange'
    : customer.status?.earningsClass === 'FORFEIT'
      ? 'red'
      : 'green';

  return (
    <>
      <div className="card-body pe-1">
        <div className="row w-100 g-2 align-items-center">
          <div className="col-auto me-2">
            <Avatar name={customer.fullName} url={customer.profileImage} size="tt" />
          </div>
          <div className="col">
            <h4 className="card-title m-0">
              <span>{customer.fullName}</span>
            </h4>
            <div className="text-muted">{customer.webAlias}</div>
          </div>
          <div className="col-auto">
            <span className={`status status-${statusClass}`}>
              <span className="status-dot"></span> {customer.status?.earningsClass}
            </span>
          </div>
          <div className="col-auto">
            <button className="btn btn-ghost-secondary btn-icon" onClick={handleShow}>
              <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                <path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path>
                <path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path>
                <path d="M16 5l3 3"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {(!periods || periods.length === 0) && (
        <div className="card-body">
          <EmptyContent title='No payables found' text="Try adjusting your search or filter to find what you're looking for." />
        </div>
      )}

      {periods && periods.length > 0 && (
        <>
          <div className="card-body pt-2 pb-3 border-bottom">
            <div className="d-flex justify-content-end gap-4">
              <div className="text-end">
                <div className="subheader">Total due</div>
                <div className="fw-semibold">
                  {formatMoney(customerTotals.totalDue)}
                </div>
              </div>
              <div className="text-end">
                <div className="subheader">Selected</div>
                <div className="fw-semibold">
                  {formatMoney(customerTotals.totalSelected)}
                </div>
              </div>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table card-table table-vcenter text-nowrap datatable">
              <thead>
                <tr>
                  <th className="w-1">
                    <TriStateCheckBox
                      checked={customerSel.all}
                      indeterminate={customerSel.some}
                      disabled={isHold || allBonusRows.length === 0}
                      onChange={(checked) => setAllSelectedLocal(checked)}
                      ariaLabel="Select/unselect all payables for this customer"
                    />
                  </th>
                  <th colSpan={4} className="fw-semibold">
                    Select all / none (this customer)
                  </th>
                </tr>

                <tr>
                  <th className="w-1"></th>
                  <th>Bonus</th>
                  <th className="text-end">Bonus Amount</th>
                  <th className="text-end">Released</th>
                  <th className="border-start text-end">Amount Due</th>
                </tr>
              </thead>

              <tbody>
                {periods.map((p) => {
                  const periodId = p.period?.id;

                  const periodSel = getSelectionState(
                    p.items.map((it) => ({
                      selected: getSelected(it.earningsClass, periodId, it.bonusTitle, customerId),
                    }))
                  );

                  const totalAmount = p.items.reduce((t, x) => t + (x.amount ?? 0), 0);
                  const totalReleased = p.items.reduce((t, x) => t + (x.released ?? 0), 0);
                  const totalDue = totalAmount - totalReleased;

                  return (
                    <React.Fragment key={periodId}>
                      {/* Period group header row */}
                      <tr className="bg-light">
                        <td className="w-1 align-top">
                          <TriStateCheckBox
                            checked={periodSel.all}
                            indeterminate={periodSel.some}
                            disabled={isHold}
                            onChange={(checked) => setPeriodSelectedLocal(periodId, checked)}
                            ariaLabel="Select/unselect all bonuses in this period"
                          />
                        </td>

                        <td className="fw-semibold">
                          <LocalDate dateString={p.period?.end} />
                          <div className="small text-muted">
                            Starts: <LocalDate dateString={p.period?.begin} />
                          </div>
                        </td>

                        <td className="text-end fw-semibold">
                          {formatMoney(totalAmount)}
                        </td>

                        <td className="text-end fw-semibold">
                          {formatMoney(totalReleased)}
                        </td>

                        <td className="border-start text-end fw-semibold">
                          {formatMoney(totalDue)}
                        </td>
                      </tr>

                      {/* Bonus rows (indented so hierarchy is obvious) */}
                      {p.items.map((it) => {
                        const due = (it.amount ?? 0) - (it.released ?? 0);
                        const selected = getSelected(it.earningsClass, periodId, it.bonusTitle, customerId);

                        return (
                          <tr key={it.id}>
                            <td colSpan={2}>
                              <div className="d-flex align-items-center gap-2 ps-3">
                                <CheckBox
                                  name={it.id}
                                  disabled={isHold}
                                  value={selected}
                                  onChange={(name, value) => {
                                    setLeafDue(it.earningsClass, periodId, it.bonusTitle, customerId, due);
                                    setLeafSelected(it.earningsClass, periodId, it.bonusTitle, customerId, value);
                                  }}
                                />
                                <span className="ps-3">{it.bonusTitle}</span>
                              </div>
                            </td>

                            <td className="text-end">{formatMoney(it.amount)}</td>
                            <td className="text-end">{formatMoney(it.released)}</td>
                            <td className="border-start text-end strong">{formatMoney(due)}</td>
                          </tr>
                        );
                      })}

                      {/* spacing between periods */}
                      <tr className="period-separator">
                        <td colSpan={5}></td>
                      </tr>

                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal showModal={show} onHide={handleHide}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Change Status</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>

          <div className="modal-body">
            <div className="form-selectgroup form-selectgroup-boxes d-flex flex-column">
              {data?.customerStatuses && [...data.customerStatuses].sort((a, b) =>
                a.statusClass.localeCompare(b.statusClass) || a.name.localeCompare(b.name)
              ).map((status) => {
                return (
                  <label key={status.id} className="form-selectgroup-item flex-fill">
                    <input
                      type="radio"
                      className="form-selectgroup-input"
                      name="statusSelect"
                      value={status.id}
                      checked={statusUpdatedId === status.id}
                      onChange={e => setStatusUpdatedId(e.target.value)}
                    />
                    <div className="form-selectgroup-label d-flex align-items-center p-3">
                      <div className="me-3">
                        <span className="form-selectgroup-check"></span>
                      </div>
                      <div className="me-auto">{status.name}</div>
                      <div className="">{status.earningsClass}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="modal-footer">
            <a href="#" className="btn btn-link link-secondary me-auto" data-bs-dismiss="modal">
              Cancel
            </a>
            <button type="submit" className="btn btn-primary" data-bs-dismiss="modal" onClick={UpdateStatus}>
              Update Status
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default CustomerPayablePanel2;

CustomerPayablePanel2.propTypes = {
  date: PropTypes.string.isRequired,
  customerId: PropTypes.string.isRequired,

  setLeafDue: PropTypes.func.isRequired,
  summaryRows: PropTypes.array.isRequired,
  bonusDetails: PropTypes.object.isRequired,

  getSelected: PropTypes.func.isRequired,
  setLeafSelected: PropTypes.func.isRequired,
};
