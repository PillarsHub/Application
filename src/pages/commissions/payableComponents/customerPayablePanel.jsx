import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useQuery, gql } from "@apollo/client";
import { SendRequest } from "../../../hooks/usePost.js";
import DataLoading from "../../../components/dataLoading.jsx";
import DataError from '../../../components/dataError.jsx';
import EmptyContent from '../../../components/emptyContent.jsx';
import Avatar from '../../../components/avatar.jsx';
import LocalDate from "../../../util/LocalDate.jsx";
import CheckBox from '../../../components/checkbox.jsx';
import Modal from '../../../components/modal.jsx';

var GET_CUSTOMER = gql`query ($nodeId: String, $date: Date) {
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
  unreleased(date: $date, nodeIds: [$nodeId], offset: 0, first: 100) {
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

const CustomerPayablePanel = ({ date, customerId, setCurrentBatch }) => {
  const [show, setShow] = useState();
  const [statusUpdatedId, setStatusUpdatedId] = useState();
  const [payables, setPayables] = useState();
  const [customer, setCustomer] = useState();
  const { loading, error, data, refetch } = useQuery(GET_CUSTOMER, {
    variables: { date: date, nodeId: customerId },
    fetchPolicy: "no-cache" 
  });
  console.log("CP " + date);

  useEffect(() => {
    if (data) {
      setStatusUpdatedId(data.customers[0].status.id);
      setCustomer(data.customers[0]);
      const groupedData = data.unreleased.reduce((acc, current) => {
        const bonusTitle = current.bonusTitle;

        if (!acc[bonusTitle]) {
          acc[bonusTitle] = {
            ...current,
            amount: 0,
            released: 0,
            children: []
          };
        }

        acc[bonusTitle].amount += current.amount;
        acc[bonusTitle].released += current.released;
        acc[bonusTitle].children.push(current);

        return acc;
      }, {});

      const groupedPayables = Object.values(groupedData).map((s) => ({
        ...s,
        id: s.bonusId + '_' + s.period.id,
        selected: data.customers[0].status.earningsClass.toLowerCase() !== 'hold'
      }));

      setPayables(groupedPayables.sort((a, b) => a.bonusId.localeCompare(b.bonusId)));

    }
  }, [data])

  useEffect(() => {
    if (payables) {
      var total = payables.filter(x => x.selected).reduce((t, x) => t + (x.amount - x.released), 0)

      setCurrentBatch({
        cutoffDate: date,
        bonusGroups: payables.filter(x => x.selected).map(x => ({ bonusTitle: x.bonusTitle, earningsClass: customer.status.earningsClass })),
        nodeIds: [customerId],
        total: customer.status.earningsClass == 'RELEASE' ? total : 0,
        forfeitTotal: customer.status.earningsClass == 'FORFEIT' ? total : 0,
        totalCustomers: 1,
      });
    }
  }, [payables])

  if (error) return <DataError error={error} />
  if (loading || !customer) return <DataLoading />;

  const handleHide = () => setShow(false);
  const handleShow = () => setShow(true);

  const updateSelected = (name, value) => {
    setPayables(v => {
      return v.map(p => p.id === name ? { ...p, selected: value } : p);
    });
  }

  const UpdateStatus = (e) => {
    e.preventDefault();
    const now = new Date();

    var source = {
      nodeId: customerId,
      sourceGroupId: "Status",
      date: now.toISOString(),
      value: statusUpdatedId,
      externalId: now.toISOString()
    };

    SendRequest("POST", "/api/v1/Sources", source, () => {
      refetch();
    }, (error) => {
      alert(error);
    });
  }

  const statusClass = customer.status.earningsClass == 'HOLD' ? 'orange' : customer.status.earningsClass == 'FORFEIT' ? 'red' : 'green';

  return <>
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
            <span className="status-dot"></span> {customer.status.earningsClass}
          </span>
        </div>
        <div className="col-auto">
          <button className="btn btn-ghost-secondary btn-icon" onClick={handleShow}>
            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
          </button>
        </div>
      </div>
    </div>
    {(!payables || payables.length == 0) && <>
      <div className="card-body">
        <EmptyContent title='No payables found' text="Try adjusting your search or filter to find what you're looking for." />
      </div>
    </>}

    {payables && payables.length > 0 && <>
      <div className="table-responsive">
        <table className="table card-table table-vcenter text-nowrap datatable">
          <thead>
            <tr>
              <th className="w-1"></th>
              <th className="w-10">Bonus</th>
              <th className="d-none d-sm-table-cell w-4">Level</th>
              <th className="d-none d-sm-table-cell text-end w-4">Bonus Amount</th>
              <th className="d-none d-sm-table-cell text-end w-4">Released</th>
              <th className="border-start text-center w-3">Amount Due</th>
            </tr>
          </thead>
          <tbody>
            {payables && payables.map((payable) => {
              return <React.Fragment key={payable.id}>
                <tr className="bg-light">
                  <td className="w-1">
                    <CheckBox name={payable.id} value={payable.selected} disabled={customer.status.earningsClass.toLowerCase() === 'hold'} onChange={updateSelected} />
                  </td>
                  <td className="fw-bold" colSpan={2}>
                    {payable.bonusTitle}
                  </td>
                  <td className="d-none d-sm-table-cell text-end">
                    {payable.amount.toLocaleString("en-US", { style: 'currency', currency: 'USD' })}
                  </td>
                  <td className="d-none d-sm-table-cell text-end">
                    {payable.released.toLocaleString("en-US", { style: 'currency', currency: 'USD' })}
                  </td>
                  <td className="border-start text-end strong">
                    {(payable.amount - payable.released).toLocaleString("en-US", { style: 'currency', currency: 'USD' })}
                  </td>
                </tr>
                {payable.children && payable.children.map((child) => {
                  return <tr key={`${payable.id}_${child.period.id}`}>
                    <td colSpan={2}>
                    <LocalDate dateString={child.commissionDate} hideTime={true} />
                    </td>
                    <td className="d-none d-sm-table-cell text-start">
                      {child.level}
                    </td>
                    <td className="d-none d-sm-table-cell text-end">
                      {child.amount.toLocaleString("en-US", { style: 'currency', currency: 'USD' })}
                    </td>
                    <td className="d-none d-sm-table-cell text-end">
                      {child.released.toLocaleString("en-US", { style: 'currency', currency: 'USD' })}
                    </td>
                    <td className="border-start text-end">
                      {(child.amount - child.released).toLocaleString("en-US", { style: 'currency', currency: 'USD' })}
                    </td>
                  </tr>
                })}
              </React.Fragment>
            })}
          </tbody>
        </table>
      </div>
    </>}

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
              let earningsClass = status.earningsClass == 'HOLD' ? 'orange' : status.earningsClass == 'FORFEIT' ? 'red' : 'green';
              let statusClass = status.statusClass == 'INACTIVE' ? 'orange' : status.statusClass == 'DELETED' ? 'red' : 'green';
              return <label key={status.id} className="form-selectgroup-item flex-fill">
                <input type="radio" className="form-selectgroup-input" name="statusSelect" value={status.id} checked={statusUpdatedId === status.id} onChange={e => setStatusUpdatedId(e.target.value)} />
                <div className="form-selectgroup-label d-flex align-items-center p-3">
                  <div className="me-3">
                    <span className="form-selectgroup-check"></span>
                  </div>
                  <div className="me-auto">
                    <span className={`status status-${statusClass} status-lite`}>
                      <span className="status-dot"></span>
                      {status.name}
                    </span>
                  </div>
                  <div className="">
                    <span className={`status status-${earningsClass}`}>
                      <span className="status-dot"></span> {status.earningsClass}
                    </span>

                  </div>
                </div>
              </label>
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
    </Modal >
  </>
}

export default CustomerPayablePanel;

CustomerPayablePanel.propTypes = {
  date: PropTypes.string.isRequired,
  customerId: PropTypes.string.isRequired,
  setCurrentBatch: PropTypes.func.isRequired
}
