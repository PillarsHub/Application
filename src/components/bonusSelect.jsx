import React from "react";
import PropTypes from 'prop-types';
import { useFetch } from "../hooks/useFetch";


const BonusSelect = ({ name, value, onChange }) => {
  const { loading, error, data } = useFetch("/api/v1/Bonuses/Titles", { });

  const handleChange = (event) => {
    var value = event.target.value;
    onChange(name, value);
  };

  if (loading) return <span>-</span>;
  if (error) return `Error! ${error}`;

  return <>
    <select className="form-select" name={name} value={value} onChange={handleChange}>
      {data && data.map((bt) => {
        return <option key={bt.bonusId} value={bt.bonusId}>{bt.title} - {bt.bonusId}</option>
      })}
    </select>
  </>
}

export default BonusSelect;


BonusSelect.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
}