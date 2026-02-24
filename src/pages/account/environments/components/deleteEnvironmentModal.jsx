import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { SendRequest } from '../../../../hooks/usePost';
import Modal from '../../../../components/modal';
import TextInput from '../../../../components/textInput';

const DeleteEnvironmentModal = ({ environmentId, environmentName }) => {
  const [newEnv, setNewEnv] = useState();

  const handleEnvChange = (name, value) => {
    setNewEnv(v => ({ ...v, error: '', [name]: value }));
  }

  const handleSubmit = () => {
    if (newEnv.name) {
      if (newEnv.name == environmentName) {
        SendRequest("DELETE", "/api/v1/Environments/" + environmentId, newEnv, () => {
          location = "/";
        }, (error) => {
          setNewEnv(v => ({ ...v, error: error }));
        })
      } else {
        setNewEnv(v => ({ ...v, error: 'Name does not match environemnt name' }));
      }
    } else {
      setNewEnv(v => ({ ...v, error: 'Name is required' }));
    }
  }

  return <>
    <button className="btn btn-outline-danger d-none d-sm-inline-block" onClick={() => setNewEnv({ name: '' })} >
      <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-trash" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="4" y1="7" x2="20" y2="7"></line><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
      Delete Environment
    </button>

    <Modal showModal={newEnv != undefined} onHide={() => setNewEnv()} >
      <div className="modal-header">
        <h5 className="modal-title">Delete Environment</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">

        <div>
          <p><strong>Deleting this environment will permanently remove any data associated with the environment, and it cannot be recovered.</strong></p>
          <p>If you are sure you want to delete this environement, please enter the environment name below. &lsquo;{environmentName}&lsquo;</p>
        </div>

        <label className="form-label">Environment Name</label>
        <TextInput name="name" errorText={newEnv?.error ?? ''} value={newEnv?.name ?? ''} placeholder="Your environment name" onChange={handleEnvChange} />
      </div>
      <div className="modal-footer">
        <button className="btn btn-link link-secondary" data-bs-dismiss="modal">Cancel</button>
        <button className="btn btn-danger ms-auto" onClick={handleSubmit}>
          Delete Environment
        </button>
      </div>

    </Modal>
  </>
}

export default DeleteEnvironmentModal;

DeleteEnvironmentModal.propTypes = {
  environmentId: PropTypes.string.isRequired,
  environmentName: PropTypes.string.isRequired,
}
