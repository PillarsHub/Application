import React, { useEffect, useRef, useState } from 'react';
import { SendRequest } from '../../hooks/usePost';
import { useTheme } from '../../hooks/useTheme';
import DataLoading from '../../components/dataLoading';

const fields = [
  { name: 'firstName', label: 'First name', autoComplete: 'given-name' },
  { name: 'lastName', label: 'Last name', autoComplete: 'family-name' },
  { name: 'emailAddress', label: 'Email address', type: 'email', autoComplete: 'email' },
  { name: 'password', label: 'Password', type: 'password', autoComplete: 'new-password' },
];

function getErrorMessage(error) {
  const fallback = 'Unable to create your account. Please try again.';
  if (!error) return fallback;

  try {
    const response = JSON.parse(error);
    if (typeof response === 'string') return response || fallback;
    const messages = Object.values(response?.errors ?? {}).flat().filter(value => typeof value === 'string');
    if (messages.length) return messages.join(' ');
    return response?.detail || response?.message || response?.title || fallback;
  } catch {
    return error;
  }
}

export default function CreateAccount() {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', emailAddress: '', password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const requestPending = useRef(false);
  const strengthRef = useRef(null);
  const { theme, loading, error } = useTheme();
  const canCreateAccount = !loading && !error && Boolean(theme) && !theme.init && !theme.environmentId;

  useEffect(() => {
    if (!loading && theme && !theme.init && theme.environmentId) {
      window.location.replace('/');
    }
  }, [loading, theme]);

  useEffect(() => {
    if (!canCreateAccount || !strengthRef.current) return;

    // Lazy auth pages mount after Tabler's initial DOM scan.
    const meter = window.tabler.Strength.getOrCreateInstance(strengthRef.current, {
      input: '#create-account-password',
    });
    return () => meter.dispose();
  }, [canCreateAccount]);

  useEffect(() => {
    if (!theme || theme.init) return;
    document.title = `Create account | ${theme.title || 'Pillars'}`;
    if (theme.favicon?.url) {
      let favicon = document.querySelector('link[rel="icon"]');
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = theme.favicon.url;
    }
  }, [theme]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(current => ({ ...current, [name]: value }));
    setErrors(current => ({ ...current, [name]: undefined, general: undefined }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canCreateAccount || requestPending.current) return;

    const validationErrors = {};
    for (const { name, label, type } of fields) {
      const value = type === 'password' ? formData[name] : formData[name].trim();
      if (!value) validationErrors[name] = `${label} is required.`;
    }
    if (formData.emailAddress.trim() && !event.currentTarget.elements.namedItem('emailAddress').validity.valid) {
      validationErrors.emailAddress = 'Enter a valid email address.';
    }
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) {
      event.currentTarget.elements.namedItem(Object.keys(validationErrors)[0])?.focus();
      return;
    }

    requestPending.current = true;
    setShowPassword(false);
    setSubmitting(true);
    const onError = (response) => {
      requestPending.current = false;
      setSubmitting(false);
      setErrors({ general: getErrorMessage(response) });
    };

    try {
      SendRequest('POST', '/api/v1/Environments/CreateSubscription', {
        ...formData,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        emailAddress: formData.emailAddress.trim(),
        // Preserve the existing API contract without a second input.
        cpassword: formData.password,
        acceptsTerms: true,
      }, () => {
        window.location.assign('/');
      }, onError);
    } catch {
      onError();
    }
  };

  if (error) return <div role="alert">Error! {error}</div>;
  if (!canCreateAccount) return <DataLoading title={theme?.environmentId ? 'Returning to sign in' : 'Loading Theme'} />;

  return (
    <div className="page-wrapper page-center" style={{ background: theme?.loginColor ?? '#f1f5f9', position: 'relative' }}>
      <div className="container container-tight py-4" style={{ maxWidth: '35rem' }}>
        <div className="card card-md box-shadow">
          <div className="card-body">
            <div className="text-center mb-4 d-print-none">
              <a href="/" aria-label="Return to sign in">
                <img src={theme?.loginLogo?.url ?? '/images/logo-dark.png'} alt="Pillars" style={{ maxWidth: '300px', maxHeight: '165px' }} />
              </a>
            </div>
            <h2 className="h2 text-center mb-4">Create new account</h2>
            <form onSubmit={handleSubmit} noValidate aria-busy={submitting}>
              {errors.general && <div className="alert alert-danger" role="alert">{errors.general}</div>}
              <fieldset className="border-0 p-0 m-0" disabled={submitting}>
                {fields.map(({ name, label, type = 'text', autoComplete }) => (
                  <div className="mb-3" key={name}>
                    <label className="form-label" htmlFor={`create-account-${name}`}>{label}</label>
                    <div className={name === 'password' ? 'input-group input-group-flat' : undefined}>
                      <input
                        id={`create-account-${name}`}
                        name={name}
                        type={name === 'password' && showPassword ? 'text' : type}
                        className={`form-control${errors[name] ? ' is-invalid' : ''}`}
                        autoComplete={autoComplete}
                        autoCapitalize={name === 'password' ? 'none' : undefined}
                        spellCheck={name === 'password' ? false : undefined}
                        value={formData[name]}
                        onChange={handleChange}
                        required
                        aria-invalid={Boolean(errors[name])}
                        aria-describedby={[
                          errors[name] ? `create-account-${name}-error` : '',
                          name === 'password' ? 'create-account-password-strength' : '',
                        ].filter(Boolean).join(' ') || undefined}
                      />
                      {name === 'password' && (
                        <span className="input-group-text">
                          <button
                            type="button"
                            className="link-secondary input-group-link border-0 bg-transparent p-0"
                            title={showPassword ? 'Hide password' : 'Show password'}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            aria-controls="create-account-password"
                            onClick={() => setShowPassword(current => !current)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className="icon">
                              {showPassword ? <>
                                <path d="M10.585 10.587a2 2 0 0 0 2.829 2.828" />
                                <path d="M16.681 16.673a8.717 8.717 0 0 1 -4.681 1.327c-3.6 0 -6.6 -2 -9 -6c1.272 -2.12 2.712 -3.678 4.32 -4.674m2.86 -1.146a9.055 9.055 0 0 1 1.82 -.18c3.6 0 6.6 2 9 6c-.666 1.11 -1.379 2.067 -2.138 2.87" />
                                <path d="M3 3l18 18" />
                              </> : <>
                                <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                                <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
                              </>}
                            </svg>
                          </button>
                        </span>
                      )}
                    </div>
                    {errors[name] && <div id={`create-account-${name}-error`} className="invalid-feedback d-block">{errors[name]}</div>}
                    {name === 'password' && <>
                      <div ref={strengthRef} className="strength" aria-label="Password strength">
                        <span className="strength-segment" />
                        <span className="strength-segment" />
                        <span className="strength-segment" />
                        <span className="strength-segment" />
                      </div>
                      <div id="create-account-password-strength" className="strength-text">Use a long, unique password.</div>
                    </>}
                  </div>
                ))}
                <div className="form-footer">
                  <p id="create-account-terms" className="mb-3">
                    By clicking <strong className="text-nowrap">Create account</strong>, you agree to our <a className="fw-semibold text-nowrap" href="https://www.pillarshub.com/terms" target="_blank" rel="noreferrer">Terms of Service</a> and acknowledge our <a className="fw-semibold text-nowrap" href="https://www.pillarshub.com/privacy" target="_blank" rel="noreferrer">Privacy Notice</a>.
                  </p>
                  <button type="submit" className="btn btn-primary w-100" disabled={submitting} aria-describedby="create-account-terms">
                    {submitting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
                    {submitting ? 'Creating account…' : 'Create account'}
                  </button>
                </div>
              </fieldset>
            </form>
            <div className="text-center text-muted mt-3">
              Already have an account? <a href="/">Sign in</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
