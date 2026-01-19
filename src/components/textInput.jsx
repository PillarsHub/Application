import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

const TextInput = ({ className = 'form-control', type = '', name, value, onChange, disabled, placeholder, errorText, errored, required = false }) => {
  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    onChange(name, value);
  }, [onChange]);

  const inputClass = (errorText || errored) ? `${className} is-invalid` : className;

  return (
    <>
      <input
        type={type}
        className={inputClass}
        placeholder={placeholder || ''}
        name={name}
        value={value ?? ''}
        disabled={disabled}
        onChange={handleChange}
        autoComplete='off'
        required={required}
      />
      {errorText && <div className="invalid-feedback">{errorText}</div>}
    </>
  );
}

export default TextInput;

TextInput.propTypes = {
  className: PropTypes.string,
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  errorText: PropTypes.string,
  errored: PropTypes.bool,
  required: PropTypes.bool
}
