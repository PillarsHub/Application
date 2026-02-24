import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextInput from '../../../../components/textInput';

export default function KeyValueEditor({ values, handleChange }) {
  const [localPairs, setLocalPairs] = useState([]);

  // Convert object to array of key-value pairs on init/update
  useEffect(() => {
    const entries = Object.entries(values ?? {});
    setLocalPairs(entries);
  }, [values]);

  const triggerChange = (pairs) => {
    setLocalPairs(pairs);
    const updated = Object.fromEntries(pairs);
    handleChange(updated);
  };

  const handleKeyChange = (index, newKey) => {
    const updated = [...localPairs];
    updated[index] = [newKey, updated[index][1]];
    triggerChange(updated);
  };

  const handleValueChange = (index, newValue) => {
    const updated = [...localPairs];
    updated[index] = [updated[index][0], newValue];
    triggerChange(updated);
  };

  const handleAdd = () => {
    const updated = [...localPairs, ['', '']];
    triggerChange(updated);
  };

  const handleRemove = (index) => {
    const updated = [...localPairs];
    updated.splice(index, 1);
    triggerChange(updated);
  };

  return (
    <div>
      {localPairs.map(([key, value], index) => (
        <div key={index} style={{ display: 'flex', marginBottom: 8 }}>
          <TextInput
            value={key}
            name={index}
            onChange={handleKeyChange}
            placeholder="Key"
            style={{ marginRight: 8 }}
          />
          <TextInput
            value={value}
            name={index}
            onChange={handleValueChange}
            placeholder="Value"
            style={{ marginRight: 8 }}
          />
          <button type="button" className="btn btn-default" onClick={() => handleRemove(index)}>Remove</button>
        </div>
      ))}
      <button type="button" className="btn btn-default" onClick={handleAdd}>Add New</button>
    </div>
  );
}



KeyValueEditor.propTypes = {
  values: PropTypes.any.isRequired,
  handleChange: PropTypes.func.isRequired,
}
