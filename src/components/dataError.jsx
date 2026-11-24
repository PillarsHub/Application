import React from 'react';
import PropTypes from 'prop-types';
import AccountMenu from '../pages/accountMenu.jsx';
import useWidgetText from '../features/widgets/hooks/useWidgetText.js';

const DataError = ({ title, error, showHeader = false }) => {
  const { widgetText } = useWidgetText();
  return <div className="page-wrapper page-center" >

    {showHeader && <header className="navbar navbar-expand d-print-none" data-bs-theme="light">
      <div className="container-xl">
        <div className="navbar-nav flex-row order-md-last d-none d-lg-flex">
          <div className="nav-item dropdown ">
            <AccountMenu />
          </div>
        </div>
        <div className="flex-row d-lg-flex align-items-center justify-content-center w-100" id="navbar-menu">
        </div>
      </div>
    </header>}

    <div className="container container-tight py-4">
      <div className="text-center">
        <div className="mb-3">
          {title ?? widgetText('We encountered an error requesting your data.')}
        </div>
        <div className="text-secondary mb-3">{JSON.stringify(error)}</div>
      </div>
    </div>
  </div>
}

export default DataError;

DataError.propTypes = {
  title: PropTypes.string,
  error: PropTypes.string,
  showHeader: PropTypes.bool
}
