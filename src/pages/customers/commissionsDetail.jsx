import React, { useState } from 'react';
import { useParams } from "react-router-dom"
import PageHeader from "../../components/pageHeader.jsx";
import PeriodPicker from "../../components/periodPicker.jsx";
import EarningsTable from '../../components/earningsTable.jsx';
import WidgetContainer from '../../features/widgets/components/widgetContainer.jsx';

const CommissionsDetail = () => {
  let params = useParams();
  const queryParams = new URLSearchParams(window.location.search);
  const periodParam = queryParams.get("periodId") ?? "0";
  const [periodId, setPeriodId] = useState(periodParam);
  const [data, setData] = useState();
  const [loaded, setLoaded] = useState(false);

  const handlePeriodChange = (pId, u) => {
    if (u) {
      setPeriodId(pId);
    }
  };

  const handleNoContent = () => {
    setLoaded(true);
  }

  return <PageHeader preTitle="Commissions Detail" title={data?.customers[0]?.fullName} pageId="commissions" customerId={params.customerId}>
    <div className="container-xl">
      <WidgetContainer customerId={params.customerId} dashboardId="earnings" periodId={Number(periodId)} onLoad={(d) => setData(d)} onEmpty={handleNoContent} />

      {loaded && data && <div className="row row-deck row-cards">
        <div className="col-12">
          <div className="card mb-3">
            <div className="card-header">
              <h3 className="card-title">Bonuses Earned</h3>
              <div className="card-actions">
                <PeriodPicker periodId={periodId} setPeriodId={handlePeriodChange} />
              </div>
            </div>
            <EarningsTable customerId={params.customerId} periodId={periodId} />
          </div>
        </div>
      </div>}
    </div>
  </PageHeader>
}

export default CommissionsDetail;