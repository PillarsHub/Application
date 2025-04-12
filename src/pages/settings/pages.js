import React, { useState } from "react";
import { useQuery, gql } from "@apollo/client";
import { useFetch } from "../../hooks/useFetch";
import { SendRequest } from "../../hooks/usePost";
import PageHeader from "../../components/pageHeader";
import SettingsNav from "./settingsNav";
import Modal from "../../components/modal";
import TextInput from "../../components/textInput";
import SelectInput from "../../components/selectInput";
import TextArea from "../../components/textArea";

var GET_DATA = gql`query {
  trees {
    id
    name
  }
}`;

const Pages = () => {
  const [activeItem, setActiveItem] = useState();
  const [deleteItem, setDeleteItem] = useState();
  const { loading, error, data } = useQuery(GET_DATA, { variables: {} });
  const { data: dashboards, loading: dashLoading, error: dashError, refetch } = useFetch("/api/v1/Dashboards");

  const handleHideDelete = () => setDeleteItem();
  const handleShowDelete = (id) => {
    setDeleteItem({ id: id });
  }

  const handleClose = () => setActiveItem();
  const handleShow = () => {
    var newName = 'NewPage';
    var newId = generateDashboardId(newName, dashboards);
    setActiveItem({ id: newId, name: newName, type: "Customer" });
  }

  const handleChange = (name, value) => {
    setActiveItem(values => {
      const updated = { ...values, [name]: value };

      if (name === 'name') {
        updated.id = generateDashboardId(value, dashboards);
      }

      return updated;
    });
  };

  const handleSubmit = () => {
    SendRequest("PUT", `/api/v1/Dashboards/${activeItem.id}`, activeItem, () => {
      setActiveItem();
      refetch();
    }, (error) => {
      alert(error);
    });
  }

  const handleDelete = () => {
    SendRequest("DELETE", `/api/v1/Dashboards/${deleteItem.id}`, {}, () => {
      setDeleteItem();
      refetch();
    }, (error) => {
      alert(error);
    });
  }

  return <>
    <PageHeader title="Pages" preTitle="Settings">
      <SettingsNav title="Pages" loading={loading || dashLoading} error={error || dashError} pageId="pages">
        <div className="card-header">
          <span className="card-title">Pages</span>
        </div>
        <div className="table-responsive">
          <table className="table card-table table-vcenter text-nowrap datatable table-ellipsis">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Type</th>
                <th className="w-1"></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Dashboard</td>
                <td>Customer Dashboard</td>
                <td>System</td>
                <td className="text-end">
                  <a className="btn btn-ghost-secondary btn-icon" href={`/settings/pages/dashboard`} >
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
                  </a>
                  <button className="btn btn-ghost-secondary btn-icon muted" disabled >
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-trash" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 7l16 0"></path><path d="M10 11l0 6"></path><path d="M14 11l0 6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
                  </button>
                </td>
              </tr>
              <tr>
                <td>Customer Details</td>
                <td>Customer Details</td>
                <td>System</td>
                <td className="text-end">
                  <a className="btn btn-ghost-secondary btn-icon" href={`/settings/pages/customer`} >
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
                  </a>
                  <button className="btn btn-ghost-secondary btn-icon muted" disabled >
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-trash" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 7l16 0"></path><path d="M10 11l0 6"></path><path d="M14 11l0 6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
                  </button>
                </td>
              </tr>
              <tr>
                <td>Earnings</td>
                <td>Customer Earnings</td>
                <td>System</td>
                <td className="text-end">
                  <a className="btn btn-ghost-secondary btn-icon" href={`/settings/pages/earnings`} >
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
                  </a>
                  <button className="btn btn-ghost-secondary btn-icon muted" disabled >
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-trash" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 7l16 0"></path><path d="M10 11l0 6"></path><path d="M14 11l0 6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
                  </button>
                </td>
              </tr>
              <tr>
                <td>Orders</td>
                <td>Customer Orders</td>
                <td>System</td>
                <td className="text-end">
                  <a className="btn btn-ghost-secondary btn-icon" href={`/settings/pages/orders`} >
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
                  </a>
                  <button className="btn btn-ghost-secondary btn-icon muted" disabled >
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-trash" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 7l16 0"></path><path d="M10 11l0 6"></path><path d="M14 11l0 6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
                  </button>
                </td>
              </tr>
              {data && data.trees && data.trees.map((tree) => {
                return <tr key={`tree_${tree.id}`}>
                  <td>{tree.name} Tree</td>
                  <td>Customer {tree.name} Tree</td>
                  <td>System</td>
                  <td className="text-end">
                    <a className="btn btn-ghost-secondary btn-icon" href={`/settings/pages/tree/${tree.id}`} >
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
                    </a>
                    <button className="btn btn-ghost-secondary btn-icon muted" disabled >
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-trash" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 7l16 0"></path><path d="M10 11l0 6"></path><path d="M14 11l0 6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
                    </button>
                  </td>
                </tr>
              })}
              {dashboards && dashboards.filter(b => b.type != 'System').map((b => {
                return <tr key={`tree_${b.id}`}>
                  <td>{b.name}</td>
                  <td>{b.description}</td>
                  <td>{b.type}</td>
                  <td className="text-end">
                    <a className="btn btn-ghost-secondary btn-icon" href={`/settings/pages/${b.id}`} >
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
                    </a>
                    <button className="btn btn-ghost-secondary btn-icon" onClick={() => handleShowDelete(b.id)} >
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-trash" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 7l16 0"></path><path d="M10 11l0 6"></path><path d="M14 11l0 6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
                    </button>
                  </td>
                </tr>
              }))}

            </tbody>
            <tfoot>
              <tr>
                <td colSpan="5" className="text-end">
                  <button className="btn btn-primary" onClick={() => handleShow('')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-device-ipad-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12.5 21h-6.5a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v7" /><path d="M9 18h3" /><path d="M16 19h6" /><path d="M19 16v6" /></svg>
                    Add Page
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </SettingsNav>

      <Modal showModal={activeItem != null} onHide={handleClose} >
        {activeItem && <>
          <div className="modal-header">
            <h5 className="modal-title">Add Page</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <div className="row">
              <div className="col-md-8">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <TextInput name="name" value={activeItem?.name} onChange={handleChange} />
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Type</label>
                  <SelectInput name="type" value={activeItem.type} onChange={handleChange} >
                    <option value="Corporate">Corporate</option>
                    <option value="Customer">Customer</option>
                  </SelectInput>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="mb-12">
                <label className="form-label">Description</label>
                <TextArea name="description" value={activeItem?.description} onChange={handleChange} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
              Cancel
            </a>
            <button className="btn btn-primary ms-auto" onClick={handleSubmit}>
              Create Page
            </button>
          </div>
        </>}
      </Modal>

      <Modal showModal={deleteItem != null} size="sm" onHide={handleHideDelete} >
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        <div className="modal-status bg-danger"></div>
        <div className="modal-body text-center py-4">
          <h3>Are you sure?</h3>
          <div className="text-muted">Do you really want to remove <strong>{JSON.stringify(deleteItem)}</strong></div>
        </div>
        <div className="modal-footer">
          <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
            Cancel
          </a>
          <button type="submit" className="btn btn-danger ms-auto" onClick={handleDelete}>
            Delete Page
          </button>
        </div>
      </Modal>

    </PageHeader>
  </>
}

function generateDashboardId(name, dashboards) {
  if (!name) return '';

  const baseId = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_') // replace non-alphanumeric with _
    .replace(/^_+|_+$/g, '');    // remove leading/trailing _

  let candidate = baseId;
  let counter = 1;

  const existingIds = new Set(dashboards.map(d => d.id.toLowerCase()));

  while (existingIds.has(candidate)) {
    candidate = `${baseId}_${counter++}`;
  }

  return candidate;
}



export default Pages;