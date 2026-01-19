import React from 'react';
import PropTypes from 'prop-types';

const CheckBox = ({ className = 'form-check-input', name, value, onChange, disabled }) => {

  const handleChange = (event) => {

    var name = event.target.name;
    var value = event.target.checked;

    onChange(name, value);
  };

  return <input type="checkbox" className={className} name={name} checked={value} disabled={disabled ?? false} onChange={handleChange} />
}

export default CheckBox;

CheckBox.propTypes = {
  className: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.bool.isRequired,
  onChange: PropTypes.func,
  disabled: PropTypes.bool
}
