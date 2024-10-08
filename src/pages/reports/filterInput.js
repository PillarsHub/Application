import React from "react";
import PropTypes from 'prop-types';
import PeriodPicker from "../../components/periodPicker";
import RankSelect from "../../components/rankSelect";
import AutoComplete from "../../components/autocomplete";
import TextInput from "../../components/textInput";
import TreeSelect from "../../components/treeSelect";
import CustomerTypeSelect from "../../components/customerTypeSelect";
import NumericInput from "../../components/numericInput";
import DateInput from "../../components/dateInput";

const FilterInput = ({ filter, values, onChange, col = 'col' }) => {
  const { inputType } = filter;
  switch (inputType) {
    case "Text":
      return <div className={col}><TextInput name={filter.id} placeholder={filter.id} value={values[filter.id] ?? ''} onChange={onChange} /></div>
    case "Number":
      return <div className={col}><NumericInput name={filter.id} placeholder={filter.id} value={values[filter.id] ?? ''} onChange={onChange} /></div>
    case "Period":
      return <> <div className="col"></div><div className="col-auto ms-auto"><PeriodPicker periodId={values?.periodId ?? ''} setPeriodId={(value) => onChange('periodId', Number(value))} /></div></>;
    case "Rank":
      return <div className={col}><RankSelect name="rankId" value={values?.rankId ?? ''} onChange={onChange} ><option value="">All Ranks</option></RankSelect></div>
    case "CustomerId":
      return <div className={col}><AutoComplete placeholder="Select Customer" name="customerId" value={values?.customerId ?? ''} onChange={onChange} /></div>
    case "Tree":
      return <div className={col}><TreeSelect name={filter.id} value={values[filter.id] ?? ''} onChange={onChange} ></TreeSelect></div>
    case "CustomerType":
      return <div className={col}><CustomerTypeSelect placeholder="Select Type" name={filter.id} value={values[filter.id] ?? ''} onChange={onChange} /></div>
    case "Date":
        return <div className={col}><DateInput placeholder="Select Type" allowEmpty={false} name={filter.id} value={values[filter.id] ?? ''} onChange={onChange} /></div>
    default:
      return <div className={col}><TextInput name={filter.id} placeholder={JSON.stringify(filter)} value={values[filter.id] ?? ''} onChange={onChange} /></div>
  }
}

export default FilterInput;

FilterInput.propTypes = {
  filter: PropTypes.object,
  values: PropTypes.any.isRequired,
  onChange: PropTypes.func.isRequired,
  col: PropTypes.string
}