import React, { useRef } from 'react';
import PropTypes from 'prop-types';

import './fileInput.css';

const FileInput = ({ id, accept, className, name, onChange, disabled, button = false }) => {
  const inputFileRef = useRef(null);

  const handleChange = (event) => {
    var name = event.target.name;
    const file = event.target.files[0];

    onChange(name, file);
  };

  if (button) {

    const handleButtonClick = () => {
      // Trigger click on the input element
      inputFileRef.current.click();
    };


    return <>
      <button className={`${className} btn`} onClick={handleButtonClick} >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-upload"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 9l5 -5l5 5" /><path d="M12 4l0 12" /></svg>
        Upload
      </button>
      <input ref={inputFileRef} id={id} type="file" accept={accept} className="d-none" name={name} disabled={disabled} onChange={handleChange} autoComplete='off' />
    </>
  }

  return <input id={id} type="file" accept={accept} className={className ?? 'form-control'} name={name} disabled={disabled} onChange={handleChange} autoComplete='off' />
}

export default FileInput;

FileInput.propTypes = {
  id: PropTypes.string,
  accept: PropTypes.string,
  className: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  button: PropTypes.bool
}
