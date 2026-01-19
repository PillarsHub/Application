import React from 'react';
import PropTypes from 'prop-types';



const Switch = ({ name, value = false, onChange, disabled, title }) => {

    const handleChange = (event) => {
        
        var name = event.target.name;
        var value = event.target.checked;
        
        onChange(name, value);
    };

    if (title != '')
    {
        return <label className="form-check form-switch">
            <input type="checkbox" className="form-check-input" name={name} checked={value} disabled={disabled} onChange={handleChange} />
            <span className="form-check-label tw-pretty">{title}</span>
        </label>
    }

    return <label className="form-check form-check-single form-switch">
        <input type="checkbox" className="form-check-input" name={name} checked={value} disabled={disabled} onChange={handleChange} />
    </label>
}

export default Switch;

Switch.propTypes = {
    name: PropTypes.string.isRequired,
    value: PropTypes.bool,
    onChange: PropTypes.func,
    disabled: PropTypes.bool,
    title: PropTypes.string,
}
