import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { gql } from "@apollo/client";
import DataLoading from "../../../components/dataLoading.jsx";
import DataError from '../../../components/dataError.jsx';
import EmptyContent from '../../../components/emptyContent.jsx';
import Avatar from '../../../components/avatar.jsx';
import LocalDate from "../../../util/LocalDate.jsx";
import Modal from '../../../components/modal.jsx';
import { SendRequest } from "../../../hooks/usePost.js";

export const GET_CUSTOMER = gql`query ($nodeId: String, $date: Date) {
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
    earningsClass
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

const formatMoney = (v) =>
  (v ?? 0).toLocaleString("en-US", { style: 'currency', currency: 'USD' });

const CustomerPayablePanel3 = ({ customerId, data, loading, error, getSelected, onStatusChanged }) => {
  const [show, setShow] = useState(false);
  const [statusUpdatedId, setStatusUpdatedId] = useState();
  const [customer, setCustomer] = useState();

  // view model in this panel: periods -> items (bonus rows)
  const [periods, setPeriods] = useState([]);

  // Customer detail remains read-only for batch selection.
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

      const itemEarningsClass = asClass(item.earningsClass);
      const key = `${normalizeBonus(item.bonusTitle)}|${itemEarningsClass}`;
      if (!acc[pid].items[key]) {
        acc[pid].items[key] = {
          bonusTitle: item.bonusTitle,
          earningsClass: itemEarningsClass,
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
          id: `${p.period.id}_${normalizeBonus(row.bonusTitle)}_${asClass(row.earningsClass)}`,
        }))
          .sort((a, b) => String(a.bonusTitle ?? "").localeCompare(String(b.bonusTitle ?? "")));

        return {
          period: p.period,
          items,
        };
      })
      .sort((a, b) => new Date(b.period?.end) - new Date(a.period?.end));

    setPeriods(periodList);
  }, [data, customerId]);

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
      onStatusChanged?.();
      setShow(false);
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
                  <th>Bonus</th>
                  <th className="text-end">Bonus Amount</th>
                  <th className="text-end">Released</th>
                  <th className="border-start text-end">Amount Due</th>
                </tr>
              </thead>

              <tbody>
                {periods.map((p) => {
                  const periodId = p.period?.id;

                  const totalAmount = p.items.reduce((t, x) => t + (x.amount ?? 0), 0);
                  const totalReleased = p.items.reduce((t, x) => t + (x.released ?? 0), 0);
                  const totalDue = totalAmount - totalReleased;

                  return (
                    <React.Fragment key={periodId}>
                      {/* Period group header row */}
                      <tr className="bg-light">

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

                        return (
                          <tr key={it.id}>
                            <td>
                              <div className="d-flex align-items-center gap-2 ps-3">
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
                        <td colSpan={4}></td>
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

export default CustomerPayablePanel3;

CustomerPayablePanel3.propTypes = {
  customerId: PropTypes.string.isRequired,
  data: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.object,
  getSelected: PropTypes.func.isRequired,
  onStatusChanged: PropTypes.func,
};
