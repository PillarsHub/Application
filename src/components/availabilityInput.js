import React from 'react';
import PropTypes from 'prop-types';
import { useQuery, gql } from "@apollo/client";
import DataLoading from "../components/dataLoading";
import SelectInput from './selectInput';
import TextInput from './textInput';
import EmptyContent from './emptyContent';

var GET_DATA = gql`query {
  compensationPlans {
    id
    definitions {
      name
      valueId
      comment
    }
    ranks {
      id
      name
    }
  }  
  trees
  {
    name
    id
  }
  customerTypes {
    id
    name
  }
  customerStatuses {
    id
    name
  }
}`;

const AvailabilityInput = ({ name, value, resourceName, onChange }) => {
  const { data, loading, error } = useQuery(GET_DATA, {
    variables: {},
  });

  if (loading) return <DataLoading />;
  if (error) return `Error loading Documents ${error}`;

  const allValues = [].concat(...data.compensationPlans.map(obj => obj.definitions));
  const allRanks = [].concat(...data.compensationPlans.map(obj => obj.ranks));
  const allCustTypes = [].concat(...data.customerTypes);
  const allStatusTypes = [].concat(...data.customerStatuses);
  const hasRank = allRanks.length > 0;

  const handleChange = (row, nme, val) => {
    value[row] = ({ ...value[row], [nme]: val });
    onChange(name, value);
  };

  const handleAdd = () => {
    if (!value) value = [];
    if (allRanks.length > 0) {
      value.push({ key: 'Rank', operator: "Equal", value: allRanks[0]?.id });
    } else {
      value.push({ key: 'CustType', operator: "Equal", value: allCustTypes[0]?.id });
    }
    onChange(name, value);
  }

  const handleDelete = (index) => {
    value.splice(index, 1);
    onChange(name, value);
  }

  const isEmpty = value ? (value.length > 0 ? false : true) : true;

  return <>
    <div className="card">
      {isEmpty && <EmptyContent title="No Requirements" text={`This ${resourceName} will be visible to all customers`} />}
      {!isEmpty && <>
        <div className="card-header">
          <h3 className="card-title text-capitalize">{resourceName} Requirements</h3>
        </div>
        <table className="table table-sm mb-0">
          <thead>
            <tr>
              <th>Term</th>
              <th>op</th>
              <th>Requirement</th>
              <th className="w-1"></th>
            </tr>
          </thead>
          <tbody>
            {value && value.map((requirement, index) => {
              return <tr key={index}>
                <td>
                  <SelectInput name="key" value={requirement.key} onChange={(n, v) => handleChange(index, n, v)} emptyText="Select Requirement">
                    {hasRank && <option value="Rank">Rank</option>}
                    <option value="CustType">Customer Type</option>
                    <option value="Status">Customer Status</option>
                    <option value="language">Language</option>
                    {allValues && allValues.map((value) => {
                      return <option key={value.valueId} value={value.valueId}>
                        {value.name} ({value.valueId})
                      </option>
                    })}
                  </SelectInput>
                </td>
                <td>
                  <SelectInput name="operator" value={requirement.operator} onChange={(n, v) => handleChange(index, n, v)}>
                    <option value="Equal">Exactly</option>
                    <option value="NotEqual">Not Exactly</option>
                    {/* <option value="LessThan">Less than</option>
                    <option value="GreaterThan">More than</option> */}
                    <option value="GreaterThanOrEqual">At Least</option>
                    <option value="LessThanOrEqual">At Most</option>
                  </SelectInput>
                </td>
                <td>
                  {requirement.key == "Rank" && <SelectInput name="value" emptyOption="Select Rank" value={requirement.value} onChange={(n, v) => handleChange(index, n, v)}>
                    {allRanks && allRanks.map((value) => {
                      return <option key={value.id} value={value.id}>
                        {value.name}
                      </option>
                    })}
                  </SelectInput>}
                  {requirement.key == "CustType" && <>
                    <SelectInput name="value" value={requirement.value} emptyOption="Select Type" onChange={(n, v) => handleChange(index, n, v)}>
                      {allCustTypes && allCustTypes.sort((a, b) => a.id - b.id).map((value) => {
                        return <option key={value.id} value={value.id}>
                          {value.name}
                        </option>
                      })}
                    </SelectInput>
                  </>}
                  {requirement.key == "Status" && <>
                    <SelectInput name="value" value={requirement.value} emptyOption="Select Type" onChange={(n, v) => handleChange(index, n, v)}>
                      {allStatusTypes && allStatusTypes.sort((a, b) => a.id - b.id).map((value) => {
                        return <option key={value.id} value={value.id}>
                          {value.name}
                        </option>
                      })}
                    </SelectInput>
                  </>}
                  {requirement.key != "Rank" && requirement.key != "CustType" && requirement.key != "Status" && <>
                    <TextInput name="value" value={requirement.value} onChange={(n, v) => handleChange(index, n, v)} />
                  </>}
                </td>
                <td>
                  <button className="btn btn-ghost-secondary btn-icon" onClick={() => handleDelete(index)} >
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-trash" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 7l16 0"></path><path d="M10 11l0 6"></path><path d="M14 11l0 6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
                  </button>
                </td>
              </tr>
            })}
          </tbody>
        </table>
      </>}
      <div className="card-footer">
        <div className="d-flex">
          <button className="btn ms-auto" onClick={handleAdd} >Add Requirement</button>
        </div>
      </div>
    </div >
  </>
}

export default AvailabilityInput;

AvailabilityInput.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.array.isRequired,
  resourceName: PropTypes.string,
  onChange: PropTypes.func
}
