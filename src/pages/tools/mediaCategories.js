import React, { useEffect, useState } from 'react';
import PropTypes from "prop-types";
import { useQuery, gql } from "@apollo/client";
import PageHeader from "../../components/pageHeader";
import Modal from "../../components/modal";
import TextInput from "../../components/textInput";
import SelectInput from "../../components/selectInput";
import NumericInput from "../../components/numericInput"
import Switch from "../../components/switch"
import { SendRequest } from "../../hooks/usePost";
import DataLoading from "../../components/dataLoading";
import DataError from "../../components/dataError";


var GET_STATUSES = gql`query {
    documentCategories {
      id
      parentId
      name
      published
      description
      displayIndex
    }
  }`

const MediaCategories = () => {
  const [show, setShow] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [activeItem, setActiveItem] = useState({});
  const [categories, setCategories] = useState();
  const { loading, error, data, refetch } = useQuery(GET_STATUSES, {
    variables: {},
  });

  useEffect(() => {
    if (data) {
      setCategories(buildCategoryTree(data.documentCategories));
    }
  }, [data]);

  const handleChange = (name, value) => {
    setActiveItem(values => ({ ...values, [name]: value }))
  }

  const handleClose = () => setShow(false);
  const handleShow = (id) => {
    var item = data.documentCategories.find(element => element.id == id);
    if (item === undefined) item = { id: id, name: '', statusClass: "Active", earningsClass: "Release", isNew: true };
    setActiveItem(item);
    setShow(true);
  }

  const handleHideDelete = () => setShowDelete(false);
  const handleShowDelete = (id) => {
    var item = data.documentCategories.find(element => element.id == id);
    if (item === undefined) item = { id: id, name: '', statusClass: "Active", earningsClass: "Release", isNew: true };
    setActiveItem(item);
    setShowDelete(true);
  }

  const handleSubmit = () => {
    var url = "/api/v1/documents/categories";
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

  const handleDelete = () => {
    SendRequest("DELETE", `/api/v1/documents/categories/${activeItem.id}`, {}, () => {
      refetch();
      setShowDelete(false);
    }, (error) => {
      alert(error);
    });
  }

  function buildCategoryTree(categories) {
    const map = {};
    const roots = [];

    // Initialize each category with an empty children array
    categories.forEach(cat => {
      map[cat.id] = { ...cat, children: [] };
    });

    // Link children to parents
    categories.forEach(cat => {
      if (cat.parentId && map[cat.parentId]) {
        map[cat.parentId].children.push(map[cat.id]);
      } else {
        roots.push(map[cat.id]);
      }
    });

    // Recursive sort helper by displayIndex
    const sortByDisplayIndex = arr => {
      arr.sort((a, b) => (a.displayIndex ?? 0) - (b.displayIndex ?? 0));
      arr.forEach(cat => {
        if (cat.children && cat.children.length > 0) {
          sortByDisplayIndex(cat.children);
        }
      });
    };

    // Sort roots and all children
    sortByDisplayIndex(roots);

    return roots;
  }

  if (loading) return <DataLoading />
  if (error) return <DataError error={error} />

  return <PageHeader title="Media Categories" breadcrumbs={[{ title: 'Media', link: `/media` }, { title: 'Categories' }]}>
    <div className="container-xl">
      <div className="card">
        <div className="table-responsive">
          <table className="table card-table table-vcenter text-nowrap datatable">
            <thead>
              <tr>
                <th className="w-1">Index</th>
                <th>Name</th>
                <th>Description</th>
                <th>Published</th>
                <th className="w-1"></th>
              </tr>
            </thead>
            <tbody>
              <CategoryRow categories={categories} indent={0} handleShow={handleShow} handleShowDelete={handleShowDelete} />
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="5" className="text-end">
                  <button className="btn btn-primary" onClick={() => handleShow('')}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon dropdown-item-icon" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7.5 7.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path><path d="M3 6v5.172a2 2 0 0 0 .586 1.414l7.71 7.71a2.41 2.41 0 0 0 3.408 0l5.592 -5.592a2.41 2.41 0 0 0 0 -3.408l-7.71 -7.71a2 2 0 0 0 -1.414 -.586h-5.172a3 3 0 0 0 -3 3z"></path></svg>
                    Add Category
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <Modal showModal={showDelete} size="sm" onHide={handleHideDelete} >
      <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      <div className="modal-status bg-danger"></div>
      <div className="modal-body text-center py-4">
        <h3>Are you sure?</h3>
        <div className="text-muted">Do you really want to remove <strong>{activeItem.name}</strong></div>
      </div>
      <div className="modal-footer">
        <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
          Cancel
        </a>
        <button type="submit" className="btn btn-danger ms-auto" onClick={handleDelete}>
          Delete Category
        </button>
      </div>
    </Modal>

    <Modal showModal={show} onHide={handleClose}>
      <div className="modal-header">
        <h5 className="modal-title">Customer Status </h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <div className="row">
          <div className="col-md-12">
            <div className="mb-3">
              <label className="form-label">Name</label>
              <TextInput name="name" value={activeItem.name} onChange={handleChange} />
            </div>
          </div>
          <div className="col-md-4">
            <div className="mb-3">
              <label className="form-label">Index</label>
              <NumericInput name="displayIndex" value={activeItem.displayIndex} onChange={handleChange} />
            </div>
          </div>
          <div className="col-md-8">
            <div className="mb-3">
              <label className="form-label">Parent Category</label>
              <SelectInput name="parentId" value={activeItem.parentId} onChange={handleChange} >
                <option value="">None</option>
                {categories && categories.map((cat) => {
                  return <option key={cat.id} value={cat.id}>{cat.name}</option>
                })}
              </SelectInput>
            </div>
          </div>
          <div className="col-md-12">
            <div className="mb-3">
              <label className="form-label">Description</label>
              <TextInput name="description" value={activeItem.description} onChange={handleChange} />
            </div>
          </div>
          <div className="col-md-12">
            <div className="mb-3">
              <Switch title="Published" name="published" value={activeItem.published} onChange={handleChange} />
            </div>
          </div>
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

export default MediaCategories;


function CategoryRow({ categories, indent, handleShow, handleShowDelete }) {

  if (!categories) return <></>

  return categories.map((cat) =>
    <>
      <tr key={cat.id}>
        <td>{cat.displayIndex}</td>
        <td><span style={{ padding: `${15 * indent}px` }} >{cat.name}</span></td>
        <td>{cat.description}</td>
        <td>{cat.published ? "Published" : 'Not Published'}</td>
        <td>
          <button className="btn btn-ghost-secondary btn-icon" onClick={() => handleShow(`${cat.id}`)} >
            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
          </button>
          <button className="btn btn-ghost-secondary btn-icon" onClick={() => handleShowDelete(`${cat.id}`)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-trash" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 7l16 0"></path><path d="M10 11l0 6"></path><path d="M14 11l0 6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
          </button>
        </td>
      </tr>

      {cat.children && cat.children.length > 0 && <CategoryRow categories={cat.children} indent={indent + 1} handleShow={handleShow} handleShowDelete={handleShowDelete} />}
    </>
  );
}

CategoryRow.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      parentId: PropTypes.string,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      displayIndex: PropTypes.number,
      children: PropTypes.array, // recursive children
    })
  ),
  indent: PropTypes.number.isRequired,
  handleShow: PropTypes.func.isRequired,
  handleShowDelete: PropTypes.func.isRequired,
};