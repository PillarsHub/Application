import React from 'react';
import PropTypes from 'prop-types';

const BonusPicker = ({ bonuses, excludedBonuses, onChange, disabled }) => {
  const excluded = new Set(excludedBonuses);
  const includedCount = bonuses.filter(bonus => !excluded.has(bonus.key)).length;
  const allIncluded = includedCount === bonuses.length;
  const toggleBonus = (key, included) => {
    const next = new Set(excludedBonuses);
    if (included) next.delete(key);
    else next.add(key);
    onChange([...next]);
  };
  return (
    <div className="dropdown">
      <button type="button" className="btn dropdown-toggle" data-bs-toggle="dropdown" data-bs-auto-close="outside"
        aria-expanded="false" disabled={disabled}>
        Bonuses: {allIncluded ? 'All' : `${includedCount} of ${bonuses.length}`}
      </button>
      <div className="dropdown-menu p-3" style={{ minWidth: '17rem' }}>
        <div className="d-flex align-items-center justify-content-between gap-3 mb-2">
          <span className="fw-semibold">Include bonuses</span>
          <button type="button" className="btn btn-sm" disabled={disabled || !excludedBonuses.length} onClick={() => onChange([])}>Select all</button>
        </div>
        <p className="small text-muted mb-3">Applies to all payables sections.</p>
        <div style={{ maxHeight: '20rem', overflowY: 'auto' }}>
          {bonuses.map(bonus => (
            <label className="form-check mb-2" key={bonus.key}>
              <input type="checkbox" className="form-check-input" checked={!excluded.has(bonus.key)} disabled={disabled}
                onChange={event => toggleBonus(bonus.key, event.target.checked)} />
              <span className="form-check-label">{bonus.title}</span>
            </label>
          ))}
          {!bonuses.length && <div className="small text-muted">No bonuses available for this period.</div>}
        </div>
      </div>
    </div>
  );
};

BonusPicker.propTypes = {
  bonuses: PropTypes.arrayOf(PropTypes.shape({ key: PropTypes.string.isRequired, title: PropTypes.string.isRequired })).isRequired,
  excludedBonuses: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default BonusPicker;
