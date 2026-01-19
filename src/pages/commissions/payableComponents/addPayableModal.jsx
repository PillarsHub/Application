import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { SendRequest } from "../../../hooks/usePost";
import Modal from '../../../components/modal.jsx';
import AutoComplete from '../../../components/autocomplete.jsx';
import NumericInput from '../../../components/numericInput.jsx'
import TextInput from '../../../components/textInput.jsx';
import DateInput from '../../../components/dateInput.jsx';

const AddPayableModal = ({refetch}) => {
  const [showNewPayable, setShowNewPayable] = useState(false);
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [newPayable, setNewPayable] = useState({});

  const handleHideNewPayable = () => setShowNewPayable(false);
  const handleShowNewPayable = () => {
    setNewPayable({});
    setShowNewPayable(true);
  }

  const handlePayableChange = (name, value) => {
    setErrors({});
    setNewPayable((p) => ({ ...p, [name]: value }));
  }

  const handleAddPayable = () => {
    let hadError = false;

    if (!newPayable?.nodeId) {
      setErrors(v => ({ ...v, nodeId: 'NodeId is required' }));
      hadError = true;
    }
    if (!newPayable?.date) {
      setErrors(v => ({ ...v, date: 'Date is required' }));
      hadError = true;
    }
    if (!newPayable?.comment) {
      setErrors(v => ({ ...v, comment: 'Comment is required' }));
      hadError = true;
    }
    if (!newPayable?.amount) {
      setErrors(v => ({ ...v, amount: 'Amount is required' }));
      hadError = true;
    }

    if (!hadError) {
      setProcessing(true);
      SendRequest('POST', '/api/v1/Bonuses/Manual', newPayable, () => {
        setProcessing(false);
        refetch();
        setShowNewPayable(false);
      }, (error) => {
        setProcessing(false);
        setErrors({ error: error });
        alert(error);
      });
    }
  }

  return <>
  <button className="btn btn-default btn-sm-icon" onClick={handleShowNewPayable}>
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-coin">   <path stroke="none" d="M0 0h24v24H0z" fill="none" />    <path d="M20.985 12.528a9 9 0 1 0 -8.45 8.456" />   <path d="M16 19h6" />   <path d="M19 16v6" />   <path d="M9 10h.01" />   <path d="M15 10h.01" />  <path d="M14.8 9a2 2 0 0 0 -1.8 -1h-2a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4h-2a2 2 0 0 1 -1.8 -1" />   <path d="M12 7v10" /> </svg>
    <span className="d-none d-sm-table-cell text-start">Add Payable</span>
  </button>

  < Modal showModal={showNewPayable} onHide={handleHideNewPayable} >
      <div className="modal-header">
        <h5 className="modal-title">New Payable</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <div className="row">
          <div className="col-sm-7 mb-3">
            <label className="form-label">Customer</label>
            <AutoComplete errorText={errors.nodeId} name="nodeId" value={newPayable?.nodeId ?? ''} onChange={handlePayableChange} />
          </div>
          <div className="col-sm-5 mb-3">
            <label className="form-label">Period</label>
            <DateInput errorText={errors.date} name="date" value={newPayable?.date ?? 0} onChange={handlePayableChange} />
          </div>
          <div className="col-sm-7 mb-3">
            <label className="form-label">Comment</label>
            <TextInput errorText={errors.comment} name="comment" value={newPayable?.comment ?? ''} onChange={handlePayableChange} />
          </div>
          <div className="col-sm-5 mb-3">
            <label className="form-label">Amount</label>
            <NumericInput errorText={errors.amount} name="amount" value={newPayable?.amount ?? ''} onChange={handlePayableChange} />
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
          Cancel
        </a>
        {processing && <button className="btn btn-primary ms-auto">
          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
          Creating Payable
        </button>}
        {!processing && <>
          <button type="submit" className="btn btn-primary ms-auto" onClick={handleAddPayable}>
            Add Payable
          </button>
        </>}
      </div>
    </Modal >
  
  </>
}

export default AddPayableModal;

AddPayableModal.propTypes = {
  refetch: PropTypes.func.isRequired
}
