import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"
import { useQuery, gql } from "@apollo/client";
import { SendRequest } from "../../../hooks/usePost.js";
import PageHeader from "../../../components/pageHeader.jsx";
import AccountNav from "./accountNav.jsx";
import DataLoading from "../../../components/dataLoading.jsx";

var GET_CUSTOMER = gql`query ($nodeIds: [String]!) {
  customers(idList: $nodeIds) {
    id
    fullName
    merchantData {
      bankAccount {
        routingNumber
        accountNumber
        nameOnAccount
        other
      }
    }
  }
  trees {
    id
    enableCustomerLegPreference
  }
}`;

const CustomerMoneyOut = () => {
  let params = useParams();
  const [activeItem, setActiveItem] = useState({});
  const { loading, error, data, refetch } = useQuery(GET_CUSTOMER, {
    variables: { nodeIds: [params.customerId] },
  });

  // Update the activeItem when the data is loaded
  useEffect(() => {
    if (!loading && data) {
      var bankAccount = data?.customers[0].merchantData?.bankAccount;
      var merchantId = bankAccount?.other ? '3' : bankAccount?.accountNumber ? '2' : '1';
      var item =
        bankAccount ?
          { routingNumber: bankAccount.routingNumber, accountNumber: bankAccount.accountNumber, nameOnAccount: bankAccount.nameOnAccount, other: bankAccount.other, merchantId: merchantId } :
          { routingNumber: '', accountNumber: '', nameOnAccount: '', other: '', merchantId: merchantId };
      setActiveItem(item);
    }
  }, [loading, data]);

  if (loading) return <DataLoading />
  if (error) return `Error! ${error}`;

  const handleChange = (name, value) => {
    setActiveItem(values => ({ ...values, [name]: value }));
  }

  const handleSubmit = () => {
    let item = [{
      op: "replace",
      path: "/merchantData",
      value: { bankAccount: activeItem }
    }];

    SendRequest("PATCH", `/api/v1/Customers/${params.customerId}`, item, () => {
      var successAlert = document.getElementById('passwordSuccess');
      successAlert.classList.remove('d-none');
      refetch();
    }, (error, code) => {
      alert(`${code}: ${error}`);
    })
  }

  var nameOnAccountLabel = "Crypto Wallet Address";
  var nameOnAccountDisplay = "";

  var routingNumberLabel = "Routing Number / Swift Code";
  var routingNumberDisplay = "d-none";

  var accountNumberLabel = "Account Number";
  var accountNumberDisplay = "d-none";

  var otherLabel = "Bank Name";
  var otherDisplay = "d-none";

  if (activeItem.merchantId == 2) {
    nameOnAccountLabel = "Nobile Number";
    routingNumberLabel = "E-Mail";
    routingNumberDisplay = "";
    accountNumberLabel = "Name";
    accountNumberDisplay = "";
  }

  if (activeItem.merchantId == 3) {
    nameOnAccountLabel = "Name on Account";
    routingNumberDisplay = "";
    accountNumberDisplay = "";
    otherDisplay = "";
  }

  return <PageHeader preTitle="Account" title={data?.customers[0].fullName} pageId="account" customerId={params.customerId}>
    <AccountNav pageId="moneyout" loading={loading} customerId={params.customerId} treeData={data?.trees} >

      <div className="card-body">
        <div className="row">
          <div className="col-12">
            <div id="passwordSuccess" className="alert alert-success d-none" role="alert">
              Your account has been upated!
            </div>
          </div>
          <div className="col-12">
            <div className="mb-3">
              <label className="form-label">Merchant</label>
              <select className="form-select" name="merchantId" value={activeItem.merchantId} onChange={(e) => handleChange(e.target.name, e.target.value)}>
                <option value="1">Crypto</option>
                <option value="2">MaxiCash</option>
                <option value="3">Bank</option>
              </select>
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-12">
            <div className="mb-3">
              <label className={`form-label ${nameOnAccountDisplay}`}>{nameOnAccountLabel}</label>
              <input className={`form-control ${nameOnAccountDisplay}`} name="nameOnAccount" value={activeItem.nameOnAccount} onChange={(e) => handleChange(e.target.name, e.target.value)} autoComplete="off" />
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-12">
            <div className="mb-3">
              <label className={`form-label ${routingNumberDisplay}`}>{routingNumberLabel}</label>
              <input className={`form-control ${routingNumberDisplay}`} name="routingNumber" value={activeItem.routingNumber} onChange={(e) => handleChange(e.target.name, e.target.value)} autoComplete="off" />
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-12">
            <div className="mb-3">
              <label className={`form-label ${accountNumberDisplay}`}>{accountNumberLabel}</label>
              <input className={`form-control ${accountNumberDisplay}`} name="accountNumber" value={activeItem.accountNumber} onChange={(e) => handleChange(e.target.name, e.target.value)} autoComplete="off" />
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-12">
            <div className="mb-3">
              <label className={`form-label ${otherDisplay}`}>{otherLabel}</label>
              <input className={`form-control ${otherDisplay}`} name="other" value={activeItem.other} onChange={(e) => handleChange(e.target.name, e.target.value)} autoComplete="off" />
              <span className="text-danger"></span>
            </div>
          </div>
        </div>
      </div>
      <div className="card-footer bg-transparent">
        <div className="col d-flex justify-content-end">
          <button type="submit" className="btn btn-primary" onClick={handleSubmit} >Update Account</button>
        </div>
      </div>
    </AccountNav>
  </PageHeader>
}

export default CustomerMoneyOut;