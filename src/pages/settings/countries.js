import React from "react-dom/client";
import { useState } from 'react';
import { useQuery, gql } from "@apollo/client";
import PageHeader from "../../components/pageHeader";
import Modal from "../../components/modal";
import { SendRequest } from "../../hooks/usePost";
import MultiSelect from "../../components/muliselect";
import Switch from "../../components/switch";
import SettingsNav from "./settingsNav";


var GET_COUNTRIES = gql`query{
    currencies
    {
        iso3
        name
    }
    languages
    {
        iso2
        name
    }
    countries
    {
        iso2
        name
        currency
        taxRate
        addTax
        languages
        active
    }
}`;


const Countries = () => {
  const [show, setShow] = useState(false);
  const [activeItem, setActiveItem] = useState({});
  const { loading, error, data, refetch } = useQuery(GET_COUNTRIES, {
    variables: {},
  });

  if (error) return `Error! ${error}`;

  const handleChange = (name, value) => {
    setActiveItem(values => ({ ...values, [name]: value }))
  }

  const handleClose = () => setShow(false);
  const handleShow = (id) => {
    var item = data.countries.find(element => element.iso2 == id);
    if (item === undefined) item = { iso2: id, currency: 'usd', isNew: true };
    setActiveItem({
      isNew: item.isNew,
      iso2: item.iso2,
      currency: item.currency,
      taxRate: item.taxRate,
      addTax: item.addTax,
      languages: item.languages,
      active: true
    });
    setShow(true);
  }

  const handleSubmit = async e => {
    e.preventDefault();
    setShow(false);

    activeItem.name = data.countries.find(el => el.iso2 == activeItem.iso2)?.name;

    var url = `/api/v1/countries/${activeItem.iso2}`;
    SendRequest('PUT', url, activeItem, () => {
      refetch();
    }, (error) => {
      alert('Error: ' + error);
    });
  }


  return <PageHeader preTitle="Settings" title="Countries">
    <SettingsNav loading={loading} pageId="countries">
      <div className="card-header">
        <span className="card-title">Countries</span>
      </div>
      <div className="table-responsive">
        <table className="table card-table table-vcenter text-nowrap datatable">
          <thead>
            <tr>
              <th>Country</th>
              <th>Code</th>
              <th>Currency</th>
              <th>Add Tax</th>
              <th>Tax Rate</th>
              <th>Languages</th>
              <th className="w-1"></th>
            </tr>
          </thead>
          <tbody>
            {data && data.countries.map((item) => {
              return item.active ? <tr key={item.iso2}>
                <td>{item.name}</td>
                <td>{item.iso2?.toUpperCase()}</td>
                <td>{data.currencies.find(i => i.iso3 == item.currency)?.name}</td>
                <td>{item.addTax ? 'Yes' : 'No'}</td>
                <td>{item.taxRate}</td>
                <td>
                  {item.languages.map((language) => {
                    return <span className="badge badge-outline text-blue m-1" key={language} >{data.languages.find(i => i.iso2 == language).name}</span>
                  })}
                </td>
                <td>
                  <button type="submit" className="btn btn-ghost-secondary btn-icon" onClick={() => handleShow(`${item.iso2}`)} >
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
                  </button>
                  <button className="btn btn-ghost-secondary btn-icon" >
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-trash" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 7l16 0"></path><path d="M10 11l0 6"></path><path d="M14 11l0 6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
                  </button>
                </td>
              </tr> : <></>
            })}

          </tbody>
          <tfoot>
            <tr>
              <td colSpan="7">
                <div className="row">
                  <div className="col">
                    <small className="form-hint">
                      * &quot;Add Tax&quot; will set the price of all items in that country to include tax in the original price rather than showing tax as a separate item.
                    </small>
                  </div>
                  <div className="col-auto">
                    <button className="btn btn-primary" onClick={() => handleShow('')}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-world-plus" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M20.985 12.518a9 9 0 1 0 -8.45 8.466"></path><path d="M3.6 9h16.8"></path><path d="M3.6 15h11.4"></path><path d="M11.5 3a17 17 0 0 0 0 18"></path><path d="M12.5 3a16.998 16.998 0 0 1 2.283 12.157"></path><path d="M16 19h6"></path><path d="M19 16v6"></path></svg>
                      Add Country
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </SettingsNav>

    <Modal showModal={show} onHide={handleClose} >
      <div className="modal-header">
        <h5 className="modal-title">Country</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <div className="row">
          <div className="col-md-12">
            <div className="mb-3">
              <label className="form-label">Country Name</label>
              <select className="form-select" name="iso2" value={activeItem.iso2 || ""} onChange={(e) => handleChange(e.target.name, e.target.value)} disabled={!activeItem.isNew}>
                {data && data.countries.map((item) => {
                  return <option key={item.iso2} value={item.iso2}>{item.name}</option>
                })}
              </select>
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-md-12">
            <div className="mb-3">
              <label className="form-label">Country Languages <span style={{ fontSize: "smaller" }}>(hold ctrl/option to select multiple)</span></label>
              <div>
                <MultiSelect className="form-select" name="languages" value={activeItem.languages || ""} onChange={handleChange}>
                  {data && data.languages.map((item) => {
                    return <option key={item.iso2} value={item.iso2}>{item.name}</option>
                  })}
                </MultiSelect>
                <span className="text-danger"></span>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Currency</label>
              <div>
                <select className="form-select" name="currency" value={activeItem.currency || ""} onChange={(e) => handleChange(e.target.name, e.target.value)}>
                  {data && data.currencies.map((item) => {
                    return <option key={item.iso3} value={item.iso3}>{item.name}</option>
                  })}
                </select>
                <span className="text-danger"></span>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Tax Rate</label>
              <input className="form-control" name="taxRate" value={activeItem.taxRate || ""} onChange={(e) => handleChange(e.target.name, e.target.value)} autoComplete="off" />
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-md-12">
            <div className="mb-3">
              <div className="divide-y">
                {/* <div>
                  <label className="row">
                    <span className="col">Allow Shop</span>
                    <span className="col-auto">
                      <Switch name="allowShop" value={activeItem.allowShop || ""} onChange={handleChange} />
                    </span>
                    <span className="text-danger"></span>
                  </label>
                </div> */}
                {/* <div>
                  <label className="row">
                    <span className="col">Allow Enroll</span>
                    <span className="col-auto">
                      <Switch name="allowEnroll" value={activeItem.allowEnroll || ""} onChange={handleChange} />
                    </span>
                    <span className="text-danger"></span>
                  </label>
                </div> */}
                <div>
                  <label className="row">
                    <span className="col">Add Tax</span>
                    <span className="col-auto">
                      <Switch name="addTax" value={activeItem.addTax || ""} onChange={handleChange} />
                    </span>
                    <span className="text-danger"></span>
                  </label>
                </div>
                {/* <div>
                  <label className="row">
                    <span className="col">Require FIN</span>
                    <span className="col-auto">
                      <Switch name="requireFIN" value={activeItem.requireFIN || ""} onChange={handleChange} />
                    </span>
                    <span className="text-danger"></span>
                  </label>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
          Cancel
        </a>
        <button type="submit" className="btn btn-primary ms-auto" onClick={handleSubmit}>
          Save Country
        </button>
      </div>
    </Modal>

  </PageHeader>
}

export default Countries;