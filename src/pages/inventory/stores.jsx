import React from "react-dom/client";
import { useState } from 'react';
import PageHeader from "../../components/pageHeader.jsx";
import Modal from "../../components/modal.jsx";
import DataLoading from "../../components/dataLoading.jsx";
import { useFetch } from "../../hooks/useFetch.js";
import { SendRequest } from "../../hooks/usePost.js";
import TextInput from "../../components/textInput.jsx";
import Switch from "../../components/switch.jsx";


const Stores = () => {
  const [show, setShow] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [activeItem, setActiveItem] = useState({});
  const { data, loading, error, refetch } = useFetch('/api/v1/stores');

  if (loading) return <DataLoading />;
  if (error) return `Error! ${error}`;

  const handleChange = (name, value) => {
    setActiveItem(values => ({ ...values, [name]: value }))
  }

  const handleHideDelete = () => setShowDelete(false);
  const handleShowDelete = (id) => {
    var item = data.find(element => element.id == id);
    setActiveItem(item);
    setShowDelete(true);
  }
  const handleDelete = () => {
    setShowDelete(false);

    SendRequest("DELETE", `/api/v1/stores/${activeItem.id}`, null, () => {
      refetch();
    }, (error, code) => {
      alert(`${code}: ${error}`);
    });
  }

  const handleClose = () => setShow(false);
  const handleShow = (id) => {
    var item = data.find(element => element.id == id);
    if (item === undefined) item = { id: id, name: '', customData: { allowOrders: true, isPointOfSale: false, isDefault: false }, isNew: true };
    setActiveItem({ id: item.id, name: item.name, allowOrders: item.customData?.allowOrders, isPointOfSale: item.customData?.isPointOfSale, isDefault: item.customData?.isDefault, isNew: item.isNew ?? false });
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
        allowOrders: activeItem.allowOrders,
        isPointOfSale: activeItem.isPointOfSale,
        isDefault: activeItem.isDefault
      }
    };

    var url = "/api/v1/stores";
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


  return <PageHeader title="Stores">
    <div className="container-xl">
      <div className="row row-cards">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header">
              <button className="btn btn-default" onClick={() => handleShow('')}>
                Add Store
              </button>
            </div>
            <div>
              <div className="table-responsive">
                <table className="table card-table table-vcenter text-nowrap datatable">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Allow Ordering</th>
                      <th>Point Of Sale</th>
                      <th>Is Default</th>
                      <th className="w-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data && data.map((item) => {
                      return <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.customData?.allowOrders ? 'Yes' : 'No'}</td>
                        <td>{item.customData?.isPointOfSale ? 'Yes' : 'No'}</td>
                        <td>{item.customData?.isDefault ? 'Yes' : 'No'}</td>
                        <td>
                          <a className="btn btn-ghost-secondary btn-icon" onClick={() => handleShow(`${item.id}`)} >
                            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
                          </a>
                          <button className="btn btn-ghost-secondary btn-icon" onClick={() => handleShowDelete(item.id)} >
                            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-trash" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 7l16 0"></path><path d="M10 11l0 6"></path><path d="M14 11l0 6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
                          </button>
                        </td>
                      </tr>
                    })}

                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Modal showModal={showDelete} size="sm" onHide={handleHideDelete} >
      <div className="modal-body">
        <div className="modal-title">Are you sure?</div>
        <div>Do you wish to delete &apos;<em>{activeItem.name}&apos;</em>?</div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-link link-secondary me-auto" data-bs-dismiss="modal">Cancel</button>
        <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete Store</button>
      </div>
    </Modal>

    <Modal showModal={show} onHide={handleClose} >
      <div className="modal-header">
        <h5 className="modal-title">Add/Edit Store</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">

        <div className="row">
          <div className="col-md-12">
            <div className="mb-3">
              <label className="form-label required">Name</label>
              <TextInput name="name" value={activeItem.name || ""} onChange={handleChange} />
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-md-12">
            <div className="mb-3">
              <div className="divide-y">
                <div>
                  <label className="row">
                    <span className="col">Allow Ordering</span>
                    <span className="col-auto">
                      <Switch type="checkbox" name="allowOrders" value={activeItem?.allowOrders} onChange={handleChange} />
                    </span>
                  </label>
                </div>
                <div>
                  <label className="row">
                    <span className="col">Default Store</span>
                    <span className="col-auto">
                      <Switch type="checkbox" name="isDefault" value={activeItem?.isDefault} onChange={handleChange} />
                    </span>
                  </label>
                </div>
                <div>
                  <label className="row">
                    <span className="col">Is Point-of-Sale</span>
                    <span className="col-auto">
                      <Switch type="checkbox" name="isPointOfSale" value={activeItem?.isPointOfSale} onChange={handleChange} />
                    </span>
                  </label>
                </div>
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
          Save Store
        </button>
      </div>
    </Modal>

  </PageHeader>
}



export default Stores;