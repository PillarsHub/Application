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
    <div className="mb-3 border-bottom">
      <Switch name="useIframe" value={widget?.settings?.['useIframe']} title="Use IFrame (allows Javascript)" onChange={handleWidgetSettingsChange} />
      <Switch name="useAuthorizationCode" value={widget?.settings?.['useAuthorizationCode']} title="Use AuthorizationCode" onChange={handleWidgetSettingsChange} />
      <Switch name="usePagination" value={widget?.settings?.['usePagination']} title="Use Pagination" onChange={handleWidgetSettingsChange} />
      <div className="col-6 mb-3">
        <label className="form-label">Total Path</label>
        <TextInput name="totalPath" value={widget?.settings?.['totalPath']} title="Total Path" onChange={handleWidgetSettingsChange} />
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