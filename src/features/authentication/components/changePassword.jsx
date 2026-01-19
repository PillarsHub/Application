import React, { useState,  useEffect } from 'react';
import PropTypes from 'prop-types';
import { SendRequest } from '../../../hooks/usePost.js';
import { GetUser } from "../hooks/useToken.jsx";

const ChangePassword = ({ userId, username }) => {
  const [passwordUpdate, setPasswordUpdate] = useState({});
  const [error, setError] = useState();

  useEffect(() => {
    var successAlert = document.getElementById('passwordSuccess');
    successAlert.classList.add('d-none');
    setPasswordUpdate({});
  }, [userId])

  const setPassword = (name, value) => {
    setPasswordUpdate(values => ({ ...values, [name]: value }))
  }

  let loggedInUser = GetUser();
  let requireCurrent = (loggedInUser.username == username);

  const handleChangePassword = () => {
    setError();
    document.getElementById("newPasswordInput").classList.remove("is-invalid");
    document.getElementById("confirmNewInput").classList.remove("is-invalid");
    document.getElementById("newPasswordLabel").innerText = "";
    document.getElementById("confirmNewLabel").innerText = "";

    if (requireCurrent) {
      document.getElementById("currentInput").classList.remove("is-invalid");
      document.getElementById("currentLabel").innerText = "";
    }

    if (requireCurrent && !passwordUpdate.current) {
      document.getElementById("currentLabel").innerText = "Current password is required";
      document.getElementById("currentInput").classList.add("is-invalid");
      return;
    }

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
      origionalPassword: passwordUpdate.current,
      newPassword: passwordUpdate.newPassword
    };

    SendRequest("PUT", `/Authentication/ResetPassword`, updated, () => {
      var successAlert = document.getElementById('passwordSuccess');
      successAlert.classList.remove('d-none');
    }, (error, code) => {
      setError({code: code, message: error});
    });
  };

  return <>
    <div className="row">
      <div id="passwordSuccess" className="alert alert-success d-none" role="alert">
        Your password has been upated!
      </div>
      {requireCurrent &&
        <div className="col-12">
          <div className="mb-3">
            <label className="form-label">Current password</label>
            <input type="password" className="form-control" id="currentInput" name="current" value={passwordUpdate?.current ?? ''} onChange={(e) => { setPassword(e.target.name, e.target.value) }} />
            <span className="text-danger" id="currentLabel"></span>
          </div>
        </div>}
      <div className="col-12">
        <div className="mb-3">
          <label className="form-label">New password</label>
          <input type="password" className="form-control" id="newPasswordInput" name="newPassword" value={passwordUpdate?.newPassword ?? ''} onChange={(e) => { setPassword(e.target.name, e.target.value) }} />
          <span className="text-danger" id="newPasswordLabel"></span>
        </div>
      </div>
      <div className="col-12">
        <div className="mb-3">
          <label className="form-label">Confirm new password</label>
          <input type="password" className="form-control" id="confirmNewInput" name="confirmNew" value={passwordUpdate?.confirmNew ?? ''} onChange={(e) => { setPassword(e.target.name, e.target.value) }} />
          <span className="text-danger" id="confirmNewLabel"></span>
        </div>
      </div>
    </div>
    <div className="row">
      {error && <>
        {error.code == 404 && <span className="text-danger" id="newPasswordLabel">The user {error.message} could not be found.</span>}
        {error.code != 404 && <span className="text-danger" id="newPasswordLabel">{JSON.stringify(error)}</span>}
      </>}
      <div className="col d-flex justify-content-end">
        <button type="submit" className="btn btn-primary" onClick={handleChangePassword} >Update password</button>
      </div>
    </div>
  </>
}

export default ChangePassword;

ChangePassword.propTypes = {
  userId: PropTypes.number.isRequired,
  username: PropTypes.string.isRequired
}
