import React, { useEffect, useState } from "react";
import { useFetch } from "../../hooks/useFetch";
import { SendRequest } from "../../hooks/usePost";
import PageHeader from "../../components/pageHeader";
import SettingsNav from "./settingsNav";
import TextInput from "../../components/textInput";
import NumericInput from "../../components/numericInput";

const EmailSettings = () => {
  const [item, setItem] = useState();
  const { data, loading } = useFetch('/api/v1/emailSender');

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
    
    SendRequest('PUT', '/api/v1/emailSender', item, () =>{
    }, (error) => {
      alert(error)
    })
  }

  return <PageHeader title="Email Delivery Service" preTitle="Settings">
    <SettingsNav loading={loading} pageId="emailProviders">
      <div className="card-header">
        <span className="card-title">Delivery Service</span>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="card-body bg-light">
          <div className="mb-3">
            <label className="form-label">From Email</label>
            <TextInput type="email" name="fromEmail" value={item?.fromEmail} required={true} onChange={handleChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">From Name</label>
            <TextInput name="fromName" value={item?.fromName} required={true} onChange={handleChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">Host</label>
            <TextInput name="host" value={item?.host} required={true} onChange={handleChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">Port</label>
            <NumericInput name="port" value={item?.port ?? 587} required={true} onChange={handleChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <TextInput name="username" value={item?.username} required={true} onChange={handleChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <TextInput type="password" name="password" value={item?.password} required={true} onChange={handleChange} />
          </div>
        </div>
        <div className="card-footer">
          <button className="btn btn-primary" type="submit" >Save</button>
        </div>
      </form>
    </SettingsNav>
  </PageHeader>
}

export default EmailSettings;