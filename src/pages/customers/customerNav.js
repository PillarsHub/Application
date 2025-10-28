import React from 'react';
import PropTypes from 'prop-types';
import parse from 'html-react-parser';
import { GetScope } from "../../features/authentication/hooks/useToken"
import { Link } from "react-router-dom";
import DataError from '../../components/dataError';
import useMenu from '../../hooks/useMenu';

const CustomerNav = ({ customerId }) => {
  const queryParams = new URLSearchParams(window.location.search);
  const periodId = queryParams.get("periodId");
  const { data, loading, error } = useMenu(customerId);

  if (loading) return <></>
  if (error) return <DataError error={error} />

  if (GetScope() == customerId) {
    return <></>;
  }

  const organizeItems = (items) => {
    const result = [];
    let currentHeader = null;

    items.forEach(item => {
      if (item.status.toLowerCase() == 'enabled' || item.status.toLowerCase() == 'corporate') {
        if (!item.url) {
          currentHeader = { ...item, subItems: [] };
          result.push(currentHeader);
        } else {
          if (currentHeader) {
            currentHeader.subItems.push(item);
          } else {
            result.push(item);
          }
        }
      }
    });
    
    return result;
  };

  const menu = data?.menus?.find(items => items.id == "BO");

  return <>
    <ul className="navbar-nav justify-content-evenly me-auto">
      {menu?.items && organizeItems(menu.items).map((menu) => {
        let visible = menu.status != 'Disabled';
        var url = menu?.url?.replace('{customerId}', customerId);
        let activeClass = (location.pathname == url) ? 'active' : '';

        if (visible) {
          if (url) {
            return <li key={menu.title} className={`nav-item text-center ${activeClass}`}>
              <Link className="nav-link p-0 m-0 p-md-2 m-md-1" to={`${url}${periodId ? '?periodId=' + periodId : ''}`} >
                <span className="nav-link-icon d-md-none m-0">
                  {menu.icon && parse(menu.icon)}
                </span>
                <span className="nav-link-title d-none d-md-block">
                  {menu.title}
                </span>
              </Link>
            </li>
          } else {
            return <li key={menu.title} className={`nav-item dropdown ${activeClass}`}>
              <a className="nav-link dropdown-toggle" href="#trees" data-bs-toggle="dropdown" data-bs-auto-close="outside" role="button" aria-expanded="false" >
                <span className="nav-link-title">{menu.title}</span>
              </a>
              <div className="dropdown-menu dropdown-menu-end">
                {menu?.subItems && menu?.subItems.map((child) => {
                  var childUrl = child?.url?.replace('{customerId}', customerId);
                  return <a key={child.title} className="dropdown-item" href={`${childUrl}${periodId ? '?periodId=' + periodId : ''}`} >
                    <span className="dropdown-item-icon">{child.icon && parse(child.icon)}</span>
                    {child.title}
                  </a>
                })}
              </div>
            </li>
          }
        }
      })}
    </ul>


  </>
}

export default CustomerNav;

CustomerNav.propTypes = {
  customerId: PropTypes.string.isRequired,
  pageId: PropTypes.string.isRequired,
  onSearch: PropTypes.func
}