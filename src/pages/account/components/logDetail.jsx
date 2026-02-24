import React from 'react';
import PropTypes from 'prop-types';
import { useFetch } from '../../../hooks/useFetch.js';
import LocalDate from '../../../util/LocalDate.jsx';


const LogDetail = ({ trace }) => {
  const { loading, error, data } = useFetch("/api/v1/logs/details", { trace: trace.traceId, date: trace.date });

  if (loading) return <span>Loading...</span>;
  if (error) return `Error! ${error}`;

  return <>
    {data && data.map((logItem) => {

      return <React.Fragment key={logItem.id}>
        <div className="modal-body">
          <div className="row row-cards">
            <div className="col-md-6 col-xl-6"><h4>{logItem.category}</h4></div>
            <div className="col-md-6 col-xl-6 text-end">
              <LocalDate dateString={logItem.logTime} />
            </div>
            <div className="col-12 mt-0">

              {logItem.message.method && <div className="mb-3"><pre className="p-1 ps-2 bg-dark-lt" ><code>{logItem.message.method} https://api.pillarshub.com{logItem.message.path}</code></pre></div>}

              {logItem.message.statusCode && <div className="mb-3"><pre className="p-1 ps-2 bg-dark-lt" ><code>{logItem.message.statusCode} {logItem.message.status}</code></pre></div>}

              {logItem.message.headers && <>
                <div className="accordion mb-3" id={`accordio-${logItem.id}`}>
                  <div className="accordion-item">
                    <h2 className="accordion-header" id={`heading-${logItem.id}`}>
                      <button className="accordion-button collapsed p-1 ps-2 pe-2" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse-${logItem.id}`} aria-controls={`collapse-${logItem.id}`}>
                        {logItem.category} Headers
                      </button>
                    </h2>
                    <div id={`collapse-${logItem.id}`} className="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent={`#accordio-${logItem.id}`}>
                      <table className="table table-sm table-vcenter card-table table-striped">
                        <tbody>
                          {logItem.message.headers.map((header) => {
                            return <tr key={header.key}>
                              <td >{header.key}</td>
                              <td >{header.value}</td>
                            </tr>
                          })}
                        </tbody>
                      </table>

                    </div>
                  </div>
                </div>
              </>}
              {logItem.message.body && <div>
                <pre style={{ maxHeight: "150px" }} ><code>{logItem.message.body}</code></pre>
              </div>
              }
            </div>
          </div >
        </div >
      </React.Fragment>
    })}
  </>
}

export default LogDetail;

LogDetail.propTypes = {
  trace: PropTypes.any.isRequired,

}
