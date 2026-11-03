import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid'; // Using uuid library for fallback

const generateUUID = () => {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID().replace(/-/g, "_");
  return uuidv4().replace(/-/g, "_");
};

const Modal = ({ showModal, onHide, size, centered, focus = true, dismissible = true, children }) => {
  const [modalId] = useState(() => 'modal_' + generateUUID());

  useEffect(() => {
    const mdl = document.getElementById(modalId);
    const handleHidden = () => onHide();
    const handleHide = (event) => {
      if (!dismissible) event.preventDefault();
    };
    mdl.addEventListener('hidden.bs.modal', handleHidden);
    mdl.addEventListener('hide.bs.modal', handleHide);

    if ((showModal && mdl.style.display !== 'block') || (!showModal && mdl.style.display === 'block')) {
      const elem = document.getElementById(`${modalId}_btn`);
      elem.click();
    }

    return () => {
      mdl.removeEventListener('hidden.bs.modal', handleHidden);
      mdl.removeEventListener('hide.bs.modal', handleHide);
    };
  }, [showModal, modalId, onHide, dismissible]);

  return (
    <>
      <button id={`${modalId}_btn`} style={{ display: 'none' }} data-bs-toggle="modal" data-bs-target={`#${modalId}`}>
        Update Status
      </button>

      <div id={modalId} className={`modal modal-blur modal-${size} fade`} data-bs-focus={focus} tabIndex="-1">
        <div className={`modal-dialog modal-dialog-${centered ? 'centered' : ''}`} role="document">
          <div className="modal-content">{children}</div>
        </div>
      </div>
    </>
  );
};

Modal.propTypes = {
  showModal: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  size: PropTypes.string,
  centered: PropTypes.string,
  focus: PropTypes.bool,
  dismissible: PropTypes.bool,
  children: PropTypes.any.isRequired,
};

export default Modal;
