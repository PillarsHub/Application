import React from "react-dom/client";
import PropTypes from 'prop-types';

const StatusPill = ({status, small}) => {
  var statusColor = "green";
  if (status?.statusClass == 'INACTIVE') statusColor = 'yellow';
  if (status?.statusClass == 'DELETED') statusColor = 'red';
  
  if (small)
  {
    return <span>
      <span className={`badge bg-${statusColor} me-1`}></span> {status?.name}
    </span>
  }

  return <span className={`status status-${statusColor} status-lite`}>
    <span className="status-dot"></span>
    {status?.name}
  </span>
}

export default StatusPill;

StatusPill.propTypes = {
    status: PropTypes.any.isRequired,
    small: PropTypes.bool,
}