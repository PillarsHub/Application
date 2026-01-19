import React from 'react';
import PropTypes from 'prop-types';

const DataLoading = ({ title }) => {
  return <div className="page page-center" >
    <div className="container container-tight py-4">
      <div className="text-center">
        <div className="mb-3">
          <a href="." className="navbar-brand navbar-brand-autodark"></a>
        </div>
        <div className="text-secondary mb-3">{title ?? 'Loading requested data'}</div>
        <div className="progress progress-sm">
          <div className="progress-bar progress-bar-indeterminate"></div>
        </div>
      </div>
    </div>
  </div>
}

export default DataLoading;

DataLoading.propTypes = {
  title: PropTypes.string
}