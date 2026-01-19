import React from "react-dom/client";
import { useState } from 'react';
import { useQuery, gql } from "@apollo/client";
import PageHeader from "../../components/pageHeader.jsx";
import Modal from "../../components/modal.jsx";
import TextInput from "../../components/textInput.jsx";
import SelectInput from "../../components/selectInput.jsx";
import Switch from "../../components/switch.jsx";
import { SendRequest } from "../../hooks/usePost.js";
import SettingsNav from "./settingsNav.jsx";


var GET_STATUSES = gql`query {
  customerStatuses {
    id
    name
    statusClass
    earningsClass
    treeSettings{
      treeId
      compress
    }
  }
  trees {
    id
    name
    legNames
  }
}`

const Statuses = () => {
  const [show, setShow] = useState(false);
  const [activeItem, setActiveItem] = useState({});
  const { loading, error, data, refetch } = useQuery(GET_STATUSES, {
    variables: {},
  });

  if (error) return `Error! ${error}`;

  const handleChange = (name, value) => {
    setActiveItem(values => ({ ...values, [name]: value }))
  }

  const handleTreeSettingsChange = (treeId, value) => {
    setActiveItem(values => {
      const current = values.treeSettings ?? [];
      const numericTreeId = Number(treeId);

      const exists = current.some(s => s.treeId === numericTreeId);

      return {
        ...values,
        treeSettings: exists
          ? current.map(setting =>
            setting.treeId === numericTreeId
              ? { ...setting, compress: value }
              : setting
          )
          : [
            ...current,
            { __typename: "TreeSettings", treeId: numericTreeId, compress: value }
          ]
      };
    });
  };

  const handleClose = () => setShow(false);
  const handleShow = (id) => {
    var item = data.customerStatuses.find(element => element.id == id);
    if (item === undefined) item = { id: id, name: '', statusClass: "Active", earningsClass: "Release", isNew: true };
    setActiveItem(item);
    setShow(true);
  }

  const handleSubmit = async e => {
    e.preventDefault();

    var url = "/api/v1/statuses";
    var method = "POST";

    if (!activeItem.isNew) {
      url += `/${activeItem.id}`;
      method = "PUT";
    }

    SendRequest(method, url, activeItem, () => {
      refetch();
      setShow(false);
    }, (error) => {
      alert(error);
    });
  }

  return <PageHeader preTitle="Settings" title="Customer Statuses">
    <SettingsNav loading={loading} pageId="statuses">
      <div className="card-header">
        <span className="card-title">Customer Statuses</span>
      </div>
      <div className="table-responsive">
        <table className="table card-table table-vcenter text-nowrap datatable">
          <thead>
            <tr>
              <th>Status Name</th>
              <th>Status Class</th>
              <th>Commission Status</th>
              {/* <th>Status change options</th> */}
              <th className="w-1"></th>
            </tr>
          </thead>
          <tbody>
            {data && data.customerStatuses.map((item) => {
              return <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.statusClass}</td>
                <td>{item.earningsClass}</td>
                {/* <td><span className="text-muted small lh-base"></span></td> */}
                <td>
                  <button className="btn btn-ghost-secondary btn-icon" onClick={() => handleShow(`${item.id}`)} >
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
                  </button>
                  <button className="btn btn-ghost-secondary btn-icon" >
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-trash" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 7l16 0"></path><path d="M10 11l0 6"></path><path d="M14 11l0 6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
                  </button>
                </td>
              </tr>
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="4" className="text-end">
                <button className="btn btn-primary" onClick={() => handleShow('')}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon dropdown-item-icon" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7.5 7.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path><path d="M3 6v5.172a2 2 0 0 0 .586 1.414l7.71 7.71a2.41 2.41 0 0 0 3.408 0l5.592 -5.592a2.41 2.41 0 0 0 0 -3.408l-7.71 -7.71a2 2 0 0 0 -1.414 -.586h-5.172a3 3 0 0 0 -3 3z"></path></svg>
                  Add Customer Status
                </button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </SettingsNav>

    <Modal showModal={show} onHide={handleClose}>
      <div className="modal-header">
        <h5 className="modal-title">Customer Status </h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <div className="row">
          <div className="col-md-8">
            <div className="mb-3">
              <label className="form-label">Name</label>
              <TextInput name="name" value={activeItem.name} onChange={handleChange} />
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-md-4">
            <div className="mb-3">
              <label className="form-label">Id</label>
              <TextInput name="id" value={activeItem.id} onChange={handleChange} disabled={!activeItem.isNew} />
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Status Class</label>
              <SelectInput name="statusClass" value={activeItem.statusClass} onChange={handleChange} >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="DELETED">Deleted</option>
              </SelectInput>
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Commission Status</label>
              <SelectInput name="earningsClass" value={activeItem.earningsClass} onChange={handleChange} >
                <option value="RELEASE">Release</option>
                <option value="HOLD">Hold</option>
                <option value="FORFEIT">Forfeit</option>
              </SelectInput>
              <span className="text-danger"></span>
            </div>
          </div>
          {data?.trees && <div className="col-md-12">
            <div className="mb-3">
              {data.trees.map((tree) => {
                let value = activeItem.treeSettings?.find(s => s.treeId == tree.id)?.compress;
                let title = tree.legNames ? `Remove from ${tree.name} (compress when possible)` : `Remove node from ${tree.name} and compress tree`;
                return <Switch key={tree.id} title={title} name={tree.id} value={value} onChange={handleTreeSettingsChange} />
              })}
            </div>
          </div>}
        </div>
      </div>
      <div className="modal-footer">
        <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
          Cancel
        </a>
        <button type="submit" className="btn btn-primary ms-auto" onClick={handleSubmit}>
          Save Status
        </button>
      </div>
    </Modal>
  </PageHeader>
}

export default Statuses;