import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useQuery, gql } from "@apollo/client";
import DataLoading from "../../../components/dataLoading";
import DataError from '../../../components/dataError';
import CheckBox from '../../../components/checkbox';
import EmptyContent from '../../../components/emptyContent';

var GET_SUMMARY = gql`query ($date: Date!) {
  unreleasedSummary (date: $date) {
    bonusTitle
    earningsClass
    released
    paidAmount
    paidCount
    customerPaidCount
    totalVolume
    period {
      id
      end
    }
  }
}`;

const PayableSummaryPanel = ({ date, setCurrentBatch, handleViewBonus }) => {
  const [payables, setPayables] = useState();
  const { loading, error, data } = useQuery(GET_SUMMARY, {
    variables: { date: date }
  });
  console.log("PS " + date);

  useEffect(() => {
    if (data) {
      const customSortOrder = ['RELEASE', 'FORFEIT', 'HOLD'];


      const groupedData = data.unreleasedSummary.reduce((acc, current) => {
        const bonusTitle = `${current.bonusTitle.toLowerCase()}_${current.earningsClass}`;

        if (!acc[bonusTitle]) {
          acc[bonusTitle] = {
            ...current,
            paidAmount: 0,
            released: 0,
            customerPaidCount: 0,
            children: []
          };
        }

        acc[bonusTitle].customerPaidCount += current.customerPaidCount
        acc[bonusTitle].paidAmount += current.paidAmount;
        acc[bonusTitle].released += current.released;
        acc[bonusTitle].children.push(current);

        return acc;
      }, {});

      const sortedData = Object.values(groupedData).map((s) => (
        {
          ...s,
          id: s.bonusTitle + '_' + s.earningsClass,
          selected: s.earningsClass.toLowerCase() !== 'hold'
        }
      )).sort((a, b) => {
        return customSortOrder.indexOf(a.earningsClass) - customSortOrder.indexOf(b.earningsClass);
      });

      setPayables(sortedData);
    }
  }, [data])

  useEffect(() => {
    if (payables) {
      setCurrentBatch({
        cutoffDate: date,
        bonusGroups: payables.filter(x => x.selected).map(x => ({ bonusTitle: x.bonusTitle, earningsClass: x.earningsClass })),
        total: payables.filter(x => x.selected && x.earningsClass == 'RELEASE').reduce((t, x) => t + (x.paidAmount - x.released), 0),
        forfeitTotal: payables.filter(x => x.selected && x.earningsClass == 'FORFEIT').reduce((t, x) => t + (x.paidAmount - x.released), 0),
        totalCustomers: payables.filter(x => x.selected && x.earningsClass !== 'HOLD').reduce((t, x) => t + x.customerPaidCount, 0),
      });
    }
  }, [payables])

  if (loading) return <DataLoading />;
  if (error) return <DataError error={error} />

  const updateSelected = (name, value) => {
    setPayables(v => {
      return v.map(p => p.id === name ? { ...p, selected: value } : p);
    });
  }

  return <>
    {(!payables || payables.length == 0) && <>
      <div className="card-body">
        <EmptyContent title='No payables found' text="Try adjusting your search or filter to find what you're looking for." />
      </div>
    </>}

    {payables && payables.length > 0 && <>
      <div className="table-responsive">
        <table className="table card-table table-vcenter text-nowrap">
          <thead>

          </thead>
          <tbody>
            {payables.map((payable, index) => {
              let eClass = (index === 0 || payable.earningsClass !== payables[index - 1].earningsClass) ? payable.earningsClass : null;

              return <React.Fragment key={payable.id}>
                {eClass && <tr className="table-light">
                  <th className="subheader" colSpan={2}>Bonuses to {eClass}</th>
                  <th className="subheader d-none d-sm-table-cell text-start w-4">Customers</th>
                  {/* <th className="subheader d-none d-sm-table-cell text-end w-4">Total Amount</th>
                  <th className="subheader d-none d-sm-table-cell text-end w-4">Released</th> */}
                  <th className="subheader border-start text-center w-3">Amount Due</th>
                </tr>}
                <tr>
                  <td className="w-1">
                    <CheckBox name={payable.id} value={payable.selected} disabled={payable.earningsClass.toLowerCase() === 'hold'} onChange={updateSelected} />
                  </td>
                  <td>
                    <button onClick={() => handleViewBonus({ bonus: payable.bonusTitle, earningsClass: payable.earningsClass })} className="btn-link text-reset p-0">
                      {payable.bonusTitle}
                    </button>
                  </td>
                  <td className="d-none d-sm-table-cell text-start">
                    <button onClick={() => handleViewBonus({ bonus: 'Manual Bonus', earningsClass: payable.earningsClass })} className="btn-link text-reset p-0">
                      {payable.customerPaidCount}
                    </button>
                  </td>
                  {/* <td className="d-none d-sm-table-cell text-end">
                    {payable.paidAmount.toLocaleString("en-US", { style: 'currency', currency: 'USD' })}
                  </td>
                  <td className="d-none d-sm-table-cell text-end">
                    {payable.released.toLocaleString("en-US", { style: 'currency', currency: 'USD' })}
                  </td> */}
                  <td className="border-start text-end strong">
                    {(payable.paidAmount - payable.released).toLocaleString("en-US", { style: 'currency', currency: 'USD' })}
                  </td>
                </tr>
              </React.Fragment>
            })}
          </tbody>
        </table>
      </div>
    </>}
  </>
}


export default PayableSummaryPanel;

PayableSummaryPanel.propTypes = {
  date: PropTypes.string.isRequired,
  setCurrentBatch: PropTypes.func.isRequired,
  handleViewBonus: PropTypes.func.isRequired
}
