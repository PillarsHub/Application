import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { SendRequest } from "../../hooks/usePost";
import SelectInput from "../../components/selectInput";
import Modal from '../../components/modal';

const ChangeStatusModal = ({ customerId, show, onHide, statusId, setStatus, statuses }) => {
  const [statusUpdatedId, setStatusUpdatedId] = useState();
  const [working, setWorking] = useState(false);

  useEffect(() => {
    setStatusUpdatedId(statusId);
  }, [statusId])

  const handleSubmit = async e => {
    e.preventDefault();
    setWorking(true);
    const now = new Date();

    var source = {
      nodeId: customerId,
      sourceGroupId: "Status",
      date: now.toISOString(),
      value: statusUpdatedId,
      externalId: now.toISOString()
    };

    SendRequest("POST", "/api/v1/Sources", source, () => {
      var item = statuses.find(element => element.id == statusUpdatedId);
      setTimeout(() => {
        setWorking(false);
        setStatus(item);
        onHide();
      }, 1000);
    }, (error) => {
      setWorking(false);
      alert(error);
    });
  }

  return <>
    <Modal showModal={show} onHide={onHide}>
      <form className="modal-content" onSubmit={handleSubmit} autoComplete="off">
        <div className="modal-header">
          <h5 className="modal-title">Change Status</h5>
          <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div className="modal-body">
          <input type="hidden" />
          <div className="row">
            <div className="col-md-12">
              <div className="mb-3">
                <label className="form-label">Customer Status</label>
                <SelectInput value={statusUpdatedId} emptyOption="Select Status" onChange={(name, value) => setStatusUpdatedId(value)}>
                  {statuses && statuses.map((status) => {
                    return <option key={status.id} value={status.id}>{status.name}</option>
                  })}
                </SelectInput>
                <span className="text-danger"></span>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <a href="#" className="btn btn-link link-secondary me-auto" data-bs-dismiss="modal">
            Cancel
          </a>
          {!working && <button type="submit" className="btn btn-primary">Save</button>}
          {working && <button disabled className="btn btn-primary">
            <span className="spinner-border spinner-border-sm me-2" role="status"></span> Save
          </button>}
        </div>
      </form>
    </Modal >
  </>
}

export default ChangeStatusModal;

ChangeStatusModal.propTypes = {
  customerId: PropTypes.string.isRequired,
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  statusId: PropTypes.string.isRequired,
  setStatus: PropTypes.func.isRequired,
  statuses: PropTypes.array.isRequired
}