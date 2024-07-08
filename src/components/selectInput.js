import React, { Children } from 'react';
import PropTypes from 'prop-types';

const SelectInput = ({ className, name, value, onChange, disabled, emptyOption, children }) => {

  const handleChange = (event) => {
    var name = event.target.name;
    var value = event.target.value;
    onChange(name, value);
  };

  return <select className={className ?? 'form-select'} name={name} value={value ?? ""} disabled={disabled} onChange={handleChange}>
    {emptyOption && !value && <option value="" disabled={true}>{emptyOption}</option>}
    {Children.map(children, child =>
      <>{child} - {value}</>
    )}
  </select>;
}

export default SelectInput;



SelectInput.propTypes = {
  className: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.array.isRequired,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  emptyOption: PropTypes.string,
  children: PropTypes.any.isRequired
}
