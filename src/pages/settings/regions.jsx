import React from "react-dom/client";
import { useState } from 'react';
import { useQuery, gql } from "@apollo/client";
import PageHeader from "../../components/pageHeader";
import Modal from "../../components/modal";
import { SendRequest } from "../../hooks/usePost";
import SettingsNav from "./settingsNav";

var GET_REGIONS = gql`query{
  regions
  {
    name
    id
    locales
    {
      countryCode
      country {
         name 
      }
      stateCode
    }
  }
}`

function uniqueByCountry(regions) {
  return [...new Set(regions.map(item => item.country?.name ?? item.countryCode))];
}

const Regions = () => {
  const [show, setShow] = useState(false);
  const [activeItem, setActiveItem] = useState({});
  const { loading, error, data } = useQuery(GET_REGIONS, {
    variables: {},
  });

  if (error) return `Error! ${error}`;

  const handleChange = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setActiveItem(values => ({ ...values, [name]: value }))
  }

  const handleClose = () => setShow(false);
  const handleShow = (id) => {
    var item = data.regions.find(element => element.id == id);
    if (item === undefined) item = { id: id, description: '', taxCode: '', isNew: true };
    setActiveItem(item);
    setShow(true);
  }

  const handleSubmit = async e => {
    e.preventDefault();
    setShow(false);

    var url = "/api/v1/regions";
    var method = "POST";

    if (!activeItem.isNew) {
      url += `/${activeItem.id}`;
      method = "PUT";
    }

    SendRequest(method, url, activeItem, (r) => {
      location = "/Settings/Regions/" + r.id;
    }, (error) => {
      alert(error);
    });
  }


  return <PageHeader preTitle="Settings" title="Regions">
    <SettingsNav pageId="regions" loading={loading}>
      <div className="card-header">
        <span className="card-title">Regions</span>
      </div>
      <div className="table-responsive">
        <table className="table card-table table-vcenter text-nowrap datatable">
          <thead>
            <tr>
              <th>Region</th>
              <th>Countries</th>
              <th className="w-1"></th>
            </tr>
          </thead>
          <tbody>
            {data && data.regions.map((item) => {
              return <tr key={item.id}>
                <td>
                  <a className="text-reset" href={`/Settings/Regions/${item.id}`} >{item.name}</a>
                </td>
                <td>
                  {item.locales && uniqueByCountry(item.locales, data.countries).map((locale) => {
                    return <span className="badge badge-outline text-blue m-1" key={locale}>{locale}</span>
                  })}
                </td>
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
              <td colSpan="3" className="text-end">
                <button className="btn btn-primary" onClick={() => handleShow('')}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-map-plus" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M12 18.5l-3 -1.5l-6 3v-13l6 -3l6 3l6 -3v8.5"></path><path d="M9 4v13"></path><path d="M15 7v8"></path><path d="M16 19h6"></path><path d="M19 16v6"></path></svg>
                  Add Region
                </button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </SettingsNav>

    <Modal showModal={show} onHide={handleClose} >
      <div className="modal-header">
        <h5 className="modal-title">Create Region</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">

        <div className="row">
          <div className="col-md-12">
            <div className="mb-3">
              <label className="form-label">Region Name</label>
              <input className="form-control" name="name" value={activeItem.name || ""} onChange={handleChange} />
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
          Next &gt;
        </button>
      </div>
    </Modal>

  </PageHeader>
}

export default Regions;