import React, { useState, useEffect } from "react";
import { useQuery, gql } from "@apollo/client";
import { SendRequest } from "../../hooks/usePost.js";
import Modal from "../../components/modal.jsx";
import DataLoading from "../../components/dataLoading.jsx";
import PageHeader from "../../components/pageHeader.jsx";
import LocalDate from "../../util/LocalDate.jsx";
import DataError from "../../components/dataError.jsx";

var GET_PLANS = gql`query {
  compensationPlans {
    id
    name
  }
}`;

var GET_PERIODS = gql`query ($planId: String!, $date: Date!) {
  compensationPlans (idList: [$planId]) {
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
  const [tab, setPlanId] = useState(planQuery);
  const [periods, setPeriods] = useState();
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState();
  const [processing, setProcessing] = useState(false);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [errorPeriods, setErrorPeriods] = useState(false);
  const currentDate = new Date(Date.now());
  currentDate.setDate(currentDate.getDate() + 1);
  const isoDate = currentDate.toISOString();
  const dateOnly = isoDate.split('T')[0];
  const { loading, error, data } = useQuery(GET_PLANS, {
    variables: { date: dateOnly },
  });

  const { refetch } = useQuery(GET_PERIODS, {
    skip: true, // Initially skip the query
  });

  useEffect(() => {
    if (data) {
      if (!tab) {
        setPlanId(data.compensationPlans[0].id);
      }
    }
  }, [data]);

  useEffect(() => {
    if (!tab) return;
    let isLatest = true; // Token to ignore outdated results

    setLoadingPeriods(true);
    setErrorPeriods();
    refetch({ planId: tab, date: dateOnly })
      .then((result) => {
        if (!isLatest) return; // Ignore if not latest request
        let copy = [...result.data.compensationPlans[0].periods];
        let periods = copy.reverse();

        setPeriods(periods);
        setLoadingPeriods(false);
      })
      .catch((error) => {
        setErrorPeriods(error)
        setLoadingPeriods(false);
        console.error('Refetch error:', error);
      });

    return () => {
      isLatest = false; // Invalidate on next effect or unmount
    };
  }, [tab]);

  if (loading) return <DataLoading />;
  if (error) return `Error! ${error}`;

  const handleModalClose = () => setShowModal(false);
  const handleModalShow = (period, status) => {
    setModalData({ period: period, periodId: period.id, status: status });
    setShowModal(true);
  }

  const setPeriodStatus = () => {
    setProcessing(true);
    SendRequest('PUT', `/api/v1/CompensationPlans/0/Periods/${modalData.periodId}`, { status: modalData.status }, () => {
      setShowModal(false);
      setProcessing(false);
      /* setPeriods(prev => {
        // Clone the outer object
        const updated = { ...prev };
        updated.compensationPlans = updated.compensationPlans.map(plan => {
          // Clone the plan object
          const updatedPlan = { ...plan };
          updatedPlan.periods = updatedPlan.periods.map(period => {
            if (period.id === modalData.periodId) {
              return { ...period, status: modalData.status }; // Update status
            }
            return period;
          });
          return updatedPlan;
        });
        return updated;
      }); */
    }, (error) => {
      alert(error);
      setShowModal(false);
      setProcessing(false);
    });
  }

  return <><PageHeader title="Commission Periods">
    <div className="container-xl">
      <div className="row row-cards">
        <div className="col-12">
          <div className="card inverted">
            {data.compensationPlans.length > 1 && <div className="card-header">
              <ul className="nav nav-tabs card-header-tabs" data-bs-toggle="tabs" role="tablist">
                {data.compensationPlans.map((plan) => {
                  return <li key={plan.name} className="nav-item" role="presentation">
                    <a href={`#T${plan.id}`} className={`nav-link ${tab == plan.id ? 'active' : ''}`} onClick={(e) => { setPlanId(plan.id); e.preventDefault(); }}>{plan.name}</a>
                  </li>
                })}
              </ul>
            </div>}

            <div className="tab-content">
              {loadingPeriods && <DataLoading />}
              {errorPeriods && <DataError error={errorPeriods} />}

              {!loadingPeriods && !errorPeriods && <div className="table-responsive">
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
                      <th className="w-1"></th>
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
                        <td>
                          <div className="btn-list flex-nowrap">
                            <div className="dropdown">
                              <button className="btn-action" data-bs-toggle="dropdown" aria-expanded="false">
                                <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-menu-2" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 6l16 0"></path><path d="M4 12l16 0"></path><path d="M4 18l16 0"></path></svg>
                              </button>
                              <div className="dropdown-menu dropdown-menu-end">
                                <a className="dropdown-item" href={`/commissions/periods/${period.id}/summary`} >
                                  View Summary
                                </a>
                                {period.status?.toLowerCase() !== "closed" && <>
                                  <div className="dropdown-divider"></div>
                                  <button className="dropdown-item" onClick={() => handleModalShow(period, "Closed")} >
                                    Close Period
                                  </button>
                                </>}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    })}

                  </tbody>
                </table>
              </div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageHeader>

    <Modal showModal={showModal} size="sm" onHide={handleModalClose} >
      <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      <div className="modal-body">
        <div className="modal-title">Confirmation</div>
        <div className="mb-3">Are you sure you want to close this period?</div>

        <div className="d-flex justify-content-between">
          <p className="mb-2">Begin date</p>
          <LocalDate dateString={modalData?.period.begin} />
        </div>

        <div className="d-flex justify-content-between">
          <p className="mb-2">End date</p>
          <LocalDate dateString={modalData?.period.end} />
        </div>
        <hr className="mt-1 mb-2"></hr>
        <small className="form-hint">
          Once closed, all commissions for this period will be locked. No recalculations will occur, even if the underlying data changes. This action is permanent and cannot be undone.
        </small>
      </div>
      <div className="modal-footer">
        <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
          Cancel
        </a>
        {!processing && <button type="submit" className="btn btn-primary ms-auto" onClick={setPeriodStatus}>
          Close Period
        </button>}

        {processing && <button className="btn btn-primary ms-auto">
          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
          Close Period...
        </button>}
      </div>
    </Modal>
  </>
}

export default Periods;