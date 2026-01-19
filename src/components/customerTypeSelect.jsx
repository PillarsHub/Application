import React, { Children } from "react";
import { useQuery, gql } from "@apollo/client";
import PropTypes from 'prop-types';

var GET_PERIOD_DETAILS = gql`query {
  customerTypes{
    id
    name
  }
}`;

const CustomerTypeSelect = ({ className, name, value, onChange, placeholder = '--Select Customer Type--', children }) => {
  const { loading, error, data } = useQuery(GET_PERIOD_DETAILS, {});

  const handleChange = (event) => {
    const selectedValue = event.target.value;
    const parsedValue = selectedValue === '' ? '' : Number(selectedValue);
    onChange(name, parsedValue);
  };

  if (loading) return <span>-</span>;
  if (error) return `Error! ${error}`;

  return <>
    <select className={className ?? 'form-select'} value={value ?? ''} onChange={handleChange}>
      <option value="" disabled>{placeholder}</option>
      {Children.map(children, child =>
        <>{child}</>
      )}
      {data && data.customerTypes.map((customerType) => {
        return <option key={customerType.id} value={customerType.id}>{customerType.name}</option>
      })}
    </select>
  </>
}

export default CustomerTypeSelect;


CustomerTypeSelect.propTypes = {
  className: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  children: PropTypes.any
}