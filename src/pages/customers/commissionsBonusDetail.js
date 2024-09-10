import React, { useState } from 'react';
import { useParams } from "react-router-dom"
import { useQuery, gql } from "@apollo/client";
import PageHeader from "../../components/pageHeader";
import DataLoading from "../../components/dataLoading";
import Avatar from '../../components/avatar';
import EmptyContent from '../../components/emptyContent';
import LocalDate from '../../util/LocalDate';

var GET_DATA = gql`query ($nodeIds: [String]!, $period: BigInt!, $bonusIds: [String]!) {
  customers(idList: $nodeIds) {
    id
    fullName
  }
  compensationPlans(first: 1) {
    periods(at: $period) {
      id
      begin
      end
      status
      bonuses(nodeIds: $nodeIds, idList: $bonusIds) {
        bonusId
        bonusTitle
        level
        details {
          volume
          released
          percent
          amount
          source {
            nodeId
            date
            externalId
            sourceGroupId
            value
            customer {
              id
              fullName
              profileImage
            }
          }
        }
      } 
    }
  }
}`;

const CommissionsBonusDetail = () => {
  let params = useParams();
  const queryParams = new URLSearchParams(window.location.search);
  const periodParam = queryParams.get("periodId") ?? "0";
  const [periodId] = useState(periodParam);

  const { data, loading, error } = useQuery(GET_DATA, {
    variables: { nodeIds: [params.customerId], period: parseInt(periodId), bonusIds: [params.bonusId] },
  });

  if (loading) return <DataLoading />;
  if (error) return `Error! ${error}`;

  let period = data.compensationPlans[0].periods[0];
  let bonuses = period?.bonuses ?? [];

  return <PageHeader title={data?.customers[0].fullName} pageId="commissions" customerId={params.customerId} breadcrumbs={[{ title: 'Earnings', link: `/customers/${params.customerId}/commissions?periodId=${periodId}` }, { title: "Bonus Detail" }]}>
    {!bonuses || bonuses.length == 0 && <>
      <div className="container-xl">
        <EmptyContent title="Bonus detail not found" text={`We could not find any details for the ${params.bonusId} bonus`} />
      </div>
    </>}
    {bonuses && bonuses.length > 0 && <>
      <div className="container-xl">
        <div className="col-12">
          <div className="card mb-3">
            <div className="card-header">
              <h3 className="card-title">{bonuses[0].bonusTitle} {bonuses[0].level}</h3>
            </div>
            <div className="table-responsive">
              <table className="table card-table table-vcenter text-nowrap datatable">
                <thead>
                  <tr>
                    <th className="text-center w-1"><i className="icon-people"></i></th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Percent</th>
                    <th>Volume</th>
                    <th>Released</th>
                    <th>Order Date</th>
                    <th>Order Number</th>
                  </tr>
                </thead>
                <tbody>
                  {bonuses[0].details && bonuses[0].details.map((bonus) => {
                    return <tr key={bonus.id}>

                      {bonus.source && <>
                        <td className="text-center">
                          <Avatar name={bonus.source?.customer?.fullName} url={bonus.source?.customer?.profileImage} size="sm" />
                        </td>
                        <td>
                          <div><a className="text-reset" href={`/Customers/${bonus.source?.customer?.id}/Summary`}>{bonus.source?.customer?.fullName}</a></div>
                          <div className="small text-muted">
                            {bonus.source?.nodeId}
                          </div>
                        </td>
                      </>}
                      {!bonus.source && <>
                        <td></td>
                        <td></td>
                      </>}

                      <td>{bonus.amount.toLocaleString("en-US", { style: 'currency', currency: bonus?.currency ?? 'USD' })}</td>
                      <td>{bonus.percent}</td>
                      <td>{bonus.volume} <span className="small text-muted">{bonus.source?.sourceGroupId}</span> </td>
                      <td>{bonus.released.toLocaleString("en-US", { style: 'currency', currency: bonus?.currency ?? 'USD' })}</td>

                      <td><LocalDate dateString={bonus.source?.date} /></td>
                      <td>{bonus.source?.externalId}</td>
                    </tr>
                  })}
                  {(() => {
                    const totalAmount = bonuses[0].details.reduce((acc, bonus) => acc + bonus.amount, 0);
                    const totalVolume = bonuses[0].details.reduce((acc, bonus) => acc + bonus.volume, 0);
                    const totalReleased = bonuses[0].details.reduce((acc, bonus) => acc + bonus.released, 0);

                    return (
                      <tr className="table-light">
                        <td className="strong">Total</td>
                        <td></td>
                        <td className="strong">{totalAmount.toLocaleString("en-US", { style: 'currency', currency: bonuses[0]?.currency ?? 'USD' })}</td>
                        <td></td>
                        <td className="strong">{totalVolume}</td>
                        <td className="strong">{totalReleased.toLocaleString("en-US", { style: 'currency', currency: bonuses[0]?.currency ?? 'USD' })}</td>
                        <td></td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>}
  </PageHeader>
}

export default CommissionsBonusDetail;
