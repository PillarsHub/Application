import React, { useRef, useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import { GetScope, GetToken } from "../../features/authentication/hooks/useToken"
import { SendRequest } from '../../hooks/usePost';
import PageHeader, { CardHeader } from '../../components/pageHeader';
import WidgetContainer from "../../features/widgets/components/widgetContainer";
import ChangeStatusModal from './changeStatusModal';
import Modal from '../../components/modal';
import ProfileWidget from '../../features/widgets/components/profileWidget';


const CustomerSummary = () => {
  let params = useParams()
  const [showStatus, setShowStatus] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [data, setData] = useState();
  const [noContent, setNoContent] = useState(false);
  const widgetRef = useRef();

  useEffect(() => {
    if (params.customerId) {
      SendRequest("POST", `/api/v1/Recent`, { customerId: params.customerId }, () => {
        //DoNothing
      }, (error) => {
        alert(error)
      })
    }
  }, [params])

  const handleStatusChange = () => {
    if (widgetRef.current) {
      widgetRef.current.refreshData();
    }
  }

  const handleStatusHide = () => setShowStatus(false);
  const handleStatusShow = () => setShowStatus(true);

  const handleHide = () => setShowDelete(false);
  const handleShow = () => setShowDelete(true);

  const handleDelete = () => {
    SendRequest("DELETE", `/api/v1/Customers/${params.customerId}`, {}, () => {
      window.location = '/';
    }, (error) => {
      alert(error)
    })
  }

  const handleNoContent = () => {
    setNoContent(true);
  }

  const envId = GetToken()?.environmentId;
  let showMenu = envId == 10432 || envId == 286 || envId == 10461 || envId == 54;
  let hasScope = false;
  if (GetScope()) {
    showMenu = false;
    hasScope = true;
  }

  const statuses = data?.customerStatuses;
  const customer = data?.customers[0] ?? {};

  return <>
    <PageHeader preTitle="Customer Detail" title={customer?.fullName} pageId='summary' customerId={customer?.id}>
      <CardHeader>
        {!hasScope && <>
          <div className="btn-list">
            {/* <a href={`/customers/${params.customerId}/shop`} className="btn btn-default">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-shopping-cart" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M6 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path><path d="M17 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path><path d="M17 17h-11v-14h-2"></path><path d="M6 5l14 1l-1 7h-13"></path></svg>
              Create Order
            </a> */}

            <button className="btn btn-default" onClick={handleStatusShow}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-user-edit"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" /><path d="M6 21v-2a4 4 0 0 1 4 -4h3.5" /><path d="M18.42 15.61a2.1 2.1 0 0 1 2.97 2.97l-3.39 3.42h-3v-3l3.42 -3.39z" /></svg>
              Update Status
            </button>

            {showMenu && customer && <>
              <div className="dropdown">
                <a href="#" className="btn btn-default btn-icon" data-bs-toggle="dropdown" aria-expanded="false">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="19" r="1"></circle><circle cx="12" cy="5" r="1"></circle></svg>
                </a>
                <div className="dropdown-menu dropdown-menu-end">
                  <a href={`/Customers/${customer.id}/Edit`} className="dropdown-item">Edit Customer</a>
                  <button className="dropdown-item" onClick={handleStatusShow}>Update Status</button>
                  <button className="dropdown-item text-danger" onClick={handleShow}>Delete Customer</button>
                </div>
              </div>
            </>}

          </div>
        </>}
      </CardHeader>
      <div className="container-xl">
        <WidgetContainer ref={widgetRef} customerId={params.customerId} dashboardId="CSDB" onLoad={(d) => setData(d)} onEmpty={handleNoContent} />
        {noContent && <>
          <div className="row row-cards">
            <div className="col-md-5 col-xl-4">
              <div className="card">
                <ProfileWidget customer={customer} widget={{ settings: { compact: true } }} />
              </div>
            </div>
            <div className="col-md-7 col-xl-8">
              <div className="card">
                <ProfileWidget customer={customer} widget={{ settings: { compact: true } }} />
              </div>
            </div>
          </div>
        </>}
        {customer && <>
          <ChangeStatusModal show={showStatus} onHide={handleStatusHide} customerId={customer.id} statusId={customer?.status?.id} setStatus={handleStatusChange} statuses={statuses} />
        </>}
      </div>
    </PageHeader >


    <Modal showModal={showDelete} size="sm" onHide={handleHide}>
      <div className="modal-body">
        <input type="hidden" />
        <input value="@Model.CustomerId" type="hidden" />
        <div className="modal-title">Are you sure?</div>
        <div>Do you wish to delete &apos;<em>{customer.fullName}&apos;</em>?</div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-link link-secondary me-auto" data-bs-dismiss="modal">Cancel</button>
        <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete Customer</button>
      </div>
    </Modal>

  </>
};

export default CustomerSummary;