import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"
import { useFetch } from "../../hooks/useFetch";
import { SendRequest } from "../../hooks/usePost";
import PageHeader from "../../components/pageHeader";
import DataLoading from "../../components/dataLoading";
import DataError from "../../components/dataError";
import GraphQLQueryEditor from "../../components/graphQLQueryEditor";
import TextInput from "../../components/textInput";
import SelectInput from "../../components/selectInput";
import TextArea from "../../components/textArea";
import Switch from "../../components/switch";
import Modal from "../../components/modal";
import FilterInput from "./filterInput";

const filterDelType = "del_filter";
const columnDelType = "del_column";

const EditReport = () => {
  let params = useParams()
  const navigate = useNavigate();
  const [showFilter, setShowFilter] = useState(false);
  const [showColumn, setShowColumn] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [activeItem, setActiveItem] = useState();
  const [errorDisplay, setErrorDisplay] = useState();
  const [report, setReport] = useState();
  const [values, setValues] = useState({ offset: 0, count: 10 });
  const { loading, error, data } = useFetch(`/api/v1/Reports/${params.reportId ?? '0'}`);

  useEffect(() => {
    if (data) {
      setReport(data);
    }
  }, [data])

  useEffect(() => {
    if (error) {
      if (error.code == 404) {
        setReport({ categoryId: 1, Query: 'query {}' });
      } else {
        setErrorDisplay(error);
      }
    }
  }, [error])

  if (errorDisplay) return <DataError error={errorDisplay} />
  if (loading || !report) return <DataLoading />

  const handleSave = () => {
    var method = 'PUT';
    var path = `/api/v1/Reports/${params.reportId}`

    if (!params.reportId) {
      method = 'POST';
      path = `/api/v1/Reports`;
    }

    SendRequest(method, path, report, (r) => {
      alert('saved');
      if (r.id != params.reportId) navigate(`/reports/${r.id}/edit`);
    }, (error) => {
      alert(error);
    });
  }

  const handleDeleteClose = () => setShowDelete(false);
  const handleDeleteShow = (id, type) => {
    if (type == filterDelType) {
      var fIndex = report.filters.findIndex(f => f.id == id);
      setActiveItem({ index: fIndex, type: type });
    } else {
      var cIndex = report.dataColumns.findIndex(f => f.name == id);
      setActiveItem({ index: cIndex, type: type });
    }
    setShowDelete(true);
  }

  const handleDelete = () => {
    setReport(r => {
      var newFilters = r.filters;
      var newColumns = r.dataColumns;

      if (activeItem.type == filterDelType) {
        newFilters.splice(activeItem.index, 1);
      } else {
        newColumns.splice(activeItem.index, 1);
      }

      return { ...r, filters: newFilters, dataColumns: newColumns }
    })
    setShowDelete(false);
  }

  const handleFilterClose = () => setShowFilter(false);
  const handleFilterShow = (filterId) => {

    var index = report.filters.findIndex(f => f.id == filterId);
    var item = index > -1 ? report.filters[index] : { inputType: 'Text' };
    item.index = index;

    setActiveItem(item);
    setShowFilter(true);
  }

  const handleFilterSubmit = () => {
    setReport(r => {
      var newFilters = r.filters;
      if (activeItem.index == -1) {
        newFilters.push(activeItem);
      } else {
        newFilters[activeItem.index] = activeItem;
      }

      return { ...r, filters: newFilters }
    })

    setShowFilter(false);
  }

  const handleColumnClose = () => setShowColumn(false);
  const handleColumnShow = (columnName) => {

    var index = report.dataColumns.findIndex(f => f.name == columnName);
    var item = index > -1 ? report.dataColumns[index] : { dataType: 'String' };
    item.index = index;

    setActiveItem(item);
    setShowColumn(true);
  }

  const handleColumnSubmit = () => {
    setReport(r => {
      var newColumns = r.dataColumns;
      if (activeItem.index == -1) {
        newColumns.push(activeItem);
      } else {
        newColumns[activeItem.index] = activeItem;
      }

      return { ...r, dataColumns: newColumns }
    })
    setShowColumn(false);
  }

  const handleActiveChange = (name, value) => {
    setActiveItem(v => ({ ...v, [name]: value }));
  }

  const handleChange = (name, value) => {
    setReport(v => ({ ...v, [name]: value }));
  }

  const handleValueChange = (name, value) => {
    setValues(v => ({ ...v, [name]: value }));
  }

  return <PageHeader title="Edit Report" breadcrumbs={[{ title: `Reports`, link: `/reports` }, { title: report.categoryName, link: `/reports#${report.categoryId}` }, { title: `${report.name}`, link: `/reports/${params.reportId}` }]}>
    <div className="container-xl">
      <div className="row row-cards row-deck mb-3">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <div className="row">
                <div className="col-8 mb-3">
                  <label className="form-label">Name</label>
                  <TextInput name="name" value={report.name} onChange={handleChange} />
                </div>
                <div className="col-4 mb-3">
                  <label className="form-label">Visibility</label>
                  <SelectInput name="visibility" value={report.visibility} onChange={handleChange} >
                    <option>Corporate</option>
                    <option>BackOffice</option>
                  </SelectInput>
                </div>
                <div className="col-12">
                  <label className="form-label">Description</label>
                  <TextArea name="description" value={report.description} onChange={handleChange} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Filters</span>
            </div>
            <div className="card-body">
              {report.filters && report.filters.map((filter) => {
                return <div key={filter.id} className="mb-3">
                  <div className="row">
                    <div className="col w-100">
                      <FilterInput key={filter.id} filter={filter} values={values} onChange={handleValueChange} />
                    </div>
                    <div className="col-auto">
                      <button className="btn btn-default btn-icon me-2" onClick={() => handleFilterShow(filter.id)} >
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
                      </button>
                      <button className="btn btn-default btn-icon" onClick={() => handleDeleteShow(filter.id, filterDelType)} >
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-trash" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 7l16 0"></path><path d="M10 11l0 6"></path><path d="M14 11l0 6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
                      </button>
                    </div>
                  </div>
                </div>
              })}
            </div>
            <div className="card-footer">
              <div className="row">
                <div className="col">
                </div>
                <div className="col-auto">
                  <button className="btn btn-default" onClick={() => handleFilterShow()}>
                    Add Filter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-12">

          <div className="card">
            <div className="card-header">
              <ul className="nav nav-tabs card-header-tabs" data-bs-toggle="tabs" role="tablist">
                <li className="nav-item" role="presentation">
                  <a href="#tabs-home-7" className="nav-link active" data-bs-toggle="tab" aria-selected="true" role="tab">Query</a>
                </li>
                <li className="nav-item" role="presentation">
                  <a href="#tabs-requirements-7" className="nav-link" data-bs-toggle="tab" aria-selected="true" role="tab">Columns</a>
                </li>
              </ul>
            </div>
            <div className="tab-content">
              <div className="tab-pane active show" id="tabs-home-7" role="tabpanel">
                <div className="card-body border-bottom">
                  <div className="row">
                    <div className="col-6">
                      <label className="form-label">Root Path</label>
                      <TextInput name="rootPath" value={report.rootPath} onChange={handleChange} />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Total Path</label>
                      <TextInput name="rowCountPath" value={report.rowCountPath} onChange={handleChange} />
                    </div>
                  </div>
                </div>
                <GraphQLQueryEditor query={report.query} variables={JSON.stringify(values)} onChange={(q) => handleChange("query", q)} />
              </div>
              <div className="tab-pane" id="tabs-requirements-7" role="tabpanel">
                <div className="table-responsive">
                  <table className="table card-table table-vcenter text-nowrap datatable table-ellipsis">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Skip row if empty</th>
                        <th className="w-1"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.dataColumns && report.dataColumns.map((column) => {
                        return <tr key={column.name}>
                          <td>{column.name}</td>
                          <td>{column.title}</td>
                          <td>{column.dataType}</td>
                          <td>{column.hideRowIfEmpty ? 'Yes' : "No"}</td>
                          <td>
                            <button className="btn btn-ghost-secondary btn-icon" onClick={() => handleColumnShow(column.name)} >
                              <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
                            </button>
                            <button className="btn btn-ghost-secondary btn-icon" onClick={() => handleDeleteShow(column.name, columnDelType)} >
                              <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-trash" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 7l16 0"></path><path d="M10 11l0 6"></path><path d="M14 11l0 6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
                            </button>
                          </td>
                        </tr>
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="card-footer">
                  <div className="row">
                    <div className="col">
                    </div>
                    <div className="col-auto">
                      <button className="btn btn-default" onClick={() => handleColumnShow()}>
                        Add Column
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
            <div className="card-footer">
              <button className="btn btn-primary" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Modal showModal={showFilter} onHide={handleFilterClose} >
      <div className="modal-header">
        <h5 className="modal-title">Filter</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <div className="mb-3">
          <label className="form-label">Name</label>
          <TextInput name="id" value={activeItem?.id} onChange={handleActiveChange} />
        </div>
        <div className="mb-3">
          <label className="form-label">Filter Type</label>
          <SelectInput name="inputType" value={activeItem?.inputType} onChange={handleActiveChange} >
            <option value="Text">Text</option>
            <option value="Number">Number</option>
            <option value="Period">Period</option>
            <option value="Date">Date</option>
            <option value="DateTime">Date Time</option>
            <option value="DateRange">Date Range</option>
            <option value="CustomerId">CustomerId</option>
            <option value="Rank">Rank</option>
            <option value="Tree">Tree</option>
            <option value="CustomerType">CustomerType</option>
            <option value="OrderType">OrderType</option>
            <option value="OrderStatus">OrderStatus</option>
          </SelectInput>
        </div>
      </div>
      <div className="modal-footer">
        <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
          Cancel
        </a>
        <button type="submit" className="btn btn-primary ms-auto" onClick={handleFilterSubmit}>
          Set Filter
        </button>
      </div>
    </Modal>

    <Modal showModal={showColumn} onHide={handleColumnClose} >
      <div className="modal-header">
        <h5 className="modal-title">Column</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <div className="mb-3">
          <label className="form-label">Name</label>
          <TextInput name="name" value={activeItem?.name} onChange={handleActiveChange} />
        </div>
        <div className="mb-3">
          <label className="form-label">Title</label>
          <TextInput name="title" value={activeItem?.title} onChange={handleActiveChange} />
        </div>
        <div className="row">
          <div className="col-12">
            <div className="mb-3">
              <label className="form-label">Type</label>
              <SelectInput name="dataType" value={activeItem?.dataType} onChange={handleActiveChange} >
                <option value="Hidden">Hidden</option>
                <option value="String">String</option>
                <option value="Number">Number</option>
                <option value="DateTime">DateTime</option>
                <option value="Date">Date</option>
                <option value="Boolean">Boolean</option>
                <option value="Currency">Currency</option>
                <option value="Level">Level</option>
                <option value="Percent">Percent</option>
                <option value="Image">Image</option>
              </SelectInput>
            </div>
          </div>
          <div className="col-4">
            <div className="mb-3">
              <label className="form-label">Drilldown Type</label>
              <SelectInput name="drillDownType" value={activeItem?.drillDownType} onChange={handleActiveChange}>
                <option value="">None</option>
                <option value="Customer">Customer</option>
                <option value="Order">Order</option>
                <option value="Url">Url</option>
              </SelectInput>
            </div>
          </div>
          {activeItem?.drillDownType && <div className="col-4">
            <div className="mb-3">
              {activeItem?.drillDownType == "Url" && <label className="form-label">Url Column</label>}
              {activeItem?.drillDownType !== "Url" && <label className="form-label">Customer Id Column</label>}
              <TextInput name="drillDownSource" value={activeItem?.drillDownSource} onChange={handleActiveChange} />
            </div>
          </div>}
          {activeItem?.drillDownType == "Order" && <div className="col-4">
            <div className="mb-3">
              <label className="form-label">Order Id Column</label>
              <TextInput name="drillDownSource2" value={activeItem?.drillDownSource2} onChange={handleActiveChange} />
            </div>
          </div>}
          <div className="col-12">
            <Switch title="Skip row if empty" name="hideRowIfEmpty" value={activeItem?.hideRowIfEmpty} onChange={handleActiveChange} />
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
          Cancel
        </a>
        <button type="submit" className="btn btn-primary ms-auto" onClick={handleColumnSubmit}>
          Update Column
        </button>
      </div>
    </Modal>

    <Modal showModal={showDelete} size="sm" onHide={handleDeleteClose}>
      <div className="modal-body">
        <div className="modal-title">Are you sure?</div>
        <div>If you proceed, you will lose the widget settings.</div>
        {JSON.stringify(activeItem)}
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-link link-secondary me-auto" data-bs-dismiss="modal">Cancel</button>
        <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete Widget</button>
      </div>
    </Modal>

  </PageHeader>
}

export default EditReport;
