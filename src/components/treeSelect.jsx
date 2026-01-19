import React, { Children } from "react";
import { useQuery, gql } from "@apollo/client";
import PropTypes from 'prop-types';
import SelectInput from './selectInput';

var GET_PERIOD_DETAILS = gql`query {
    trees{
        id
        name
      }
}`;

const TreeSelect = ({ className, name, value, onChange, children }) => {
  const { loading, error, data } = useQuery(GET_PERIOD_DETAILS, {});

  const handleChange = (n, value) => {
    onChange(name, value);
  };

  if (loading) return <span>-</span>;
  if (error) return `Error! ${error}`;

  return <>
    <SelectInput className={className ?? 'form-select'} value={value} emptyOption="--Select Tree--" onChange={handleChange}>
      {Children.map(children, child =>
        <>{child}</>
      )}
      {data && data.trees.map((tree) => {
        return <option key={tree.id} value={tree.id}>{tree.name}</option>
      })}
    </SelectInput>
  </>
}

export default TreeSelect;


TreeSelect.propTypes = {
  className: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  children: PropTypes.any
}