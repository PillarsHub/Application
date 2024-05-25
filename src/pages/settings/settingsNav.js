import React, { Children } from 'react';
import PropTypes from 'prop-types';
import DataLoading from '../../components/dataLoading';


const SettingsNav = ({ pageId, loading, error, children }) => {

  let content = [];

  if (!loading && !error) {
    Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      content.push(child);
    });
  }

  return <>
    <div className="container-xl">
      <div className="card">
        <div className="row g-0">
          <div className="col-3 d-none d-md-block border-end">
            <div className="card-body">
              <h4 className="subheader">System Settings</h4>
              <div className="list-group list-group-transparent">
                <a href="/settings/company" className={`list-group-item list-group-item-action ${pageId == 'company' ? 'active' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon dropdown-item-icon" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M3 21l18 0"></path><path d="M5 21v-14l8 -4v18"></path><path d="M19 21v-10l-6 -4"></path><path d="M9 9l0 .01"></path><path d="M9 12l0 .01"></path><path d="M9 15l0 .01"></path><path d="M9 18l0 .01"></path></svg>
                  Business Information
                </a>
                <a href="/settings/users" className={`list-group-item list-group-item-action ${pageId == 'users' ? 'active' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon dropdown-item-icon" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"></path><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path><path d="M21 21v-2a4 4 0 0 0 -3 -3.85"></path></svg>
                  Users
                </a>
                <a href="/settings/theme" className={`list-group-item list-group-item-action ${pageId == 'theme' ? 'active' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon dropdown-item-icon" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M5 3m0 2a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2z"></path><path d="M19 6h1a2 2 0 0 1 2 2a5 5 0 0 1 -5 5l-5 0v2"></path><path d="M10 15m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z"></path></svg>
                  Theme
                </a>
                <a href="/settings/navigation" className={`list-group-item list-group-item-action ${pageId == 'navigation' ? 'active' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon dropdown-item-icon"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 4m0 1a1 1 0 0 1 1 -1h14a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-14a1 1 0 0 1 -1 -1z" /><path d="M4 12m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M14 12l6 0" /><path d="M14 16l6 0" /><path d="M14 20l6 0" /></svg>
                  Navigation
                </a>
                <a href="/settings/widgets" className={`list-group-item list-group-item-action ${pageId == 'widgets' ? 'active' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon dropdown-item-icon" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"></path><path d="M14 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"></path><path d="M4 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"></path><path d="M14 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"></path></svg>
                  Widgets
                </a>
              </div>
              <h4 className="subheader mt-4">Customers</h4>
              <div className="list-group list-group-transparent">
                <a href="/settings/dashboard" className={`list-group-item list-group-item-action ${pageId == 'dashboard' ? 'active' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon dropdown-item-icon" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 4h6v8h-6z"></path><path d="M4 16h6v4h-6z"></path><path d="M14 12h6v8h-6z"></path><path d="M14 4h6v4h-6z"></path></svg>
                  Dashboard
                </a>
                <a href="/settings/statuses" className={`list-group-item list-group-item-action ${pageId == 'statuses' ? 'active' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon dropdown-item-icon" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7.5 7.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path><path d="M3 6v5.172a2 2 0 0 0 .586 1.414l7.71 7.71a2.41 2.41 0 0 0 3.408 0l5.592 -5.592a2.41 2.41 0 0 0 0 -3.408l-7.71 -7.71a2 2 0 0 0 -1.414 -.586h-5.172a3 3 0 0 0 -3 3z"></path></svg>
                  Statuses
                </a>
                <a href="/settings/trees" className={`list-group-item list-group-item-action ${pageId == 'trees' ? 'active' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon dropdown-item-icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M14 6a2 2 0 1 0 -4 0a2 2 0 0 0 4 0z" /><path d="M7 14a2 2 0 1 0 -4 0a2 2 0 0 0 4 0z" /><path d="M21 14a2 2 0 1 0 -4 0a2 2 0 0 0 4 0z" /><path d="M14 18a2 2 0 1 0 -4 0a2 2 0 0 0 4 0z" /><path d="M12 8v8" /><path d="M6.316 12.496l4.368 -4.992" /><path d="M17.684 12.496l-4.366 -4.99" /></svg>
                  Placement Rules
                </a>
              </div>
              <h4 className="subheader mt-4">E-Commerce</h4>
              <div className="list-group list-group-transparent">
                <a href="/settings/payments" className={`list-group-item list-group-item-action ${pageId == 'payments' ? 'active' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon dropdown-item-icon" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M17 8v-3a1 1 0 0 0 -1 -1h-10a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3m0 4v3a1 1 0 0 1 -1 1h-12a2 2 0 0 1 -2 -2v-12"></path><path d="M20 12v4h-4a2 2 0 0 1 0 -4h4"></path></svg>
                  Payment Methods
                </a>
                <a href="/settings/regions" className={`list-group-item list-group-item-action ${pageId == 'regions' ? 'active' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon dropdown-item-icon" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M3 7l6 -3l6 3l6 -3v13l-6 3l-6 -3l-6 3v-13"></path><path d="M9 4v13"></path><path d="M15 7v13"></path></svg>
                  Regions
                </a>
                <a href="/settings/countries" className={`list-group-item list-group-item-action ${pageId == 'countries' ? 'active' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon dropdown-item-icon" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"></path><path d="M3.6 9h16.8"></path><path d="M3.6 15h16.8"></path><path d="M11.5 3a17 17 0 0 0 0 18"></path><path d="M12.5 3a17 17 0 0 1 0 18"></path></svg>
                  Countries
                </a>
                <a href="/settings/currency" className={`list-group-item list-group-item-action ${pageId == 'currency' ? 'active' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon dropdown-item-icon" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M9 14c0 1.657 2.686 3 6 3s6 -1.343 6 -3s-2.686 -3 -6 -3s-6 1.343 -6 3z"></path><path d="M9 14v4c0 1.656 2.686 3 6 3s6 -1.344 6 -3v-4"></path><path d="M3 6c0 1.072 1.144 2.062 3 2.598s4.144 .536 6 0c1.856 -.536 3 -1.526 3 -2.598c0 -1.072 -1.144 -2.062 -3 -2.598s-4.144 -.536 -6 0c-1.856 .536 -3 1.526 -3 2.598z"></path><path d="M3 6v10c0 .888 .772 1.45 2 2"></path><path d="M3 11c0 .888 .772 1.45 2 2"></path></svg>
                  Currency</a>
                <a href="/settings/salesTax" className={`list-group-item list-group-item-action ${pageId == 'salesTax' ? 'active' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon dropdown-item-icon" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M9 14l6 -6"></path><circle cx="9.5" cy="8.5" r=".5" fill="currentColor"></circle><circle cx="14.5" cy="13.5" r=".5" fill="currentColor"></circle><path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16l-3 -2l-2 2l-2 -2l-2 2l-2 -2l-3 2"></path></svg>
                  Sales Tax</a>
              </div>
            </div>
          </div>
          <div className="col d-flex flex-column">
            {loading && <DataLoading />}
            {error && <span>{error}</span>}
            {content}
          </div>
        </div>
      </div>
    </div>
  </>
}

export default SettingsNav;

SettingsNav.propTypes = {
  pageId: PropTypes.string.isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  children: PropTypes.any.isRequired
}