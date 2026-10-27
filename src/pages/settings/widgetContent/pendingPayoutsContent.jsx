import React from "react";
import PropTypes from "prop-types";
import Switch from "../../../components/switch.jsx";
import TextArea from "../../../components/textArea.jsx";
import { DEFAULT_NEGATIVE_BALANCE_MESSAGE } from "../../../features/widgets/components/pendingCommissionPresentation.mjs";

const PendingPayoutsContent = ({ widget, updateWidget }) => {
  const handleSettingsChange = (name, value) => {
    updateWidget((previous) => ({
      ...previous,
      settings: {
        ...previous.settings,
        [name]: value,
      },
    }));
  };

  return (
    <div className="mb-2">
      <Switch
        name="showCommissionSummary"
        title="Show commission summary"
        value={widget?.settings?.showCommissionSummary ?? false}
        onChange={handleSettingsChange}
      />
      <Switch
        name="showNegativeBalanceMessage"
        title="Show negative balance message"
        value={widget?.settings?.showNegativeBalanceMessage ?? false}
        onChange={handleSettingsChange}
      />
      {widget?.settings?.showNegativeBalanceMessage && (
        <div className="mt-3">
          <label className="form-label d-block">
            Negative balance message
            <TextArea
              name="negativeBalanceMessage"
              value={widget?.settings?.negativeBalanceMessage ?? DEFAULT_NEGATIVE_BALANCE_MESSAGE}
              placeholder={DEFAULT_NEGATIVE_BALANCE_MESSAGE}
              onChange={handleSettingsChange}
            />
          </label>
          <div className="form-hint">
            Use <code>{"{amount}"}</code> for the negative balance amount (for example, $10.00). Leave blank to use the default message.
          </div>
        </div>
      )}
    </div>
  );
};

PendingPayoutsContent.propTypes = {
  widget: PropTypes.any.isRequired,
  updateWidget: PropTypes.func.isRequired,
};

export default PendingPayoutsContent;
