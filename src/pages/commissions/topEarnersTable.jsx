import React from "react-dom/client";
import PropTypes from 'prop-types';
import { useQuery, gql } from "@apollo/client";
import DataLoading from "../../components/dataLoading.jsx";
import Avatar from "../../components/avatar.jsx";
import StatusPill from "../customers/statusPill.jsx";

var GET_CUSTOMERS = gql`query($nodeIds: [String]!, $period: BigInt!){
  customers(idList: $nodeIds) {
    id
    fullName
    enrollDate
    profileImage
    status{
      id
      name
      statusClass
    }
    customerType {
      id
      name
    }
  }
  compensationPlans {
    periods(at: $period)
    {
      commissionValues(nodeIds: $nodeIds)
      {
        nodeId
        valueId
        value
      }
    }
    ranks{
      id
      name
    }
  }
}`;

const TopEarnersTable = ({ topEarners, periodId }) => {
  var customerIds = topEarners.map((t) => { return t.description });

  const { loading, error, data } = useQuery(GET_CUSTOMERS, {
    variables: { nodeIds: customerIds, period: parseInt(periodId) },
  });

  if (loading) return <DataLoading />;
  if (error) return `Error! ${error}`;

  let compensationPlan = data.compensationPlans.find((p) => p.periods.length > 0);
  let ranks = compensationPlan.ranks ?? [];
  let comValues = compensationPlan.commissionValues ?? [];

  return <table className="table card-table table-vcenter text-nowrap datatable">
    <thead>
      <tr>
        <th className="text-center w-1"><i className="icon-people"></i></th>
        <th>Customer</th>
        <th>Commissions</th>
        <th>Rank</th>
        <th>Status</th>
        <th>Bonuses</th>
        <th>Volume</th>
      </tr>
    </thead>
    <tbody>
      {data?.customers && data.customers.map((customer) => {

        let bonus = topEarners.find(el => el.description == customer.id);
        let comvalue = comValues.find(el => el.nodeId == customer.id && el.valueId == "Rank");
        let rank = ranks.find(el => el.id == comvalue?.value) || { id: comvalue?.value, name: comvalue?.value };

        return <tr key={customer.id}>
          <td className="text-center">
            <Avatar name={customer.fullName} url={customer.profileImage} size="sm" />
          </td>
          <td>
            <a className="text-reset" href={`/Customers/${customer.id}/commissions?periodId=${periodId}`}>{customer.fullName}</a>
            <div className="small text-muted">{customer.id}</div>
          </td>
          <td>{bonus?.paidAmount.toLocaleString("en-US", { style: 'currency', currency: bonus?.currency ?? 'USD' })}</td>
          <td>{rank?.name}</td>
          <td><StatusPill status={customer.status} small="true" /></td>
          <td>{bonus?.paidCount}</td>
          <td>{bonus?.totalVolume}</td>
        </tr>
      })}
    </tbody>
  </table>
}

export default TopEarnersTable;

TopEarnersTable.propTypes = {
  topEarners: PropTypes.array.isRequired,
  periodId: PropTypes.number.isRequired
}