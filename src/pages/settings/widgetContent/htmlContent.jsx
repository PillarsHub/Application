import React from "react";
import PropTypes from 'prop-types';
import CodeEditor from "../../../components/codeEditor.jsx";
import SelectInput from "../../../components/selectInput.jsx";
import TextInput from "../../../components/textInput.jsx";
import Tabs, { Tab } from "../../../components/tabs.jsx";
import GraphQLEditor from "../../../components/graphQLEdtor.jsx";
import Switch from "../../../components/switch.jsx";

const HtmlContent = ({ widget, updateWidget }) => {

  const handleChange = (name, value) => {
    if (name == "css") {
      updateWidget((v) => ({ ...v, [name]: value }));
    } else {
      updateWidget((v) => {
        if (v.panes == undefined) v.panes = [];

        if (v.panes.length == 0) {
          v.panes.push({ [name]: value });
        } else {
          v.panes[0] = { ...v.panes[0], [name]: value };
        }

        return { ...v }
      });
    }
  }

  const handleWidgetChange = (name, value) => {
    updateWidget((v) => ({ ...v, [name]: value }));
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
    <div className="row row-cards mb-3 border-bottom">
      <div className="col-md-6">
        <div className="mb-3 border-bottom">
          <Switch name="useIframe" value={widget?.settings?.['useIframe']} title="Use IFrame (allows Javascript)" onChange={handleWidgetSettingsChange} />
          <Switch name="useAuthorizationCode" value={widget?.settings?.['useAuthorizationCode']} title="Use AuthorizationCode" onChange={handleWidgetSettingsChange} />
          <Switch name="usePagination" value={widget?.settings?.['usePagination']} title="Use Pagination" onChange={handleWidgetSettingsChange} />
          {widget?.settings?.['usePagination'] && <>
            <div className="col-6 mb-3">
              <label className="form-label">Total Path</label>
              <TextInput name="totalPath" value={widget?.settings?.['totalPath']} title="Total Path" onChange={handleWidgetSettingsChange} />
            </div>
          </>}
        </div>
      </div>
      <div className="col-md-6">
        <div className="mb-2 border-bottom">
          <Switch name="showDatePicker" value={widget?.showDatePicker} title="Enable Date Selector" onChange={handleWidgetChange} />
          <Switch name="showPeriodPicker" value={widget?.settings?.['showPeriodPicker']} title="Enable Period Selector" onChange={handleWidgetSettingsChange} />
        </div>
        {widget?.settings?.['showPeriodPicker'] && <>
          <div className="mb-2 border-bottom">
            <Switch name="tabbedUI" value={widget?.settings?.['tabbedUI']} title="Use Tabbed UI" onChange={handleWidgetSettingsChange} />
            <Switch name="hideOpen" value={widget?.settings?.['hideOpen']} title="Hide Open Periods" onChange={handleWidgetSettingsChange} />
            <Switch name="hideTime" value={widget?.settings?.['hideTime']} title="Hide Time" onChange={handleWidgetSettingsChange} />
            <Switch name="hideEnd" value={widget?.settings?.['hideEnd']} title="Hide Period End" onChange={handleWidgetSettingsChange} />
            <label className="form-label">defaultIndex</label>
            <TextInput name="defaultIndex" value={widget?.settings?.['defaultIndex']} onChange={handleWidgetSettingsChange} />
            <label className="form-label">defaultPlan</label>
            <TextInput name="defaultPlan" value={widget?.settings?.['defaultPlan']} onChange={handleWidgetSettingsChange} />
            <label className="form-label">planIds</label>
            <TextInput name="planIds" value={widget?.settings?.['planIds']} onChange={handleWidgetSettingsChange} />
          </div>
        </>}
      </div>
    </div>

    <Tabs>
      <Tab title="HTML">
        <CodeEditor name="text" value={widget.panes ? widget.panes[0]?.text : ''} onChange={handleChange} />
      </Tab>
      <Tab title="CSS">
        <CodeEditor name="css" mode="css" value={widget?.css} onChange={handleChange} />
      </Tab>
      <Tab title="Query">
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label">Query Method</label>
            <SelectInput name="imageUrl" value={widget.panes ? widget.panes[0]?.imageUrl : ''} onChange={handleChange}>
              <option value="GQL">GraphQL</option>
              <option value="API">API Call</option>
            </SelectInput>
          </div>
          {widget.panes && widget.panes[0]?.imageUrl == 'API' &&
            <>
              <div className="mb-3">
                <label className="form-label">URL</label>
                <TextInput name="title" value={widget.panes ? widget.panes[0]?.title : ''} onChange={handleChange} />
              </div>
              <div className="alert alert-info" role="alert">
                <h4 className="alert-title">Api calls are made from the client&apos;s brower and not from Pillar&apos;s server</h4>
                <div className="text-muted">Plase make sure no sensitive information is included in the URL.</div>
              </div>
            </>
          }
          {widget.panes && widget.panes[0]?.imageUrl != 'API' &&
            <div className="border">
              <GraphQLEditor query={widget.panes ? widget.panes[0]?.title : ''} onChange={(query) => handleChange("title", query)} />
            </div>
          }
        </div>
      </Tab>
    </Tabs>
  </>
}

export default HtmlContent;

HtmlContent.propTypes = {
  widget: PropTypes.any.isRequired,
  updateWidget: PropTypes.func.isRequired
}