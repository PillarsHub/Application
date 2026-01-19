import React, { Children } from "react";
import { useQuery, gql } from "@apollo/client";
import PropTypes from 'prop-types';

var GET_PERIOD_DETAILS = gql`query {
  compensationPlans {
    ranks{
      id
      name
    }
  }
}`;

const RankSelect = ({ className, name, value, onChange, children }) => {
  const { loading, error, data } = useQuery(GET_PERIOD_DETAILS, {});

  const handleChange = (event) => {
    onChange(name, event.target.value);
  };

  if (loading) return <span>-</span>;
  if (error) return `Error! ${error}`;

  let ranks = data.compensationPlans.flatMap(plan => plan.ranks);

  return <>
    <select className={className ?? 'form-select'} value={value} onChange={handleChange}>
      {Children.map(children, child =>
        <>{child}</>
      )}
      {ranks && ranks.map((rank) => {
        return <option key={rank.id} value={rank.id}>{rank.name}</option>
      })}
    </select>
  </>
}

export default RankSelect;


RankSelect.propTypes = {
  className: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  children: PropTypes.any
}