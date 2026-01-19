import React from "react-dom/client";
import { useQuery, gql } from "@apollo/client";
import { useParams } from "react-router-dom";
import DataLoading from "../../components/dataLoading.jsx";
import PageHeader from "../../components/pageHeader.jsx";
import Pagination from '../../components/pagination.jsx';
import LocalDate, { ToLocalDate } from "../../util/LocalDate.jsx";
import Avatar from "../../components/avatar.jsx";

var GET_PERIOD_DETAILS = gql`query ($offset: Int!, $first: Int!, $periodId: ID!) {
  compensationPlans(first: 1) {
    period(id: $periodId) {
      begin
      end
      totalVolumes
      volume (offset: $offset, first: $first){
        volume,
        volumeDate
        source
        {
          id
          externalId
          customer
          {
            id
            fullName,
            profileImage
          }
        }
      }
    }
  }
}`;

const VolumeSummary = () => {
  let params = useParams();
  const { loading, error, data,variables, refetch } = useQuery(GET_PERIOD_DETAILS, {
    variables: { offset: 0, first: 10, periodId: parseInt(params.periodId) },
  });

  if (loading) return <DataLoading />;
  if (error) return `Error! ${error}`;

  let compensationPlan = data.compensationPlans[0];
  let periodBeginText = ToLocalDate(compensationPlan.period.begin, false);
  let periodEndText = ToLocalDate(compensationPlan.period.end, false);

  return <PageHeader title="Volume Summary" preTitle={`${periodBeginText} - ${periodEndText}`} >
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
                      <th>Customer Id</th>
                      <th>Volume Date</th>
                      <th>Volume Amount</th>
                      <th>Order Number</th>
                  </tr>
                </thead>
                <tbody>
                  {compensationPlan.period.volume && compensationPlan.period.volume.map((item) => {
                    return <tr key={item.id}>
                      <td className="text-center">
                        <Avatar name={item.source.customer.fullName} url={item.source.customer.profileImage} size="xs" />
                      </td>
                      <td>
                        <a className="text-reset" href={`/Customers/${item.source.customer.id}/commissions?periodId=` + params.periodId}>{item.source.customer.fullName}</a>
                      </td>
                      <td>{item.source.customer.id}</td>
                      <td><LocalDate dateString={item.volumeDate} hideTime="true" /></td>
                      <td>{item.volume}</td>
                      <td>{item.source.externalId}</td>
                    </tr>
                  })}
                </tbody>
              </table>
            </div>
            <div className="card-footer d-flex align-items-center">
              <Pagination variables={variables} refetch={refetch} total={compensationPlan.period.totalVolumes} />
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageHeader>
}

export default VolumeSummary;