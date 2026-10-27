import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Get, useFetch } from '../../../../hooks/useFetch'
import { SendRequest } from '../../../../hooks/usePost'
import useToken from '../../../../features/authentication/hooks/useToken.jsx';
import Modal from '../../../../components/modal';
import SelectInput from '../../../../components/selectInput';
import Switch from '../../../../components/switch';
import TextInput from '../../../../components/textInput';
import TextArea from '../../../../components/textArea';
import MoneyOutLogs from './moneyOutLogs';

const serviceTypes = ['None', 'Pillars', 'Custom', 'TygaPay', 'PayQuicker', 'MassPay'];
const getServiceType = (value) => serviceTypes[value] ?? value;
const getServiceLabel = (value) => getServiceType(value) === 'Pillars' ? 'Pillars Internal' : getServiceType(value);

const getRequestError = (response) => {
  let parsed = response;
  try {
    parsed = JSON.parse(response);
  } catch {
    // The controller can return plain text as well as validation JSON.
  }
  if (!parsed || typeof parsed !== 'object') {
    return { general: String(parsed || 'The request failed. Please try again.') };
  }

  const fields = parsed.errors ?? parsed;
  const fieldMessage = (value) => Array.isArray(value) ? value.join(' ') : value;
  return {
    name: fieldMessage(fields.Name ?? fields.name),
    url: fieldMessage(fields.Url ?? fields.url),
    publicKey: fieldMessage(fields.PublicKey ?? fields.publicKey),
    privateKey: fieldMessage(fields.PrivateKey ?? fields.privateKey),
    general: parsed.errors ? Object.values(parsed.errors).flat().join(' ') :
      parsed.detail || parsed.message || parsed.title || JSON.stringify(parsed)
  };
};

const MoneyOutCard = ({ environmentId }) => {
  const { token, setToken } = useToken();
  const [copied, setCopied] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [connect, setConnect] = useState();
  const [deleting, setDeleting] = useState();
  const [working, setWorking] = useState(false);
  const [openingRegions, setOpeningRegions] = useState(false);
  const [regionsError, setRegionsError] = useState('');
  const apiUrl = `/api/v1/MoneyOut/${environmentId}`;
  const { error, loading, data, refetch } = useFetch(apiUrl);
  const merchants = [...(data ?? [])].sort((a, b) =>
    Number(!!b.isPrimary) - Number(!!a.isPrimary) ||
    (a.name ?? '').localeCompare(b.name ?? '', undefined, { sensitivity: 'base' })
  );

  const handleHideLogs = () => setShowLogs(false);
  const handleViewLogs = () => {
    setShowLogs(true);
  }

  const handleOpenRegions = () => {
    if (openingRegions || working || connect || deleting) return;
    setRegionsError('');
    if (!token?.token) {
      setRegionsError('Missing token. Please sign in again.');
      return;
    }

    setOpeningRegions(true);
    Get(`/Authentication/refresh/${encodeURIComponent(token.token)}?environmentId=${encodeURIComponent(environmentId)}`, (response) => {
      setToken(response);
      window.location.assign('/settings/regions');
    }, (response, code) => {
      setOpeningRegions(false);
      setRegionsError(code === 401 ? 'Your session has expired. Please sign in again.' : getRequestError(response).general);
    });
  };

  const handleChange = (name, value) => {
    if (name === "serviceType") {
      setConnect(prev => {
        if (prev.id) return prev;
        const updated = { ...prev, serviceType: value, url: '', headerKeys: {}, error: null };
        if (!prev.id && !prev.nameEdited) {
          updated.name = getServiceLabel(value);
        }

        if (value === "PayQuicker") {
          updated.url = "https://pillars-payquicker-hxhwgsf6hae0abbk.centralus-01.azurewebsites.net";
          updated.headerKeys = { "x-pq_environment": "p" };
        }
        if (value === "MassPay") {
          updated.url = "https://masspay.paymenture.com";
          updated.headerKeys = { "x-mp_environment": "p" };
        }

        return updated;
      });
    } else if (name === 'name') {
      setConnect(prev => ({ ...prev, name: value, nameEdited: true, error: null }));
    } else if (name === 'isPrimary') {
      setConnect(prev => prev.primaryLocked ? prev : { ...prev, isPrimary: value, error: null });
    } else if (name === 'url') {
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

  const allIpAddresses = ["40.113.234.66", "23.99.222.236", "23.99.210.196", "40.113.247.163", "40.113.236.255", "23.99.209.120", "23.99.213.137", 
                        "40.113.238.109", "40.113.224.116", "20.80.112.97", "20.80.113.33", "20.80.113.51", "20.80.113.52", "20.80.113.76", 
                        "20.80.113.92", "52.154.203.9", "52.154.254.8", "52.158.172.22", "52.158.172.35", "52.158.172.120", "52.158.173.174", "40.122.114.229"]

  const ipAddresses = [...new Set(allIpAddresses)].sort();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(ipAddresses.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleAdd = () => {
    setConnect({ id: 0, name: getServiceLabel('Pillars'), nameEdited: false, isPrimary: merchants.length === 0, primaryLocked: merchants.length === 0, environmentId, serviceType: 'Pillars', url: '', headerKeys: {}, status: false });
  };

  const handleEdit = (merchant) => {
    setConnect({ id: merchant.id, loading: true, status: false });
    Get(`${apiUrl}/${merchant.id}`, (provider) => {
      setConnect(current => current?.id === merchant.id && current.loading ? {
        ...provider,
        name: provider.name ?? '',
        isPrimary: provider.isPrimary ?? false,
        primaryLocked: provider.isPrimary ?? false,
        serviceType: getServiceType(provider.serviceType),
        url: provider.url ?? '',
        headerKeys: provider.headerKeys ?? {},
        loading: false,
        status: false
      } : current);
    }, (response) => {
      setConnect(current => current?.id === merchant.id && current.loading ? {
        ...current, loading: false, loadError: true, error: getRequestError(response)
      } : current);
    });
  };

  const handleConnect = () => {
    if (!connect || working || connect.status || connect.loading || connect.loadError) return;
    if (!connect.name.trim()) {
      setConnect(v => ({ ...v, error: { name: 'Enter a merchant name.' } }));
      return;
    }
    if (!connect.serviceType || connect.serviceType === 'None') {
      setConnect(v => ({ ...v, error: { general: 'Select a payment service.' } }));
      return;
    }
    if (['Custom', 'TygaPay'].includes(connect.serviceType) && !connect.url.trim()) {
      setConnect(v => ({ ...v, error: { url: 'Enter a service URL.' } }));
      return;
    }

    const { id, name, isPrimary, serviceType, url, headerKeys } = connect;
    const provider = { id, name: name.trim(), isPrimary, environmentId, serviceType, url: url.trim(), headerKeys };
    setWorking(true);
    setConnect(v => ({ ...v, status: true, error: null }));

    SendRequest(id ? 'PUT' : 'POST', id ? `${apiUrl}/${id}` : apiUrl, provider, () => {
      setWorking(false);
      setConnect();
      refetch();
    }, (response) => {
      setWorking(false);
      setConnect(v => v ? { ...v, status: false, error: getRequestError(response) } : v);
    })
  };

  const handleDelete = () => {
    if (!deleting || working || deleting.status) return;
    setWorking(true);
    setDeleting(v => ({ ...v, status: true, error: null }));
    SendRequest('DELETE', `${apiUrl}/${deleting.provider.id}`, undefined, () => {
      setWorking(false);
      setDeleting();
      refetch();
    }, (response) => {
      setWorking(false);
      setDeleting(v => v ? { ...v, status: false, error: getRequestError(response).general } : v);
    });
  };


  return <>
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          Commission Payment Integration
        </h3>
      </div>
      <div className="card-body">
        {loading && <div className="text-muted" role="status">Loading merchants...</div>}
        {!loading && error && <div className="alert alert-danger" role="alert">
          <p>Unable to load payment merchants. {getRequestError(error.message).general}</p>
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => refetch()}>Retry</button>
        </div>}
        {!loading && !error && merchants.length === 0 && <p className="text-muted mb-0">No payment merchants configured. Add a merchant to get started.</p>}
        {!loading && !error && merchants.length > 0 && <div className="list-group list-group-flush">
          {merchants.map(merchant => <div className="list-group-item px-0 bg-transparent" key={merchant.id}>
            <div className="d-flex align-items-center gap-2">
              <div className="flex-fill">
                <div className="fw-bold text-break">
                  {merchant.name || 'Unnamed merchant'}
                  {merchant.isPrimary && <span className="badge bg-primary-lt ms-2">Primary</span>}
                </div>
                <small className="text-muted">{getServiceLabel(merchant.serviceType)}</small>
              </div>
              <div className="btn-list flex-nowrap">
                <button type="button" className="btn btn-outline-default btn-sm" disabled={openingRegions || working || !!connect || !!deleting} aria-label={`Edit merchant ${merchant.id}`} onClick={() => handleEdit(merchant)}>Edit</button>
                <button type="button" className="btn btn-outline-danger btn-sm" disabled={openingRegions || working || !!connect || !!deleting} aria-label={`Delete merchant ${merchant.id}`} onClick={() => setDeleting({ provider: merchant, status: false })}>Delete</button>
              </div>
            </div>
          </div>)}
        </div>}
        {!loading && !error && merchants.length > 1 && <div className="mt-3">
          <p className="form-hint mb-0">
            With multiple merchants, choose which merchant handles payments for each region on the <button type="button" className="btn-link border-0 bg-transparent p-0" disabled={openingRegions || working || !!connect || !!deleting} onClick={handleOpenRegions}>
              {openingRegions ? 'Opening Regions...' : 'Regions page'}
            </button>.
          </p>
          {regionsError && <div className="text-danger mt-2" role="alert">{regionsError}</div>}
        </div>}
      </div>
      <div className="card-footer">
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-outline-default btn-sm" onClick={handleViewLogs}>Service Logs</button>
          <button type="button" className="btn btn-primary ms-auto" disabled={openingRegions || working || loading || !!error || !!connect || !!deleting} onClick={handleAdd}>Add Merchant</button>
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
        <h5 className="modal-title">{connect?.id ? 'Edit' : 'Add'} Payment Merchant</h5>
        <button type="button" className="btn-close" disabled={connect?.status} data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        {connect?.loading && <p className="text-muted" role="status">Loading merchant settings...</p>}
        {!connect?.loading && !connect?.loadError && <fieldset disabled={connect?.status}>
          <div className="mb-3">
            <label className="form-label">Payment Service</label>
            <SelectInput name="serviceType" value={connect?.serviceType} onChange={handleChange} disabled={!!connect?.id} emptyOption="Select Payment Service" >
              <option value="Pillars">Pillars Internal</option>
              <option value="PayQuicker">PayQuicker</option>
              <option value="MassPay">MassPay</option>
              <option value="TygaPay">TygaPay</option>
              <option value="Custom">Custom</option>
            </SelectInput>
          </div>
          {connect?.serviceType == "Pillars" && <div className="mb-3">
            <small className="form-hint">
              <strong>Pillars Internal</strong> is for testing only. It marks all payments as successful without sending them to any other service or transferring any funds.
            </small>
          </div>}
          {connect?.serviceType == "PayQuicker" && <div className="row">
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
          </div>}
          <div className="mb-3">
            <label className="form-label">Name</label>
            <TextInput name="name" value={connect?.name} errorText={connect?.error?.name} onChange={handleChange} required />
            <small className="form-hint">Change the name to distinguish merchants using the same payment service.</small>
          </div>
          <div className="mb-3">
            <Switch name="isPrimary" title="Primary" value={connect?.isPrimary ?? false} onChange={handleChange} disabled={connect?.status || connect?.primaryLocked} />
            {connect?.primaryLocked && <small className="form-hint">
              {connect.id ? 'To change the primary merchant, enable Primary on another merchant.' : 'The first merchant must be primary.'}
            </small>}
          </div>

          {connect?.serviceType == "PayQuicker" && <>
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

          {connect?.serviceType == "MassPay" && <>
            <div className="mb-3">
              <label className="form-label">API Key</label>
              <TextArea name="x-mp_apiKey" value={connect?.headerKeys["x-mp_apiKey"]} errorText={connect?.error?.privateKey} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">MassPay environment</label>
              <SelectInput name="x-mp_environment" value={connect?.headerKeys["x-mp_environment"] ?? ''} errorText={connect?.error?.privateKey} onChange={handleChange} >
                <option value="" disabled>Select Environment</option>
                <option value="p">Production</option>
                <option value="s">Sandbox</option>
              </SelectInput>
            </div>
          </>}

          {(connect?.serviceType == "Custom" || connect?.serviceType == "TygaPay") && <>
            <div className="mb-3">
              <label className="form-label">Service Url</label>
              <TextInput name="url" value={connect?.url} errorText={connect?.error?.url} onChange={handleChange} />
            </div>
          </>}
        </fieldset>}

        {connect?.error?.general && <>
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-title">Unable to {connect.loadError ? 'load' : 'save'} merchant</h4>
            <div className="text-muted">{connect.error.general}</div>
            {connect.loadError && <button type="button" className="btn btn-outline-danger btn-sm mt-2" onClick={() => handleEdit({ id: connect.id })}>Retry</button>}
          </div>
        </>}

      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-link link-secondary" disabled={connect?.status} data-bs-dismiss="modal">Cancel</button>
        <button type="button" className="btn btn-primary ms-auto" disabled={!connect || connect.status || connect.loading || connect.loadError} onClick={handleConnect}>
          {connect?.status && <span className="spinner-border spinner-border-sm me-2" role="status"></span>}
          {connect?.status ? 'Saving...' : 'Save Merchant'}
        </button>
      </div>
    </Modal >

    <Modal showModal={deleting != undefined} onHide={() => setDeleting()}>
      <div className="modal-header">
        <h5 className="modal-title">Delete Payment Merchant</h5>
        <button type="button" className="btn-close" disabled={deleting?.status} data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <p>Delete {deleting?.provider.name || 'this merchant'}?</p>
        <p className="text-muted mb-0">This removes its commission payment configuration.</p>
        {deleting?.error && <div className="alert alert-danger mt-3" role="alert">{deleting.error}</div>}
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-link link-secondary" disabled={deleting?.status} data-bs-dismiss="modal">Cancel</button>
        <button type="button" className="btn btn-danger ms-auto" disabled={!deleting || deleting.status} onClick={handleDelete}>
          {deleting?.status && <span className="spinner-border spinner-border-sm me-2" role="status"></span>}
          {deleting?.status ? 'Deleting...' : 'Delete Merchant'}
        </button>
      </div>
    </Modal>
  </>
};

export default MoneyOutCard;

MoneyOutCard.propTypes = {
  environmentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
}

