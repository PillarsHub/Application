import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import AccountMenu from './accountMenu.jsx';

const AccountLayout = () => {
  const { pathname } = useLocation();
  const path = pathname.toLowerCase();
  const pageId = getPageId(path);

  return (<>
    <header className="navbar navbar-expand-md navbar-dark d-print-none">
      <div className="container-xl">
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar-menu" aria-controls="navbar-menu" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <h1 className="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3">
          <a href="/account">
            <img src={"/images/logo.png"} alt="Pillars" className="navbar-brand-image" />
          </a>
        </h1>
        <div className="navbar-nav flex-row">
          <div className="nav-item dropdown">
            <AccountMenu />
          </div>
        </div>
      </div>
    </header>

    <div className="navbar-expand-md">
      <div className="collapse navbar-collapse" id="navbar-menu">
        <div className="navbar navbar-light">
          <div className="container-xl">
            <ul className="navbar-nav">
              <li className={`nav-item ${activeClass(pageId, 'environments')}`}>
                <Link className="nav-link" to="/account/environments">
                  <span className="nav-link-icon d-md-none d-lg-inline-block">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-list-details" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M13 5h8"></path><path d="M13 9h5"></path><path d="M13 15h8"></path><path d="M13 19h5"></path><path d="M3 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"></path><path d="M3 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"></path></svg>
                  </span>
                  <span className="nav-link-title">
                    Environments
                  </span>
                </Link>
              </li>
              <li className={`nav-item ${activeClass(pageId, 'compensationplans')}`}>
                <Link className="nav-link" to="/account/compensationplans">
                  <span className="nav-link-icon d-md-none d-lg-inline-block">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M5.931 6.936l1.275 4.249m5.607 5.609l4.251 1.275"></path><path d="M11.683 12.317l5.759 -5.759"></path><path d="M5.5 5.5m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0"></path><path d="M18.5 5.5m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0"></path><path d="M18.5 18.5m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0"></path><path d="M8.5 15.5m-4.5 0a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0"></path></svg>
                  </span>
                  <span className="nav-link-title">
                    Compensation Plans
                  </span>
                </Link>
              </li>
              <li className={`nav-item ${activeClass(pageId, 'users')}`}>
                <Link className="nav-link" to="/account/users">
                  <span className="nav-link-icon d-md-none d-lg-inline-block">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"></path><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path><path d="M21 21v-2a4 4 0 0 0 -3 -3.85"></path></svg>
                  </span>
                  <span className="nav-link-title">
                    Users
                  </span>
                </Link>
              </li>
              <li className={`nav-item ${activeClass(pageId, 'roles')}`}>
                <Link className="nav-link" to="/account/roles">
                  <span className="nav-link-icon d-md-none d-lg-inline-block">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-user-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" /><path d="M6 21v-2a4 4 0 0 1 4 -4h4" /><path d="M15 19l2 2l4 -4" /></svg>
                  </span>
                  <span className="nav-link-title">
                    Roles
                  </span>
                </Link>
              </li>
              {/* <li className={`nav-item ${activeClass(pageId, 'subscription')}`}>
                <Link className="nav-link" to="/account/subscription">
                  <span className="nav-link-icon d-md-none d-lg-inline-block">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon me-1" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 10h18" /><path d="M7 15h.01" /><path d="M11 15h2" /></svg>
                  </span>
                  <span className="nav-link-title">
                    Subscription
                  </span>
                </Link>
              </li>
              <li className={`nav-item ${activeClass(pageId, 'invoices')}`}>
                <Link className="nav-link" to="/account/invoices">
                  <span className="nav-link-icon d-md-none d-lg-inline-block">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon me-1" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M5 3m0 2a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2z" /><path d="M9 7h6" /><path d="M9 11h6" /><path d="M9 15h4" /></svg>
                  </span>
                  <span className="nav-link-title">
                    Invoices
                  </span>
                </Link>
              </li> */}
              <li className={`nav-item ${activeClass(pageId, 'logs')}`}>
                <Link className="nav-link" to="/account/logs">
                  <span className="nav-link-icon d-md-none d-lg-inline-block">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon me-1" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M8 6h12" /><path d="M8 12h12" /><path d="M8 18h12" /><path d="M4 6h.01" /><path d="M4 12h.01" /><path d="M4 18h.01" /></svg>
                  </span>
                  <span className="nav-link-title">
                    Logs
                  </span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <Outlet />
  </>
  )
};

function getPageId(path) {
  if (path === '/account' || path.startsWith('/account/environments')) return 'environments';
  if (path.startsWith('/account/invoices')) return 'invoices';
  if (path.startsWith('/account/subscription')) return 'subscription';
  if (path.startsWith('/account/compensationplans')) return 'compensationplans';
  if (path.startsWith('/account/users')) return 'users';
  if (path.startsWith('/account/roles')) return 'roles';
  if (path.startsWith('/account/logs')) return 'logs';

  return '';
}

function activeClass(current, pageId) {
  if (current == pageId) return 'active';
  return '';
}

export default AccountLayout;
