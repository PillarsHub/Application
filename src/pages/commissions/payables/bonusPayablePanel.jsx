import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useQuery, gql } from "@apollo/client";
import DataLoading from "../../../components/dataLoading.jsx";
import DataError from '../../../components/dataError.jsx';
import Pagination from '../../../components/pagination.jsx';
import CheckBox from '../../../components/checkbox.jsx';

var GET_BONUSES = gql`query ($date: Date, $bonusTitle: String, $earningsClass: EarningsClass) {
  unreleased(date: $date, bonusTitle: $bonusTitle, earningsClass: $earningsClass, offset: 0, first: 10000) {
    amount
    bonusTitle
    released
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
}`;

const BonusPayablePanel = ({ date, currentBonus, setCurrentBatch, handleViewCustomer, handleViewBonus, pageVariables, setPageVariables }) => {
  const [payables, setPayables] = useState();
  const { loading, error, data } = useQuery(GET_BONUSES, {
    variables: { date: date, bonusTitle: currentBonus.bonus, earningsClass: currentBonus.earningsClass }
  });
  console.log("BP " + date);


  useEffect(() => {
    if (data) {
      const groupedData = data.unreleased.reduce((acc, current) => {
        const customerId = current.customer?.id;

        if (!acc[customerId]) {
          acc[customerId] = {
            ...current,
            amount: 0,
            released: 0
          };
        }

        acc[customerId].amount += current.amount;
        acc[customerId].released += current.released;

        return acc;
      }, {});

      const groupedPayables = Object.values(groupedData).map((s) => ({
        ...s,
        id: s.bonusTitle + '_' + s.customer?.id + '_' + s.level,
        selected: currentBonus.earningsClass.toLowerCase() !== 'hold',
        earningsClass: currentBonus.earningsClass
      })).sort((a, b) => a.customer?.fullName.localeCompare(b.customer?.fullName));

      setPayables(groupedPayables);
    }
  }, [data])

  useEffect(() => {
    if (payables) {
      setCurrentBatch({
        cutoffDate: date,
        bonusGroups: [{ bonusTitle: currentBonus.bonus, earningsClass: currentBonus.earningsClass }],
        nodeIds: payables.filter(x => x.selected).map(x => (x.customer?.id)),
        total: payables.filter(x => x.selected && x.earningsClass == 'RELEASE').reduce((t, x) => t + (x.amount - x.released), 0),
        forfeitTotal: payables.filter(x => x.selected && x.earningsClass == 'FORFEIT').reduce((t, x) => t + (x.amount - x.released), 0),
        totalCustomers: payables.filter(x => x.selected && x.earningsClass !== 'HOLD').reduce((t) => t + 1, 0),
      });
    }
  }, [payables])

  if (error) return <DataError error={error} />
  if (loading) return <DataLoading />;

  const setPage = (page) => {
    setPageVariables({ offset: page.offset, count: 10 });
  }

  const updateSelected = (name, value) => {
    setPayables(v => {
      return v.map(p => p.id === name ? { ...p, selected: value } : p);
    });
  }

  const earningsColor = (earningsClass) => {
    return earningsClass == 'HOLD' ? 'orange' : earningsClass == 'FORFEIT' ? 'red' : 'green';
  }

  const statusColor = (statusClass) => {
    return statusClass == 'INACTIVE' ? 'orange' : statusClass == 'DELETED' ? 'red' : 'green';
  }

  return <>
    <div className="card-body">
      <div className="row w-100 g-2 align-items-center">
        <div className="col-auto me-2">
          <button className="btn btn-icon" onClick={() => handleViewBonus()}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-arrow-left"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M5 12l14 0" /><path d="M5 12l6 6" /><path d="M5 12l6 -6" /></svg>
          </button>
        </div>
        <div className="col">
          <h4 className="card-title m-0">
            <span>{currentBonus.bonus}</span>
          </h4>
        </div>
        <div className="col-auto">
          <span className={`status status-${earningsColor(currentBonus.earningsClass)}`}>
            <span className="status-dot"></span> {currentBonus.earningsClass}
          </span>
        </div>
      </div>
    </div>

    <div className="table-responsive">
      <table className="table card-table table-vcenter text-nowrap datatable">
        <thead>
          <tr>
            <th></th>
            <th>Bonus</th>
            <th className="d-none d-sm-table-cell">Handle</th>
            <th className="d-none d-sm-table-cell">Customer Type</th>
            <th className="d-none d-sm-table-cell">Status</th>
            <th className="d-none d-sm-table-cell text-end w-4">Bonus Amount</th>
            <th className="d-none d-sm-table-cell text-end w-4">Released</th>
            <th className="border-start text-center w-3">Amount Due</th>
          </tr>
        </thead>
        <tbody>
          {payables && payables.map((payable, index) => {
            if (index >= pageVariables.offset && index < pageVariables.offset + pageVariables.count) {
              return <tr key={payable.id}>
                <td className="w-1">
                  <CheckBox name={payable.id} value={payable.selected} disabled={currentBonus.earningsClass.toLowerCase() === 'hold'} onChange={updateSelected} />
                </td>
                <td>
                  <button onClick={() => handleViewCustomer(payable.customer.id)} className="btn-link text-reset p-0">
                    {payable.customer?.fullName}
                  </button>
                </td>
                <td className="d-none d-sm-table-cell text-start">
                  <button onClick={() => handleViewCustomer(payable.customer.id)} className="btn-link text-reset p-0">
                    {payable.customer?.webAlias}
                  </button>
                </td>
                <td className="d-none d-sm-table-cell text-start">{payable.customer?.customerType.name}</td>
                <td className="d-none d-sm-table-cell text-start">
                  <span className={`status status-${statusColor(payable.customer?.status.statusClass)} status-lite`}>
                    <span className="status-dot"></span> {payable.customer?.status.name}
                  </span>
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
            }
          })}
        </tbody>
      </table>
      <div className="card-footer d-flex align-items-center">
        <Pagination variables={pageVariables} refetch={setPage} total={payables?.length} />
      </div>
    </div>
  </>
}

export default BonusPayablePanel;

BonusPayablePanel.propTypes = {
  date: PropTypes.string.isRequired,
  currentBonus: PropTypes.any.isRequired,
  setCurrentBatch: PropTypes.func.isRequired,
  handleViewCustomer: PropTypes.func.isRequired,
  handleViewBonus: PropTypes.func.isRequired,
  pageVariables: PropTypes.any.isRequired,
  setPageVariables: PropTypes.func.isRequired
}
