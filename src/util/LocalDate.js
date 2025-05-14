import React from 'react';
import PropTypes from 'prop-types';

function LocalDate({ dateString, hideTime }) {
  if (dateString == null || dateString === '') return <span>  </span>;
  return <span title={dateString}>{ToLocalDate(dateString, hideTime)}</span>;
}

LocalDate.propTypes = {
  dateString: PropTypes.string,
  hideTime: PropTypes.bool
};

function ToLocalDate(dateString, hideTime) {
  if (dateString == null || dateString == '') return '';

  if (!dateString.endsWith("Z")) {
    dateString += "Z";
  }

  const dateObject = new Date(Date.parse(dateString));

  return ToLocal(dateObject, hideTime);
}

function FormatDate(dateString, hideTime) {
  if (dateString == null || dateString == '') return '';

  if (!dateString.endsWith("Z")) {
    dateString += "Z";
  }

  const dateObject = new Date(Date.parse(dateString));
  const offsetMinutes = dateObject.getTimezoneOffset();
  const adjustedDate = new Date(dateObject.getTime() - offsetMinutes * 60000);

  return ToLocal(adjustedDate, hideTime);
}

function ToLocal(dateObject, hideTime) {
  let options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  };

  if (hideTime) {
    options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return dateObject.toLocaleDateString(undefined, options);
  }

  return dateObject.toLocaleTimeString(undefined, options);
}

export default LocalDate;
export { ToLocalDate, FormatDate };