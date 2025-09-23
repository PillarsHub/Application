import React from 'react';
import { useParams } from "react-router-dom"
import { useQuery, gql } from "@apollo/client";
import { GetToken } from '../../features/authentication/hooks/useToken';
import BaseUrl from "../../hooks/baseUrl";
import LocalDate, { ToLocalDate } from "../../util/LocalDate";
import PageHeader, { CardHeader } from '../../components/pageHeader';
import DataLoading from '../../components/dataLoading';
import DataError from '../../components/dataError';
import Avatar from '../../components/avatar';
import Pagination from '../../components/pagination';

var GET_PERIOD_DETAILS = gql`query ($period: BigInt, $bonudId: String!, $offset: Int!, $count: Int!) {
  compensationPlans {
    id
    name
    period: periods(at: $period) {
      id
      begin
      end
      compensationPlanId
      bonuses (group: BONUS_TITLE, groupValue: $bonudId, offset: $offset, first: $count) {
        bonusId
        bonusTitle
        nodeId
        amount
        commissionDate
        level
        percent
        rank
        volume
        released
        customer {
          id
          fullName
          profileImage
        }
      }
    }
    ranks{
      id
      name
    }
  }
}`;

const BonusDetail = () => {
  let params = useParams();
  const { loading, error, data, refetch, variables } = useQuery(GET_PERIOD_DETAILS, {
    variables: { period: parseInt(params.periodId), bonudId: params.bonusId, offset: 0, count: 15 },
  });

  if (loading) return <DataLoading />;
  if (error) return <DataError error={error} />;

  let compensationPlan = data.compensationPlans.find((p) => p.period.length > 0);
  let period = compensationPlan.period[0];
  let breadcrumbText = ToLocalDate(period.end, true);
  let periodBeginText = ToLocalDate(period.begin, false);
  let periodEndText = ToLocalDate(period.end, false);
  let ranks = compensationPlan.ranks;

  let downloadParams = `?period=${parseInt(params.periodId)}&bonudId=${params.bonusId}`;
  let downloadLink = `${BaseUrl}/api/v1/reports/-15/csv${downloadParams}&authorization=${GetToken().token}`;

  return <PageHeader title="Bonus Detail" postTitle={`${periodBeginText} - ${periodEndText}`} breadcrumbs={[{ title: 'Commission Periods', link: `/commissions/periods?p=${compensationPlan.id}` }, { title: breadcrumbText, link: `/commissions/periods/${params.periodId}/summary` }, { title: params.bonusId }]} >
    <CardHeader>
      <div className="btn-list">
        <a className="btn btn-default btn-sm-icon" href={downloadLink} target="_blank" rel="noreferrer">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>
          <span className="d-none d-sm-block text-start">Download</span>
        </a>
      </div>
    </CardHeader>
    <div className="container-xl">
      <div className="row row-cards">
        <div className="col-12">
          <div className="card">
            <div className="table-responsive">
              <table className="table card-table table-vcenter text-nowrap datatable">
                <thead>
                  <tr>
                    <th className="text-center w-1"><i className="icon-people"></i></th>
                    <th>Customer Name</th>
                    <th>Bonus Name</th>
                    <th>Level</th>
                    <th>Bonus Date</th>
                    <th>Volume</th>
                    <th>Percent</th>
                    <th>Amount</th>
                    <th>Released</th>
                    <th>Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {period.bonuses && period.bonuses.map((bonus) => {
                    return <tr key={`${bonus.bonusId}_${bonus.nodeId}_${bonus.level}`}>
                      <td className="text-center">
                        {bonus.customer && <Avatar name={bonus.customer?.fullName} url={bonus.customer?.profileImage} size="xs" />}
                      </td>
                      <td>
                        {!bonus.customer && <span>Customer {bonus.nodeId}</span>}
                        <a className="text-reset" href={`/Customers/${bonus.customer?.id}/commissions?periodId=` + params.periodId}>{bonus.customer?.fullName}</a>
                      </td>
                      <td>
                        <a className="text-reset" href={`/customers/${bonus.customer?.id}/commissions/${bonus.bonusId}?periodId=${params.periodId}`}>{bonus.bonusTitle}</a>
                      </td>
                      <td> {bonus.level}</td>
                      <td><LocalDate dateString={bonus.commissionDate} hideTime={false} /></td>
                      <td>{bonus.volume}</td>
                      <td>{bonus.percent}</td>
                      <td>{bonus.amount.toLocaleString("en-US", { style: 'currency', currency: bonus?.currency ?? 'USD' })}</td>
                      <td>{bonus.released.toLocaleString("en-US", { style: 'currency', currency: bonus?.currency ?? 'USD' })}</td>
                      <td>{ranks.find(r => r.id == bonus.rank)?.name}</td>
                    </tr>
                  })}
                  {(() => {
                    const totalAmount = period.bonuses.reduce((acc, bonus) => acc + bonus.amount, 0);
                    const totalVolume = period.bonuses.reduce((acc, bonus) => acc + bonus.volume, 0);
                    const totalReleased = period.bonuses.reduce((acc, bonus) => acc + bonus.released, 0);

                    return (
                      <tr className="table-light">
                        <td className="strong">Total</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td className="strong">{totalVolume.toLocaleString()}</td>
                        <td></td>
                        <td className="strong">{totalAmount.toLocaleString("en-US", { style: 'currency', currency: period.bonuses[0]?.currency ?? 'USD' })}</td>
                        <td className="strong">{totalReleased.toLocaleString("en-US", { style: 'currency', currency: period.bonuses[0]?.currency ?? 'USD' })}</td>
                        <td></td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
            <div className="card-footer d-flex align-items-center">
              <Pagination variables={variables} refetch={refetch} total={-1} />
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageHeader>
}

export default BonusDetail;