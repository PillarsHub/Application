import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

const RadioInput = ({ className = '', name, value, onChange, disabled, errorText, errored }) => {
  const handleChange = useCallback((event) => {
    const { dataset } = event.target;
    onChange(name, dataset.value);
  }, [onChange]);

  const inputClass = (errorText || errored) ? `${className} is-invalid` : className;

  return (
    <>
      <div className={`btn-group w-100 ${inputClass}`} role="group">
        <input type="radio" className="btn-check" name="btn-radio-toolbar" id="btn-radio-toolbar-1" data-value="left" autoComplete="off" disabled={disabled} onChange={handleChange} checked={value == 'left'} />
        <label htmlFor="btn-radio-toolbar-1" className="btn btn-icon">
          <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-align-left" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 6l16 0" /><path d="M4 12l10 0" /><path d="M4 18l14 0" /></svg>
        </label>
        <input type="radio" className="btn-check" name="btn-radio-toolbar" id="btn-radio-toolbar-2" data-value="center" autoComplete="off" disabled={disabled} onChange={handleChange} checked={value == 'center'} />
        <label htmlFor="btn-radio-toolbar-2" className="btn btn-icon">
          <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-align-center" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 6l16 0" /><path d="M8 12l8 0" /><path d="M6 18l12 0" /></svg>
        </label>
        <input type="radio" className="btn-check" name="btn-radio-toolbar" id="btn-radio-toolbar-3" data-value="right" autoComplete="off" disabled={disabled} onChange={handleChange} checked={value == 'right'} />
        <label htmlFor="btn-radio-toolbar-3" className="btn btn-icon">
          <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-align-right" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 6l16 0" /><path d="M10 12l10 0" /><path d="M6 18l14 0" /></svg>
        </label>
      </div>
      {errorText && <div className="invalid-feedback">{errorText}</div>}
    </>
  );
}

export default RadioInput;

RadioInput.propTypes = {
  className: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  errorText: PropTypes.string,
  errored: PropTypes.bool
}
