import React from 'react';
import PropTypes from 'prop-types';

const NumericInput = ({ className = 'form-control', name, value = 0, onChange, disabled, errorText, errored }) => {

  const handleChange = (event) => {
    var name = event.target.name;
    var value = Number(event.target.value);
    onChange(name, value);
  };

  const inputClass = (errorText || errored) ? `${className} is-invalid` : className;

  return <>
    <input type="number" className={inputClass} name={name} value={value !== 0 ? value : ''} disabled={disabled ?? false} autoComplete='off' onChange={handleChange}></input>
    {errorText && <div className="invalid-feedback">{errorText}</div>}
  </>
}

export default NumericInput;


NumericInput.propTypes = {
  className: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.number,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  errorText: PropTypes.string,
  errored: PropTypes.bool
}
