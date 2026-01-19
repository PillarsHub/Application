import React from "react-dom/client";
import { useState } from 'react';
import PageHeader from "../../components/pageHeader";
import Modal from "../../components/modal";
import { useFetch } from "../../hooks/useFetch";
import { SendRequest } from "../../hooks/usePost";
import SettingsNav from "./settingsNav";


const SalesTax = () => {
  const [show, setShow] = useState(false);
  const [activeItem, setActiveItem] = useState({});
  const { data, loading, error, refetch } = useFetch('/api/v1/taxClasses');

  if (error) return `Error! ${error}`;

  const handleChange = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setActiveItem(values => ({ ...values, [name]: value }))
  }

  const handleClose = () => setShow(false);
  const handleShow = (id) => {
    var item = data.find(element => element.id == id);
    if (item === undefined) item = { id: id, description: '', taxCode: '', isNew: true };
    setActiveItem(item);
    setShow(true);
  }

  const handleSubmit = async e => {
    e.preventDefault();
    setShow(false);

    var url = "/api/v1/taxClasses";
    var method = "POST";

    if (!activeItem.isNew) {
      url += `/${activeItem.id}`;
      method = "PUT";
    }

    SendRequest(method, url, activeItem, () => {
      refetch();
    }, (error) => {
      alert(error);
    });
  }


  return <PageHeader preTitle="Settings" title="Sales Tax">
    <SettingsNav loading={loading} pageId="salesTax" >
      <div className="card-header">
        <span className="card-title">Sales Tax</span>
      </div>
      <div className="table-responsive">
        <table className="table card-table table-vcenter text-nowrap datatable">
          <thead>
            <tr>
              <th>Tax Class</th>
              <th>Description</th>
              <th>Tax Code</th>
              <th className="w-1"></th>
            </tr>
          </thead>
          <tbody>
            {data && data.map((item) => {
              return <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.description}</td>
                <td>{item.taxCode}</td>
                <td>
                  <button type="submit" className="btn btn-ghost-secondary btn-icon" onClick={() => handleShow(`${item.id}`)} >
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-receipt-tax" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M9 14l6 -6"></path><circle cx="9.5" cy="8.5" r=".5" fill="currentColor"></circle><circle cx="14.5" cy="13.5" r=".5" fill="currentColor"></circle><path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16l-3 -2l-2 2l-2 -2l-2 2l-2 -2l-3 2"></path></svg>
                  Add Tax Class
                </button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </SettingsNav>

    <Modal showModal={show} onHide={handleClose} >
      <div className="modal-header">
        <h5 className="modal-title">Sales Tax Class</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <div className="row">
          <div className="col-md-12">
            <div className="mb-3">
              <label className="form-label">Tax Class</label>
              <input className="form-control" name="id" value={activeItem.id || ""} onChange={handleChange} />
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-md-12">
            <div className="mb-3">
              <label className="form-label">Description</label>
              <input className="form-control" name="description" value={activeItem.description || ""} onChange={handleChange} />
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-md-12">
            <div className="mb-3">
              <label className="form-label">Tax Code</label>
              <input className="form-control" name="taxCode" value={activeItem.taxCode || ""} onChange={handleChange} />
              <span className="text-danger"></span>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
          Cancel
        </a>
        <button type="submit" className="btn btn-primary ms-auto" onClick={handleSubmit}>
          Save Tax
        </button>
      </div>
    </Modal>

  </PageHeader>
}

export default SalesTax;