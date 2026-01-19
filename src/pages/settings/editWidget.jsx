import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"
import { useQuery, gql } from "@apollo/client";
import { SendRequest } from "../../hooks/usePost.js";
import PageHeader from "../../components/pageHeader.jsx";
import useWidget from "../../features/widgets/hooks/useWidget.js"
import { WidgetTypes } from "../../features/widgets/hooks/useWidgets.jsx";
import Widget from "../../features/widgets/components/widget.jsx"
import TextInput from '../../components/textInput.jsx';
import ColorInput from '../../components/colorInput.jsx';
import RadioInput from "../../components/radioInput.jsx";
import WidgetContent from "./widgetContent/widgetContent.jsx";
import CssEditor from "../../components/cssEditor.jsx";
import DataLoading from "../../components/dataLoading.jsx";
import DataError from "../../components/dataError.jsx";
import AvailabilityInput from "../../components/availabilityInput.jsx";
import AutoComplete from "../../components/autocomplete.jsx";
import SaveButton from "../../components/saveButton.jsx";

var GET_PREVIEW_DATA = gql`query ($nodeIds: [String]!, $periodDate: Date!) {
  customers(idList: $nodeIds) {
    id
    fullName
    enrollDate
    profileImage
    status {
      id
      name
      statusClass
    }
    emailAddress
    customerType {
      id
      name
    }
    socialMedia {
      name
      value
    }
    language
    customData
    phoneNumbers {
      type
      number
    }
    addresses {
      type
      line1
      line2
      line3
      city
      stateCode
      zip
      countryCode
    }
    cards(idList: ["Dashboard"], date: $periodDate) {
      id
      values {
        value
        valueName
        valueId
      }
    }
  }
  trees {
    id
    name
    nodes(nodeIds: $nodeIds, date: $periodDate) {
      nodeId
      uplineId
      uplineLeg
      upline {
        fullName
        profileImage
      }
    }
  }
  compensationPlans {
    period(date: $periodDate) {
      rankAdvance(nodeIds: $nodeIds) {
        nodeId
        rankId
        rankName
        requirements {
          maintanance
          conditions {
            legCap
            legValue
            required
            value
            valueId
          }
        }
      }
    }
  }
  customerStatuses {
    id
    name
    statusClass
    earningsClass
  }
}`;



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
}`

const EditWidget = () => {
  let params = useParams()

  const [previewId, setPreviewId] = useState();
  const [previewData, setPreviewData] = useState();

  const [saveSettings, setSaveSettings] = useState();
  const [previewSize] = useState(12);
  const [item, setItem] = useState();
  const [date] = useState(new Date().toISOString());
  const { widget, error } = useWidget(params.widgetId);
  const { data, loading, error: dataError } = useQuery(GET_DATA, {
    variables: {},
  });
  const { refetch } = useQuery(GET_PREVIEW_DATA, {
    variables: { nodeIds: [], periodDate: date },
    skip: true, // Initially skip the query
  });

  useEffect(() => {
    if (widget) {
      var tId = widget.id === 'new' ? null : widget.id;
      setItem({ ...widget, id: tId });
    } else {
      setItem({ type: WidgetTypes.Banner });
    }
  }, [widget])

  if (error) return `Error! ${error}`;
  if (dataError) return <DataError error={dataError} />
  if (loading) return <DataLoading />

  const handleChange = (name, value) => {
    setItem((v) => ({ ...v, [name]: value }));
  }

  const handleSave = () => {
    setSaveSettings({ status: 1 });
    var action = "PUT";
    var url = `/api/v1/Widgets/${item.id}`;

    if (item.id === undefined) {
      action = "POST";
      url = `/api/v1/Widgets`;
    }

    SendRequest(action, url, item, (r) => {
      setSaveSettings({ status: 2 });
      setItem(r);
    }, (error) => {
      setSaveSettings({ status: 0, error: error });
    })
  }

  const handlePreviewChange = (name, value) => {

    if (value) {
      refetch({ nodeIds: [value], periodDate: date })
        .then((result) => {
          let customer = result.data.customers[0];
          let compensationPlans = result.data.compensationPlans;
          let trees = result.data.trees;
          setPreviewData({ customer: customer, compensationPlans: compensationPlans, trees: trees });
          setPreviewId(value);
        })
        .catch((error) => {
          alert(error)
          setPreviewData();
          setPreviewId();
        });
    } else {
      setPreviewData();
      setPreviewId();
    }
  }

  const isPreview = previewId == null || previewId == undefined;
  var breadcrumbs = [{ title: `Widgets`, link: `/settings/widgets` }, { title: "Edit Widget" }];
  if (params.pageId) {
    let pageLink = params.pageId;
    let pageName = capitalizeFirstLetter(params?.pageId ?? "A");
    if (pageName == 'CSDB') pageName = "Customer Detail";
    if (pageName == 'PDB') pageName = "Dashboard";
    if (pageLink.startsWith('tree_')) {
      var treeId = params.pageId.substring(5);
      pageName = `${data.trees.find(t => t.id == treeId)?.name} Tree Settings`;
      pageLink = `tree/${treeId}`;
    }

    breadcrumbs = [{ title: `Pages`, link: `/settings/Pages` }, { title: `${pageName}`, link: `/settings/Pages/${pageLink}` }]
  }

  return <PageHeader title="Edit Widget" breadcrumbs={breadcrumbs}>
    <div className="container-xl">
      <div className="row">
        <div className="col-md-6 col-lg-8">

          <div className="card">
            <div className="">
              <div className="card-header">
                <ul className="nav nav-tabs card-header-tabs" data-bs-toggle="tabs" role="tablist">
                  <li className="nav-item" role="presentation">
                    <a href="#tabs-home-7" className="nav-link active" data-bs-toggle="tab" aria-selected="true" role="tab">Content</a>
                  </li>
                  <li className="nav-item" role="presentation">
                    <a href="#tabs-requirements-7" className="nav-link" data-bs-toggle="tab" aria-selected="true" role="tab">Requirements</a>
                  </li>
                  <li className="nav-item" role="presentation">
                    <a href="#tabs-advanced-7" className="nav-link" data-bs-toggle="tab" aria-selected="false" role="tab" tabIndex="-1">CSS Overrides</a>
                  </li>
                </ul>
              </div>
              <div className="card-body">
                <div className="tab-content">
                  <div className="tab-pane active show" id="tabs-home-7" role="tabpanel">
                    <div className="row">
                      <div className="col-md-4 col-lg-2 mb-3">
                        <label className="form-label">Widget Type</label>
                        <select className="form-select" name="type" value={item?.type ?? ''} onChange={(e) => handleChange(e.target.name, e.target.value)} >
                          {WidgetTypes && Object.keys(WidgetTypes).map((key) => {
                            return <option key={key} value={WidgetTypes[key]}>{key}</option>
                          })}
                        </select>
                      </div>
                      {/* <div className="col-md-4 col-lg-4 mb-3">
                        <label className="form-label">Name</label>
                        <TextInput name="name" value={item?.name ?? ''} onChange={handleChange} placeholder="Name of the Wedget" />
                      </div>
                      <div className="col-md-4 col-lg-6 mb-3">
                        <label className="form-label">Description</label>
                        <TextInput name="description" value={item?.description ?? ''} rows={1} onChange={handleChange} placeholder="Short Description of what this widget is about" />
                      </div> */}

                      <div className="col-8 mb-3">
                        <label className="form-label">Header Title</label>
                        <TextInput name="title" value={item?.title ?? ''} onChange={handleChange} />
                      </div>


                      <div className="col-2 mb-3">
                        <label className="form-label">Header Alignment</label>
                        <RadioInput name="headerAlignment" value={item?.headerAlignment} onChange={handleChange} />
                      </div>

                      <div className="col-3 mb-3">
                        <label className="form-label">Header Background Color</label>
                        <ColorInput name="headerColor" value={item?.headerColor} defaultValue="#ffffff" onChange={handleChange} />
                      </div>

                      <div className="col-3 mb-3">
                        <label className="form-label">Header Text Color</label>
                        <ColorInput name="headerTextColor" value={item?.headerTextColor} defaultValue="#1d273b" onChange={handleChange} />
                      </div>

                      <div className="col-3 mb-3">
                        <label className="form-label">Card Background Color</label>
                        <ColorInput name="backgroundColor" value={item?.backgroundColor} defaultValue="#ffffff" onChange={handleChange} />
                      </div>
                      <div className="col-3 mb-3">
                        <label className="form-label">Card Text Color</label>
                        <ColorInput name="textColor" value={item?.textColor} defaultValue="#1d273b" onChange={handleChange} />
                      </div>
                      <div className="col-3 mb-3">
                        <label className="form-label">Card Border Color</label>
                        <ColorInput name="borderColor" value={item?.borderColor} defaultValue="#e6e7e9" onChange={handleChange} />
                      </div>
                    </div>

                    <WidgetContent widget={item} updateWidget={setItem} trees={data.trees} definitions={data.compensationPlans} customerTypes={data.customerTypes} />

                  </div>
                  <div className="tab-pane" id="tabs-requirements-7" role="tabpanel">
                    <AvailabilityInput name="availability" resourceName="widget" value={item?.availability ?? []} onChange={handleChange} />
                  </div>
                  <div className="tab-pane" id="tabs-advanced-7" role="tabpanel">
                    <div className="col-12 mb-3">
                      <CssEditor name="css" value={item?.css} onChange={handleChange} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-footer">
              <div className="row">
                <div className="col">
                  <SaveButton settings={saveSettings} onClick={handleSave} />
                </div>
              </div>
            </div>
          </div>

        </div>
        <div className="col-md-6 col-lg-4">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Widget Preview</h4>
            </div>
            <div className="card-header">
              <div className="w-100">
                <AutoComplete name="customerId" value={previewId} placeholder="Widget preview customer" onChange={handlePreviewChange} allowNull={true} showClear={true} />
              </div>
            </div>
            <div className="p-2">
              <div className={`col-${previewSize}`}>
                {item && <Widget widget={item} trees={previewData?.trees ?? data?.trees} customer={previewData?.customer} compensationPlans={previewData?.compensationPlans} isPreview={isPreview} date={date} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageHeader>
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}


export default EditWidget;