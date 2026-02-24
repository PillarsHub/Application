import React from 'react';
import { Get, useFetch } from '../../../hooks/useFetch'
import useToken from '../../../features/authentication/hooks/useToken.jsx';
import AddEnvironmentModal from './components/addEnvironemntModal.jsx';
import PageHeader, { CardHeader } from '../../../components/pageHeader.jsx';
import DataLoading from '../../../components/dataLoading.jsx';
import DataError from '../../../components/dataError';
import ResponseTimeChart from './components/responseTimeChart.jsx';
import DailyCountChart from './components/dailyCountChart.jsx';

const EnvironmentList = () => {
  const today = new Date();
  const beginningOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 31);
  const startDate = beginningOfMonth > tenDaysAgo ? beginningOfMonth : tenDaysAgo;

  const { token, setToken } = useToken();
  const [loginError, setLoginError] = React.useState('');
  const { loading, error, data, refetch } = useFetch("/api/v1/Environments", {});
  const { error: statsError, data: statsData } = useFetch("/api/v1/Logs/stats", { date: startDate.toISOString() });

  if (loading) return <DataLoading />;
  if (error) return <DataError error={error} />;
  if (statsError) return <DataError error={statsError} />;

  const groupedArray = statsData?.filter(item => new Date(item.date) >= beginningOfMonth).reduce((acc, currentItem) => {
    const existingItem = acc.find(item => item.environmentId === currentItem.environmentId);

    if (existingItem) {
      // If the date already exists, update the sum and count
      existingItem.sumResponseTime += currentItem.averageResponseTime;
      existingItem.count += 1;
      existingItem.callCount += currentItem.callCount;
    } else {
      // If the date doesn't exist, add a new entry to the accumulator
      acc.push({
        sumResponseTime: currentItem.averageResponseTime,
        count: 1,
        callCount: currentItem.callCount,
        environmentId: currentItem.environmentId,
      });
    }

    return acc;
  }, []) ?? [];

  const averageResponseTimes = groupedArray.map(item => ({
    averageResponseTime: Math.round(item.sumResponseTime / item.count),
    environmentId: item.environmentId,
    callCount: item.callCount
  }));

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

  const subTotal = 50000;
  const totalRequests = averageResponseTimes.reduce((sum, item) => sum + item.callCount, 0);
  const percentage = totalRequests > 0 ? (totalRequests / subTotal * 100) : 0;

  return <>
    <PageHeader title="Environments" postTitle="Overview" showAfterDays={1}>
      <CardHeader>
        <div className="col-auto ms-auto d-print-none">
          <div className="btn-list">
            <AddEnvironmentModal refetch={refetch} />
          </div>
        </div>
      </CardHeader>
      <div className="page-body">
        <div className="container-xl">
          {loginError && (
            <div className="alert alert-danger alert-dismissible" role="alert">
              <div className="d-flex">
                <div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon alert-icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                </div>
                <div>
                  <h4 className="alert-title">Unable to login to environment</h4>
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
                      const stat = averageResponseTimes.find(x => x.environmentId == env.id);

                      return <tr key={env.id}>
                        <td>{env.name}</td>
                        <td>{stat?.averageResponseTime ?? 0} ms</td>
                        <td>{stat?.callCount ?? 0}</td>
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
                      {totalRequests}
                    </div>
                    <div className="d-flex mb-2">
                      <div>Subscription Usage</div>
                    </div>
                    <div className="progress progress-sm">
                      <div className="progress-bar bg-green" style={{ width: `${percentage}%` }} role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                        <span className="visually-hidden">{percentage.toFixed(2)}% Complete</span>
                      </div>
                    </div>
                  </div>
                </div>



                <div className="card">
                  <div className="card-body">
                    <h3 className="card-title">Average Response Time</h3>
                    <ResponseTimeChart data={statsData} />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-8">
              <div className="card">
                <div className="card-body">
                  <h3 className="card-title">Requests per day</h3>
                  <DailyCountChart data={statsData} />
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
