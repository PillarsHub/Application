import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

const DateTimeInput = ({ className = 'form-control', name, value, onChange, disabled, placeholder, errorText, errored, allowEmpty = true }) => {

  useEffect(() => {
    if (!allowEmpty && !value) {
      console.log(value);
      const formattedDate = new Date().toISOString();
      onChange(name, formattedDate);
    }
  }, [value])

  const handleChange = (event) => {
    if (event.target.value) {
      const inputDate = new Date(event.target.value); // Extract the date object from the input value
      const formattedDate = inputDate ? inputDate.toISOString() : ''; // Format the date as 'YYYY-MM-DD'
      onChange(name, formattedDate);
    } else {
      onChange(name, '');
    }
  };

  let displayDate = '';
  if (value) {
    const valueDate = new Date(Date.parse(value));
    displayDate = valueDate.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }) + 'T' + valueDate.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  const inputClass = (errorText || errored) ? `${className} is-invalid` : className;

  return <>
    <input type="datetime-local" className={inputClass} placeholder={placeholder ?? ''} name={name} value={displayDate} disabled={disabled} onChange={handleChange} autoComplete='off' />
    {errorText && <div className="invalid-feedback">{errorText}</div>}
  </>
}

export default DateTimeInput;

DateTimeInput.propTypes = {
  className: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  errorText: PropTypes.string,
  errored: PropTypes.bool,
  allowEmpty: PropTypes.bool
}
