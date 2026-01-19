import React from 'react';
import PropTypes from 'prop-types';

const TextArea = ({ className = 'form-control', name, value, placeholder, onChange, rows = 3 }) => {

    const handleChange = (event) => {
        
        var name = event.target.name;
        var value = event.target.value;
        
        onChange(name, value);
    };

    return <textarea className={className ?? 'form-control'} placeholder={placeholder ?? ''} rows={rows} name={name} value={value} onChange={handleChange}></textarea>
}

export default TextArea;

TextArea.propTypes = {
    className: PropTypes.string,
    name: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    rows: PropTypes.number,
}
