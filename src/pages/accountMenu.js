import React from 'react';
import { GetUser, GetScope, useToken22 } from "../features/authentication/hooks/useToken"
import Avatar from '../components/avatar';

const AccountMenu = () => {
  var user = GetUser();
  const { clearToken } = useToken22();
  let customerId = GetScope();

  var profileLink = '/profile';
  if (customerId != undefined) profileLink = `/customers/${customerId}/account/profile`;

  const handleLogout = () => {
    clearToken();
    location = "/";
  };

  return <>

    {user?.SSO && <>
      <span className="nav-link d-flex lh-1 text-reset p-0 text-truncate">
        <Avatar name={`${user?.firstName} ${user?.lastName}`} size="sm" />
        <span className="ps-2 d-none d-sm-block" >{user?.firstName} {user?.lastName}</span>
      </span>
    </>}

    {!user?.SSO && <>
      <a href="#" className="nav-link d-flex lh-1 text-reset p-0 dropdown-toggle" data-bs-toggle="dropdown" aria-label="Open user menu">
        <Avatar name={`${user?.firstName} ${user?.lastName}`} size="sm" />
        <span className="ps-2 d-none d-sm-block" >{user?.firstName} {user?.lastName}</span>
      </a>

      <div className="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
        {!user?.SSO && <a href={profileLink} className="dropdown-item" title="Manage">
          <svg xmlns="http://www.w3.org/2000/svg" className="icon dropdown-item-icon" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M12 13a3 3 0 1 0 0 -6a3 3 0 0 0 0 6z"></path><path d="M6.201 18.744a4 4 0 0 1 3.799 -2.744h4a4 4 0 0 1 3.798 2.741"></path><path d="M19.875 6.27c.7 .398 1.13 1.143 1.125 1.948v7.284c0 .809 -.443 1.555 -1.158 1.948l-6.75 4.27a2.269 2.269 0 0 1 -2.184 0l-6.75 -4.27a2.225 2.225 0 0 1 -1.158 -1.948v-7.285c0 -.809 .443 -1.554 1.158 -1.947l6.75 -3.98a2.33 2.33 0 0 1 2.25 0l6.75 3.98h-.033z"></path></svg>
          Profile
        </a>}

        {GetScope() == undefined && <a className="dropdown-item" href="/account/environments" title="Manage">
          <svg xmlns="http://www.w3.org/2000/svg" className="icon dropdown-item-icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M10 5m0 2a2 2 0 0 1 2 -2h6a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2z" /><path d="M7 7l0 10" /><path d="M4 8l0 8" /></svg>
          Environment List
        </a>}
        {(!user?.SSO || GetScope() == undefined) && <div className="dropdown-divider"></div>}
        <button className="dropdown-item" onClick={handleLogout}>
          <svg xmlns="http://www.w3.org/2000/svg" className="icon dropdown-item-icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2"></path><path d="M7 12h14l-3 -3m0 6l3 -3"></path></svg>
          Logout
        </button>
      </div>
    </>}
  </>;
};

export default AccountMenu;