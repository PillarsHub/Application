import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useFetch } from '../../../../hooks/useFetch'
import { SendRequest } from '../../../../hooks/usePost'
import Modal from '../../../../components/modal';
import SelectInput from '../../../../components/selectInput';
import TextInput from '../../../../components/textInput';
import MoneyOutLogs from './moneyOutLogs';

const MoneyOutCard = ({ environmentId }) => {
  const [copied, setCopied] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [connect, setConnect] = useState();
  const { error, data, refetch } = useFetch(`/api/v1/MoneyOut/${environmentId}`);

  const handleHideLogs = () => setShowLogs(false);
  const handleViewLogs = () => {
    setShowLogs(true);
  }

  const handleChange = (name, value) => {
    if (name === "serviceType") {
      setConnect(prev => {
        let updated = { [name]: value, headerKeys: {}, error: null };

        const currentServiceType = name === "serviceType" ? value : prev.serviceType;
        if (currentServiceType === "Paymenture") {
          updated.url = "https://pillars.paymenture.com/api/v1/batches";
        }
        if (currentServiceType === "PayQuicker") {
          updated.url = "https://pillars-payquicker-hxhwgsf6hae0abbk.centralus-01.azurewebsites.net";
          updated.headerKeys = { "x-pq_environment": "p" };
        }

        return updated;
      });
    } else if (name === "url") {
      setConnect(prev => ({ ...prev, [name]: value, error: null }));
    } else {
      setConnect(v => ({
        ...v,
        headerKeys: {
          ...v.headerKeys,
          [name]: value
        },
        error: null
      }));
    }
  }

  /* const handleTChange = (headerKeys) => {
    setConnect(v => ({
      ...v,
      headerKeys,
      error: null
    }));
  }; */

  const allIpAddresses = ["40.113.234.66", "23.99.222.236", "23.99.210.196", "40.113.247.163", "40.113.236.255", "23.99.209.120", "23.99.213.137", 
                        "40.113.238.109", "40.113.224.116", "20.80.112.97", "20.80.113.33", "20.80.113.51", "20.80.113.52", "20.80.113.76", 
                        "20.80.113.92", "52.154.203.9", "52.154.254.8", "52.158.172.22", "52.158.172.35", "52.158.172.120", "52.158.173.174", "40.122.114.229"]

  const ipAddresses = [...new Set(allIpAddresses)].sort();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(ipAddresses.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleShow = () => {
    setConnect({ serviceType: data.serviceType, url: data.url, headerKeys: data.headerKeys, status: false });
  }

  const handleConnect = () => {
    setConnect(v => ({ ...v, status: true, error: null }));

    SendRequest("PUT", `/api/v1/MoneyOut/${environmentId}`, connect, () => {
      setConnect();
      refetch();
    }, (error, code) => {
      if (code === 400) {
        const parsedError = JSON.parse(error);
        setConnect((v) => ({
          ...v,
          status: false,
          error: {
            url: parsedError.Url,
            publicKey: parsedError.PublicKey,
            privateKey: parsedError.PrivateKey,
            general: JSON.stringify(error)
          },
        }));
      } else {
        setConnect((v) => ({
          ...v,
          status: false,
          error: { general: JSON.stringify(error) },
        }));
      }
    })
  }

  if (error) return `Error! ${error}`;


  return <>
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          Commission Payment Integration
        </h3>
        <div className="card-actions">
          <button onClick={handleShow} className="btn w-100 btn-icon">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-settings" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z"></path><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"></path></svg>
          </button>
        </div>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <div className="datagrid">
            <dl className="row">
              <dt className="col-6">Payment Service</dt>
              <dd className="col-6 text-end">{data?.serviceType ?? 'Loading...'}</dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="card-footer">
        <div className="d-flex">
          <button className="btn btn-outline-default btn-sm ms-auto" onClick={handleViewLogs}>Service Logs</button>
        </div>
      </div>
    </div>

    <Modal showModal={showLogs} size="lg" onHide={handleHideLogs}>
      <div className="modal-header">
        <h5 className="modal-title">Payment Connection Logs</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="">
        {showLogs && <MoneyOutLogs environmentId={environmentId} />}
      </div>
      <div className="modal-footer">
        <button className="btn btn-default" data-bs-dismiss="modal">Close</button>
      </div>
    </Modal>

    <Modal showModal={connect != undefined} onHide={() => setConnect()} >
      <div className="modal-header">
        <h5 className="modal-title">Commission Payment Connection</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <div className="mb-3">
          <label className="form-label">Payment Service</label>
          <SelectInput name="serviceType" value={connect?.serviceType} onChange={handleChange} >
            <option value="Pillars">Pillars Internal</option>
            <option value="Paymenture">Paymenture</option>
            <option value="PayQuicker">PayQuicker</option>
            <option value="Custom">Custom</option>
          </SelectInput>
          {connect?.serviceType == "Paymenture" && <small className="form-hint mt-2 ecom-woo">
            If you need help with any of these fields, please contanct <a href="https://5567634.hs-sites.com/en/customer-support/contact-us" target="_blank" rel="noreferrer">Paymenture Support</a> for assistance.
          </small>}
        </div>
        {connect?.serviceType == "Paymenture" && <>
          <div className="mb-3">
            <label className="form-label">Service Url</label>
            <TextInput name="url" value={connect?.url} errorText={connect?.error?.url} onChange={handleChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">Paymenture User</label>
            <TextInput name="x-user" value={connect?.headerKeys["x-user"]} errorText={connect?.error?.publicKey} onChange={handleChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">Paymenture Token</label>
            <TextInput name="x-token" value={connect?.headerKeys["x-token"]} errorText={connect?.error?.privateKey} onChange={handleChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">Paymenture Client Id</label>
            <TextInput name="x-clientid" value={connect?.headerKeys["x-clientid"]} errorText={connect?.error?.privateKey} onChange={handleChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">Paymenture Company Id</label>
            <TextInput name="x-companyid" value={connect?.headerKeys["x-companyid"]} errorText={connect?.error?.privateKey} onChange={handleChange} />
          </div>
        </>}

        {connect?.serviceType == "PayQuicker" && <>

          <div className="row">
            <div className="col-9">
              <small className="form-hint mb-2">
                In order to successfully integrate with <strong>PayQuicker</strong>, the following IP addresses must be whitelisted in your PayQuicker account.
              </small>
            </div>
            <div className="col-3 mb-3">
              <div className="dropdown mb-3">
                <button
                  className="btn btn-sm btn-outline-secondary dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  View IPs
                </button>
                <ul className="dropdown-menu p-1">
                  <pre className="mb-2" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {ipAddresses.join('\n')}
                  </pre>
                  <button className="btn btn-sm btn-primary w-100" onClick={copyToClipboard}>
                    {copied ? 'Copied!' : 'Copy All'}
                  </button>
                </ul>
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">ClientId</label>
            <TextInput name="x-pq_clientId" value={connect?.headerKeys["x-pq_clientId"]} errorText={connect?.error?.publicKey} onChange={handleChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">Client Secret</label>
            <TextInput name="x-pq_clientSecret" value={connect?.headerKeys["x-pq_clientSecret"]} errorText={connect?.error?.privateKey} onChange={handleChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">Funding Account PublicId</label>
            <TextInput name="x-pq_fundingAccountPublicId" value={connect?.headerKeys["x-pq_fundingAccountPublicId"]} errorText={connect?.error?.privateKey} onChange={handleChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">PayQuicker environment</label>
            <SelectInput name="x-pq_environment" value={connect?.headerKeys["x-pq_environment"] ?? ''} errorText={connect?.error?.privateKey} onChange={handleChange} >
              <option value="" disabled>Select Environment</option>
              <option value="p">Production</option>
              <option value="s">Sandbox</option>
            </SelectInput>
          </div>

        </>}

        {connect?.serviceType == "Custom" && <>
          <div className="mb-3">
            <label className="form-label">Service Url</label>
            <TextInput name="url" value={connect?.url} errorText={connect?.error?.url} onChange={handleChange} />
          </div>
          {/* <div className="mb-3">
            <label className="form-label">Header Values</label>
            <KeyValueEditor values={connect.headerKeys} handleChange={handleTChange} />
          </div> */}
        </>}

        {connect?.error?.general && <>
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-title">Unable to connect to Payment Service</h4>
            <div className="text-muted">{connect.error.general}</div>
          </div>
        </>}

      </div>
      <div className="modal-footer">
        <button className="btn btn-link link-secondary" data-bs-dismiss="modal">Cancel</button>
        {connect?.status && <button className="btn btn-primary ms-auto"><span className="spinner-border spinner-border-sm me-2" role="status"></span> Connecting</button>}
        {!connect?.status && <button className="btn btn-primary ms-auto" onClick={handleConnect}>Connect</button>}
      </div>
    </Modal >
  </>
};

export default MoneyOutCard;

MoneyOutCard.propTypes = {
  environmentId: PropTypes.string.isRequired
}

