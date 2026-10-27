import React from 'react';
import PropTypes from 'prop-types';

const MerchantPicker = ({ merchants, excludedMerchantIds, onChange, disabled }) => {
  const excluded = new Set(excludedMerchantIds);
  const includedCount = merchants.filter(merchant => !excluded.has(merchant.id)).length;
  const toggleMerchant = (id, included) => {
    const next = new Set(excludedMerchantIds);
    if (included) next.delete(id);
    else next.add(id);
    onChange([...next]);
  };
  return (
    <div className="dropdown">
      <button type="button" className="btn dropdown-toggle" data-bs-toggle="dropdown" data-bs-auto-close="outside"
        aria-expanded="false" disabled={disabled}>
        Merchants: {includedCount === merchants.length ? 'All' : `${includedCount} of ${merchants.length}`}
      </button>
      <div className="dropdown-menu p-3" style={{ minWidth: '17rem' }}>
        <div className="d-flex align-items-center justify-content-between gap-3 mb-2">
          <span className="fw-semibold">Include merchants</span>
          <button type="button" className="btn btn-sm" disabled={disabled || !excludedMerchantIds.length} onClick={() => onChange([])}>Select all</button>
        </div>
        <p className="small text-muted mb-3">Applies to all payables sections.</p>
        <div style={{ maxHeight: '20rem', overflowY: 'auto' }}>
          {merchants.map(merchant => (
            <label className="form-check mb-2" key={merchant.id}>
              <input type="checkbox" className="form-check-input" checked={!excluded.has(merchant.id)} disabled={disabled}
                onChange={event => toggleMerchant(merchant.id, event.target.checked)} />
              <span className="form-check-label">{merchant.name}</span>
              {merchant.serviceType && <span className="form-check-description">{merchant.serviceType}</span>}
            </label>
          ))}
          {!merchants.length && <div className="small text-muted">No merchants available for this period.</div>}
        </div>
      </div>
    </div>
  );
};

MerchantPicker.propTypes = {
  merchants: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired, name: PropTypes.string.isRequired, serviceType: PropTypes.string })).isRequired,
  excludedMerchantIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default MerchantPicker;
