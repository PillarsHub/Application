import React, { useEffect, useState } from "react";
import PropTypes from 'prop-types';
import { Get, useFetch } from '../../hooks/useFetch.js'
import useToken from '../../features/authentication/hooks/useToken.jsx';
import SelectInput from '../../components/selectInput.jsx';
import PastDueNotice, { usePastDueNotice } from './pastDueNotice.jsx';
import DataLoading from '../../components/dataLoading.jsx';
import DataError from '../../components/dataError.jsx';
 
export default function EnvironmentLogin({ setToken, clearToken }) {
  const { token } = useToken();
  const { data, loading, error } = useFetch('/api/v1/Environments');
  const [environmentId, setEnvironmentId] = useState();
  const { notice: pastDueNotice } = usePastDueNotice(token, { showAfterDays: 3 });
  const readyEnvironments = Array.isArray(data) ? data.filter(env => env.status === 0) : [];
  const noEnvironments = Array.isArray(data) && readyEnvironments.length === 0;

  useEffect(() => {
    if (!loading && !error && noEnvironments) {
      window.location.replace('/account');
    }
  }, [loading, error, noEnvironments]);

  const handleChange = (name, value) => {
    setEnvironmentId(value);
  };

  const handleSubmit = async e => {
    e.preventDefault();

    var errorElement = document.getElementById("loginError");
    errorElement.innerHTML = '';

    if (pastDueNotice?.blockEnvironmentLogin) {
      errorElement.innerHTML = 'Environment access is currently disabled because your invoice is past due. Use Manage Account to update billing.';
      return;
    }

    if (!readyEnvironments.some(env => String(env.id) === String(environmentId))) {
      errorElement.textContent = 'Select an environment to continue.';
      return;
    }

    Get(`/Authentication/refresh/${token.token}?environmentId=${environmentId}`, (response) => {
      setToken(response);
      location = "/";
    }, (error, text) => {
      if (error == 401) {
        errorElement.innerHTML = 'Invalid Token.  Please log out and try again.';
      } else {
        errorElement.innerHTML = text;
      }
    })
  }

  const handleManage = () => {
    location = `/account`;
  }

  const handleClear = () => {
    clearToken();
    location = "/";
  }

  let showList = readyEnvironments.length < 7;

  if (loading) return <DataLoading title="Loading environments" />;
  if (error) return <DataError error={error} />;
  if (noEnvironments) return <DataLoading title="Opening account management" />;

  return (
    <div className="page-wrapper page-center" >
      <div className="container-tight py-4">
        <div className="text-center mb-4">
        </div>
        <form className="card card-md box-shadow" onSubmit={handleSubmit} autoComplete="off" noValidate>
          <div className="card-body">
            <div className="text-center mb-4 d-print-none text-white">
              <img src={`/images/logo-dark.png`} alt="Pillars" style={{ maxWidth: '300px', maxHeight: '65px' }} />
            </div>
            <h2 className="h2 text-center mb-4">Select Environment</h2>
            <p>Select the environment you would like to connect to.</p>
            <PastDueNotice token={token} notice={pastDueNotice} showAfterDays={3} />
            <div className="text-danger"></div>
            <div className="mb-3">
              <div className="form-selectgroup form-selectgroup-boxes d-flex flex-column">
                {showList && <FullList data={readyEnvironments} onChange={handleChange} disabled={pastDueNotice?.blockEnvironmentLogin} />}
                {!showList && <DropDownList data={readyEnvironments} handleChange={handleChange} environmentId={environmentId} disabled={pastDueNotice?.blockEnvironmentLogin} />}
              </div>
              <span id="loginError" className="text-danger"></span>
            </div>
            <div className="form-footer">
              <button type="submit" className="btn btn-primary w-100" disabled={pastDueNotice?.blockEnvironmentLogin}>
                {pastDueNotice?.blockEnvironmentLogin ? 'Environment Access Disabled' : 'Sign in'}
              </button>
            </div>
          </div>
        </form>
        <div className="text-center text-muted mt-3">
          <div>Need account-level controls? <a href="#" onClick={handleManage} tabIndex="-1">Manage Account</a></div>
          <div className="mt-1">Not finding what you need? <a href="#" onClick={handleClear} tabIndex="-1">Sign out</a></div>
        </div>
      </div>
    </div>

  )
}

EnvironmentLogin.propTypes = {
  setToken: PropTypes.func.isRequired,
  clearToken: PropTypes.func.isRequired
}

function FullList({ data, onChange, disabled }) {

  const handleChange = (event) => {
    var name = event.target.name;
    var value = event.target.value;
    onChange(name, value);
  };

  return <>
    {data && data.map((env) => {
      return <label key={env.id} className="form-selectgroup-item flex-fill">
        <input type="radio" name="envId" value={env.id} className="form-selectgroup-input" onChange={handleChange} disabled={disabled} />
        <div className="form-selectgroup-label d-flex align-items-center p-3">
          <div className="me-3">
            <span className="form-selectgroup-check"></span>
          </div>
          <div>
            {env.name}
          </div>
        </div>
      </label>
    })}
  </>
}

FullList.propTypes = {
  data: PropTypes.any.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
}

function DropDownList({ data, handleChange, environmentId, disabled }) {
  return (
    <SelectInput value={environmentId} emptyOption="- Select -" onChange={handleChange} disabled={disabled}>
      {data && data.map((env) => {
        return <option key={env.id} value={env.id}>{env.name}</option>
      })}
    </SelectInput>
  )}

DropDownList.propTypes = {
  data: PropTypes.any.isRequired,
  handleChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  environmentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
}
