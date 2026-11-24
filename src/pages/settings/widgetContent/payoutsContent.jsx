import React from 'react';
import PropTypes from 'prop-types';
import Switch from '../../../components/switch.jsx';

export default function PayoutsContent({ widget, updateWidget }) {
  return <Switch name="showDatePicker" value={widget?.showDatePicker} title="Enable Date Selector" onChange={(name, value) => updateWidget(current => ({ ...current, [name]: value }))} />;
}

PayoutsContent.propTypes = { widget: PropTypes.object.isRequired, updateWidget: PropTypes.func.isRequired };
