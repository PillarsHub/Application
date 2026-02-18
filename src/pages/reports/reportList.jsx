import React, { useState } from "react";
import PropTypes from 'prop-types';
import { GetScope } from "../../features/authentication/hooks/useToken.jsx"
import { useFetch } from "../../hooks/useFetch.js";
import { SendRequest } from "../../hooks/usePost.js";
import DataLoading from "../../components/dataLoading.jsx";
import Modal from "../../components/modal.jsx";

const ReportList = ({ categoryId, customerId }) => {
  const [activeItem, setActiveItem] = useState();
  const { loading, error, data, refetch } = useFetch(`/api/v1/Reports?categoryId=${categoryId}`);

  if (loading && !data) return <DataLoading />;
  if (error) return `Error! ${error}`;

  const hasScope = GetScope() != undefined || customerId != undefined;

  const handleShowDelete = (report) => {
    setActiveItem(report);
  }

  const handleHideDelete = () => {
    setActiveItem();
  }

  const handleDelete = () => {
    if (!activeItem?.id) return;

    SendRequest("DELETE", `/api/v1/Reports/${activeItem.id}`, {}, () => {
      setActiveItem();
      refetch();
    }, (deleteError) => {
      alert(deleteError);
    });
  }

  return <>
    <div className="table-responsive">
      <table className="table card-table table-vcenter text-nowrap datatable table-ellipsis">
        <thead>
          <tr>
            <th>Name</th>
            <th className="d-none d-sm-table-cell text-start">description</th>
            {!hasScope && <>
              <th className="w-1">Index</th>
              <th className="d-none d-sm-table-cell text-start">Visibility</th>
              <th className="d-none d-sm-table-cell text-start w-1"></th>
            </>}
          </tr>
        </thead>
        <tbody>
          {data && data.map((report) => {
            return <tr key={report.id}>
              <td>
                {customerId && <>
                  <a href={`/customers/${customerId}/reports/${report.id}`} className="text-reset">{report.name}</a>
                </>}
                {!customerId && <>
                  <a href={`/reports/${report.id}`} className="text-reset">{report.name}</a>
                </>}
              </td>
              <td className="text-muted d-none d-sm-table-cell">
                {report.description}
              </td>
              {!hasScope && <>
                <td className="text-muted d-none d-sm-table-cell">
                  {report.displayIndex}
                </td>
                <td className="text-muted d-none d-sm-table-cell">
                  {report.visibility}
                </td>
                <td className="text-muted d-none d-sm-table-cell">
                  <a className="btn btn-ghost-secondary btn-icon" href={`/reports/${report.id}/edit`} >
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
                  </a>
                  <button className="btn btn-ghost-secondary btn-icon" onClick={() => handleShowDelete(report)} >
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-trash" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 7l16 0"></path><path d="M10 11l0 6"></path><path d="M14 11l0 6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
                  </button>
                </td>
              </>}
            </tr>
          })}

        </tbody>
      </table>
    </div>

    <Modal showModal={activeItem != null} size="sm" onHide={handleHideDelete} >
      <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      <div className="modal-status bg-danger"></div>
      <div className="modal-body text-center py-4">
        <h3>Are you sure?</h3>
        <div className="text-muted">Do you really want to remove <strong>{activeItem?.name}</strong></div>
      </div>
      <div className="modal-footer">
        <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
          Cancel
        </a>
        <button type="submit" className="btn btn-danger ms-auto" onClick={handleDelete}>
          Delete Report
        </button>
      </div>
    </Modal>
  </>
}

export default ReportList;

ReportList.propTypes = {
  categoryId: PropTypes.string,
  customerId: PropTypes.string
}
