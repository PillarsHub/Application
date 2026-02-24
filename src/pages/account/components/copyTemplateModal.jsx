import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { SendRequest } from '../../../hooks/usePost.js';
import Modal from '../../../components/modal.jsx';
import TextInput from '../../../components/textInput.jsx';

const CopyTemplateModal = ({ show, setShow, templateId, templateName }) => {
  const [value, setValue] = useState({ name: 'Copy of ' + templateName });
  const [errorObj, setErrorObj] = useState();
  const [working, setWorking] = useState(false);

  const handleHide = () => setShow(false);
  const handleChange = (name, value) => {
    setValue(v => ({ ...v, [name]: value }));
  }
  const copyItem = () => {
    setWorking(true);
    const url = `/api/v1/Templates/${templateId}/copy?templateName=${value.name}`;

    SendRequest("GET", url, {}, (r) => {
      location = `/templates/${r.id}/detail`;
    }, (msg, code) => {
      setErrorObj({code: code, message: msg})
      setWorking(false);
    })
  }

  return <>
    <Modal showModal={show} onHide={handleHide} >

      <div className="modal-header">
        <h5 className="modal-title">Copy Template</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <div className="mb-3">
          <label className="form-label text-start">Name</label>
          <TextInput name="name" errorText={errorObj?.name ?? ''} value={value?.name ?? ''} placeholder="Your environment name" onChange={handleChange} />
        </div>
        {errorObj && <span className="text-danger" > {errorObj.code}: {errorObj.message}</span>}
      </div>
      <div className="modal-footer">
        <button className="btn btn-link link-secondary" data-bs-dismiss="modal">Cancel</button>
        {!working && <button className="btn btn-primary ms-auto" onClick={copyItem}>Save</button>}
        {working && <button className="btn btn-primary ms-auto" onClick={copyItem}><span className="spinner-border spinner-border-sm me-2" role="status"></span>Saving</button>}
      </div>
    </Modal>
  </>
}

export default CopyTemplateModal;

CopyTemplateModal.propTypes = {
  show: PropTypes.bool.isRequired,
  setShow: PropTypes.func.isRequired,
  templateId: PropTypes.string.isRequired,
  templateName: PropTypes.string.isRequired
}
