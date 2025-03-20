import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const DateRangeInput = ({ className = 'form-control pe-4', name, startDate, endDate, onChange, disabled, placeholder, errorText, errored, allowEmpty = true }) => {
  const [begin, setBegin] = useState();
  const [end, setEnd] = useState();

  useEffect(() => {
    if (!allowEmpty && !startDate) {
      setBegin(new Date());
      setEnd(new Date());
      const formattedDate = new Date().toISOString();
      onChange(name, formattedDate, formattedDate);
    }
  }, [startDate, endDate])

  const handleChange = (update) => {
    const [startDate, endDate] = update;

    setBegin(startDate);
    setEnd(endDate);

    const formattedSDate = startDate ? startDate.toISOString() : null;
    const formattedEDate = endDate ? endDate.toISOString() : formattedSDate;
    onChange(name, formattedSDate, formattedEDate);
  };

  const inputClass = (errorText || errored) ? `${className} is-invalid` : className;

  return <>
    <div className="input-group">
      <div className="input-icon w-100">
        <DatePicker
          className={inputClass}
          placeholderText={placeholder ?? ''}
          name={name}
          timezone
          disabled={disabled}
          swapRange={true}
          selectsRange={true}
          startDate={begin}//startDate ? new Date(startDate) : null}
          endDate={end}//endDate ? new Date(endDate) : null}
          onChange={handleChange}
        />

        <span className="input-icon-addon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-calendar"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M16 2a1 1 0 0 1 .993 .883l.007 .117v1h1a3 3 0 0 1 2.995 2.824l.005 .176v12a3 3 0 0 1 -2.824 2.995l-.176 .005h-12a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-12a3 3 0 0 1 2.824 -2.995l.176 -.005h1v-1a1 1 0 0 1 1.993 -.117l.007 .117v1h6v-1a1 1 0 0 1 1 -1zm3 7h-14v9.625c0 .705 .386 1.286 .883 1.366l.117 .009h12c.513 0 .936 -.53 .993 -1.215l.007 -.16v-9.625z" /><path d="M12 12a1 1 0 0 1 .993 .883l.007 .117v3a1 1 0 0 1 -1.993 .117l-.007 -.117v-2a1 1 0 0 1 -.117 -1.993l.117 -.007h1z" /></svg>
        </span>
      </div>
    </div>
    {errorText && <div className="invalid-feedback">{errorText}</div>}
  </>

}

export default DateRangeInput;

DateRangeInput.propTypes = {
  className: PropTypes.string,
  name: PropTypes.string.isRequired,
  startDate: PropTypes.string.isRequired,
  endDate: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  errorText: PropTypes.string,
  errored: PropTypes.bool,
  allowEmpty: PropTypes.bool
}
