import React from "react";
import { useParams } from "react-router-dom"
import { useQuery, gql } from "@apollo/client";
import PageHeader from "../../../components/pageHeader.jsx";
import DataLoading from '../../../components/dataLoading.jsx';
import AccountNav from "./accountNav.jsx";

var GET_CUSTOMER = gql`query ($nodeIds: [String]!) {
    customers(idList: $nodeIds) {
      id
      fullName
      firstName
      lastName
      emailAddress
      user{
        id
        username
        firstName
        lastName
        verified
        scope
      }
    }
  }`;

const CustomerMoneyIn = () => {
  let params = useParams();
  const { loading, error, data } = useQuery(GET_CUSTOMER, {
    variables: { nodeIds: [params.customerId] },
  });

  if (loading) return <DataLoading />;
  if (error) return `Error! ${error}`;

  let user = data.customers[0].user;

  return <PageHeader preTitle="Account" title={data?.customers[0].fullName} pageId="account" customerId={params.customerId}>
    <div className="container-xl">
      <div className="card">
        <div className="row g-0">
          <div className="col-3 d-none d-md-block border-end">
            <div className="card-body">
              <AccountNav pageId="moneyin" customerId={params.customerId} />
            </div>
          </div>
          <div className="col d-flex flex-column">
            <div className="card-body">
              {JSON.stringify(user)}
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageHeader>
}

export default CustomerMoneyIn;