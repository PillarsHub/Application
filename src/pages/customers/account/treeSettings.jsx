import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"
import { useQuery, gql } from "@apollo/client";
import { SendRequest } from "../../../hooks/usePost.js";
import PageHeader from "../../../components/pageHeader.jsx";
import AccountNav from "./accountNav.jsx";
import Switch from "../../../components/switch.jsx";
import DataLoading from "../../../components/dataLoading.jsx";
import DataError from "../../../components/dataError.jsx";

var GET_DATA = gql`query ($nodeIds: [String]!) {
  customers (idList: $nodeIds) {
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
    treePreferences {
      buildRule
      holdingTank
      treeId
    }
  }
  trees {
    id
    legNames
    name
    buildPattern
    enableCustomerLegPreference
    enableHoldingTank
    holdingTankDurationInDays
  }
}`;

const CustomerTreeSettings = () => {
  const [preferences, setPreferences] = useState([]);
  //const [holdingTank, setHoldingTank] = useState();
  let params = useParams();
  //const { loading, error, data, refetch } = useFetch(`/api/v1/NodeSettings/${params.customerId}`);
  const { loading, error, data, refetch } = useQuery(GET_DATA, {
    variables: { nodeIds: [params.customerId] },
  });

  useEffect(() => {
    if (data) {
      setPreferences(data?.customers[0].treePreferences)
    }
  }, [data])

  if (loading) return <DataLoading />
  if (error) return <DataError error={error} />

  const handleChange = (treeId, name, value) => {
    setPreferences(prevPreferences => {
      const updatedTreePreferences = prevPreferences.map(treePreference => {
        if (treePreference.treeId == treeId) {
          return { ...treePreference, [name]: value };
        }
        return treePreference;
      });

      if (!updatedTreePreferences.some(treePreference => treePreference.treeId == treeId)) {
        updatedTreePreferences.push({
          treeId: treeId,
          [name]: value,
        });
      }

      return updatedTreePreferences;
    });
  };

  const handleSubmit = () => {
    SendRequest("PUT", `/api/v1/NodeSettings/${params.customerId}`, { treePreferences: preferences }, () => {
      var successAlert = document.getElementById('passwordSuccess');
      successAlert.classList.remove('d-none');
      refetch();
    }, (error) => {
      alert(error);
    });
  }

  const buildRules = ["Left", "Right"]

  //let treePreference = data?.treePreferences ? data?.treePreferences[0] : null;

  //var leg = preference ?? treePreference?.buildRule ?? 'Left';
  //var ht = holdingTank ?? treePreference?.holdingTank ?? true;

  return <PageHeader preTitle="Account" title={data?.customers[0].fullName} pageId="account" customerId={params.customerId}>
    <AccountNav pageId="treeSettings" loading={loading} customerId={params.customerId} treeData={data?.trees} >

      {data?.trees && data.trees.map((tree) => {
        if (tree.enableCustomerLegPreference) {
          var holdingTankLength = tree.holdingTankDurationInDays > 2 ? tree.holdingTankDurationInDays + " days" : (tree.holdingTankDurationInDays * 24) + " hours"
          var preference = preferences.find(preference => preference.treeId == tree.id) ?? {}

          return <div className="card-body" key={tree.id}>
            <h1 className="card-title mb-3">{tree.name} Tree Placement Rule</h1>
            {tree.enableCustomerLegPreference && <div className="mb-3">
              <div className="form-selectgroup form-selectgroup-boxes d-flex flex-column">
                {buildRules && buildRules.map((legName) => {
                  return <>
                    <label className="form-selectgroup-item flex-fill">
                      <input type="radio" name="buildRule" value={legName.toUpperCase()} className="form-selectgroup-input" checked={preference.buildRule?.toUpperCase() === legName?.toUpperCase()} onChange={(e) => handleChange(tree.id, e.target.name, e.target.value)} />
                      <div className="form-selectgroup-label d-flex align-items-center p-3">
                        <div className="me-3 mb-1">
                          <span className="form-selectgroup-check"></span>
                        </div>
                        <div>
                          Place on <strong>{legName} Leg</strong>
                        </div>
                      </div>
                    </label>
                  </>
                })}
              </div>
            </div>}

            {tree.enableHoldingTank && <div className="mb-3">
              <Switch className="form-check-input" name="holdingTank" value={preference.holdingTank} onChange={(name, value) => handleChange(tree.id, name, value)} title={`Delay placement for ${holdingTankLength}`} />
              <small className="form-hint">When this is selected, any new enrollments will be placed in the Holding Tank to be placed manually.</small>
            </div>}
          </div>
        }
      })}

      <div className="card-footer bg-transparent">
        <div id="passwordSuccess" className="alert alert-success d-none" role="alert">
          Your preference has been upated!
        </div>
        <div className="col d-flex justify-content-end">
          <button type="submit" className="btn btn-primary" onClick={handleSubmit} >Update Preference</button>
        </div>
      </div>

    </AccountNav>
  </PageHeader>
}

export default CustomerTreeSettings;