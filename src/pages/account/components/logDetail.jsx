import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useFetch } from '../../../hooks/useFetch.js';
import LocalDate from '../../../util/LocalDate.jsx';

const LogDetail = ({ trace }) => {
  const { loading, error, data } = useFetch("/api/v1/logs/details", { trace: trace.traceId, date: trace.date });

  if (loading) return <div className="modal-body text-secondary">Loading log details...</div>;
  if (error) return <div className="modal-body"><div className="alert alert-danger mb-0">Unable to load log details: {String(error)}</div></div>;
  if (!data?.length) return <div className="modal-body text-secondary">No details were recorded for this trace.</div>;

  return <div className="modal-body bg-light" style={{ maxHeight: "75vh", overflowY: "auto" }}>
    <div className="d-flex flex-column gap-3">
      {data.map((logItem) => <LogEntry key={logItem.id} logItem={logItem} />)}
    </div>
  </div>;
};

const LogEntry = ({ logItem }) => {
  const message = logItem.message ?? {};
  const requestUrl = logItem.category === 'Api_Request' ?
    message.path ? `https://api.pillarshub.com${message.path}` : null
    : null;

  return <section className="card shadow-sm">
    <div className="card-header d-block py-3">
      <div className="row align-items-center g-2">
        <div className="col-12 col-md">
          <h3 className="card-title mb-1">{logItem.category || "Log entry"}</h3>
          <div className="d-flex flex-wrap align-items-center gap-2">
            {message.statusCode && <span className={`badge ${getStatusClass(message.statusCode)}`}>
              {message.statusCode}{message.status ? ` ${message.status}` : ""}
            </span>}
          </div>
        </div>
        <div className="col-12 col-md-auto text-secondary text-md-end">
          <LocalDate dateString={logItem.logTime} />
        </div>
      </div>
    </div>

    <div className="card-body">
      {requestUrl && <div className="mb-4">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h4 className="subheader mb-0">Request URL</h4>
          <CopyButton value={`${message.method ? `${message.method} ` : ""}${requestUrl}`} />
        </div>
        <pre className="p-1 ps-2 bg-light text-dark border rounded p-3 mb-0" style={{ overflowX: "auto", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
          <code>
            <span className="badge bg-blue-lt text-blue me-2">
              {message.method}
            </span>
            {requestUrl}
          </code>
        </pre>
      </div>}

      {(message.requestHeaders || message.requestBody) && <LogSection title="Request">
        {message.requestHeaders && <HeadersAccordion headers={message.requestHeaders} id={`request-headers-${logItem.id}`} />}
        {message.requestBody && <PayloadBlock title="Body" value={message.requestBody} />}
      </LogSection>}

      {(message.responseHeaders || message.responseBody) && <LogSection title="Response 33">
        {message.responseHeaders && <HeadersAccordion headers={message.responseHeaders} id={`response-headers-${logItem.id}`} />}
        {message.responseBody && <PayloadBlock title="Body" value={message.responseBody} />}
      </LogSection>}
    </div>
  </section>;
};

const LogSection = ({ title, children }) => <section className="mt-1">
  {children}
</section>;

const HeadersAccordion = ({ headers, id }) => {
  const entries = Object.entries(headers);
  if (!entries.length) return null;

  return <div className="accordion mb-3" id={`${id}-accordion`}>
    <div className="accordion-item">
      <h2 className="accordion-header" id={`${id}-heading`}>
        <button className="accordion-button collapsed py-2 px-3" type="button" data-bs-toggle="collapse" data-bs-target={`#${id}`} aria-expanded="false" aria-controls={id}>
          Headers <span className="badge bg-secondary-lt text-secondary ms-2">{entries.length}</span>
        </button>
      </h2>
      <div id={id} className="accordion-collapse collapse" aria-labelledby={`${id}-heading`} data-bs-parent={`#${id}-accordion`}>
        <div className="table-responsive">
          <table className="table table-sm table-vcenter table-striped mb-0">
            <tbody>
              {entries.map(([key, value]) => <tr key={key}>
                <th className="text-secondary text-nowrap align-top ps-3" scope="row">{key}</th>
                <td className="font-monospace text-break pe-3">{formatHeaderValue(value)}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>;
};

const PayloadBlock = ({ title, value }) => {
  const formattedValue = formatBody(value);

  return <div>
    <div className="d-flex align-items-center justify-content-between mb-2">
      <h4 className="subheader mb-0">{title}</h4>
      <CopyButton value={formattedValue} />
    </div>
    <pre className="bg-dark text-light rounded p-3 mb-0" style={{ maxHeight: "40vh", overflow: "auto", whiteSpace: "pre" }}>
      <code>{formattedValue}</code>
    </pre>
  </div>;
};

const CopyButton = ({ value }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return <button type="button" className="btn btn-sm btn-ghost-secondary" onClick={copy}>
    {copied ? "Copied" : "Copy"}
  </button>;
};

const formatBody = (body) => {
  if (body == null) return "";

  try {
    const parsed = typeof body === "string" ? JSON.parse(body) : body;
    if (parsed?.query) return parsed.query;
    return typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2);
  }
  catch {
    return String(body);
  }
};

const formatHeaderValue = (value) => typeof value === "string" ? value : JSON.stringify(value);

const getStatusClass = (statusCode) => {
  const code = Number(statusCode);
  if (code >= 200 && code < 300) return "bg-green-lt text-green";
  if (code >= 300 && code < 400) return "bg-yellow-lt text-yellow";
  if (code >= 400) return "bg-red-lt text-red";
  return "bg-secondary-lt text-secondary";
};

LogDetail.propTypes = { trace: PropTypes.object.isRequired };
LogEntry.propTypes = { logItem: PropTypes.object.isRequired };
LogSection.propTypes = { title: PropTypes.string.isRequired, children: PropTypes.node.isRequired };
HeadersAccordion.propTypes = { headers: PropTypes.object.isRequired, id: PropTypes.string.isRequired };
PayloadBlock.propTypes = { title: PropTypes.string.isRequired, value: PropTypes.any.isRequired };
CopyButton.propTypes = { value: PropTypes.string.isRequired };

export default LogDetail;
