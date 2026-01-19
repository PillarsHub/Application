import React from 'react';
import PropTypes from 'prop-types';
import { useQuery, gql } from "@apollo/client";
import LocalDate from '../util/LocalDate.jsx';
import DataError from './dataError.jsx';
import DataLoading from './dataLoading.jsx';
import EmptyContent from './emptyContent.jsx';


var GET_DATA = gql`query ($nodeIds: [String]!, $period: BigInt!) {
  customers(idList: $nodeIds) {
    id
    fullName
  }
  period(id: $period) {
    id
    begin
    end
    status
    bonuses(nodeIds: $nodeIds) {
      bonusId
      nodeId
      amount
      bonusTitle
      description
      level
      rank
      released
      percent
      commissionDate
      volume
    } 
  }
  compensationPlans {
    ranks{
      id
      name
    }
  }
}`;

const EarningsTable = ({ customerId, periodId, overrides }) => {
  if (periodId == 0) return <></>;
  const { data, loading, error } = useQuery(GET_DATA, {
    variables: { nodeIds: [customerId], period: parseInt(periodId) },
  });

  if (loading) return <DataLoading />;
  if (error) return <DataError error={error} />

  var plan = data?.compensationPlans?.find(item =>
    item.ranks.some(subItem => subItem.id)
  ) || null;

  let ranks = plan?.ranks;
  let bonuses = [];
  if (data?.period?.bonuses) {
    bonuses = [...data.period.bonuses];
    bonuses.sort((a, b) => (a.bonusId > b.bonusId) ? 1 : -1);
  }

  const hasBonuses = bonuses?.length > 0 ?? false;

  return <>
    {!hasBonuses && <>
      <EmptyContent title='Bonuses not found' text="No bonuses found for the selected period" />
    </>}
    {hasBonuses && <div className="table-responsive">
      <table className="table card-table table-vcenter text-nowrap datatable">
        <thead>
          <tr>
            <th>Date</th>
            <th>Bonus Name</th>
            <th>Level</th>
            <th>Volume</th>
            <th>Percent</th>
            <th>Amount</th>
            <th>Released</th>
            <th>Rank</th>
          </tr>
        </thead>
        <tbody>
          {bonuses.map((bonus) => {
            var override = overrides?.find(o => o.title == bonus.bonusTitle) ?? { title: bonus.bonusTitle, display: bonus.bonusTitle, show: true }
            if (!override.show) return <tr key={bonus.bonusId}></tr>

            return <tr key={bonus.bonusId}>
              <td><LocalDate dateString={bonus.commissionDate} hideTime={true} /></td>
              <td>
                <a className="text-reset" href={`/customers/${customerId}/commissions/${bonus.bonusId}?periodId=${periodId}`}>{override.display}</a>
              </td>
              <td>{bonus.level}</td>
              <td>
                <a className="text-reset" href={`/customers/${customerId}/commissions/${bonus.bonusId}?periodId=${periodId}`}>
                  {Math.round(bonus.volume * 1000) / 1000}
                </a>
              </td>
              <td>{bonus.percent}</td>
              <td>{bonus.amount.toLocaleString("en-US", { style: 'currency', currency: bonus?.currency ?? 'USD' })}</td>
              <td>{bonus.released.toLocaleString("en-US", { style: 'currency', currency: bonus?.currency ?? 'USD' })}</td>
              <td>{ranks?.find(r => r.id == bonus.rank)?.name}</td>
            </tr>
          })}
          {(() => {
            const totalAmount = bonuses.reduce((acc, bonus) => {
              const override = overrides?.find(o => o.title == bonus.bonusTitle) ?? { show: true };
              return override.show ? acc + bonus.amount : acc;
            }, 0);

            const totalVolume = bonuses.reduce((acc, bonus) => {
              const override = overrides?.find(o => o.title == bonus.bonusTitle) ?? { show: true };
              return override.show ? acc + bonus.volume : acc;
            }, 0);

            const totalReleased = bonuses.reduce((acc, bonus) => {
              const override = overrides?.find(o => o.title == bonus.bonusTitle) ?? { show: true };
              return override.show ? acc + bonus.released : acc;
            }, 0);

            return (
              <tr className="table-light">
                <td className="strong">Total</td>
                <td></td>
                <td></td>
                <td className="strong">{Math.round(totalVolume * 1000) / 1000}</td>
                <td></td>
                <td className="strong">{totalAmount.toLocaleString("en-US", { style: 'currency', currency: bonuses[0]?.currency ?? 'USD' })}</td>
                <td className="strong">{totalReleased.toLocaleString("en-US", { style: 'currency', currency: bonuses[0]?.currency ?? 'USD' })}</td>
                <td></td>
              </tr>
            );
          })()}
        </tbody>
      </table>
    </div>}
  </>
}

export default EarningsTable;

EarningsTable.propTypes = {
  customerId: PropTypes.string.isRequired,
  periodId: PropTypes.number,
  overrides: PropTypes.array
}
