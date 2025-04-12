import React, { useState } from 'react';
import { GetScope } from "../../features/authentication/hooks/useToken"
import { useParams } from "react-router-dom"

import PageHeader from '../../components/pageHeader';
import WidgetContainer from "../../features/widgets/components/widgetContainer";



const Dashboard = () => {
  let params = useParams()
  const [data, setData] = useState();
  const [noContent, setNoContent] = useState(false);

  const showTitle = false;
  const title = (GetScope() == undefined && showTitle) ? data?.customers[0]?.fullName : '';
  const preTitle = (GetScope() == undefined && showTitle) ? 'Dashboard' : '';

  const handleNoContent = () => {
    setNoContent(true);
  }

  return <>
    <PageHeader title={title} preTitle={preTitle} pageId="dashboard" customerId={params.customerId}>
      <div className="container-xl">
        <WidgetContainer customerId={params.customerId} dashboardId="PDB" onLoad={(d) => setData(d)} onEmpty={handleNoContent} />
        {noContent && <>
          <div className="row row-cards">
            <div className="col-md-12">
              <div className="card">
                <div><h1>Testing</h1></div>
              </div>
            </div>
          </div>
        </>}
      </div>
    </PageHeader>
  </>
};

export default Dashboard;