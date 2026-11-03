import React from 'react';
import { useParams } from "react-router-dom"
import { useFetch } from '../../../hooks/useFetch.js';
import PageHeader, { CardHeader } from '../../../components/pageHeader.jsx';
import DeleteEnvironmentModal from './components/deleteEnvironmentModal.jsx';
import PlanCard from './components/planCard.jsx';
import ECommerceCard from './components/ecommerceCard.jsx';
import MoneyOutCard from './components/moneyOutCard.jsx';
import AccessTokens from './components/accessTokens.jsx';
import EditEnvironmentModal from './components/editEnvironmentModal.jsx';
import WebHookSubscriptions from './components/webHookSubscriptions.jsx';


const EnvironementDetail = () => {
  const params = useParams();
  const { loading, error, data, refetch } = useFetch("/api/v1/environments/" + params.id);

  const today = new Date();
  const beginningOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 11);
  const startDate = beginningOfMonth > tenDaysAgo ? beginningOfMonth : tenDaysAgo;
  const { error: statsError, data: statsData } = useFetch("/api/v1/Logs/stats", { environmentId: params.id, date: startDate.toISOString() });

  if (error) return `Error! ${error}`;
  if (statsError) return `Error! ${statsError}`;

  if (loading || !data) return <span>-</span>;
  if (error) return `Error! ${error}`;

  return <>
    <PageHeader title={data.name} breadcrumbs={[{ title: "Environments", link: "/account/environments" }, { title: data.name }]} >
      <CardHeader>
        <div className="col-auto ms-auto d-print-none">
          <div className="btn-list">
            <EditEnvironmentModal environmentId={data.id} environmentName={data.name} refetch={refetch} />
            <DeleteEnvironmentModal environmentId={data.id} environmentName={data.name} />
          </div>
        </div>
      </CardHeader>
      <div className="page-body">
        <div className="container-xl">
          <div className="row row-cards row-deck">
            <div className="col-md-4">
              <PlanCard environmentId={data.id} status={data.status} />
            </div>

            <div className="col-md-4">
              <MoneyOutCard environmentId={data.id} />
            </div>

            <div className="col-md-4">
              <ECommerceCard environmentId={data.id} />
            </div>

            <div className="col-md-12">
              <div className="card">
                <div className="card-body">
                  <h3 className="card-title">Traffic summary</h3>
                  {/* <DailyCountChart height={230} data={statsData} /> */}
                </div>
              </div>
            </div>

            <div className="col-12">
              <AccessTokens environmentId={data.id} environmentName={data.name} stats={statsData} />
            </div>

            <div className="col-md-12">
              <WebHookSubscriptions key={params.id} environmentId={params.id} />
            </div>

          </div>
        </div>
      </div>
    </PageHeader >
  </>
};


export default EnvironementDetail;
