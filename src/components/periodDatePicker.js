import React from 'react';
import PropTypes from 'prop-types';
import DateInput from './dateInput'; // ← use the timezone-aware component

const PeriodDatePicker = ({ className = 'form-control', name, value, onChange, disabled, placeholder, errorText, errored, allowEmpty = true }) => {
  return (
    <div style={{ maxWidth: '150px' }}>
      <DateInput
        className={className}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        errorText={errorText}
        errored={errored}
        allowEmpty={allowEmpty}
      />
    </div>
  );
};

export default PeriodDatePicker;

PeriodDatePicker.propTypes = {
  className: PropTypes.string,
  name: PropTypes.string.isRequired,
  /** ISO 8601 (UTC) string, e.g. "2025-10-01T00:00:00.000Z" */
  value: PropTypes.string.isRequired,
  /** onChange(name, isoUtcString) */
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  errorText: PropTypes.string,
  errored: PropTypes.bool,
  allowEmpty: PropTypes.bool
};
