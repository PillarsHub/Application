import React, { Children } from 'react';
import PropTypes from 'prop-types';
import DataLoading from '../../../components/dataLoading.jsx';

const AccountNav = ({ customerId, pageId, loading, children, treeData }) => {

  let content = [];

  if (!loading) {
    Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      content.push(child);
    });
  }

  const showTreeSettings = treeData?.some(item => item.enableCustomerLegPreference) ?? false;

  return <>
    <div className="container-xl">
      <div className="card">
        <div className="row g-0">
          <div className="col-md-3 d-md-block border-end border-bottom">
            <div className="card-body">
              <h4 className="subheader">Account Settings</h4>
              <div className="list-group list-group-transparent">
                <a href={`/customers/${customerId}/account/profile`} className={`list-group-item list-group-item-action d-flex align-items-center ${activeClass(pageId, 'profile')}`}>My Account</a>
                {/*<a href="#" className={`list-group-item list-group-item-action d-flex align-items-center`}>My Notifications</a> */}
                <a href={`/customers/${customerId}/account/security`} className={`list-group-item list-group-item-action d-flex align-items-center ${activeClass(pageId, 'security')}`}>Security</a>
                {/* <a href={`/customers/${customerId}/account/moneyin`} className={`list-group-item list-group-item-action d-flex align-items-center ${activeClass(pageId, 'moneyin')}`}>Payment Preferences</a> */}
                {/* <a href={`/customers/${customerId}/account/moneyout`} className={`list-group-item list-group-item-action d-flex align-items-center ${activeClass(pageId, 'moneyout')}`}>Funds Transfer</a> */}
                {showTreeSettings && <a href={`/customers/${customerId}/account/treesettings`} className={`list-group-item list-group-item-action d-flex align-items-center ${activeClass(pageId, 'treeSettings')}`}>Placement Rules</a>}
              </div>
              {/* <h4 className="subheader mt-4">Experience</h4>
                <div className="list-group list-group-transparent">
                    <a href="#" className="list-group-item list-group-item-action">Give Feedback</a>
                </div> */}
            </div>
          </div>
          <div className="col-md-9">
            {loading && <DataLoading />}
            {content}
          </div>
        </div>
      </div>
    </div>
  </>
}

function activeClass(current, pageId) {
  if (current == pageId) return 'active';
  return '';
}

export default AccountNav;

AccountNav.propTypes = {
  customerId: PropTypes.string.isRequired,
  pageId: PropTypes.string.isRequired,
  loading: PropTypes.bool.isRequired,
  children: PropTypes.any.isRequired,
  treeData: PropTypes.array
}