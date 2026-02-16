import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useLocation, NavLink } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import parse from 'html-react-parser';
import DataError from '../components/dataError';
import { GetMenu } from '../hooks/useMenu';
import Avatar from '../components/avatar';

const CorporateMenu = ({ itemClick, customerId, showCustomer }) => {
  const location = useLocation();
  const prevIdRef = useRef(customerId);
  const [customerMenu, setCustomerMenu] = useState([]);
  const { data, loading, error } = useFetch('/api/v1/Menus');

  useEffect(() => {
    if (!customerId) return;

    if (prevIdRef.current !== customerId || !customerMenu?.menus) {
      prevIdRef.current = customerId;
      GetMenu(customerId, (d) => setCustomerMenu(d));
    }
  }, [customerId, customerMenu?.menus]);


  if (loading) return <></>
  if (error) return <DataError error={error} />

  const icons = true;
  const menu = data?.find(items => items.id == "CO");

  const subMenu = customerMenu?.menus?.find(items => items.id == "BO");

  return (<>
    <ul className="navbar-nav">
      {subMenu && showCustomer && <>
        <li className="sidebar-header customer-section-label">Customer</li>
        <li className="nav-item customer-menu-side">

          <a href="#menu-layout" className="nav-link px-3 py-2" data-bs-toggle="collapse" aria-expanded="true">
            <div className="row">
              <div className="col-auto m-auto">
                <Avatar name={customerMenu.customers?.[0].fullName} url={customerMenu.customers?.[0].profileImage} size="xs" />
              </div>
              <div className="col pe-3 ">
                <div className="font-weight-medium text-truncate" title={customerMenu.customers?.[0].fullName ?? ''}>
                  {customerMenu.customers?.[0].fullName}
                </div>
              </div>
            </div>
            <span className="nav-link-toggle"></span>
          </a>
          <ul className="collapse show pb-1 border-bottom customer-ul collapsed" id="menu-layout">

            {subMenu?.items && subMenu.items.map((sMenu) => {
              let visible = sMenu.status.toLowerCase() == 'enabled' || sMenu.status.toLowerCase() == 'corporate'
              var url = sMenu?.url?.replace('{customerId}', customerId);
              let activeClass = (location.pathname == url) ? 'active' : '';

              if (visible) {
                if (url) {
                  return <li key={sMenu.title} className={`nav-item ps-4 ${activeClass}`}>
                    <NavLink className="dropdown-item" to={url} onClick={itemClick}>
                      <span className="nav-link-icon d-md-none d-lg-inline-block">
                        {sMenu.icon && parse(sMenu.icon)}
                      </span>
                      <span className="nav-link-title text-truncate" title={sMenu.title}>
                        {sMenu.title}
                      </span>
                    </NavLink>
                  </li>
                } else {
                  return <li key={sMenu.title} className="sidebar-header">{sMenu.title}</li>
                }
              }
            })}

          </ul>
        </li>
        <li className="sidebar-header admin-section-label">Admin</li>

      </>}

      {menu?.items && menu.items.map((mnu) => {
        let visible = mnu.status == 'Enabled' || mnu.status == 'Corporate';
        const customersExpanded = location.pathname.startsWith(mnu.url);

        const exactMenu = menu.items.find(m => location.pathname == m.url);
        const hasOtherExact = exactMenu && mnu.url != location.pathname;
        let activeClass = !subMenu && !hasOtherExact && (customersExpanded || location.pathname == mnu.url) ? 'active' : '';

        if (visible) {
          if (mnu.url) {
            return <li key={mnu.title} className={`nav-item ${activeClass}`}>
              <NavLink className="nav-link" to={mnu.url} onClick={itemClick}>
                {icons && <span className="nav-link-icon d-md-none d-lg-inline-block">
                  {mnu.icon && parse(mnu.icon)}
                </span>}
                <span className="nav-link-title text-truncate" title={mnu.title}>
                  {mnu.title}
                </span>
              </NavLink>
            </li>
          } else {
            return <li key={mnu.title} className="sidebar-header">{mnu.title}</li>
          }
        }
      })}

      <li className="sidebar-header">Settings</li>

      <li className={`nav-item text-truncate ${location.pathname == '/settings/company' ? 'active' : ''}`}>
        <NavLink className="nav-link" to="/settings/company" onClick={itemClick} >
          {icons && <span className="nav-link-icon d-md-none d-lg-inline-block">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-adjustments-horizontal" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M14 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M4 6l8 0" /><path d="M16 6l4 0" /><path d="M8 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M4 12l2 0" /><path d="M10 12l10 0" /><path d="M17 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M4 18l11 0" /><path d="M19 18l1 0" /></svg>
          </span>}
          <span className="nav-link-title text-truncate" title="Settings">
            Settings
          </span>
        </NavLink>
      </li>

    </ul>
  </>
  )
};

export default CorporateMenu;

CorporateMenu.propTypes = {
  itemClick: PropTypes.func,
  customerId: PropTypes.string,
  showCustomer: PropTypes.bool
}
