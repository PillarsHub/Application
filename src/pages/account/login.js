import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Get } from '../../hooks/useFetch';
import useSubdomain from '../../hooks/useSubdomain';
import { useTheme } from '../../hooks/useTheme';
import DataLoading from '../../components/dataLoading';

export default function Login({ setToken }) {
  const [username, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState('');
  const { subdomain } = useSubdomain();
  const { theme, loading, error } = useTheme({ subdomain: subdomain });
  const usernameRef = useRef(null);

  useEffect(() => {
    if (!loading && usernameRef.current) {
      usernameRef.current.focus();
    }
  }, [loading]);

  const validate = () => {
    const errors = {};
    if (!username) errors.username = 'Email address is required';
    if (!password) errors.password = 'Password is required';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoginError('');

    const envQueryString = theme?.environmentId ? `&environmentId=${theme.environmentId}` : '';

    const encodedUsername = encodeURIComponent(username);
    const encodedPassword = encodeURIComponent(password);
    const url = `/Authentication?username=${encodedUsername}&password=${encodedPassword}${envQueryString}`;

    Get(url, (response) => {
      setToken(response);
    }, (text, error) => {
      if (error === 401) {
        setLoginError('Incorrect username or password');
      } else {
        setLoginError(text);
      }
    });
  };

  useEffect(() => {
    document.title = theme?.title ? `${theme.title}` : 'Pillars';
    if (theme?.favicon?.url) {
      const favicon = document.querySelector('link[rel="icon"]');

      if (favicon) {
        favicon.href = theme.favicon.url;
      } else {
        const newFavicon = document.createElement('link');
        newFavicon.rel = 'icon';
        newFavicon.href = theme.favicon.url;
        document.head.appendChild(newFavicon);
      }
    }
  }, [theme]);

  if (loading) return <DataLoading title="Loading Theme" />;
  if (error) return <div>Error! {error}</div>;

  return (
    <div className="page-wrapper page-center" style={{ background: theme?.loginColor ?? '#f1f5f9', position: 'relative' }}>
      <div className="container container-tight py-4">
        <div className="card card-md box-shadow">
          <div className="card-body">
            <div className="text-center mb-4 d-print-none text-white">
              <img src={theme?.loginLogo?.url ?? `/images/logo-dark.png`} alt="Pillars" style={{ maxWidth: '300px', maxHeight: '165px' }} />
            </div>
            <h2 className="h2 text-center mb-4">Log into your account</h2>
            <form onSubmit={handleSubmit} autoComplete="off" noValidate>
              <div className="mb-3">
                <label className="form-label">Email address</label>
                <input
                  type="email"
                  ref={usernameRef}
                  className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                  placeholder="Email"
                  autoComplete="off"
                  onChange={(e) => setUserName(e.target.value)}
                />
                {errors.username && <div className="invalid-feedback">{errors.username}</div>}
              </div>
              <div className="mb-2">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  placeholder="Password"
                  autoComplete="off"
                  onChange={(e) => setPassword(e.target.value)}
                />
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>
              <div className="mb-2">
                <label className="form-check">
                  <span className="form-label-description">
                    <a href="/account/forgotPassword">Forgot password</a>
                  </span>
                </label>
              </div>
              {loginError && <div className="text-danger mb-2">{loginError}</div>}
              <div className="form-footer">
                <button type="submit" className="btn btn-primary w-100">Sign in</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

Login.propTypes = {
  setToken: PropTypes.func.isRequired,
};
