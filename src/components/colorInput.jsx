import React from 'react';
import PropTypes from 'prop-types';

const ColorInput = ({ className, name, value, onChange, disabled, placeholder, defaultValue }) => {

  const handleChange = (event) => {
    var name = event.target.name;
    var value = event.target.value;

    onChange(name, value);
  };

  const handleReset = () => {
    onChange(name, defaultValue);
  }

  const correctedValue = value ? value : defaultValue ?? '';

  return <>
    <div className="input-group">
      <span className="">
        <input type="color" className="form-control form-control-color" name={name} value={correctedValue} onChange={handleChange} />
      </span>
      <input className={className ?? 'form-control'} placeholder={placeholder ?? ''} name={name} value={correctedValue} disabled={disabled} onChange={handleChange} autoComplete='off' />
      {defaultValue && <button className="btn btn-icon text-muted" onClick={handleReset}>
      <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-arrow-back-up" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 14l-4 -4l4 -4" /><path d="M5 10h11a4 4 0 1 1 0 8h-1" /></svg>
        </button>}
    </div>
  </>
}

export default ColorInput;

ColorInput.propTypes = {
  className: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  defaultValue: PropTypes.string,
}
