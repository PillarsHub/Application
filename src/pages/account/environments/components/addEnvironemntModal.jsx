import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { SendRequest } from '../../../../hooks/usePost.js';
import Modal from '../../../../components/modal.jsx';
import TextInput from '../../../../components/textInput.jsx';

const AddEnvironmentModal = ({ refetch }) => {
  const [newEnv, setNewEnv] = useState();

  const handleEnvChange = (name, value) => {
    setNewEnv(v => ({ ...v, error: '', [name]: value }));
  }

  const handleSubmit = () => {
    if (newEnv.name) {
      SendRequest("POST", "/api/v1/Environments", newEnv, () => {
        refetch();
        setNewEnv();
      }, (error) => {
        setNewEnv(v => ({ ...v, error: error }));
      })
    } else {
      setNewEnv(v => ({ ...v, error: 'Name is required' }));
    }
  }

  return <>
    <button className="btn btn-primary d-none d-sm-inline-block" onClick={() => setNewEnv({ name: '' })} >
      New Environment
    </button>

    <Modal showModal={newEnv != undefined} onHide={() => setNewEnv()} >
      <div className="modal-header">
        <h5 className="modal-title">New Environment</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <label className="form-label text-start">Name</label>
        <TextInput name="name" errorText={newEnv?.error ?? ''} value={newEnv?.name ?? ''} placeholder="Your environment name" onChange={handleEnvChange} />
      </div>
      <div className="modal-footer">
        <button className="btn btn-link link-secondary" data-bs-dismiss="modal">Cancel</button>
        <button className="btn btn-primary ms-auto" onClick={handleSubmit}>
          Create Environment
        </button>
      </div>

    </Modal>
  </>
}

export default AddEnvironmentModal;

AddEnvironmentModal.propTypes = {
  refetch: PropTypes.func.isRequired
}
