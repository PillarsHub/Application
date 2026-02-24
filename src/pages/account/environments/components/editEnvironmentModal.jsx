import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { SendRequest } from '../../../../hooks/usePost.js';
import Modal from '../../../../components/modal.jsx';
import TextInput from '../../../../components/textInput.jsx';

const EditEnvironmentModal = ({ environmentId, environmentName, refetch }) => {
  const [show, setShow] = useState(false);
  const [newEnv, setNewEnv] = useState({ name: environmentName });

  const handleEnvChange = (name, value) => {
    setNewEnv(v => ({ ...v, error: '', [name]: value }));
  }

  const handleSubmit = () => {
    if (newEnv.name) {
      SendRequest("PUT", "/api/v1/Environments/" + environmentId, newEnv, () => {
        refetch();
        setShow(false);
      }, (error) => {
        setNewEnv(v => ({ ...v, error: error }));
      })
    } else {
      setNewEnv(v => ({ ...v, error: 'Name is required' }));
    }
  }

  return <>
    <button className="btn btn-outline-primary btn-icon" onClick={() => setShow(true)} >
      <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" /><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" /><path d="M16 5l3 3" /></svg>
    </button>

    <Modal showModal={show} onHide={() => setShow(false)} >
      <div className="modal-header">
        <h5 className="modal-title">Edit Environment</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <label className="form-label">Environment Name</label>
        <TextInput name="name" errorText={newEnv?.error ?? ''} value={newEnv?.name ?? ''} placeholder="Your environment name" onChange={handleEnvChange} />
      </div>
      <div className="modal-footer">
        <button className="btn btn-link link-secondary" data-bs-dismiss="modal">Cancel</button>
        <button className="btn btn-primary ms-auto" onClick={handleSubmit}>
          Update
        </button>
      </div>

    </Modal>
  </>
}

export default EditEnvironmentModal;

EditEnvironmentModal.propTypes = {
  environmentId: PropTypes.string.isRequired,
  environmentName: PropTypes.string.isRequired,
  refetch: PropTypes.func.isRequired
}
