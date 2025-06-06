import React, { useEffect } from "react";
import PropTypes from 'prop-types';
import { useFetch } from "../../../hooks/useFetch";
import TextInput from "../../../components/textInput";
import CheckBox from "../../../components/checkbox";
import Switch from "../../../components/switch";


const EarningsContent = ({ widget, updateWidget, }) => {
  const { data } = useFetch('/api/v1/Bonuses/Titles', {});

  useEffect(() => {
    if (data) {
      updateWidget((v) => {

        const distinctList = data.filter((item, index, self) =>
          index === self.findIndex((obj) => obj.title === item.title)
        );

        distinctList?.map((bonus) => {
          var index = v.panes?.findIndex(p => p.title == bonus.title) ?? -1;
          if (index == -1) {
            if (!v.panes) v.panes = [];
            v.panes.push({ title: bonus.title, text: `${bonus.title}`, imageUrl: "true" });
          }
        })

        return { ...v }
      });
    }
  }, [data])

  const handleWidgetChange = (name, value) => {
    updateWidget((v) => ({ ...v, [name]: value }));
  }

  const handleChange = (name, value) => {
    updateWidget((v) => {

      var index = v.panes?.findIndex(p => p.title == name) ?? -1;
      v.panes[index].text = value;

      return { ...v };
    })
  }

  const handleChangeChecked = (name, value) => {
    updateWidget((v) => {

      var index = v.panes?.findIndex(p => p.title == name) ?? -1;
      v.panes[index].imageUrl = `${value}`;

      return { ...v };
    })
  }

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
      <Switch name="showDatePicker" value={widget?.showDatePicker} title="Enable Date Selector" onChange={handleWidgetChange} />
    </div>
    {widget?.showDatePicker && <>
      <div className="row row-cards mb-3 border-bottom">
        <div className="col-md-3">
          <Switch name="tabbedUI" value={widget?.settings?.['tabbedUI']} title="Use Tabbed UI" onChange={handleWidgetSettingsChange} />
        </div>
        <div className="col-md-3">
          <Switch name="hideOpen" value={widget?.settings?.['hideOpen']} title="Hide Open Periods" onChange={handleWidgetSettingsChange} />
        </div>
        <div className="col-md-3">
          <Switch name="hideTime" value={widget?.settings?.['hideTime']} title="Hide Time" onChange={handleWidgetSettingsChange} />
        </div>
        <div className="col-md-3">
          <Switch name="hideEnd" value={widget?.settings?.['hideEnd']} title="Hide Period End" onChange={handleWidgetSettingsChange} />
        </div>
        <div className="col-md-3 mb-3">
          <label className="form-label">defaultIndex</label>
          <TextInput name="defaultIndex" value={widget?.settings?.['defaultIndex']} onChange={handleWidgetSettingsChange} />
        </div>
        <div className="col-md-3 mb-3">
          <label className="form-label">defaultPlan</label>
          <TextInput name="defaultPlan" value={widget?.settings?.['defaultPlan']} onChange={handleWidgetSettingsChange} />
        </div>
        <div className="col-md-3 mb-3">
          <label className="form-label">planIds</label>
          <TextInput name="planIds" value={widget?.settings?.['planIds']} onChange={handleWidgetSettingsChange} />
        </div>

      </div>
    </>
    }


    {/* tabbedUI: true, hideOpen: false, localTime: true, hideTime: false, defaultPlan: 386, defaultIndex: 1, planIds: [386, 309] */}

    <div className="row row-cards">
      {widget.panes && widget.panes?.map((pane) => {
        return <React.Fragment key={pane.title}>
          <div className="col-md-3">
            <label className="form-label">{pane.title}</label>
            <div className="input-group mb-2">
              <span className="input-group-text">
                <CheckBox name={pane.title} value={pane?.imageUrl?.toLowerCase() == 'true'} onChange={handleChangeChecked} placeholder="Name of the Wedget" />
              </span>
              <TextInput name={pane.title} value={pane?.text} onChange={handleChange} placeholder="Name of the Wedget" />
            </div>
          </div>
        </React.Fragment>
      })}
    </div>
  </>
}

export default EarningsContent;

EarningsContent.propTypes = {
  widget: PropTypes.any.isRequired,
  updateWidget: PropTypes.func.isRequired,
  trees: PropTypes.any.isRequired
}