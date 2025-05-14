import React, { Children } from 'react';
import PropTypes from 'prop-types';

const SelectInput = ({ className, name, value, onChange, disabled, emptyOption, children }) => {

  const handleChange = (event) => {
    var name = event.target.name;
    var value = event.target.value;
    onChange(name, value);
  };

  // Recursive function to get all valid values from children, including optgroups
  const getChildValues = (children) => {
    return Children.toArray(children).flatMap(child => {
      if (child.type === 'optgroup') {
        return getChildValues(child.props.children);
      } else if (child.props.value !== undefined) {
        return child.props.value?.toString();
      }
      return [];
    });
  };

  const childValues = getChildValues(children);
  const isValidValue = childValues.includes(value?.toString())

  return <>
    <select className={className ?? 'form-select'} name={name} value={isValidValue ? value : ""} disabled={disabled} onChange={handleChange}>
      {emptyOption && !isValidValue && <option value="" disabled={true}>{emptyOption}</option>}
      {Children.map(children, child =>
        <>{child}</>
      )}
    </select>
  </>
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
