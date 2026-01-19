import React from 'react';
import PageHeader from '../../components/pageHeader.jsx';
import { useParams } from 'react-router-dom';
import { useQuery, gql } from "@apollo/client";
import DataError from '../../components/dataError.jsx';
import DataLoading from '../../components/dataLoading.jsx';
import Avatar from "../../components/avatar.jsx";
import LocalDate from '../../util/LocalDate.jsx';

var GET_CUSTOMERS = gql`query ($customerId: String!) {
  customers(idList: [$customerId]) {
    fullName
    nodes{
      nodes{
        customer{
          fullName
          profileImage
          webAlias
          id
          enrollDate
          customerType{
            name
          }
        }
      }
    }
  }
}

`;

function PlacementSuite() {
  let params = useParams();
  const { loading, error, data } = useQuery(GET_CUSTOMERS, {
    variables: { offset: 0, first: 10, search: '', customerId: params.customerId },
  });

  if (loading) return <DataLoading />;
  if (error) return <DataError error={error} />

  return <>
    <PageHeader preTitle="Placement Suite" title={data.customers[0].fullName}>
      {/* <h1>PlacementSuite {params.customerId}</h1> */}


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
                      <th>Enroll Date</th>
                      <th className="text-center w-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.customers[0].nodes[0].nodes && data.customers[0].nodes[0].nodes.map((node) => {
                      var customer = node.customer;
                      return <tr key={customer.id}>
                        <td className="text-center">
                          <Avatar name={customer.fullName} url={customer.profileImage} />
                        </td>
                        <td>
                          <a className="text-reset" href={`/customers/${customer.id}/summary`}>{customer.fullName}</a>
                        </td>
                        <td>{customer.webAlias}</td>
                        <td>{customer.customerType?.name}</td>
                        <td><LocalDate dateString={customer.enrollDate} hideTime={false} /></td>
                        <td><button className="btn btn-default" >
                        <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  strokeWidth="2"  strokeLinecap="round"  strokeLinejoin="round"  className="icon icon-tabler icons-tabler-outline icon-tabler-pin"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 4.5l-4 4l-4 1.5l-1.5 1.5l7 7l1.5 -1.5l1.5 -4l4 -4" /><path d="M9 15l-4.5 4.5" /><path d="M14.5 4l5.5 5.5" /></svg>
                          Place
                        </button></td>
                      </tr>
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageHeader>
  </>
}

export default PlacementSuite;