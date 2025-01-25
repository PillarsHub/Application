import React from 'react';
import { useParams } from "react-router-dom"
import { useQuery, gql } from "@apollo/client";
import { GetScope } from '../../features/authentication/hooks/useToken';
import Pagination from '../../components/pagination';
import PageHeader from "../../components/pageHeader";
import DataLoading from "../../components/dataLoading";
import StatusPill from "./statusPill";
import Avatar from "../../components/avatar";
import LocalDate from "../../util/LocalDate";
import DataError from '../../components/dataError';

var GET_CUSTOMERS = gql`query($nodeIds: [String]!, $offset: Int!, $first: Int!){
  customer: customers(idList: $nodeIds) {
    id,
    fullName
  }
  customers(offset: $offset, first: $first) {
    id
    companyName
    fullName
    enrollDate
    profileImage
    webAlias
    scopeLevel
    status{
      id
      name
      statusClass
    }
    customerType {
      id
      name
    }
    emailAddress
    phoneNumbers {
      number
    }
  }
  totalCustomers
}`;

const TeamList = () => {
  let params = useParams()
  const { loading, error, data, variables, refetch } = useQuery(GET_CUSTOMERS, {
    variables: { nodeIds: [params.customerId], offset: 0, first: 10 },
  });

  if (loading) return <DataLoading />;
  if (error) return <DataError error={error} />

  let customer = data.customer[0] ?? { id: params.customerId, cards: [] };

  return (
    <PageHeader title={customer.fullName} preTitle="My Team" pageId='team' customerId={params.customerId}>
      <div className="container-xl">
        <div className="row row-cards">
          <div className="col-12">
            <div className="card">
              <div className="table-responsive">
                <table className="table card-table table-vcenter text-nowrap datatable">
                  <thead>
                    <tr>
                      <th className="text-center w-1"></th>
                      <th>Customer</th>
                      <th>Handle</th>
                      <th>Customer Type</th>
                      <th>Status</th>
                      <th>Phone Number</th>
                      <th>Email Address</th>
                      <th>Enroll Date</th>
                      <th className="text-center"><i className="icon-settings"></i></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.customers && data.customers.filter((item) => item.scopeLevel != 'UPLINE').map((item) => {
                      return <tr key={item.id}>
                        <td className="text-center">
                          <Avatar name={item.fullName} url={item.profileImage} />
                        </td>
                        <td>
                          <a className="text-reset" href={`/customers/${item.id}/summary`}>{item.fullName}</a>
                          {GetScope() == undefined && <div className="small text-muted">
                            {item.id}
                          </div>}
                        </td>
                        <td>{item.webAlias}</td>
                        <td>{item.customerType?.name}</td>
                        <td><StatusPill status={item.status} small={true} /></td>
                        <td>
                          {item.phoneNumbers && item.phoneNumbers.length > 0 && item.phoneNumbers[0].number}
                        </td>
                        <td>{item.emailAddress}</td>
                        <td><LocalDate dateString={item.enrollDate} hideTime={true} /></td>
                        <td className="text-center"></td>
                      </tr>
                    })}
                  </tbody>
                </table>
              </div>
              <div className="card-footer d-flex align-items-center">
                <Pagination variables={variables} refetch={refetch} total={data.totalCustomers} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageHeader>
  );
};

export default TeamList;