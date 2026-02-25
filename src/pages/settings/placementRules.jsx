import React, { useState } from "react";
import PageHeader from "../../components/pageHeader";
import { useQuery, gql } from "@apollo/client";
import Modal from "../../components/modal";
import SettingsNav from "./settingsNav";
import Switch from "../../components/switch";
import NumericInput from "../../components/numericInput";
import Editor from "../../components/editor";
import { SendRequest } from "../../hooks/usePost";
import DataError from "../../components/dataError";


var GET_DATA = gql`query {
  trees {
    id
    legNames
    name
    isPrivate
    buildPattern
    enableCustomerLegPreference
    enableCustomerMovements
    customerMovementWarning
    customerMovementConfirmation
    movementDurationInDays
    maximumAllowedMovementLevels
    enableHoldingTank
    holdingTankDurationInDays
  }
}`;

const PlacementRules = () => {
  const [showModal, setShowModal] = useState(false);
  const [activeItem, setActiveItem] = useState();
  const [overrideMovementWarning, setOverrideMovementWarning] = useState(false);
  const [overrideMovementConfirmation, setOverrideMovementConfirmation] = useState(false);
  const stripHtml = (value) => `${value ?? ""}`
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .trim();
  const isBlankHtml = (value) => !`${value ?? ""}`
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .trim();
  const isBlankText = (value) => !`${value ?? ""}`.trim();
  const activeHasLegNames = Array.isArray(activeItem?.legNames)
    ? activeItem.legNames.length > 0
    : !!activeItem?.legNames;
  const { loading, error, data, refetch } = useQuery(GET_DATA, {
    variables: {},
  });

  if (error) return <DataError error={error} />;

  const handleHide = () => setShowModal(false);
  const handleShow = (id) => {
    var item = data?.trees.find(tree => tree.id == id);
    if (item) {
      item = { ...item, customerMovementConfirmation: stripHtml(item.customerMovementConfirmation) };
      setOverrideMovementWarning(!isBlankHtml(item.customerMovementWarning));
      setOverrideMovementConfirmation(!isBlankText(item.customerMovementConfirmation));
    } else {
      setOverrideMovementWarning(false);
      setOverrideMovementConfirmation(false);
    }
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
        path: "/customerMovementWarning",
        value: overrideMovementWarning ? activeItem.customerMovementWarning : ""
      },
      {
        op: "replace",
        path: "/customerMovementConfirmation",
        value: overrideMovementConfirmation ? activeItem.customerMovementConfirmation : ""
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
                <th>Enable Placement Suite</th>
                <th>Placeable Levels</th>
                <th>Personal Info</th>
                <th className="w-1"></th>
              </tr>
            </thead>
            <tbody>
              {data?.trees && data.trees.map((tree) => {
                const hasLegNames = Array.isArray(tree.legNames)
                  ? tree.legNames.length > 0
                  : !!tree.legNames;

                return <tr key={tree.id}>
                  <td>{tree.name}</td>
                  <td>{hasLegNames ? (tree.enableCustomerLegPreference ? 'Enabled' : 'Disabled') : '-'}</td>
                  <td>{hasLegNames ? (tree.enableHoldingTank ? `${tree.holdingTankDurationInDays} days` : 'Disabled') : '-'}</td>
                  <td>{hasLegNames ? '-' : (tree.enableCustomerMovements ? `${tree.movementDurationInDays} days` : 'Disabled')}</td>
                  <td>{hasLegNames ? '-' : (tree.enableCustomerMovements ? `${tree.maximumAllowedMovementLevels} levels` : 'Disabled')}</td>
                  <td><span>{tree.isPrivate ?? false ? 'Hidden' : 'Visible'}</span></td>
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
        {activeHasLegNames ? <>
          <div className="mb-3">
            <Switch title="Leg preference" name="enableCustomerLegPreference" value={activeItem?.enableCustomerLegPreference} onChange={handleChange} />
            <small className="form-hint">Allows customers to select the desired leg for the automatic placement of new enrollments.</small>
          </div>
          <div className="mb-3 mb-3 border-top pt-3">
            <Switch title="Holding tank" name="enableHoldingTank" value={activeItem?.enableHoldingTank} onChange={handleChange} />
            <small className="form-hint">Enables customers to delay automatic placement of new enrollments.</small>
          </div>
          {activeItem?.enableHoldingTank && <div className="mb-3 ms-3">
            <label className="form-label">Days in holding tank</label>
            <NumericInput name="holdingTankDurationInDays" value={activeItem?.holdingTankDurationInDays} onChange={handleChange} />
          </div>}
        </> : <>
          <div className="mb-3">
            <Switch title="Enable placement suite" name="enableCustomerMovements" value={activeItem?.enableCustomerMovements} onChange={handleChange} />
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
            <div className="mb-3 ms-3">
              <Switch
                title="Override default disclaimer"
                name="overrideMovementWarning"
                value={overrideMovementWarning}
                onChange={(_name, value) => setOverrideMovementWarning(value)}
              />
            </div>
            {overrideMovementWarning && <div className="mb-3 ms-4">
              <label className="form-label">Placement Suite Disclaimer</label>
              <Editor
                name="customerMovementWarning"
                value={activeItem?.customerMovementWarning ?? ""}
                mode="tiny"
                height={220}
                onChange={handleChange}
              />
            </div>}
            <div className="mb-3 ms-3">
              <Switch
                title="Override default confirmation"
                name="overrideMovementConfirmation"
                value={overrideMovementConfirmation}
                onChange={(_name, value) => setOverrideMovementConfirmation(value)}
              />
            </div>
            {overrideMovementConfirmation && <div className="mb-3 ms-4">
              <label className="form-label">Placement Confirmation</label>
              <textarea
                className="form-control"
                name="customerMovementConfirmation"
                rows="3"
                placeholder="Leave blank to use the system default confirmation."
                value={activeItem?.customerMovementConfirmation ?? ""}
                onChange={(e) => handleChange(e.target.name, e.target.value)}
              />
            </div>}
          </>}
        </>}
        <div className="mb-3 border-top pt-3">
          <Switch
            title="Allow customer personal info"
            name="showCustomerDetails"
            value={!activeItem?.isPrivate}
            onChange={(_name, value) => handleChange("isPrivate", !value)}
          />
          <small className="form-hint">Allows customers to view personal information for customers in their downline in this tree, including email, birth date, phone numbers, and addresses.</small>
          <small className="form-hint d-block mt-1">If customers are in multiple trees, visibility is allowed if any tree allows it.</small>
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
