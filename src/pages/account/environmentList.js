import React, { useState } from "react";
import PropTypes from 'prop-types';
import { Get, useFetch } from '../../hooks/useFetch'
import useToken from '../../features/authentication/hooks/useToken';

export default function EnvironmentList({ setToken, clearToken }) {
  const { token } = useToken();
  const { data } = useFetch(`/Authentication/token/${token.token}/Environments`);
  const [environmentId, setEnvironmentId] = useState();

  const handleChange = (event) => {
    setEnvironmentId(event.target.value);
  };

  const handleSubmit = async e => {
    e.preventDefault();

    var errorElement = document.getElementById("loginError");
    errorElement.innerHTML = '';

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

  const handleClear = () => {
    clearToken();
    location = "/";
  }

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
            <p>There is more than one environment associated with this account. Please select the environment you would like to connect to.</p>
            <div className="text-danger"></div>
            <div className="mb-3">
              <div className="form-selectgroup form-selectgroup-boxes d-flex flex-column">
                {data && data.map((env) => {
                  return <label key={env.id} className="form-selectgroup-item flex-fill">
                    <input type="radio" name="envId" value={env.id} className="form-selectgroup-input" onChange={handleChange} />
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
              </div>
              <span id="loginError" className="text-danger"></span>
            </div>
            <div className="form-footer">
              <button className="btn btn-primary w-100" tabIndex="4" onClick={handleSubmit}>Sign in</button>
            </div>
          </div>
        </form>
        <div className="text-center text-muted mt-3">
          <span>Not finding what you need? <a href="#" onClick={handleClear} tabIndex="-1">Sign out</a></span>
        </div>
      </div>
    </div>

  )
}

EnvironmentList.propTypes = {
  setToken: PropTypes.func.isRequired,
  clearToken: PropTypes.func.isRequired
}