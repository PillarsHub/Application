import React from "react-dom/client";
import PropTypes from 'prop-types';

const LoadingNode = ({ nodeId }) => {
  return <div className="card d-flex flex-column" style={{ maxWidth: '115px', margin: 'auto' }}>
    <div className="card-body text-center box-shadow">
      <h3 className="align-items-center">
        <span className='cardTitle'>
          <div className="spinner-border" role="status"></div>{nodeId}
        </span>
      </h3>
    </div>
  </div>
}

export default LoadingNode;

LoadingNode.propTypes = {
  nodeId: PropTypes.any.isRequired
}