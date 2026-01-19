import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const SaveButton = ({ settings, onClick }) => {
  const [status, setStatus] = useState();

  useEffect(() => {
    if (settings) {
      setStatus(settings.status ?? 0)
    } else {
      setStatus(0);
    }
  }, [settings])

  useEffect(() => {
    if (status === 2) {
      const timer = setTimeout(() => {
        setStatus(0);
      }, 3000);
      return () => clearTimeout(timer); // Clean up if component unmounts or status changes
    }
  }, [status]);

  if (status == 1) {
    return <>
      <button className="btn btn-primary">
        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
        Saving...
      </button>
    </>
  }

  const btnClass = status == 2 ? 'success' : 'primary';
  const btnText = status == 2 ? 'Saved' : 'Save';

  return <>
    <button type="submit" className={`btn btn-${btnClass} ms-auto`} onClick={onClick}>
      {status == 2 && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M5 12l5 5l10 -10" /></svg>}
      {btnText}
    </button>
    {settings?.error && <div className="alert alert-danger" role="alert">
      <div className="text-muted">{settings?.error}</div>
    </div>}
  </>

}

export default SaveButton;

SaveButton.propTypes = {
  settings: PropTypes.any.isRequired,
  onClick: PropTypes.func.isRequired
}
