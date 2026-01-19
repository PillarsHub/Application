import React, { useState, useEffect } from "react";
import { useFetch } from "../../hooks/useFetch";
import { SendRequest } from "../../hooks/usePost";
import PageHeader from "../../components/pageHeader";
import SettingsNav from "./settingsNav";
import TextInput from '../../components/textInput';
import TextArea from '../../components/textArea';
import Editor from '../../components/editor';

const EmailContent = () => {
  const { data: sender, error: sError } = useFetch('/api/v1/emailSender');
  const { data, loading, error } = useFetch('/api/v1/emailcontent/PasswordReset');
  const [item, setItem] = useState();

  useEffect(() => {
    if (data) {
      setItem(data);
    }
  }, [data])

  const handleChange = (name, value) => {
    setItem(v => ({ ...v, [name]: value }));
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    SendRequest('PUT', '/api/v1/emailcontent/PasswordReset', item, () => {
    }, (error) => {
      alert(error)
    })
  }

  var hasSender = !sError && (sender?.id ?? '' != '') ? true : false;

  return <PageHeader title="Email Content" preTitle="Settings">
    <SettingsNav loading={loading} error={error} pageId="emailContent">
      <div className="card-header">
        <span className="card-title">Email Content</span>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="card-body bg-light">

          {!hasSender && <div className="alert alert-warning" role="alert">
            <div className="d-flex">
              <div className="col-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon alert-icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 9v2m0 4v.01" /><path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75" /></svg>
              </div>
              <div className="col">
                <h4 className="alert-title">Email Delivery Service Not Configured</h4>
                <div className="text-muted">Please configure an email delivery service to enable the use of email content.</div>
              </div>
              <div className="col-auto">
                <div className="btn-list">
                  <a href="/settings/email/providers" className="btn btn-warning">Configure Delivery Service</a>
                </div>
              </div>
            </div>
          </div>}

          <div className="mb-3">
            <label className="form-label">Subject</label>
            <TextInput type="subject" name="subject" value={item?.subject} required={true} onChange={handleChange} />
          </div>

          <div className="card">
            <div className="card-header">
              <ul className="nav nav-tabs card-header-tabs" data-bs-toggle="tabs" role="tablist">
                <li className="nav-item" role="presentation">
                  <a href="#tabs-home-7" className="nav-link active" data-bs-toggle="tab" aria-selected="true" role="tab">Html Content</a>
                </li>
                <li className="nav-item" role="presentation">
                  <a href="#tabs-profile-7" className="nav-link" data-bs-toggle="tab" aria-selected="false" role="tab" tabIndex="-1">Text Content</a>
                </li>
              </ul>
            </div>
            <div className="">
              <div className="tab-content">
                <div className="tab-pane active show" id="tabs-home-7" role="tabpanel">
                  <Editor height={600} mode="complex" name="htmlBody" value={item?.htmlBody} onChange={handleChange} />
                </div>
                <div className="tab-pane" id="tabs-profile-7" role="tabpanel">
                  <TextArea rows={25} name="textBody" value={item?.textBody} onChange={handleChange} />
                </div>
              </div>
            </div>
          </div>

        </div>
        <div className="card-footer">
          <button className="btn btn-primary" type="submit">Save</button>
        </div>
      </form>
    </SettingsNav>
  </PageHeader>
}

export default EmailContent;