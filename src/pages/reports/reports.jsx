import React, { useState } from "react";
import { useLocation, useParams } from 'react-router-dom';
import { GetScope } from "../../features/authentication/hooks/useToken.jsx";
import { useFetch } from "../../hooks/useFetch.js";
import PageHeader, { CardHeader } from "../../components/pageHeader.jsx";
import DataLoading from "../../components/dataLoading.jsx";
import ReportList from "./reportList.jsx";

const Reports = () => {
  const location = useLocation();
  let params = useParams()
  const hashVariable = location.hash.substring(1);
  const [tab, setTab] = useState(hashVariable !== '' ? hashVariable : 1);
  const { loading, error, data } = useFetch(`/api/v1/Reports/Categories`);

  if (loading) return <DataLoading />;
  if (error) return `Error! ${error}`;

  const handleTabChange = (e) => {
    setTab(e.target.name);
  }

  const hasScope = GetScope() != undefined || params.customerId != undefined;
  let tabName = data?.find((el) => el.id == tab) ?? { name: '' };

  return <PageHeader title="Reports" preTitle="Report Center" customerId={params.customerId}>
    {!hasScope && <CardHeader>
      <a className="btn btn-primary" href="/reports/new">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-filter-2-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 6h16" /><path d="M6 12h10" /><path d="M9 18h3" /><path d="M19 15v6" /><path d="M16 18h6" /></svg>
        Add Report
      </a>
    </CardHeader>}
    <div className="page-body">

      <div className="container-xl">
        <div className="card">

          <div className="row g-0">
            <div className="col-2 d-none d-md-block border-end">
              <div className="card-body">
                <h4 className="subheader">Standard Reports</h4>
                <div className="list-group list-group-transparent">
                  {data && data.filter((c) => c.advanced == false).map((category) => {
                    return <button key={category.id} name={category.id} className={`list-group-item list-group-item-action d-flex align-items-center ${tab == `${category.id}` ? 'active' : ''}`} onClick={handleTabChange} >{category.name}</button>
                  })}
                </div>
                <h4 className="subheader mt-4">Advanced Reports</h4>
                <div className="list-group list-group-transparent">
                  {data && data.filter((c) => c.advanced == true).map((category) => {
                    return <button key={category.id} name={category.id} className={`list-group-item list-group-item-action d-flex align-items-center ${tab == `${category.id}` ? 'active' : ''}`} onClick={handleTabChange} >{category.name}</button>
                  })}
                </div>
              </div>
            </div>
            <div className="col d-flex flex-column">
              <div className="card-header">
                <h2 className="mb-0">{tabName.name} Reports</h2>
              </div>
              <ReportList categoryId={tab} customerId={params.customerId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageHeader >
}

export default Reports;
