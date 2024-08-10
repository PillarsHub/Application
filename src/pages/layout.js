import React from 'react';
import { Outlet } from "react-router-dom";
import { GetScope } from "../features/authentication/hooks/useToken"
import BackOfficeMenu from './backOfficeMenu';
import CorporateMenu from './corporateMenu';
import DataLoading from '../components/dataLoading';
import useSubdomain from '../hooks/useSubdomain';
import { useTheme } from '../hooks/useTheme';
import AccountMenu from './accountMenu';

const Layout = () => {
  const { subdomain } = useSubdomain();
  const { theme, loading, error } = useTheme({ subdomain: subdomain });

  if (loading) return <DataLoading title="Loading Theme" />;
  if (error) return `Error! ${error}`;

  const inlineStyle = {
    "--tblr-navbar-bg": (theme?.headerColor ?? '#1d273b'),
    '--tblr-navbar-border-color': (theme?.headerColor ?? '#243049'),
    '--tblr-icon-color': (theme?.headerTextColor ?? 'rgba(255,255,255,.7)'),
    '--tblr-nav-link-font-size': "1rem",
    "--tblr-nav-link-font-weight": "400",
    "--tblr-body-color": (theme?.headerTextColor ?? 'rgba(255, 255, 255, 0.8)')
  };

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

  document.title = theme?.title ? `${theme.title}` : 'Pillars';

  const handleNavItemClick = () => {
    const navbarCollapse = document.querySelector('.navbar-collapse');
    if (navbarCollapse.classList.contains('show')) {
      // Use Bootstrap's collapse methods to handle the animation
      const collapseInstance = new window.bootstrap.Collapse(navbarCollapse, {
        toggle: false,
      });
      collapseInstance.hide();
    }
  };

  return (<>
    <aside className="navbar navbar-vertical navbar-expand-lg" style={inlineStyle}>
      <div className="container-fluid">
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#sidebar-menu" aria-controls="sidebar-menu" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <h1 className="navbar-brand navbar-brand-autodark">
          <a href='/'>
            <img src={theme?.logo?.url ?? "/images/logo.png"} alt="Pillars" className="navbar-brand-image" />
          </a>
        </h1>
        <div className="navbar-nav flex-row d-lg-none">
          <div className="nav-item dropdown">
            <AccountMenu />
          </div>
        </div>
        <div className="collapse navbar-collapse" id="sidebar-menu">
          {GetScope() == undefined && <CorporateMenu />}
          {GetScope() != undefined && <BackOfficeMenu itemClick={handleNavItemClick} />}
        </div>
      </div>
    </aside>

    <Outlet />
  </>
  )
};

export default Layout;