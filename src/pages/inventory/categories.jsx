import React from "react-dom/client";
import { useState } from 'react';
import { useQuery, gql } from "@apollo/client";
import PageHeader from "../../components/pageHeader.jsx";
import Modal from "../../components/modal.jsx";
import DataLoading from "../../components/dataLoading.jsx";
import { SendRequest } from "../../hooks/usePost.js";
import MultiSelect from "../../components/muliselect.jsx";
import TextInput from "../../components/textInput.jsx";
import TextArea from "../../components/textArea.jsx";
import NumericInput from "../../components/numericInput.jsx";

var GET_DATA = gql`query {
  categories {
    id
    name
    description
    displayIndex
    storeIds
  }
  stores {
    id
    name
    customData
  }
}`;

const Categories = () => {
  const [show, setShow] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [activeItem, setActiveItem] = useState({});
  const { loading, error, data, refetch } = useQuery(GET_DATA, {
    variables: {},
  });

  if (loading) return <DataLoading />;
  if (error) return `Error! ${error}`;

  const handleChange = (name, value) => {
    setActiveItem(values => ({ ...values, [name]: value }))
  }

  const handleClose = () => setShow(false);
  const handleShow = (id) => {
    var item = data.categories.find(element => element.id == id);
    if (item === undefined) item = { id: id, isNew: true };
    setActiveItem(item);
    setShow(true);
  }

  const handleHideDelete = () => setShowDelete(false);
  const handleShowDelete = (id) => {
    var item = data.categories.find(element => element.id == id);
    setActiveItem(item);
    setShowDelete(true);
  }
  const handleDelete = () => {
    setShowDelete(false);
    SendRequest("DELETE", `/api/v1/categories/${activeItem.id}`, null, () => {
      refetch();
    }, (error, code) => {
      alert(`${code}: ${error}`);
    });
  }

  const handleSubmit = async e => {
    e.preventDefault();
    setShow(false);

    var url = "/api/v1/categories";
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


  return <PageHeader title="Categories">
    <div className="container-xl">
      <div className="row row-cards">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header">
              <button className="btn btn-default" onClick={() => handleShow('')}>
                Add Category
              </button>
            </div>
            <div>
              <div className="table-responsive">
                <table className="table card-table table-vcenter text-nowrap datatable">
                  <thead>
                    <tr>
                      <th>Category Name</th>
                      <th>Stores</th>
                      <th>Sort Order</th>
                      <th className="w-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.categories && [...data.categories].sort((x, y) => x.displayIndex - y.displayIndex).map((item) => {
                      return <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>
                          {item.storeIds && item.storeIds.map((storeId) => {
                            return <span className="badge badge-outline text-blue m-1" key={storeId} >{data.stores.find(i => i.id == storeId)?.name ?? storeId}</span>
                          })}
                        </td>
                        <td>{item.displayIndex}</td>
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
        <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete Category</button>
      </div>
    </Modal>

    <Modal showModal={show} onHide={handleClose} >
      <div className="modal-header">
        <h5 className="modal-title">Add/Edit Category</h5>
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
              <label className="form-label">Description</label>
              <TextArea
                rows={4}
                name="description"
                value={activeItem.description || ""}
                onChange={handleChange}
              />
              <span className="text-danger"></span>
            </div>
          </div>

          <div className="col-md-12">
            <div className="mb-3">
              <label className="form-label">Stores</label>
              <MultiSelect name="storeIds" value={activeItem.storeIds} onChange={handleChange}>
                {data.stores && data.stores.map((store) => {
                  return <option key={store.id} value={store.id}>{store.name}</option>
                })}
              </MultiSelect>
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-md-12">
            <div className="mb-3">
              <label className="form-label">Sort Order</label>
              <NumericInput name="displayIndex" value={activeItem.displayIndex} onChange={handleChange} />
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
          Save Category
        </button>
      </div>
    </Modal>

  </PageHeader>
}



export default Categories;