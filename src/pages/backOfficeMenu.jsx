import React from 'react';
import PropTypes from 'prop-types';
import parse from 'html-react-parser';
import { useLocation, NavLink } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import DataError from '../components/dataError';

const BackOfficeMenu = ({ itemClick, customerId }) => {
  const location = useLocation();
  const { data, loading, error } = useFetch('/api/v1/Menus');

  if (loading) return <></>
  if (error) return <DataError error={error} />

  const menu = data?.find(items => items.id == "BO");

  return (<>
    <ul className="navbar-nav">

      {menu?.items && menu.items.map((menu) => {
        let visible = menu.status == 'Enabled' || menu.status == 'Customer';
        var url = menu?.url?.replace('{customerId}', customerId);
        let activeClass = (location.pathname == url) ? 'active' : '';

        if (visible) {
          if (url) {
            return <li key={menu.title} className={`nav-item ${activeClass}`}>
              <NavLink className="nav-link" to={url} onClick={itemClick}>
                <span className="nav-link-icon d-md-none d-lg-inline-block">
                  {menu.icon && parse(menu.icon)}
                </span>
                <span className="nav-link-title">
                  {menu.title}
                </span>
              </NavLink>
            </li>
          } else {
            return <li key={menu.title} className="sidebar-header">{menu.title}</li>
          }
        }
      })}
    </ul>
  </>
  )
};

export default BackOfficeMenu;

BackOfficeMenu.propTypes = {
  itemClick: PropTypes.func,
  customerId: PropTypes.string.isRequired
}