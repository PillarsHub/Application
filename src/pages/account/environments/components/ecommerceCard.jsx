import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useFetch } from '../../../../hooks/useFetch'
import { SendRequest } from '../../../../hooks/usePost'
import Modal from '../../../../components/modal';
import SelectInput from '../../../../components/selectInput';
import TextInput from '../../../../components/textInput';
import Switch from '../../../../components/switch';

const ECommerceCard = ({ environmentId }) => {
  const [reconnect, setReconnect] = useState({ status: false });
  const [connect, setConnect] = useState();
  const { error, data, refetch } = useFetch(`/api/v1/environment/${environmentId}/ECommerce/status`);

  const handleReconnect = () => {
    setReconnect({ status: true });

    SendRequest("POST", `/api/v1/environment/${environmentId}/ECommerce/reconnect`, {}, () => {
      setReconnect({ status: false });
      refetch();
    }, (error) => {
      setReconnect({ status: false, error: error });
    })
  }

  const handleChange = (name, value) => {
    setConnect(v => ({ ...v, [name]: value, error: null }));
  }

  const handleConnect = () => {
    setConnect(v => ({ ...v, status: true, error: null }));

    SendRequest("POST", `/api/v1/environment/${environmentId}/ECommerce`, connect, () => {
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
          },
        }));
      } else {
        setConnect((v) => ({
          ...v,
          status: false,
          error: { general: error },
        }));
      }
    })
  }

  if (error) return `Error! ${error}`;


  return <>
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          E-Commerce Integration
        </h3>
        <div className="card-actions">
          <button onClick={() => setConnect({ serviceType: data.serviceType, status: false, enableEdit: data.enableEdit })} className="btn w-100 btn-icon">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-settings" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z"></path><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"></path></svg>
          </button>
        </div>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <div className="datagrid">
            <dl className="row">
              <dd className="col-8">E-Commerce</dd>
              <dd className="col-4 text-end">{data?.serviceType ?? 'Loading...'}</dd>
              <dd className="col-8">Customer & Order Management</dd>
              <dd className="col-4 text-end">{data?.enableEdit ? 'Yes' : 'No'}</dd>
              <dd className="col-8">Status</dd>
              <dd className="col-4 text-end">
                <span className={`status status-${(data?.connected ?? true) ? 'success' : 'danger'} status-lite`}>
                  <span className="status-dot"></span> {(data?.connected ?? true) ? 'Connected' : 'Disconnected'}
                </span>
              </dd>
            </dl>
            {reconnect.error && <>
              <div className="alert alert-danger" role="alert">
                <h4 className="alert-title">Unable to reconnect to e-commerce service</h4>
                <div className="text-muted">{reconnect.error}</div>
              </div>
            </>}
          </div>
        </div>
      </div>
      <div className="card-footer">
        <div className="d-flex">
          {!(data?.connected ?? true) && <>
            {reconnect.status && <button className="btn btn-outline-warning btn-sm ms-auto"><span className="spinner-border spinner-border-sm me-2" role="status"></span> Reconnecting</button>}
            {!reconnect.status && <button className="btn btn-outline-warning btn-sm ms-auto" onClick={handleReconnect} >Reconnect</button>}
          </>}
        </div>
        {/* <a href="https://docs.commissionsportal.com/en/integrations/ecommerce" >Learn more</a> */}
      </div>
    </div>

    <Modal showModal={connect != undefined} onHide={() => setConnect()} >
      <div className="modal-header">
        <h5 className="modal-title">E-Commerce Connection</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <div className="mb-3">
          <label className="form-label">E-Commerce</label>
          <SelectInput name="serviceType" value={connect?.serviceType} onChange={handleChange} >
            <option value="Pillars">Pillars Internal</option>
            <option value="WooCommerce">WooCommerce</option>
            <option value="Custom">Custom</option>
          </SelectInput>
          {connect?.serviceType == "WooCommerce" && <small className="form-hint mt-2 ecom-woo">
            The WooCommerce instance needs to be set up and configured beforehand.
            For instructions on how to set up an e-commerce instance and prepare it for integration,
            we kindly direct you to our <a href="https://pillars-hub.readme.io/docs/woocommerce" target="_blank" rel="noreferrer">documentation</a>.
          </small>}
        </div>
        {connect?.serviceType == "WooCommerce" && <>
          <div className="mb-3">
            <label className="form-label">Api Url</label>
            <TextInput name="url" value={connect?.url} errorText={connect?.error?.url} onChange={handleChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">Consumer Key</label>
            <TextInput name="publicKey" value={connect?.publicKey} errorText={connect?.error?.publicKey} onChange={handleChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">Consumer Secret</label>
            <TextInput name="privateKey" value={connect?.privateKey} errorText={connect?.error?.privateKey} onChange={handleChange} />
          </div>
        </>}

        <div className="mb-3">
          <Switch title="Customer & Order Management" name="enableEdit" value={connect?.enableEdit} errorText={connect?.error?.url} onChange={handleChange} />
          <small className="form-hint">
            When enabled, users can create and edit customers and orders directly in Pillars.
            This is usually disabled to keep data in sync with the connected e-commerce platform.
            Enabling it may result in data differences between Pillars and the source system
          </small>
        </div>

        {connect?.error?.general && <>
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-title">Unable to connect to e-commerce service</h4>
            <div className="text-muted">{connect.error.general}</div>
          </div>
        </>}

      </div>
      <div className="modal-footer">
        <button className="btn btn-link link-secondary" data-bs-dismiss="modal">Cancel</button>
        {connect?.status && <button className="btn btn-primary ms-auto"><span className="spinner-border spinner-border-sm me-2" role="status"></span> Connecting</button>}
        {!connect?.status && <button className="btn btn-primary ms-auto" onClick={handleConnect}>Connect</button>}
      </div>

    </Modal>

  </>
};

export default ECommerceCard;

ECommerceCard.propTypes = {
  environmentId: PropTypes.string.isRequired
}

