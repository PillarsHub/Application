import React from 'react';
import { useQuery, gql } from "@apollo/client";
import PropTypes from 'prop-types';
import SelectInput from "./selectInput";

var GET_PERIOD_DETAILS = gql`query {
  orderTypes{
    id
    name
  }
}`;

const OrderTypeSelect = ({ name, value, onChange, placeholder = '--Select Order Type--' }) => {
  const { loading, error, data } = useQuery(GET_PERIOD_DETAILS, {});

  const handleChange = (n, v) => {
    const selectedValue = v;
    const parsedValue = selectedValue === '' ? '' : selectedValue;
    onChange(n, parsedValue);
  };

  if (loading) return <span>-</span>;
  if (error) return `Error! ${error}`;

  return <>
    <SelectInput name={name} value={value} onChange={handleChange} emptyOption={placeholder} >
      {data && data.orderTypes.map((orderType) => {
        return <option key={orderType.id} value={orderType.id}>{orderType.name}</option>
      })}
    </SelectInput>
  </>
}

export default OrderTypeSelect;


OrderTypeSelect.propTypes = {
  className: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  children: PropTypes.any
}