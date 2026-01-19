import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import Cropper from 'react-easy-crop';
import { getOrientation } from 'get-orientation/browser'
import { getCroppedImg, getRotatedImage } from '../../../util/canvasUtils.js'
import Modal from '../../../components/modal.jsx';
import { SendRawRequest, SendRequest } from '../../../hooks/usePost.js';

import './changeProfileImage.css';

const ORIENTATION_TO_ANGLE = {
  '3': 180,
  '6': 90,
  '8': -90,
}

const ChangeProfileImage = ({ customerId, showModal, onHide, onUpdate }) => {
  const fileInputRef = useRef(null);
  const [processing, setProcessing] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0)
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const cropperRef = useRef();

  const handleHide = () => {
    setSelectedImage(null);
    setZoom(1);
    setRotation(0);
    onHide();
  }

  const handleImageChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      let imageDataUrl = await readFile(file)

      try {
        // apply rotation if needed
        const orientation = await getOrientation(file)
        const rotation = ORIENTATION_TO_ANGLE[orientation]
        if (rotation) {
          imageDataUrl = await getRotatedImage(imageDataUrl, rotation)
        }
      } catch (e) {
        console.warn('failed to detect the orientation')
      }

      setSelectedImage(imageDataUrl)
    }
  };

  const handleImageSelect = () => {
    fileInputRef.current.click();
  }


  const handleCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const handleImageUpload = async () => {
    try {
      setProcessing(true);
      const croppedImage = await getCroppedImg(selectedImage, croppedAreaPixels, rotation)

      // Convert Blob URL to a File object
      const file = await fetch(croppedImage).then(res => res.blob()).then(blob => new File([blob], `profile_${customerId}.png`));

      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name);
      formData.append("Description", "Profile Image");
      formData.append("category", "Profile_Image_" + customerId);

      SendRawRequest("PUT", '/api/v1/blobs', null, formData, (r) => {
        let item = [{
          op: "replace",
          path: "/profileImage",
          value: `${r.url}?t=${r.lastModified}`
        }];

        SendRequest("PATCH", `/api/v1/Customers/${customerId}`, item, () => {
          setSelectedImage(null);
          setZoom(1);
          setRotation(0);
          onUpdate();
          setProcessing(false);
        }, (error, code) => {
          alert(`${code}: ${error}`);
          setProcessing(false);
        })

      }, (error, code) => {
        alert(`${code}: ${error}`);
        setProcessing(false);
      });

    } catch (e) {
      console.error(e)
      setProcessing(false);
    }
  };

  return <>
    <Modal showModal={showModal ?? false} size="lg" onHide={handleHide}>
      <div className="modal-header">
        <h5 className="modal-title">Profile Photo</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        {selectedImage && <>
          <div className="AABB mb-3">
            <div className="crop-container">
              <Cropper
                ref={cropperRef}
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropComplete={handleCropComplete}
              />
            </div>
            <div className="controls">
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => {
                  setZoom(e.target.value)
                }}
                className="form-range mb-2"
              />
            </div>
          </div>
        </>}
        {!selectedImage && <>
          <div className="empty">
            <p className="empty-title">Please select an photo</p>
            <p className="empty-subtitle text-muted">
              Photo cannot be more than 1MB. The recommended height is 23px.
            </p>
            <div className="empty-action">
              <button className="btn btn-primary" onClick={handleImageSelect}>
                <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-camera-plus" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 20h-7a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v3.5" /><path d="M16 19h6" /><path d="M19 16v6" /><path d="M9 13a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>
                Upload Photo
              </button>
            </div>
          </div>
        </>}
      </div>
      <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleImageChange} />
      <div className="modal-footer">
        <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
          Cancel
        </a>
        {processing && <button className="btn btn-primary ms-auto">
          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
          Updating Profile
        </button>}
        {!processing && <button className="btn btn-primary ms-auto" disabled={!selectedImage} onClick={handleImageUpload}>
          Update Profile
        </button>}
      </div>
    </Modal>
  </>
};

function readFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(reader.result), false)
    reader.readAsDataURL(file)
  })
}

export default ChangeProfileImage;

ChangeProfileImage.propTypes = {
  customerId: PropTypes.string.isRequired,
  showModal: PropTypes.bool,
  onHide: PropTypes.func.isRequired,
  onUpdate: PropTypes.func,
}