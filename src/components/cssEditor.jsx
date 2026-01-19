import React from 'react';
import PropTypes from 'prop-types';

const CssEditor = ({ name, value, onChange }) => {

    const handleChange = (event) => {
        
        var name = event.target.name;
        var value = event.target.value;
        
        onChange(name, value);
    };

    return <textarea className={'form-control'} rows={20} name={name} value={value} onChange={handleChange}></textarea>
}

export default CssEditor;

CssEditor.propTypes = {
    name: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired
}
