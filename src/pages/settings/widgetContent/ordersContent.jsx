import React from "react";
import PropTypes from 'prop-types';
import Switch from "../../../components/switch.jsx";


const OrdersContent = ({ widget, updateWidget }) => {

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
    <div className="mb-2 border-bottom">
      <Switch name="useExternalIds" value={widget?.settings?.['useExternalIds']} title="Show External Id" onChange={handleWidgetSettingsChange} />
    </div>
  </>
}

export default OrdersContent;

OrdersContent.propTypes = {
  widget: PropTypes.any.isRequired,
  updateWidget: PropTypes.func.isRequired,
  trees: PropTypes.any.isRequired
}