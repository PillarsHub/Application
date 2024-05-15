import React from 'react';
import PropTypes from 'prop-types';
import { useFetch } from "../hooks/useFetch";
import DataLoading from "../components/dataLoading";
import SelectInput from './selectInput';
import NumericInput from './numericInput';
import EmptyContent from './emptyContent';

const AvailabilityInput = ({ name, value, onChange }) => {
  const { data, loading, error } = useFetch('/api/v1/CompensationPlans');

  if (loading) return <DataLoading />;
  if (error) return `Error loading Documents ${error}`;

  const allValues = [].concat(...data.map(obj => obj.definitions));
  const allRanks = [].concat(...data.map(obj => obj.ranks));

  const handleChange = (row, nme, val) => {
    value[row] = ({ ...value[row], [nme]: val });
    onChange(name, value);
  };

  const handleAdd = () => {
    if (!value) value = [];
    value.push({ key: 'Rank', volume: allRanks[0].rankId });
    onChange(name, value);
  }

  const handleDelete = (index) => {
    value.splice(index, 1);
    onChange(name, value);
  }

  const isEmpty = value ? (value.length > 0 ? false : true) : true;

  return <>
    <div className="card">
      {isEmpty && <EmptyContent title="No Requirements" text="This resource will be visible to all customers" />}
      {!isEmpty && <table className="table table-sm mb-0">
        <thead>
          <tr>
            <th className="w-50">Term</th>
            <th className="w-50">Requirement</th>
            <th className="w-1"></th>
          </tr>
        </thead>
        <tbody>
          {value && value.map((requirement, index) => {
            return <tr key={index}>
              <td>
                <SelectInput name="key" value={requirement.key} onChange={(n, v) => handleChange(index, n, v)} emptyText="Select Requirement">
                  <option value="Rank">Rank</option>
                  <option value="CustType">Customer Type</option>
                  {allValues && allValues.map((value) => {
                    return <option key={value.valueId} value={value.valueId}>
                      {value.name} ({value.valueId})
                    </option>
                  })}
                </SelectInput>
              </td>
              <td>
                {requirement.key == "Rank" && <SelectInput name="volume" value={requirement.volume} onChange={(n, v) => handleChange(index, n, v)}>
                  {allRanks && allRanks.map((value) => {
                    return <option key={value.rankId} value={value.rankId}>
                      {value.rankName}
                    </option>
                  })}
                </SelectInput>}
                {requirement.key != "Rank" && <div className="input-group">
                  <button type="button" className="btn dropdown-toggle" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  {requirement.exact ? 'Exactly' : 'At Least'}
                  </button>
                  <div className="dropdown-menu">
                    <a className="dropdown-item" href="#" onClick={(e) => {handleChange(index, "exact", true); e.preventDefault();}}>
                      Exactly
                    </a>
                    <a className="dropdown-item" href="#" onClick={(e) => {handleChange(index, "exact", false); e.preventDefault();}}>
                      At Least
                    </a>
                  </div>
                  <NumericInput name="volume" value={requirement.volume} onChange={(n, v) => handleChange(index, n, v)} />
                </div>}
              </td>
              <td>
                <button className="btn btn-ghost-secondary btn-icon" onClick={() => handleDelete(index)} >
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-trash" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 7l16 0"></path><path d="M10 11l0 6"></path><path d="M14 11l0 6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
                </button>
              </td>
            </tr>
          })}
        </tbody>
      </table>}
      <div className="card-footer">
        <div className="d-flex">
          <button className="btn ms-auto" onClick={handleAdd} >Add Requirement</button>
        </div>
      </div>
    </div>
  </>
}

export default AvailabilityInput;

AvailabilityInput.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.array.isRequired,
  onChange: PropTypes.func
}
