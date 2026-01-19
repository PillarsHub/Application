import React from "react";
import PropTypes from 'prop-types';
import Switch from "../../../components/switch.jsx";
import TextInput from "../../../components/textInput.jsx";
import SelectInput from "../../../components/selectInput.jsx";
import MultiSelect from "../../../components/muliselect.jsx";
import NumericInput from "../../../components/numericInput.jsx";

const RecruiterContent = ({ widget, trees, customerTypes, updateWidget }) => {

  const handleWidgetSettingsChange = (name, value) => {
    updateWidget((v) => ({
      ...v,
      settings: {
        ...v.settings,
        [name]: value,
      },
    }));
  };

  return <>
    <div className="row">
      <div className="mb-3 border-bottom">
        <Switch name="compact" value={widget?.settings?.['compact']} title="Compact View" onChange={handleWidgetSettingsChange} />
      </div>
      <div className="mb-3 border-bottom">
        <Switch name="showPercent" value={widget?.settings?.['showPercent']} title="Show Percentage Comparison" onChange={handleWidgetSettingsChange} />
      </div>
      <div className="col-3 mb-3">
        <label className="form-label">Customer Column Title</label>
        <TextInput name="columnTitle" value={widget?.settings?.['columnTitle']} onChange={handleWidgetSettingsChange} />
      </div>
      <div className="col-3 mb-3">
        <label className="form-label">Tree</label>
        <SelectInput name="treeId" value={widget?.settings?.['treeId']} emptyOption="--Select Tree--" onChange={handleWidgetSettingsChange}>
          {trees && trees.map((tree) => {
            return <option key={tree.id} value={tree.id} >{tree.name}</option>
          })}
        </SelectInput>
      </div>
      <div className="col-3 mb-3">
        <label className="form-label">Number of Recruiters</label>
        <NumericInput name="maxRows" value={widget?.settings?.['maxRows'] ?? 10} onChange={handleWidgetSettingsChange} />
      </div>
      <div className="col-3 mb-3">
        <label className="form-label">Time Period</label>
        <SelectInput name="timePeriod" value={widget?.settings?.['timePeriod']} onChange={handleWidgetSettingsChange}>
          <option value="">Current Month</option>
          <option value="LM">Last Month</option>
          <option value="CW">Current Week</option>
          <option value="LW">Last Week</option>
        </SelectInput>
      </div>
      <div className="col-4 mb-3">
        <label className="form-label">Recruiter Customer Types</label>
        <MultiSelect name="recruiterTypes" value={widget?.settings?.['recruiterTypes']} onChange={handleWidgetSettingsChange}>
          {customerTypes && customerTypes.map((cType) => {
            return <option key={cType.id} value={cType.id}>{cType.id} {cType.name}</option>
          })}
        </MultiSelect>
      </div>
      <div className="col-4 mb-3">
        <label className="form-label">Enrolled Customer Types</label>
        <MultiSelect name="enrolledTypes" value={widget?.settings?.['enrolledTypes']} onChange={handleWidgetSettingsChange}>
          {customerTypes && customerTypes.map((cType) => {
            return <option key={cType.id} value={cType.id}>{cType.id} {cType.name}</option>
          })}
        </MultiSelect>
      </div>
    </div>
  </>
}

export default RecruiterContent;

RecruiterContent.propTypes = {
  widget: PropTypes.any.isRequired,
  trees: PropTypes.array.isRequired,
  customerTypes: PropTypes.array.isRequired,
  updateWidget: PropTypes.func.isRequired
}