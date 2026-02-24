import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { SendRequest } from '../../../hooks/usePost.js';
import Modal from '../../../components/modal.jsx';

const DeleteTemplateModal = ({ show, setShow, templateId, templateName }) => {
  const [errorObj, setErrorObj] = useState();
  const [working, setWorking] = useState(false);
  const handleHide = () => setShow(false);

  const deleteItem = () => {
    setWorking(true);
    const url = `/api/v1/Templates/${templateId}`;
    SendRequest("DELETE", url, {}, () => {
      location = `/templates`;
    }, (msg, code) => {
      setErrorObj({code: code, message: msg})
      setWorking(false);
    })
  }

  return <>
    <Modal showModal={show} onHide={handleHide} >

      <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      <div className="modal-body py-4">
        <div className="modal-title">Are you sure?</div>
        <div className="text-muted mb-3">Are you sure you want to permanently delete the &lsquo;{templateName}&lsquo; template</div>

        {errorObj && <span className="text-danger" > {errorObj.code}: {errorObj.message}</span>}
      </div>

      <div className="modal-footer">
        <button className="btn btn-link link-secondary" data-bs-dismiss="modal">Cancel</button>
        {!working && <button className="btn btn-danger ms-auto" onClick={deleteItem}>Delete Template</button>}
        {working && <button className="btn btn-danger ms-auto" onClick={deleteItem}><span className="spinner-border spinner-border-sm me-2" role="status"></span>Deleting</button>}
      </div>

    </Modal>
  </>
}

export default DeleteTemplateModal;

DeleteTemplateModal.propTypes = {
  show: PropTypes.bool.isRequired,
  setShow: PropTypes.func.isRequired,
  templateId: PropTypes.string.isRequired,
  templateName: PropTypes.string.isRequired
}
