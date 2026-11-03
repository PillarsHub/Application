import React from 'react';
import { Get, useFetch } from '../../../hooks/useFetch'
import useToken from '../../../features/authentication/hooks/useToken.jsx';
import AddEnvironmentModal from './components/addEnvironemntModal.jsx';
import PageHeader, { CardHeader } from '../../../components/pageHeader.jsx';
import DataLoading from '../../../components/dataLoading.jsx';
import DataError from '../../../components/dataError';
import ResponseTimeChart from './components/responseTimeChart.jsx';
import DailyCountChart from './components/dailyCountChart.jsx';
import useEnvironmentStats from './useEnvironmentStats';

const StatsLoading = () => <span className="text-muted" role="status">Loading statistics...</span>;

const EnvironmentList = () => {
  const { token, setToken } = useToken();
  const [loginError, setLoginError] = React.useState('');
  const { loading, error, data, refetch } = useFetch("/api/v1/Environments", {});
  const { loading: statsLoading, error: statsError, data: statsData, refetch: refetchStats } = useEnvironmentStats();
  const statsByEnvironment = React.useMemo(() => new Map(
    statsData?.environments.map(item => [String(item.environmentId), item])
  ), [statsData]);

  if (loading) return <DataLoading />;
  if (error) return <DataError error={error} />;

  const handleLogin = (environmentId) => {
    setLoginError('');

    if (!token?.token) {
      setLoginError('Missing token. Please sign in again.');
      return;
    }

    Get(`/Authentication/refresh/${token.token}?environmentId=${environmentId}`, (response) => {
      setToken(response);
      location = "/";
    }, (error, text) => {
      if (error == 401) {
        setLoginError('Invalid Token.  Please log out and try again.');
      } else {
        setLoginError(text);
      }
    })
  }

  const subTotal = 500000;
  const totalRequests = statsData?.totalRequests ?? 0;
  const percentage = totalRequests > 0 ? (totalRequests / subTotal * 100) : 0;

  return <>
    <PageHeader title="Environments" postTitle="Overview" showAfterDays={2}>
      <CardHeader>
        <div className="col-auto ms-auto d-print-none">
          <div className="btn-list">
            <AddEnvironmentModal refetch={refetch} />
          </div>
        </div>
      </CardHeader>
      <div className="page-body">
        <div className="container-xl">
          {statsError && <div className="alert alert-warning" role="alert">
            {statsError} <button type="button" className="btn btn-sm btn-outline-secondary ms-2" onClick={refetchStats}>Retry statistics</button>
          </div>}
          {loginError && (
            <div className="alert alert-danger alert-dismissible" role="alert">
              <div className="d-flex">
                <div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon alert-icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                </div>
                <div>
                  <h4 className="alert-heading">Unable to login to environment</h4>
                  <div className="text-muted">{loginError}</div>
                </div>
              </div>
              <a className="btn-close" data-bs-dismiss="alert" aria-label="close"></a>
            </div>
          )}
          <div className="row row-deck row-cards">
            <div className="col-12">
              <div className="card">
                <table className="table card-table table-vcenter table-responsive">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>AVERAGE RESPONSE TIME</th>
                      <th>REQUESTS THIS PERIOD</th>
                      <th>STATUS</th>
                      <th className="w-1">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data && data.map((env) => {
                      const isReady = env.status == 0;
                      const stat = statsByEnvironment.get(String(env.id));

                      return <tr key={env.id}>
                        <td>{env.name}</td>
                        <td>{statsLoading ? '-' : statsError ? 'Unavailable' : `${stat?.averageResponseTime ?? 0} ms`}</td>
                        <td>{statsLoading ? '-' : statsError ? 'Unavailable' : stat?.callCount ?? 0}</td>
                        <td>
                          {isReady ?
                            <><span className="badge bg-success me-1"></span> Ready </> :
                            <><span className="badge bg-warning me-1"></span> Initialized </>
                          }
                        </td>
                        <td>
                          <div className="btn-list flex-nowrap justify-content-end">
                            {isReady ? (
                              <>
                                <a href={`/account/environments/${env.id}`} className="btn btn-default">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-settings" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z"></path><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"></path></svg>
                                  Configure
                                </a>
                                <button onClick={() => handleLogin(env.id)} className="btn btn-default btn-icon">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-login" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M15 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2" /><path d="M21 12h-13l3 -3" /><path d="M11 15l-3 -3" /></svg>
                                </button>
                              </>
                            ) : (
                              <a href={`/account/environments/${env.id}`} className="btn w-100 btn-default">
                                <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-settings" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z"></path><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"></path></svg>
                                Configure
                              </a>
                            )}

                          </div>
                        </td>
                      </tr>
                    })}
                  </tbody>
                </table>
                {(!data || data.length == 0) && <>
                  <div className="card-body">
                    <div className="empty">
                      <p className="empty-title">No Environments</p>
                      <p className="empty-subtitle text-muted">
                        To ensure proper system functionality, please configure at least one environment.
                      </p>
                      <div className="empty-action">
                        <AddEnvironmentModal refetch={refetch} />
                      </div>
                    </div>
                  </div>
                </>}
              </div>
            </div>

            <div className="col-md-4">
              <div className="row row-deck row-cards" >



                <div className="card">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="subheader">Requests this period</div>
                      <div className="ms-auto lh-1">
                        <span className="text-muted">of {subTotal}</span>
                      </div>
                    </div>
                    <div className="h1 mb-3">
                      {statsLoading ? <StatsLoading /> : statsError ? 'Unavailable' : totalRequests}
                    </div>
                    <div className="d-flex mb-2">
                      <div>Subscription Usage</div>
                    </div>
                    {statsData && <div className="progress progress-sm">
                      <div className="progress-bar bg-green" style={{ width: `${percentage}%` }} role="progressbar" aria-valuenow={percentage} aria-valuemin="0" aria-valuemax="100">
                        <span className="visually-hidden">{percentage.toFixed(2)}% Complete</span>
                      </div>
                    </div>}
                  </div>
                </div>



                <div className="card">
                  <div className="card-body">
                    <h3 className="card-title">Average Response Time</h3>
                    {statsLoading ? <StatsLoading /> : statsData && <ResponseTimeChart data={statsData.responseTimes} startDate={statsData.responseTimeStart} />}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-8">
              <div className="card">
                <div className="card-body">
                  <h3 className="card-title">Requests per day</h3>
                  {statsLoading ? <StatsLoading /> : statsData && <DailyCountChart data={statsData.dailyCounts} />}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </PageHeader>
  </>
};

export default EnvironmentList;
