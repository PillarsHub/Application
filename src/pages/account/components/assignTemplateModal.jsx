import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useFetch } from '../../../hooks/useFetch.js';
import { SendRequest } from '../../../hooks/usePost.js';
import Modal from '../../../components/modal.jsx';
import TextInput from '../../../components/textInput.jsx';
import SelectInput from '../../../components/selectInput.jsx';

const AssignTemplateModal = ({ templateId }) => {
  const [assignData, setAssignData] = useState();
  const [working, setWorking] = useState(false);
  const { error, data } = useFetch("/api/v1/Environments", {});

  if (error) return <span>{error}</span>;

  const defaultEnvId = data?.find(env => env.status > 0)?.id;
  let environment = data?.find(env => env.id == assignData?.environmentId);
  //if (!environment) environment = data ? data[0] : undefined;

  const handleEnvChange = (name, value) => {
    setAssignData(v => ({ ...v, error: '', [name]: value }));
  }

  const handleSubmit = () => {

    setAssignData(v => ({ ...v, postError: null }));

    if (environment?.status > 0 || assignData.name) {
      if (environment?.status > 0 || assignData.name == environment.name) {
        const url = `/api/v1/Templates/AssignTemplate?environmentId=${assignData.environmentId}&templateId=${templateId}`
        setWorking(true);
        SendRequest("POST", url, {}, () => {
          setWorking(false);
          location = `/environments/${assignData.environmentId}`;
        }, (error) => {
          setWorking(false);
          setAssignData(v => ({ ...v, postError: error }));
        })
      } else {
        setAssignData(v => ({ ...v, error: 'Name does not match environemnt name' }));
      }
    } else {
      setAssignData(v => ({ ...v, error: 'Name is required' }));
    }
  }

  return <>
    {(!data || data.length > 0) &&
      <button className="btn btn-primary d-none d-sm-inline-block" onClick={() => setAssignData({ environmentId: defaultEnvId })} >
        Assign to Environment
      </button>}

    <Modal showModal={assignData != undefined} onHide={() => setAssignData()} >
      <div className="modal-header">
        <h5 className="modal-title">Assign to Environment</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <div className="mb-3">
          <label className="form-label">Environment Name</label>
          <SelectInput name="environmentId" value={assignData?.environmentId ?? ''} emptyOption="Select Environment" onChange={handleEnvChange} >
            {data && data.map((env) => {
              return <option key={env.id} value={env.id}>{env.name}</option>
            })}
          </SelectInput>
        </div>

        {assignData?.postError && <>
          <div className="mb-3">
            <span className="text-danger">{assignData.postError}</span>
          </div>
        </>}

        {environment && environment.status == 0 && (
          <>
            <div className="alert alert-warning" role="alert">
              <h4 className="alert-title">This environment already has a compensation plan assigned.</h4>
              <div className="text-muted">Assigning this compensation plan to an environment that already has a plan can cause data to be corrupted.</div>
            </div>

            <div>
              <p><strong> </strong></p>
              <p>If you are sure you want to proceed with this environment, please enter the environment name below: &lsquo;{environment?.name}&lsquo;</p>
            </div>


            <label className="form-label">Environment Confirmation</label>
            <TextInput name="name" errorText={assignData?.error ?? ''} value={assignData?.name ?? ''} placeholder="Your environment name" onChange={handleEnvChange} />
          </>
        )}
      </div>
      <div className="modal-footer">
        <button className="btn btn-link link-secondary" data-bs-dismiss="modal">Cancel</button>

        {working && <button className="btn btn-primary ms-auto"><span className="spinner-border spinner-border-sm me-2" role="status"></span>Processing</button>}
        {environment && !working && <button className="btn btn-primary ms-auto" onClick={handleSubmit}>Assign Template</button>}
        {!environment && !working && <button className="btn btn-primary ms-auto" disabled>Assign Template</button>}
      </div>
    </Modal>
  </>
}

export default AssignTemplateModal;

AssignTemplateModal.propTypes = {
  templateId: PropTypes.string.isRequired,
}
