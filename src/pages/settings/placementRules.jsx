import React, { useState } from "react";
import PageHeader from "../../components/pageHeader";
import { useQuery, gql } from "@apollo/client";
import Modal from "../../components/modal";
import SettingsNav from "./settingsNav";
import Switch from "../../components/switch";
import NumericInput from "../../components/numericInput";
import { SendRequest } from "../../hooks/usePost";


var GET_DATA = gql`query {
  trees {
    id
    legNames
    name
    isPrivate
    buildPattern
    enableCustomerLegPreference
    enableCustomerMovements
    movementDurationInDays
    maximumAllowedMovementLevels
    enableHoldingTank
    holdingTankDurationInDays
  }
}`;

const PlacementRules = () => {
  const [showModal, setShowModal] = useState(false);
  const [activeItem, setActiveItem] = useState();
  const { loading, error, data, refetch } = useQuery(GET_DATA, {
    variables: {},
  });

  if (error) return `Error! ${error}`;

  const handleHide = () => setShowModal(false);
  const handleShow = (id) => {
    var item = data?.trees.find(tree => tree.id == id);
    setActiveItem(item);
    setShowModal(true);
  }

  const handleChange = (name, value) => {
    setActiveItem(v => ({ ...v, [name]: value }));
  }

  const handleSubmit = () => {

    let item = [
      {
        op: "replace",
        path: "/enableCustomerLegPreference",
        value: activeItem.enableCustomerLegPreference
      },
      {
        op: "replace",
        path: "/enableCustomerMovements",
        value: activeItem.enableCustomerMovements
      },
      {
        op: "replace",
        path: "/movementDurationInDays",
        value: activeItem.movementDurationInDays
      },
      {
        op: "replace",
        path: "/maximumAllowedMovementLevels",
        value: activeItem.maximumAllowedMovementLevels
      },
      {
        op: "replace",
        path: "/enableHoldingTank",
        value: activeItem.enableHoldingTank
      },
      {
        op: "replace",
        path: "/holdingTankDurationInDays",
        value: activeItem.holdingTankDurationInDays
      },
      {
        op: "replace",
        path: "/isPrivate",
        value: activeItem.isPrivate
      }
    ];

    SendRequest("PATCH", `/api/v1/trees/${activeItem.id}`, item, () => {
      setShowModal(false);
      refetch();
    }, (error, code) => {
      alert(`${code}: ${error}`);
    })
  }

  return <>
    <PageHeader title="Placement Rules" preTitle="Settings">
      <SettingsNav loading={loading} pageId="trees">
        <div className="card-header">
          <span className="card-title">Placement Rules</span>
        </div>
        <div className="table-responsive">
          <table className="table card-table table-vcenter text-nowrap datatable">
            <thead>
              <tr>
                <th>Tree</th>
                <th>Leg Preference</th>
                <th>Holding Tank</th>
                <th>Allow Movements</th>
                <th>Placeable Levels</th>
                <th>Hide Customer Details</th>
                <th className="w-1"></th>
              </tr>
            </thead>
            <tbody>
              {data?.trees && data.trees.map((tree) => {
                return <tr key={tree.id}>
                  <td>{tree.name}</td>
                  <td>{tree.enableCustomerLegPreference ? 'Enabled' : 'Disabled'}</td>
                  <td>{tree.enableHoldingTank ? `${tree.holdingTankDurationInDays} days` : 'Disabled'}</td>
                  <td>{tree.enableCustomerMovements ? `${tree.movementDurationInDays} days` : 'Disabled'}</td>
                  <td>{tree.enableCustomerMovements && `${tree.maximumAllowedMovementLevels} levels`}</td>
                  <td>{(tree.isPrivate ?? false) && <span>Yes</span>}</td>
                  <td>
                    <button className="btn btn-ghost-secondary btn-icon" onClick={() => handleShow(`${tree.id}`)} >
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
                    </button>
                  </td>
                </tr>
              })}
            </tbody>
          </table>
        </div>

      </SettingsNav>
    </PageHeader>

    <Modal showModal={showModal} onHide={handleHide}>
      <div className="modal-header">
        <h5 className="modal-title">Update placement rules</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <div className="mb-3">
          <Switch title="Leg preference" name="enableCustomerLegPreference" value={activeItem?.enableCustomerLegPreference} onChange={handleChange} />
          <small className="form-hint">Allows customers to select the desired leg for the automatic placement of new enrollments.</small>
        </div>
        <div className="mb-3">
          <Switch title="Holding tank" name="enableHoldingTank" value={activeItem?.enableHoldingTank} onChange={handleChange} />
          <small className="form-hint">Enables customers to delay automatic placement of new enrollments.</small>
        </div>
        {activeItem?.enableHoldingTank && <div className="mb-3 ms-3">
          <label className="form-label">Days in holding tank</label>
          <NumericInput name="holdingTankDurationInDays" value={activeItem?.holdingTankDurationInDays} onChange={handleChange} />
        </div>}
        <div className="mb-3">
          <Switch title="Allow movements" name="enableCustomerMovements" value={activeItem?.enableCustomerMovements} onChange={handleChange} />
          <small className="form-hint">Allows customers change placements once a placement is made.</small>
        </div>
        {activeItem?.enableCustomerMovements && <>
          <div className="mb-3 ms-3">
            <label className="form-label">Days to allow movements</label>
            <NumericInput name="movementDurationInDays" value={activeItem?.movementDurationInDays} onChange={handleChange} />
          </div>
          <div className="mb-3 ms-3">
            <label className="form-label">Placeable levels</label>
            <NumericInput name="maximumAllowedMovementLevels" value={activeItem?.maximumAllowedMovementLevels} onChange={handleChange} />
          </div>
        </>}
        <div className="mb-3">
          <Switch title="Hide customer details" name="isPrivate" value={activeItem?.isPrivate} onChange={handleChange} />
          <small className="form-hint">When enabled, personal information will not be displayed for customers in <i>this</i> tree only.</small>
        </div>
      </div>
      <div className="modal-footer">
        <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
          Cancel
        </a>
        <button type="submit" className="btn btn-primary ms-auto" onClick={handleSubmit}>
          Save
        </button>
      </div>
    </Modal>
  </>
}

export default PlacementRules;