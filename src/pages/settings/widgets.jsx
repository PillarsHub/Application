import React, { useState } from "react";
import PageHeader from "../../components/pageHeader";
import SettingsNav from "./settingsNav";
import useWidgets from "../../features/widgets/hooks/useWidgets";
import { WidgetTypes } from "../../features/widgets/hooks/useWidgets";
import Modal from "../../components/modal";
import { SendRequest } from "../../hooks/usePost";

const WidgetSettings = () => {
  const [showDelete, setShowDelete] = useState();
  const [deleteId, setDeleteId] = useState();
  const { widgets, loading, error, refetch } = useWidgets();

  if (error) return `Error! ${error}`;

  const handleDeleteHide = () => setShowDelete(false);
  const handleShowDelete = (widgetId) => {
    setDeleteId(widgetId);
    setShowDelete(true);
  }
  const handleDelete = () => {
    SendRequest("DELETE", `/api/v1/Widgets/${deleteId}`, {}, () => {
      refetch();
    }, (error) => {
      alert(error);
    })
    setShowDelete(false);
  }

  return <PageHeader preTitle="Settings" title="Widgets">
    <SettingsNav loading={loading} pageId="widgets">
      <div className="card-header">
        <span className="card-title">Widgets</span>
      </div>
      <div className="table-responsive">
        <table className="table card-table table-vcenter text-nowrap datatable table-ellipsis">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Type</th>
              <th className="w-1"></th>
            </tr>
          </thead>
          <tbody>
            {widgets && widgets.map((w) => {
              return <tr key={w.id}>
                <td>{w.name}</td>
                <td>{w.description}</td>
                <td>{Object.keys(WidgetTypes).find(key => WidgetTypes[key] === w.type)}</td>
                <td className="text-end">
                  <a className="btn btn-ghost-secondary btn-icon" href={`/settings/widgets/${w.id}`} >
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
                  </a>
                  <button className="btn btn-ghost-secondary btn-icon" onClick={() => handleShowDelete(w.id)} >
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-trash" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 7l16 0"></path><path d="M10 11l0 6"></path><path d="M14 11l0 6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
                  </button>
                </td>
              </tr>
            })}

          </tbody>
          <tfoot>
            <tr>
              <td colSpan="5" className="text-end">
                <a className="btn btn-primary" href="/settings/widgets/new">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-layout-grid-add" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"></path><path d="M14 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"></path><path d="M4 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"></path><path d="M14 17h6m-3 -3v6"></path></svg>
                  Add Widget
                </a>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </SettingsNav>

    <Modal showModal={showDelete} size="sm" onHide={handleDeleteHide}>
      <div className="modal-body">
        <div className="modal-title">Are you sure?</div>
        <div>If you proceed, you will lose the widget settings.</div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-link link-secondary me-auto" data-bs-dismiss="modal">Cancel</button>
        <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete Widget</button>
      </div>
    </Modal>

  </PageHeader>
}

export default WidgetSettings;