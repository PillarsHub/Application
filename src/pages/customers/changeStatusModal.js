import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { SendRequest } from "../../hooks/usePost";
import SelectInput from "../../components/selectInput";

const ChangeStatusModal = ({ customerId, id, statusId, setStatus, statuses }) => {
  const [statusUpdatedId, setStatusUpdatedId] = useState(statusId);

  const handleSubmit = async e => {
    e.preventDefault();
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
      setStatus(item);
    }, (error) => {
      alert(error);
    });
  }

  return <div>
    <div className="modal modal-blur fade" id={id} tabIndex="-1" role="dialog" aria-hidden="true">
      <div className="modal-dialog modal-md" role="document">
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
            <button type="submit" className="btn btn-primary" data-bs-dismiss="modal">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
}

export default ChangeStatusModal;

ChangeStatusModal.propTypes = {
  customerId: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  statusId: PropTypes.string.isRequired,
  setStatus: PropTypes.func.isRequired,
  statuses: PropTypes.array.isRequired
}