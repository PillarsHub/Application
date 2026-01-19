import React, { useState } from 'react';
import PageHeader from "../../components/pageHeader";
import Modal from "../../components/modal";
import { useFetch } from "../../hooks/useFetch";
import { SendRequest } from "../../hooks/usePost";
import SettingsNav from './settingsNav';
import TextInput from "../../components/textInput"

const Currency = () => {
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState();
  const [activeItem, setActiveItem] = useState({});
  const { data, loading, error: error, refetch } = useFetch('/api/v1/currencies', { offset: 0, count: 100 });

  if (error) return `Error! ${error}`;

  const handleChange = (name, value) => {
    setActiveItem(values => ({ ...values, [name]: value }))
  }

  const handleClose = () => setShow(false);
  const handleShow = (id) => {
    var item = data.find(element => element.iso3 == id);
    if (item === undefined) item = { iso3: id, name: '', symbol: '', exchangeRate: 1, decimalLength: 0, isNew: true };
    setActiveItem(item);
    setShow(true);
  }

  const handleSubmit = async e => {
    e.preventDefault();
    setErrors();

    if (!activeItem.iso3) setErrors(e => ({ ...e, iso3: "Currency Code is required" }));
    if (!activeItem.name) setErrors(e => ({ ...e, name: "Name is required" }));

    if (activeItem.iso3 && activeItem.name) {
      setShow(false);
      var url = "/api/v1/currencies/" + activeItem.iso3;
      SendRequest("PUT", url, activeItem, () => {
        refetch();
      }, (error) => {
        setErrors(error);
      });
    }
  }


  return <PageHeader preTitle="Settings" title="Currency">
    <SettingsNav loading={loading} pageId='currency'>
      <div className="card-header">
        <span className="card-title">Currency Info</span>
      </div>
      <div className="table-responsive">
        <table className="table card-table table-vcenter text-nowrap datatable">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Symbol</th>
              <th>Exchange Rate</th>
              <th>Decimal Length</th>
              <th className="w-1"></th>
            </tr>
          </thead>
          <tbody>
            {data && data.map((item) => {
              return <tr key={item.iso3}>
                <td>{item.iso3}</td>
                <td>{item.name}</td>
                <td>{item.symbol}</td>
                <td>{item.exchangeRate}</td>
                <td>{item.decimalLength}</td>
                <td>
                  <button type="submit" className="btn btn-ghost-secondary btn-icon" onClick={() => handleShow(`${item.iso3}`)} >
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
              <td colSpan="6" className="text-end">
                <button className="btn btn-primary" onClick={() => handleShow('')}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-coins" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M9 14c0 1.657 2.686 3 6 3s6 -1.343 6 -3s-2.686 -3 -6 -3s-6 1.343 -6 3z"></path><path d="M9 14v4c0 1.656 2.686 3 6 3s6 -1.344 6 -3v-4"></path><path d="M3 6c0 1.072 1.144 2.062 3 2.598s4.144 .536 6 0c1.856 -.536 3 -1.526 3 -2.598c0 -1.072 -1.144 -2.062 -3 -2.598s-4.144 -.536 -6 0c-1.856 .536 -3 1.526 -3 2.598z"></path><path d="M3 6v10c0 .888 .772 1.45 2 2"></path><path d="M3 11c0 .888 .772 1.45 2 2"></path></svg>
                  Add Currency
                </button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </SettingsNav>

    <Modal showModal={show} onHide={handleClose} >
      <div className="modal-header">
        <h5 className="modal-title">Currency</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">

        <div className="row">
          <div className="col-md-12">
            <div className="mb-3">
              <label className="form-label">Currency Code</label>
              <TextInput name="iso3" value={activeItem.iso3} errorText={errors?.iso3} onChange={handleChange} />
            </div>
          </div>
          <div className="col-md-12">
            <div className="mb-3">
              <label className="form-label">Name</label>
              <TextInput name="name" value={activeItem.name} errorText={errors?.name} onChange={handleChange} />
            </div>
          </div>
          <div className="col-md-4">
            <div className="mb-3">
              <label className="form-label">Symbol</label>
              <TextInput name="symbol" value={activeItem.symbol} onChange={handleChange} />
            </div>
          </div>
          <div className="col-md-4">
            <div className="mb-3">
              <label className="form-label">Decimal Length</label>
              <TextInput name="decimalLength" value={activeItem.decimalLength} onChange={handleChange} />
            </div>
          </div>
          <div className="col-md-4">
            <div className="mb-3">
              <label className="form-label">Exchange Rate</label>
              <TextInput name="exchangeRate" value={activeItem.exchangeRate} onChange={handleChange} />
            </div>
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
          Cancel
        </a>
        <button type="submit" className="btn btn-primary ms-auto" onClick={handleSubmit}>
          Save Currency
        </button>
      </div>
    </Modal>

  </PageHeader>
}

export default Currency;