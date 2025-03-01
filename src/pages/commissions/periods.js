import React, { useState, useEffect } from "react";
import { useQuery, gql } from "@apollo/client";
import DataLoading from "../../components/dataLoading";
import PageHeader from "../../components/pageHeader";
import LocalDate from "../../util/LocalDate";

var GET_PERIODS = gql`query ($date: Date!) {
  compensationPlans {
    name
    periods(date: $date, previous: 10) {
      id
      begin
      end
      status
      totalCommissions
      totalCustomers
      totalCustomersPaid
      totalVolume
    }
  }
}`;

const Periods = () => {
  const queryParams = new URLSearchParams(window.location.search);
  const planQuery = queryParams.get("p");
  const [tab, setTab] = useState(planQuery);
  const currentDate = new Date(Date.now());
  currentDate.setDate(currentDate.getDate() + 1);
  const isoDate = currentDate.toISOString();
  const dateOnly = isoDate.split('T')[0];
  const { loading, error, data, } = useQuery(GET_PERIODS, {
    variables: { date: dateOnly },
  });

  useEffect(() => {
    if (data && !tab) {
      setTab(data.compensationPlans[0].name);
    }
  }, [data]);

  if (loading) return <DataLoading />;
  if (error) return `Error! ${error}`;

  return <PageHeader title="Commission Periods">
    <div className="container-xl">
      <div className="row row-cards">
        <div className="col-12">
          <div className="card inverted">
            {data.compensationPlans.length > 1 && <div className="card-header">
              <ul className="nav nav-tabs card-header-tabs" data-bs-toggle="tabs" role="tablist">
                {data.compensationPlans.map((plan) => {
                  return <li key={plan.name} className="nav-item" role="presentation">
                    <a href={`#T${plan.name}`} className={`nav-link ${tab == plan.name ? 'active' : ''}`} data-bs-toggle="tab" aria-selected="true" role="tab">{plan.name}</a>
                  </li>
                })}
              </ul>
            </div>}

            <div className="tab-content">
              {data.compensationPlans.map((plan) => {
                let copy = [...plan.periods];
                let periods = copy.reverse();
                return <div key={plan.name} className={`tab-pane ${tab == plan.name ? 'active show' : ''}`} id={`T${plan.name}`} role="tabpanel">
                  <div className="table-responsive">
                    <table className="table card-table table-vcenter text-nowrap datatable">
                      <thead>
                        <tr>
                          <th className="text-center w-1"><i className="icon-people"></i></th>
                          <th>Period</th>
                          <th>Status</th>
                          <th>Customers</th>
                          <th>Total Volume</th>
                          <th>Total Commission</th>
                          <th className="text-center">Percent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {periods && periods.map((period) => {
                          let percent = period.totalVolume > 0 ? Math.round((period.totalCommissions / period.totalVolume) * 100) : 0;
                          return <tr key={period.id}>
                            <td className="text-center"></td>
                            <td>
                              <div>
                                <a href={`/commissions/periods/${period.id}/summary`} >
                                  <LocalDate dateString={period.end} />
                                </a>
                              </div>
                              <div className="small text-muted">
                                Starts: <LocalDate dateString={period.begin} />
                              </div>
                            </td>
                            <td>{period.status}</td>
                            <td>{period.totalCustomersPaid}</td>
                            <td>{period.totalVolume.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                            <td>{period.totalCommissions?.toLocaleString("en-US", { style: 'currency', currency: 'USD' })}</td>
                            <td className="text-center">
                              <div className="row align-items-center">
                                <div className="col-12 col-lg-auto">{percent}%</div>
                                <div className="col">
                                  <div className="progress">
                                    <div className="progress-bar" style={{ width: `${percent}%` }} role="progressbar" aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100" aria-label={`{percent}% Complete`}>
                                      <span className="visually-hidden">{percent}% Complete</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        })}

                      </tbody>
                    </table>
                  </div>
                </div>
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageHeader>
}

export default Periods;