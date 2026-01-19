import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { SendRequest } from "../../hooks/usePost.js";
import Modal from "../../components/modal.jsx";

const PayablesModal = ({ batchData, showModal, onHide }) => {
  const [processing, setProcessing] = useState(false);

  const handleProcessPayables = () => {
    setProcessing(true);
    SendRequest('POST', '/api/v1/Batches', batchData, () => {
      location = '/commissions/paid';
    }, (error) => {
      alert(error);
      setProcessing(false);
    });
  }

  return <>
    <Modal showModal={showModal} size="sm" onHide={onHide} >
      <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      <div className="modal-body">
        <div className="modal-title">Confirm Payments</div>
        <div className="mb-3">Are you sure you want to process these payments?</div>

        {batchData?.total == 0 && <div className="d-flex justify-content-between text-muted strong">
          <p className="mb-2">Forfeite Total</p>
          <p className="mb-2 me-1">{batchData?.forfeitTotal?.toLocaleString("en-US", { style: 'currency', currency: 'USD' })}</p>
        </div>}

        <div className="d-flex justify-content-between text-muted strong">
          <p className="mb-2">Release Total</p>
          <p className="mb-2 me-1">{batchData?.total?.toLocaleString("en-US", { style: 'currency', currency: 'USD' })}</p>
        </div>
      </div>
      <div className="modal-footer">
        <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
          Cancel
        </a>
        {!processing && <button type="submit" className="btn btn-primary ms-auto" onClick={handleProcessPayables}>
          Submit Payables
        </button>}

        {processing && <button className="btn btn-primary ms-auto">
          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
          Processing...
        </button>}
      </div>
    </Modal>
  </>
}

export default PayablesModal;

PayablesModal.propTypes = {
  showModal: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  batchData: PropTypes.object.isRequired
}
