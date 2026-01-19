import React from 'react';
import PropTypes from 'prop-types';

const EmptyContent = ({ title, text, buttonText = '', href = '', onClick }) => {
  return <div className="empty">
    <p className="empty-title">{title ?? 'Content not found'}</p>
    <p className="empty-subtitle text-muted">
      {text ?? 'The content requested cannot be found.'}
    </p>
    {buttonText && <div className="empty-action">
      {href && <a href={href} className="btn btn-primary">
        {buttonText}
      </a>}

      {!href && <button href={href} className="btn btn-primary" onClick={onClick}>
        {buttonText}
      </button>}
    </div>}
  </div>
}

export default EmptyContent;

EmptyContent.propTypes = {
  title: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  buttonText: PropTypes.string,
  href: PropTypes.string,
  onClick: PropTypes.func
}
