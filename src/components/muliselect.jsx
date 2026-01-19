import React from 'react';
import { Children } from 'react';
import PropTypes from 'prop-types';

const MultiSelect = ({ id, className, name, value = [], onChange, disabled, children }) => {

    const handleChange = (event) => {
        
        var result = [];
        var options = event.target && event.target.options;
        var opt;

        for (var i=0, iLen=options.length; i<iLen; i++) {
            opt = options[i];

            if (opt.selected) {
            result.push(opt.value || opt.text);
            }
        }
        
        var name = event.target.name;
        onChange(name, result);
    };

    return <select id={id} className={className ?? 'form-select'} name={name} value={value} disabled={disabled} onChange={handleChange} multiple>
        {Children.map(children, child =>
            <>{child}</>
        )}
    </select>;
}

export default MultiSelect;



MultiSelect.propTypes = {
    id: PropTypes.string,
    className: PropTypes.string,
    name: PropTypes.string.isRequired,
    value: PropTypes.array,
    onChange: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    children: PropTypes.any.isRequired
}
