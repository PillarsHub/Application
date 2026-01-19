import React from "react";
import PropTypes from 'prop-types';
import Switch from "../../../components/switch.jsx";

const ProfileContent = ({ widget, updateWidget }) => {



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
    <div className="row row-cards">
      <div className="mb-3 border-bottom">
        <Switch name="compact" value={widget?.settings?.['compact']} title="Compact View" onChange={handleWidgetSettingsChange} />
      </div>
    </div>
  </>
}

export default ProfileContent;

ProfileContent.propTypes = {
  widget: PropTypes.any.isRequired,
  updateWidget: PropTypes.func.isRequired
}