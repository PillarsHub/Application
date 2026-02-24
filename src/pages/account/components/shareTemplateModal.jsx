import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { SendRequest } from '../../../hooks/usePost.js';
import { useFetch } from '../../../hooks/useFetch.js'
import Modal from '../../../components/modal.jsx';
import TextInput from '../../../components/textInput.jsx';

const ShareTemplateModal = ({ show, setShow, templateId, templateName }) => {
  const [errorObj, setErrorObj] = useState({});
  const [shareInput, setShareInput] = useState();
  const [working, setWorking] = useState(false);
  const [deleting, setDeleting] = useState();
  const { data, refetch } = useFetch(`/api/v1/Templates/${templateId}/share`, {});
  //const [working, setWorking] = useState(false);
  const handleHide = () => setShow(false);

  const handleChange = (name, value) => {
    setErrorObj({});
    setShareInput(v => ({ ...v, [name]: value }))
  }

  const addShare = () => {
    if ((shareInput?.emailAddress ?? '') !== '') {
      setWorking(true);
      setErrorObj({});
      const url = `/api/v1/Templates/${templateId}/share`;

      SendRequest("POST", url, shareInput, () => {
        refetch();
        setShareInput({});
        setWorking(false);
      }, (msg, code) => {
        if (code == 404) {
          setErrorObj({ code: code, message: 'Account was not found. Please check the email and try again.' })
        } else {
          setErrorObj({ code: code, message: msg })
        }
        setWorking(false);
      })
    } else {
      setErrorObj({ code: 0, message: 'Email address is required' })
    }
  }

  const removeShare = (email) => {
    setDeleting(email);
    setErrorObj({});
    const url = `/api/v1/Templates/${templateId}/share/${email}`;

    SendRequest("DELETE", url, shareInput, () => {
      refetch();
      setDeleting();
    }, (msg) => {
      setErrorObj({ [email]: msg })
      setDeleting();
    })
  }

  return <>
    <Modal showModal={show} onHide={handleHide} >

      <div className="modal-header">
        <h5 className="modal-title">Share {templateName}</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">

        <div className="mb-3">
          <div className="input-group mb-2">
            <TextInput name="emailAddress" errored={errorObj?.message} value={shareInput?.emailAddress ?? ''} placeholder="Enter email address to share this template with" onChange={handleChange} />
            {!working && <button className="btn" onClick={addShare} >Share</button>}
            {working && <button className="btn" ><span className="spinner-border spinner-border-sm me-2" role="status"></span></button>}
            {errorObj?.message && <div className="invalid-feedback">{errorObj?.message}</div>}
          </div>
        </div>

        <table className="table table-vcenter card-table">
          <tbody>
            {data && data.map((share) => {
              return <tr key={share.emailAddress}>
                <td>
                  {share.emailAddress}
                  <span className="text-danger d-block small">{errorObj[share.emailAddress]}</span>
                  {errorObj?.message && <div className="invalid-feedback">{errorObj?.message}</div>}
                </td>
                <td className="w-1">
                  {deleting == share.emailAddress && <button className="btn btn-default btn-icon">
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  </button>}
                  {deleting != share.emailAddress && <button className="btn btn-default btn-icon" onClick={() => removeShare(`${share.emailAddress}`)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-trash" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="4" y1="7" x2="20" y2="7"></line><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
                  </button>}
                </td>
              </tr>
            })}
          </tbody>
        </table>
      </div>
      <div className="modal-footer">
        <button className="btn btn-primary ms-auto" data-bs-dismiss="modal">Close</button>
      </div>
    </Modal>
  </>
}

export default ShareTemplateModal;

ShareTemplateModal.propTypes = {
  show: PropTypes.bool.isRequired,
  setShow: PropTypes.func.isRequired,
  templateId: PropTypes.string.isRequired,
  templateName: PropTypes.string.isRequired
}
