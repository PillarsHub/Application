import React from 'react';
import { useParams } from "react-router-dom"
import { useQuery, gql } from "@apollo/client";
import LocalDate, { ToLocalDate } from "../../util/LocalDate.jsx";
import PageHeader from '../../components/pageHeader.jsx';
import DataLoading from '../../components/dataLoading.jsx';
import DataError from '../../components/dataError.jsx';
import Avatar from '../../components/avatar.jsx';

var GET_PERIOD_DETAILS = gql`query ($period: BigInt, $rankId: String) {
  compensationPlans {
    id
    name
    period: periods(at: $period) {
      id
      begin
      end
      compensationPlanId
      bonuses (group: RANK, groupValue: $rankId) {
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
        details {
          amount
          source {
            externalId
          }
        }
      }
    }
    ranks{
      id
      name
    }
  }
}`;

const RankDetail = () => {
  let params = useParams();
  const { loading, error, data, } = useQuery(GET_PERIOD_DETAILS, {
    variables: { period: parseInt(params.periodId), rankId: params.rankId === '0' ? '' : params.rankId },
  });

  if (loading) return <DataLoading />;
  if (error) return <DataError error={error} />;

  let compensationPlan = data.compensationPlans.find((p) => p.period.length > 0);
  let period = compensationPlan.period[0];
  let breadcrumbText = ToLocalDate(period.end, true);
  let periodBeginText = ToLocalDate(period.begin, false);
  let periodEndText = ToLocalDate(period.end, false);
  let ranks = compensationPlan.ranks;
  let rank = ranks.find(r => r.id == params.rankId) ?? { name: 'No Rank'};

  return <PageHeader title="Rank Detail" postTitle={`${periodBeginText} - ${periodEndText}`} breadcrumbs={[{ title: 'Commission Periods', link: `/commissions/periods?p=${compensationPlan.id}` }, { title: breadcrumbText, link: `/commissions/periods/${params.periodId}/summary` }, { title: rank.name }]} >
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
                    <th>Amount</th>
                    <th>Percent</th>
                    <th>Volume</th>
                    <th>Released</th>
                    <th>Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {period.bonuses && period.bonuses.map((bonus) => {
                    return <tr key={bonus.bonusId}>
                      <td className="text-center">
                        <Avatar name={bonus.customer.fullName} url={bonus.customer.profileImage} size="xs" />
                      </td>
                      <td>
                        <a className="text-reset" href={`/Customers/${bonus.customer.id}/commissions?periodId=` + params.periodId}>{bonus.customer.fullName}</a>
                      </td>
                      <td>
                        <a className="text-reset" href={`/customers/${bonus.customer.id}/commissions/${bonus.bonusId}?periodId=${params.periodId}`}>{bonus.bonusTitle}</a>
                      </td>
                      <td> {bonus.level}</td>
                      <td><LocalDate dateString={bonus.commissionDate} hideTime={false} /></td>
                      <td>{bonus.amount.toLocaleString("en-US", { style: 'currency', currency: bonus?.currency ?? 'USD' })}</td>
                      <td>{bonus.percent}</td>
                      <td>{bonus.volume}</td>
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
                        <td className="strong">{totalAmount.toLocaleString("en-US", { style: 'currency', currency: period.bonuses[0]?.currency ?? 'USD' })}</td>
                        <td></td>
                        <td className="strong">{totalVolume}</td>
                        <td className="strong">{totalReleased.toLocaleString("en-US", { style: 'currency', currency: period.bonuses[0]?.currency ?? 'USD' })}</td>
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
    </div>
  </PageHeader>
}

export default RankDetail;