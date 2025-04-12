import React, { useState } from 'react';
import { GetScope } from "../../features/authentication/hooks/useToken"
import { useParams } from "react-router-dom"

import PageHeader from '../../components/pageHeader';
import WidgetContainer from "../../features/widgets/components/widgetContainer";


const CustomerPage = () => {
  let params = useParams()
  const [data, setData] = useState();
  const [loaded, setLoaded] = useState(false);

  const showTitle = false;
  const title = (GetScope() == undefined && showTitle) ? data?.customers[0]?.fullName : '';
  const preTitle = (GetScope() == undefined && showTitle) ? 'CustomerPage' : '';

  const handleNoContent = () => {
    setLoaded(true);
  }

  return <>
    <PageHeader title={title} preTitle={preTitle} pageId={params.pageId} customerId={params.customerId}>
      <div className="container-xl">
        <WidgetContainer customerId={params.customerId} dashboardId={params.pageId} onLoad={(d) => setData(d)} onEmpty={handleNoContent} />
        {loaded && <>
          <div className="container-tight py-4">
            <div className="empty">
              <div className="empty-header">404</div>
              <p className="empty-title">Oops… You just found an error page</p>
              <p className="empty-subtitle text-muted">
                We are sorry but the page you are looking for was not found
              </p>
              <div className="empty-action">
                <a href="/" className="btn btn-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><line x1="5" y1="12" x2="19" y2="12" /><line x1="5" y1="12" x2="11" y2="18" /><line x1="5" y1="12" x2="11" y2="6" /></svg>
                  Take me home
                </a>
              </div>
            </div>
          </div>
        </>}
      </div>
    </PageHeader>
  </>
};

export default CustomerPage;