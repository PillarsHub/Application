import React from 'react';
import PropTypes from 'prop-types';

const DataCard = ({ data }) => {
  return <>
      {data && data.map((stat) => {
      return <div key={stat.valueId} className="datagrid-item">
        <div className="datagrid-title">{stat.valueName} {stat.valueId == stat.valueName ? `` : `(${stat.valueId})`}</div>
        <div className="datagrid-content">{stat.value}</div>
      </div>
    })}
  </>
}

export default DataCard;

DataCard.propTypes = {
  data: PropTypes.any.isRequired,
}
