import React, { useState } from 'react';
import { useFetch } from '../../hooks/useFetch.js';
import Pagination from '../../components/pagination.jsx'
import PageHeader, { CardHeader } from '../../components/pageHeader.jsx'
import Modal from '../../components/modal.jsx'
import LocalDate from "../../util/LocalDate.jsx"
import LogDetail from './components/logDetail.jsx';

const Logs = () => {
  const currentDate = new Date().toISOString();
  const [hours, setHours] = useState(1);
  const [trace, setTrace] = useState();
  const { loading: countLoading, error: countError, data: countData, refetch: countRefetch } = useFetch("/api/v1/Logs/Counts", { date: currentDate, hours: 1 });
  const { loading: envLoading, error: envError, data: envData } = useFetch("/api/v1/Environments", { forLogs: true });
  const { loading, error, data, variables, refetch } = useFetch("/api/v1/Logs", { date: currentDate, hours: 1, offset: 0, count: 10 });

  if (countLoading || envLoading || loading) return <span>Loading...</span>;
  if (error) return `Error! ${error}`;
  if (countError) return `Error! ${countError}`;
  if (envError) return `Error! ${envError}`;

  if (!countData) return `Error! ${countError}`;

  const setTimeSpan = (hours) => {
    countRefetch({ hours: hours })
    refetch({ hours: hours, offset: 0, count: 10 });
    setHours(hours);
  }

  const clearFilter = () => {
    refetch({ environmentId: null, statusCode: null, offset: 0, count: 10 });
  }

  const setEnvironmentFilter = (envId) => {
    refetch({ environmentId: envId, statusCode: null, offset: 0, count: 10 });
  }

  const setStatusCodeFilter = (code) => {
    refetch({ environmentId: null, statusCode: code, offset: 0, count: 10 });
  }

  const groupedData = {};
  countData.forEach(item => {
    if (!groupedData[item.name]) {
      groupedData[item.name] = [];
    }
    groupedData[item.name].push(item);
  });

  // Sort data within each group by 'count'
  for (const name in groupedData) {
    groupedData[name].sort((a, b) => b.count - a.count);
  }

  const GetEnvironmentName = (environmentId) => {
    var name = envData?.find(env => env.id == environmentId)?.name;
    if (name) return name;

    return environmentId == 0 ? 'N/A' : environmentId;
  }

  return <>
    <PageHeader title="Logs Page" preTitle="Account" >
      <CardHeader>
        <div className="col-auto ms-auto d-print-none">
          <div className="dropdown">
            <button className="btn btn-default dropdown-toggle text-muted" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Last {hours} hours</button>
            <div className="dropdown-menu dropdown-menu-end">
              <button className={`dropdown-item ${hours == 1 && 'active'}`} onClick={() => setTimeSpan(1)}>Last 1 hours</button>
              <button className={`dropdown-item ${hours == 3 && 'active'}`} onClick={() => setTimeSpan(3)}>Last 3 hours</button>
              <button className={`dropdown-item ${hours == 6 && 'active'}`} onClick={() => setTimeSpan(6)}>Last 6 hours</button>
              <button className={`dropdown-item ${hours == 12 && 'active'}`} onClick={() => setTimeSpan(12)}>Last 12 hours</button>
              <button className={`dropdown-item ${hours == 24 && 'active'}`} onClick={() => setTimeSpan(24)}>Last 24 hours</button>
            </div>
          </div>
        </div>
      </CardHeader>
      <div className="page-body">
        <div className="container-xl">
          <div className="row row-deck row-cards">

            <div className="col-sm-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Requests by Environment</h3>
                </div>
                <table className="table card-table">
                  <thead>
                    <tr>
                      <th>Environment</th>
                      <th className="text-end" >Requests</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedData["EnvironmentId"] && groupedData["EnvironmentId"].map((data) => {
                      return <tr key={data.value}>
                        <td>
                          {GetEnvironmentName(data.value)}
                        </td>
                        <td className="text-end">
                          <a href="#" onClick={(e) => { e.preventDefault(); setEnvironmentFilter(data.value); }}>{data.count}</a>
                        </td>
                      </tr>
                    })}
                  </tbody>
                </table>
                <div className="card-footer">
                  {groupedData["Total"] &&
                    <div className="row">
                      <div className="col"></div>
                      <div className="col-auto">
                        Total: <a href="#" onClick={(e) => { e.preventDefault(); clearFilter(data.value); }}>{groupedData["Total"][0]?.count}</a>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>

            <div className="col-sm-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Requests by Response Code</h3>
                </div>
                <table className="table card-table">
                  <thead>
                    <tr>
                      <th>Path</th>
                      <th className="text-end" >Requests</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedData["StatusCode"] && groupedData["StatusCode"].map((data) => {
                      return <tr key={data.value}>
                        <td>{data.value} - {httpCodeToName[data.value]}</td>
                        <td className="text-end" >
                          <a href="#" onClick={(e) => { e.preventDefault(); setStatusCodeFilter(data.value); }}>{data.count}</a>
                        </td>
                      </tr>
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="col-12">
              <div className="card">
                <table className="table table-vcenter card-table">
                  <thead>
                    <tr>
                      <th>Environment</th>
                      <th>Method</th>
                      <th>Path</th>
                      <th>Status Code</th>
                      <th>Response Time</th>
                      <th>Log Time</th>
                      <th className="w-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items && data.items.map((log) => {
                      return <tr key={log.traceId}>
                        <td>{GetEnvironmentName(log.environmentId)}</td>
                        <td>{log.method}</td>
                        <td>{log.path}</td>
                        <td>{log.statusCode} - {httpCodeToName[log.statusCode]}</td>
                        <td>{log.responseTime}</td>
                        <td><LocalDate dateString={log.logTime} /></td>
                        <td>
                          <button className="btn btn-default" onClick={() => setTrace({ traceId: log.traceId, date: log.logTime })} >View</button>
                        </td>
                      </tr>
                    })}
                  </tbody>
                </table>
                <div className="card-footer">
                  <Pagination variables={variables} refetch={refetch} total={data.total} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageHeader>

    <Modal showModal={trace != undefined} onHide={() => setTrace()} centered={true} size="lg" >
      <div className="modal-header">
        <h5 className="modal-title">Log Detail</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      {trace && <LogDetail trace={trace} />}
      <div className="modal-footer">
        <button type="button" className="btn" data-bs-dismiss="modal">Close</button>
      </div>

    </Modal>
  </>
};

const httpCodeToName = {
  0: "Incomplete ",
  100: "Continue",
  101: "Switching Protocols",
  200: "OK",
  201: "Created",
  202: "Accepted",
  203: "Non-Authoritative Information",
  204: "No Content",
  205: "Reset Content",
  206: "Partial Content",
  300: "Multiple Choices",
  301: "Moved Permanently",
  302: "Found",
  303: "See Other",
  304: "Not Modified",
  305: "Use Proxy",
  307: "Temporary Redirect",
  400: "Bad Request",
  401: "Unauthorized",
  402: "Payment Required",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  406: "Not Acceptable",
  407: "Proxy Authentication Required",
  408: "Request Timeout",
  409: "Conflict",
  410: "Gone",
  411: "Length Required",
  412: "Precondition Failed",
  413: "Payload Too Large",
  414: "URI Too Long",
  415: "Unsupported Media Type",
  416: "Range Not Satisfiable",
  417: "Expectation Failed",
  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
  505: "HTTP Version Not Supported",
};

export default Logs;