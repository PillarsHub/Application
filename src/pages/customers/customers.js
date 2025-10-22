import React, { useEffect, useState } from 'react';
import { useQuery, gql } from "@apollo/client";
import { GetScope, GetToken } from '../../features/authentication/hooks/useToken';
import { SendRequest } from '../../hooks/usePost';
import PageHeader, { CardHeader } from "../../components/pageHeader";
import FormatPhoneNumber from "../../util/phoneNumberFormatter";
import DataLoading from "../../components/dataLoading";
import StatusPill from "./statusPill";
import Avatar from "../../components/avatar";
import LocalDate from "../../util/LocalDate";
import DataError from '../../components/dataError';

var GET_CUSTOMERS = gql`query($offset: Int!, $first: Int!) {
  recentCustomers(offset: $offset, first: $first) {
    customerId
    pinned
    date
    customer{
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
  }
}`;

const Customers = () => {
  const [recentList, setRecentList] = useState();
  const { loading, error, data } = useQuery(GET_CUSTOMERS, {
    variables: { offset: 0, first: 10, search: '' },
  });

  useEffect(() => {
    if (data) {
      setRecentList(data.recentCustomers.length > 0 ? data.recentCustomers : [])
    }
  }, [data])

  if (loading) return <DataLoading />;
  if (error) return <DataError error={error} />

  const handleSetPinned = (customerId, pinned) => {
    setRecentList(prevList =>
      prevList.map(item =>
        item.customerId === customerId ? { ...item, pinned } : item
      )
    );

    SendRequest("POST", `/api/v1/Recent`, { pinned: pinned, customerId: customerId }, () => {
      //Do Nothing
    }, (error) => {
      alert(error)
    })
  }

  var token = GetToken();

  return (
    <PageHeader title="Recent Customers" >
      <CardHeader>
        {GetScope() == undefined && token?.environmentId == '00' &&
          <div className="dropdown">
            <a href="/Customers/New" className="btn btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-user-plus" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0"></path><path d="M16 19h6"></path><path d="M19 16v6"></path><path d="M6 21v-2a4 4 0 0 1 4 -4h4"></path></svg>
              Add Customer
            </a>
          </div>
        }
      </CardHeader>
      <div className="container-xl">
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
                {recentList && recentList.filter((item) => item.customer?.scopeLevel != 'UPLINE').map((item) => {
                  if (item.customer?.id) {
                    return <tr key={item.customer.id}>
                      <td className="text-center">
                        <Avatar name={item.customer.fullName} url={item.customer.profileImage} />
                      </td>
                      <td>
                        <a className="text-reset" href={`/customers/${item.customer.id}/summary`}>{item.customer.fullName}</a>
                        {GetScope() == undefined && <div className="small text-muted">
                          {item.customer.id}
                        </div>}
                      </td>
                      <td>{item.customer.webAlias}</td>
                      <td>{item.customer.customerType?.name}</td>
                      <td><StatusPill status={item.customer.status} small={true} /></td>
                      <td>
                        {item.customer.phoneNumbers && item.customer.phoneNumbers.length > 0 && FormatPhoneNumber(item.customer.phoneNumbers[0].number)}
                      </td>
                      <td>{item.customer.emailAddress}</td>
                      <td><LocalDate dateString={item.customer.enrollDate} hideTime={true} /></td>
                      <td className="text-center">
                        {!item.pinned && <>
                          <button className="btn btn-ghost-secondary btn-icon" onClick={() => handleSetPinned(item.customer.id, true)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-pin"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M15 4.5l-4 4l-4 1.5l-1.5 1.5l7 7l1.5 -1.5l1.5 -4l4 -4" /><path d="M9 15l-4.5 4.5" /><path d="M14.5 4l5.5 5.5" /></svg>
                          </button>
                        </>}
                        {item.pinned && <>
                          <button className="btn btn-ghost-secondary btn-icon" onClick={() => handleSetPinned(item.customer.id, false)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-pinned"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M9 4v6l-2 4v2h10v-2l-2 -4v-6" /><path d="M12 16l0 5" /><path d="M8 4l8 0" /></svg>
                          </button>
                        </>}
                      </td>
                    </tr>
                  }
                })}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </PageHeader>
  );
};

export default Customers;