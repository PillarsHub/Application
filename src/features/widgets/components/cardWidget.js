import React from "react";
import PropTypes from 'prop-types';
import FormatPhoneNumber from '../../../util/phoneNumberFormatter';
import Avatar from '../../../components/avatar';

const CardWidget = ({ customer, panes, values, compact, showCustomer, isPreview, loading }) => {
  const cardContent = (pane, value, compact) => {
    if (compact) {
      return <>
        <dd className="col-3">{pane.text}</dd>
        <dd className="col-9 text-end">{value}</dd>
      </>
    } else {
      return <>
        <div className="datagrid-title tooltip2">
          {pane.text}
          {pane.description && <span className="tooltiptext">{pane.description}</span>}
        </div>
        <div className="h2 datagrid-content">
          {value}
        </div>
      </>
    }
  }

  if (panes) {
    return <div className="card-body" style={{ whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
      {showCustomer && <>
        <h1 className="d-flex align-items-center">
          <span className="me-3">
            <Avatar name={customer?.fullName} url={customer?.profileImage} size="sm" />
          </span>
          <span className='cardTitle'>{customer?.fullName}</span>
        </h1>
      </>}
      <div className={compact ? '' : 'datagrid widgetDatagrid'}>
        {panes.map((pane) => {
          const emptyValue = isPreview ? pane.values?.length > 0 ? pane.values[0].value : Math.floor(Math.random() * (5000 - 100 + 1)) + 100 : 0;
          const stat = values?.find((s) => s.valueId == pane.title) ?? { value: emptyValue };
          const value = loading ? '-' : pane.values?.length > 0 ? pane.values.find((m) => m.value == stat.value)?.text ?? '-' : truncateDecimals(stat.valueId, stat.value, 0);
          return <div key={pane.title} className={compact ? 'row' : 'datagrid-item'} style={{ color: pane.imageUrl }}>
            {(cardContent(pane, value, compact))}
          </div>
        })}
      </div>
    </div>
  } else {
    return <div className="card-body">
      <div className="datagrid widgetDatagrid">
        {values && values.map((stat) => {
          return <div key={stat.valueId} className="datagrid-item">
            {(cardContent({ text: `${stat.valueName} ${stat.valueId == stat.valueName ? `` : `(${stat.valueId})`}` }, stat.value, compact))}
          </div>
        })}
      </div>
    </div>
  }
}

function truncateDecimals(term, number, digits) {

  if (term?.toLowerCase() == 'handle') return number;
  if (term?.toLowerCase() == 'phone') return FormatPhoneNumber(number);

  // Convert string input to number if possible
  const num = typeof number === 'string' ? Number(number) : number;

  // Check if num is a valid finite number
  if (typeof num !== 'number' || !isFinite(num)) {
    return number;  // Return original value if not a valid number
  }

  var multiplier = Math.pow(10, digits);
  var adjustedNum = number * multiplier;
  var truncatedNum = Math[adjustedNum < 0 ? 'ceil' : 'floor'](adjustedNum);

  return (truncatedNum / multiplier).toLocaleString();
}


export default CardWidget;

CardWidget.propTypes = {
  customer: PropTypes.object.isRequired,
  panes: PropTypes.object.isRequired,
  values: PropTypes.object.isRequired,
  compact: PropTypes.bool.isRequired,
  showCustomer: PropTypes.bool.isRequired,
  isPreview: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired
}
