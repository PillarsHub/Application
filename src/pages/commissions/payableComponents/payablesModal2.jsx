import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { SendRequest } from "../../../hooks/usePost.js";
import Modal from "../../../components/modal.jsx";

const PayablesModal2 = ({ batchData, showModal, validation, onHide }) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(false);
  const [comment, setComment] = useState('');

  const invalid = validation.status === "invalid";

  // Keep payload stable and avoid mutating props.
  // Only add Comment when it has a value to keep the payload clean.
  const payload = useMemo(() => {
    const trimmed = comment.trim();
    if (!trimmed) return batchData;
    return { ...batchData, comment: trimmed };
  }, [batchData, comment]);

  const handleProcessPayables = () => {
    if (processing) return;
    setError();

    setProcessing(true);
    SendRequest('POST', '/api/v1/Batches/Create', payload, () => {
      window.location.assign('/commissions/paid');
    }, (a, error) => {
      setError({ state: '1', message: error });
      setProcessing(false);
    });
  };

  return (
    <Modal showModal={showModal} size="md" onHide={onHide}>
      <button
        type="button"
        className="btn-close"
        aria-label="Close"
        onClick={onHide}
        disabled={processing}
      />

      <div className="modal-body">
        <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
          <div>
            <div className="modal-title">Confirm payment batch</div>
            <div className="text-muted">
              Review the totals below, then confirm to create the batch.
            </div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-body py-3">
            {(validation?.totals?.totalPayables ?? 0) !== 0 && (
              <div className="d-flex justify-content-between align-items-center">
                <div className="text-muted">Payables</div>
                <div className="fw-semibold">
                  {validation?.totals?.totalPayables ?? 0}
                </div>
              </div>
            )}

            {(validation?.totals?.forfeitTotal ?? 0) !== 0 && (
              <div className="d-flex justify-content-between align-items-center mt-2">
                <div className="text-muted">Forfeit total</div>
                <div className="fw-semibold">
                  {(validation?.totals?.forfeitTotal ?? 0).toLocaleString("en-US", {
                    style: 'currency',
                    currency: 'USD'
                  })}
                </div>
              </div>
            )}

            <div className="d-flex justify-content-between align-items-center mt-2">
              <div className="text-muted">Release total</div>
              <div className="fw-semibold">
                {(validation?.totals?.releaseTotal ?? 0).toLocaleString("en-US", {
                  style: 'currency',
                  currency: 'USD'
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Comment */}
        <div className="mb-3">
          <label className="form-label" htmlFor="batchComment">
            Batch comment <span className="text-muted">(optional)</span>
          </label>

          <textarea
            id="batchComment"
            className="form-control"
            rows={3}
            placeholder="Add a note for this batch."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={processing}
          />
        </div>

        {invalid && (
          <div className="alert alert-warning mb-0" role="alert">
            <div className="alert-title">Negative net payments included</div>
            <div className="text-muted">
              One or more customers will receive a negative payment amount.
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-danger mb-0" role="alert">
            <div className="alert-title">Unable to create batch</div>
            <div className="text-muted">
              The batch could not be created. Please try again.
            </div>
          </div>
        )}

      </div>

      <div className="modal-footer">
        <button
          type="button"
          className="btn btn-link link-secondary"
          onClick={onHide}
          disabled={processing}
        >
          Cancel
        </button>

        {!processing ? (
          <button
            type="button"
            className="btn btn-primary ms-auto"
            onClick={handleProcessPayables}
          >
            Create batch
          </button>
        ) : (
          <button type="button" className="btn btn-primary ms-auto" disabled>
            <span className="spinner-border spinner-border-sm me-2" role="status" />
            Processing...
          </button>
        )}
      </div>
    </Modal>
  );
};

export default PayablesModal2;

PayablesModal2.propTypes = {
  showModal: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  batchData: PropTypes.object.isRequired,
  validation: PropTypes.object.isRequired
};
