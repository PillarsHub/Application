import React, { useState } from "react";
import { SendRequest } from '../../hooks/usePost';
import useSubdomain from "../../hooks/useSubdomain";
import { useTheme } from '../../hooks/useTheme';
import DataLoading from '../../components/dataLoading';

const ResetPassword = () => {
  const queryParams = new URLSearchParams(window.location.search)
  const [passwordUpdate, setPasswordUpdate] = useState({});
  const { subdomain } = useSubdomain();
  const { theme, loading, error } = useTheme({ subdomain: subdomain });

  if (loading) return <DataLoading title="Loading Theme" />;
  if (error) return `Error! ${error}`;

  let username = queryParams.get("username");
  let token = queryParams.get('token');

  const setPassword = (name, value) => {
    setPasswordUpdate(values => ({ ...values, [name]: value }))
  }

  const handleChangePassword = (e) => {
    e.preventDefault();
    document.getElementById("newPasswordInput").classList.remove("is-invalid");
    document.getElementById("confirmNewInput").classList.remove("is-invalid");
    document.getElementById("newPasswordLabel").innerText = "";
    document.getElementById("confirmNewLabel").innerText = "";

    if (!passwordUpdate.newPassword) {
      document.getElementById("newPasswordLabel").innerText = "New password is required";
      document.getElementById("newPasswordInput").classList.add("is-invalid");
      return;
    }
    if (!passwordUpdate.confirmNew) {
      document.getElementById("confirmNewLabel").innerText = "Confirm new password is required";
      document.getElementById("confirmNewInput").classList.add("is-invalid");
      return;
    }

    if (passwordUpdate.confirmNew != passwordUpdate.newPassword) {
      document.getElementById("confirmNewLabel").innerText = "Passwords do not match";
      document.getElementById("confirmNewInput").classList.add("is-invalid");
      return;
    }

    var updated = {
      username: username,
      origionalPassword: token,
      newPassword: passwordUpdate.newPassword
    };

    SendRequest("PUT", `/Authentication/ResetPassword`, updated, () => {
      var successAlert = document.getElementById('passwordSuccess');
      successAlert.classList.remove('d-none');
    }, () => {
      var successAlert = document.getElementById('passwordFail');
      successAlert.classList.remove('d-none');
    });
  };

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
    <div className="page page-center">
      <div className="container container-tight py-4">
        <form className="card card-md" action="./" method="get" autoComplete="off" noValidate="">
          <div className="card-body">

            <h2 className="card-title text-center mb-4">Reset Password</h2>
            <p className="text-muted mb-4">Enter your email address and your password will be reset and emailed to you. </p>
            <div className="row">
              <div id="passwordSuccess" className="alert alert-success d-none" role="alert">
                Your password has been upated!
              </div>

              <div className="mb-3">
                <label className="form-label">Email address</label>
                <input type="text" className="form-control" value={username} disabled />
              </div>

              <div className="col-12">
                <div className="mb-3">
                  <label className="form-label">New password</label>
                  <input type="password" className="form-control" id="newPasswordInput" name="newPassword" onChange={(e) => { setPassword(e.target.name, e.target.value) }} />
                  <span className="text-danger" id="newPasswordLabel"></span>
                </div>
              </div>
              <div className="col-12">
                <div className="mb-3">
                  <label className="form-label">Confirm new password</label>
                  <input type="password" className="form-control" id="confirmNewInput" name="confirmNew" onChange={(e) => { setPassword(e.target.name, e.target.value) }} />
                  <span className="text-danger" id="confirmNewLabel"></span>
                </div>
              </div>
            </div>

            <div id="passwordFail" className="alert alert-danger alert-dismissible d-none" role="alert">
              
                  <h4 className="alert-title">Unable to update password</h4>
                  <div className="text-muted">The token you are using is not valid. This could be because it has expired.  Please <a href="/account/forgotPassword">request</a> a new token and try again.</div>
              <a className="btn-close" data-bs-dismiss="alert" aria-label="close"></a>
            </div>

            <div className="row">
              <div className="col d-flex justify-content-end">
                <button type="submit" className="btn btn-primary" onClick={handleChangePassword} >Update password</button>
              </div>
            </div>

          </div>
        </form>
        <div className="text-center text-muted mt-3">
          Return to <a href="/">Sign In</a>
        </div>
      </div>
    </div>
  </>
}

export default ResetPassword;