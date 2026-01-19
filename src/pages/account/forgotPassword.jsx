import React, { useState } from "react";
import { SendRequest } from '../../hooks/usePost';
import useSubdomain from "../../hooks/useSubdomain";
import { useTheme } from '../../hooks/useTheme';
import DataLoading from '../../components/dataLoading';

const ForgotPassword = () => {
  const [emailAddress, setEmailAddress] = useState();
  const { subdomain } = useSubdomain();
  const { theme, loading, error } = useTheme({ subdomain: subdomain });

  if (loading) return <DataLoading title="Loading Theme" />;
  if (error) return `Error! ${error}`;

  const handleChangePassword = (e) => {
    e.preventDefault();

    const userAgent = navigator.userAgent;
    const os = getOS(userAgent);
    const browser = getBrowserInfo(userAgent);
    
    var envPart = theme?.environmentId > 0 ? '&environmentId=' + theme?.environmentId : '';
    const encodedEmail = encodeURIComponent(emailAddress);
    var url = `/Authentication/ResetPassword?emailAddress=${encodedEmail}&operatingSystem=${os}&browserName=${browser}${envPart}`;
    SendRequest("POST", url, {}, () => {
      var successAlert = document.getElementById('passwordSuccess');
      successAlert.classList.remove('d-none');
    }, (error, code) => {
      alert(`${code}: ${error}`);
    });
  }

  document.title = theme?.title ? `${theme.title}` : 'Pillars';
  if (theme?.favicon?.url) {
    const favicon = document.querySelector('link[rel="icon"]');

    if (favicon) {
      favicon.href = theme?.favicon?.url;
    } else {
      const newFavicon = document.createElement('link');
      newFavicon.rel = 'icon';
      newFavicon.href = theme?.favicon?.url;
      document.head.appendChild(newFavicon);
    }
  }

  return <>
    <div className="page-wrapper page-center" style={{ background: theme?.loginColor ?? '#f1f5f9', position: 'relative' }}>
      <div className="container container-tight py-4">
        <form className="card card-md" action="./" method="get" autoComplete="off" noValidate="">
          <div className="card-body">
            <div className="text-center mb-4 d-print-none text-white">
              <img src={theme?.loginLogo?.url ?? `/images/logo-dark.png`} alt="Pillars" style={{ maxWidth: '300px', maxHeight: '65px' }} />
            </div>
            <h2 className="h2 text-center mb-4">Forgot Password</h2>
            <p className="text-muted mb-4">Enter your email address and instructions on how to reset your password will be emailed to you.</p>
            <div id="passwordSuccess" className="alert alert-success d-none" role="alert">
              An email with instructions has been sent.  If it does not show up, please check your email spam folder.
            </div>

            <div className="mb-3">
              <label className="form-label">Email address</label>
              <input type="email" className="form-control" placeholder="Enter email" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} />
            </div>
            <div className="form-footer">
              <button href="#" className="btn btn-primary w-100" onClick={handleChangePassword}>
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><rect x="3" y="5" width="18" height="14" rx="2"></rect><polyline points="3 7 12 13 21 7"></polyline></svg>
                Send me new password
              </button>
            </div>
            <div className="text-center text-muted mt-3">
              Return to <a href="/">Sign In</a>
            </div>
          </div>
        </form>
      </div>
    </div>
  </>
}

const getOS = (userAgent) => {
  const platformMatch = userAgent.match(/(Win|Mac|Linux)/i);
  if (platformMatch) {
    const platform = platformMatch[0].toLowerCase();
    if (platform === "win") return "Windows";
    return platform;
  }
  return "Unknown";
};

const getBrowserInfo = (userAgent) => {
  if (userAgent.indexOf("Chrome") !== -1) return "Google Chrome";
  else if (userAgent.indexOf("Safari") !== -1) return "Safari";
  else if (userAgent.indexOf("Firefox") !== -1) return "Mozilla Firefox";
  else if (userAgent.indexOf("Edge") !== -1) return "Microsoft Edge";
  else if (userAgent.indexOf("MSIE") !== -1 || userAgent.indexOf("Trident/") !== -1) return "Internet Explorer";
  
  return "Unknown";
};

export default ForgotPassword;