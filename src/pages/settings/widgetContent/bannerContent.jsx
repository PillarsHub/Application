import React, { useState } from "react";
import PropTypes from 'prop-types';
import Modal from "../../../components/modal.jsx";
import TextInput from '../../../components/textInput.jsx';
import TextArea from '../../../components/textArea.jsx';
import FileInput from "../../../components/fileInput.jsx";
import { SendRawRequest } from "../../../hooks/usePost.js";

const MAX_DOCUMENT_SIZE = 1024 * 1024; // 1 MB (adjust the size as needed)

const BannerContent = ({ widget, updateWidget }) => {
  const [processing, setProcessing] = useState(false)
  const [showEdit, setShowEdit] = useState();
  const [showDelete, setShowDelete] = useState();
  const [sizeError, setSizeError] = useState();
  const [editItem, setEditItem] = useState();
  const [documentFile, setDocumentFile] = useState(null);

  const handleDeleteHide = () => setShowDelete(false);
  const handleShowDelete = (index) => {
    setEditItem({ ...widget?.panes[index], index: index });
    setShowDelete(true);
  }
  const handleDelete = () => {
    updateWidget((v) => {
      v.panes.splice(editItem.index, 1);
      return { ...v }
    });
    setShowDelete(false);
  }

  const handleHideEdit = () => setShowEdit(false);
  const handleShowEdit = (index) => {
    setSizeError();
    setDocumentFile();
    if (index > -1) {
      setEditItem({ ...widget?.panes[index], index: index, linkType: "LF" });
    } else {
      setEditItem({ index: index, linkType: "UL" });
    }
    setShowEdit(true);
  }

  const handleSaveEdit = () => {
    const item = { ...editItem };

    if (item.linkType != "LF") {
      if (sizeError) return;
      if (!documentFile) {
        setSizeError('File is required');
        return;
      } else {
        setProcessing(true);
        const formData = new FormData();
        formData.append("file", documentFile);
        formData.append("title", documentFile.name);
        formData.append("Description", "Widget Image");
        formData.append("category", "Widget_Images");

        SendRawRequest("PUT", '/api/v1/blobs', null, formData, (r) => {
          item.imageUrl = r.url;
          setProcessing(false);
          updateItem(item);
        }, (error, code) => {
          alert(`${code}: ${error}`);
          setProcessing(false);
        });
      }
    } else {
      updateItem(item)
    }
  }

  const updateItem = (item) => {
    updateWidget((v) => {
      if (item.index == -1) {
        if (!v.panes) v.panes = [];
        v.panes.push(item);
      } else {
        v.panes[item.index] = item;
      }

      return { ...v }
    });
    setShowEdit(false);
  }

  const handleSlideChange = (name, value) => {
    setEditItem((v) => ({ ...v, [name]: value }));
  }

  const handleDocumentFileChange = (name, file) => {
    setSizeError()
    if (file && file.size > MAX_DOCUMENT_SIZE) {
      setSizeError('File size is too large. Please select a smaller file.')
    }
    setDocumentFile(file);
  };

  return <>
    <div className="row row-deck row-cards">
      {widget?.panes && widget.panes.map((p, index) => {
        return <div key={p.id} className="col-sm-6 col-lg-4">
          <div className="card card-sm">
            <img src={p.imageUrl} className="card-img-top" />
            <div className="card-footer card-footer-transparent text-center pt-2">
              <div className="d-flex align-items-center">
                <div className="col">
                  <div>{p.title}</div>
                  <div className="text-muted">{p.text}</div>
                </div>
                <div className="col-auto">
                  <div className="dropdown">
                    <a href="#" className="btn-action" data-bs-toggle="dropdown" aria-expanded="false">
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="19" r="1"></circle><circle cx="12" cy="5" r="1"></circle></svg>
                    </a>
                    <div className="dropdown-menu dropdown-menu-end">
                      <button className="dropdown-item" onClick={() => handleShowEdit(index)} >Edit</button>
                      <button className="dropdown-item text-danger" onClick={() => handleShowDelete(index)} >Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      })}

      <button className="btn btn-default" onClick={() => handleShowEdit(-1)}>
        <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-photo-plus" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M15 8h.01"></path><path d="M12.5 21h-6.5a3 3 0 0 1 -3 -3v-12a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v6.5"></path><path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l4 4"></path><path d="M14 14l1 -1c.67 -.644 1.45 -.824 2.182 -.54"></path><path d="M16 19h6"></path><path d="M19 16v6"></path></svg>
        Add Slide
      </button>

    </div>
    <Modal showModal={showEdit} onHide={handleHideEdit}>
      <div className="modal-header">
        <h5 className="modal-title">Slide Details</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <div className="row">
          <div className="col-12 mb-3">
            <label className="form-label">Slider Text</label>
            <TextInput name="title" value={editItem?.title ?? ''} onChange={handleSlideChange} />
          </div>
          <div className="col-12 mb-3">
            <TextArea name="text" value={editItem?.text ?? ''} onChange={handleSlideChange} />
          </div>

          <div className="col-8">
            {editItem?.linkType === "LF" && <>
              <label className="form-label">Media Url</label>
              <TextInput name="imageUrl" value={editItem.imageUrl} onChange={handleSlideChange} />
              <span className="text-danger"></span>
            </>}
            {editItem?.linkType != "LF" && <>
              <label className="form-label">Document</label>
              <FileInput id="file" accept="image/*" name="file" value={documentFile} onChange={handleDocumentFileChange} className={`form-control ${sizeError ? 'is-invalid' : ''}`} />
              <span className="invalid-feedback">{sizeError}</span>
              <small className="form-hint mb-3 ms-1 mt-2">
                The document must be less than 1MB in size.
              </small>
            </>}
          </div>
          <div className="col-4">
            <label className="form-label">Media Type</label>
            <select className="form-select" name="linkType" value={editItem?.linkType || ""} onChange={(e) => handleSlideChange(e.target.name, e.target.value)} >
              <option value="UL">Upload File</option>
              <option value="LF">Link File</option>
            </select>
            <span className="text-danger"></span>
          </div>

          {/* <div className="col-12 mb-3">
            <label className="form-label">Image Url</label>
            <div className="input-group">
              <TextInput name="imageUrl" value={editItem?.imageUrl ?? ''} onChange={handleSlideChange} />
              <button className="btn btn-default" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-upload" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 9l5 -5l5 5" /><path d="M12 4l0 12" /></svg>
                Upload
              </button>
            </div>

          </div> */}
        </div>
      </div>
      <div className="modal-footer">
        <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
          Cancel
        </a>
        {!processing && <button type="submit" className="btn btn-primary ms-auto" onClick={handleSaveEdit}>
          Save
        </button>}
        {processing && <button type="submit" className="btn btn-primary ms-auto">
          Uploading Image
        </button>}
      </div>
    </Modal>

    <Modal showModal={showDelete} size="sm" onHide={handleDeleteHide}>
      <div className="modal-body">
        <div className="modal-title">Are you sure?</div>
        <div>If you proceed, you will lose pane settings.</div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-link link-secondary me-auto" data-bs-dismiss="modal">Cancel</button>
        <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete Pane</button>
      </div>
    </Modal>
  </>
}

export default BannerContent;

BannerContent.propTypes = {
  widget: PropTypes.any.isRequired,
  updateWidget: PropTypes.func.isRequired
}