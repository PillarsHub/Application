import React from "react-dom/client";
import { useState } from 'react';
import { useQuery, gql } from "@apollo/client";
import PageHeader from "../../components/pageHeader";
import Modal from "../../components/modal";
import { SendRequest } from "../../hooks/usePost";
import MultiSelect from "../../components/muliselect";
import SettingsNav from "./settingsNav";

var GET_DATA = gql`query {
    paymentMethods {
        id
        name
        merchantId
        customData
    }
    regions {
        id
        name
    }
    stores {
        id
        name
        customData
    }
}`;

const Payments = () => {
  const [show, setShow] = useState(false);
  const [activeItem, setActiveItem] = useState({});
  const { loading, error, data, refetch } = useQuery(GET_DATA, {
    variables: {},
  });

  if (error) return `Error! ${error}`;

  const handleChange = (name, value) => {
    setActiveItem(values => ({ ...values, [name]: value }))
  }

  const handleClose = () => setShow(false);
  const handleShow = (id) => {
    var item = data.paymentMethods.find(element => element.id == id);
    if (item === undefined) item = { id: id, description: '', taxCode: '', isNew: true };
    setActiveItem({ isNew: item.isNew, id: item.id, name: item.name, merchantId: item.merchantId, regionIds: item.customData?.regionIds, storeIds: item.customData?.storeIds });
    setShow(true);
  }

  const handleSubmit = async e => {
    e.preventDefault();
    setShow(false);

    let item = {
      isNew: activeItem.isNew,
      id: activeItem.id,
      name: activeItem.name,
      merchantId: activeItem.merchantId,
      customData: {
        regionIds: activeItem.regionIds,
        storeIds: activeItem.storeIds
      }
    };

    var url = "/api/v1/paymentMethods";
    var method = "POST";

    if (!item.isNew) {
      url += `/${item.id}`;
      method = "PUT";
    }

    SendRequest(method, url, item, () => {
      refetch();
    }, (error) => {
      alert(error);
    });
  }


  return <PageHeader preTitle="Settings" title="Payment Methods">
    <SettingsNav loading={loading} pageId="payments">
      <div className="card-header">
        <span className="card-title">Payment Methods</span>
      </div>
      <div className="table-responsive">
        <table className="table card-table table-vcenter text-nowrap datatable">
          <thead>
            <tr>
              <th>Name</th>
              <th>Merchant</th>
              <th>Stores</th>
              <th>Regions</th>
              <th className="w-1"></th>
            </tr>
          </thead>
          <tbody>
            {data?.paymentMethods && data.paymentMethods.map((item) => {
              return <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.merchantId}</td>
                <td>
                  {item.customData?.storeIds && item.customData.storeIds.map((storeId) => {
                    return <span className="badge badge-outline text-blue m-1" key={storeId} >{data?.stores.find(i => i.id == storeId)?.name ?? storeId}</span>
                  })}
                </td>
                <td>
                  {item.customData?.regionIds && item.customData.regionIds.map((regionId) => {
                    return <span className="badge badge-outline text-blue m-1" key={regionId} >{data?.regions.find(i => i.id == regionId)?.name ?? regionId}</span>
                  })}
                </td>
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
              <td colSpan="5" className="text-end">
                <button className="btn btn-primary" onClick={() => handleShow('')}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-wallet" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M17 8v-3a1 1 0 0 0 -1 -1h-10a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3m0 4v3a1 1 0 0 1 -1 1h-12a2 2 0 0 1 -2 -2v-12"></path><path d="M20 12v4h-4a2 2 0 0 1 0 -4h4"></path></svg>
                  Add Payment
                </button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </SettingsNav>


    <Modal showModal={show} onHide={handleClose} >
      <div className="modal-header">
        <h5 className="modal-title">Payment Map</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <div className="row">
          <div className="col-md-7">
            <div className="mb-3">
              <label className="form-label">Payment Name</label>
              <input className="form-control" name="name" value={activeItem.name || ""} onChange={(e) => handleChange(e.target.name, e.target.value)} />
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-md-5">
            <div className="mb-3">
              <label className="form-label">Merchant</label>
              <input className="form-control" name="merchantId" value={activeItem.merchantId || ''} onChange={(e) => handleChange(e.target.name, e.target.value)} />
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Regions</label>
              <div>
                <MultiSelect className="form-select" name="regionIds" value={activeItem.regionIds || []} onChange={handleChange} disabled={false}>
                  {data?.regions && data.regions.map((region) => {
                    return <option key={region.id} value={region.id}>{region.name}</option>
                  })}
                </MultiSelect>
                <span className="text-danger"></span>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Stores</label>
              <div>
                <MultiSelect className="form-select" name="storeIds" value={activeItem.storeIds || []} onChange={handleChange} disabled={false} >
                  {data?.stores && data.stores.map((store) => {
                    return <option key={store.id} value={store.id}>{store.name}</option>
                  })}
                </MultiSelect>
                <span className="text-danger"></span>
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
          Save Payment Method
        </button>
      </div>
    </Modal>

  </PageHeader >
}

export default Payments;