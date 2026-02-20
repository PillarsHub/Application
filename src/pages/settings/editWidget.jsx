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
import Modal from "../../components/modal.jsx";
import useSubdomain from "../../hooks/useSubdomain.js";
import { useTheme } from "../../hooks/useTheme.js";

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

const THEME_COLOR_WIDGET_HEADER = "widgetHeaderColor";
const THEME_COLOR_WIDGET_HEADER_TEXT = "widgetHeaderTextColor";
const THEME_COLOR_WIDGET_BACKGROUND = "widgetBackgroundColor";
const THEME_COLOR_WIDGET_TEXT = "widgetTextColor";
const THEME_COLOR_WIDGET_BORDER = "widgetBorderColor";

const FALLBACK_WIDGET_COLORS = {
  headerColor: "#ffffff",
  headerTextColor: "#1d273b",
  backgroundColor: "#ffffff",
  textColor: "#1d273b",
  borderColor: "#e6e7e9"
};

const getThemeColorValue = (theme, name, defaultValue) => {
  if (!Array.isArray(theme?.colors)) return defaultValue;
  const color = theme.colors.find((item) => item?.name?.toLowerCase() === name.toLowerCase());
  return color?.value ?? defaultValue;
};

const getDefaultWidgetColors = (theme) => ({
  headerColor: getThemeColorValue(theme, THEME_COLOR_WIDGET_HEADER, FALLBACK_WIDGET_COLORS.headerColor),
  headerTextColor: getThemeColorValue(theme, THEME_COLOR_WIDGET_HEADER_TEXT, FALLBACK_WIDGET_COLORS.headerTextColor),
  backgroundColor: getThemeColorValue(theme, THEME_COLOR_WIDGET_BACKGROUND, FALLBACK_WIDGET_COLORS.backgroundColor),
  textColor: getThemeColorValue(theme, THEME_COLOR_WIDGET_TEXT, FALLBACK_WIDGET_COLORS.textColor),
  borderColor: getThemeColorValue(theme, THEME_COLOR_WIDGET_BORDER, FALLBACK_WIDGET_COLORS.borderColor)
});

const normalizeColorValue = (value) => {
  if (value === undefined || value === null) return null;

  const normalized = `${value}`.trim();
  return normalized === "" ? null : normalized;
};

const normalizeWidgetColorsForSave = (widget, defaults) => {
  const next = { ...widget };

  Object.keys(defaults).forEach((field) => {
    const current = normalizeColorValue(next[field]);
    const defaultValue = normalizeColorValue(defaults[field]);
    const currentKey = current?.toLowerCase();
    const defaultKey = defaultValue?.toLowerCase();

    next[field] = current === null || currentKey === defaultKey ? null : current;
  });

  return next;
};

const IMPORT_STRIP_FIELDS = ["id", "createdDate", "createDate", "createdBy", "modifiedDate", "updatedDate", "modifiedBy", "__typename"];

const parseImportWidget = (rawValue, currentWidgetId) => {
  const parsed = JSON.parse(rawValue);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Imported JSON must be a widget object.");
  }

  const widgetPayload = parsed.widget && typeof parsed.widget === "object" && !Array.isArray(parsed.widget) ? parsed.widget : parsed;
  const next = { ...widgetPayload };

  IMPORT_STRIP_FIELDS.forEach((field) => {
    delete next[field];
  });

  if (currentWidgetId !== undefined && currentWidgetId !== null) {
    next.id = currentWidgetId;
  }

  return next;
};

const EditWidget = () => {
  let params = useParams()
  const { subdomain } = useSubdomain();
  const { theme } = useTheme({ subdomain });
  const defaultWidgetColors = getDefaultWidgetColors(theme);

  const [previewId, setPreviewId] = useState();
  const [previewData, setPreviewData] = useState();

  const [saveSettings, setSaveSettings] = useState();
  const [previewSize] = useState(12);
  const [item, setItem] = useState();
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [sourceJson, setSourceJson] = useState("");
  const [sourceError, setSourceError] = useState();
  const [copyState, setCopyState] = useState();
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
    const payload = normalizeWidgetColorsForSave(item, defaultWidgetColors);

    if (item.id === undefined) {
      action = "POST";
      url = `/api/v1/Widgets`;
    }

    SendRequest(action, url, payload, (r) => {
      setSaveSettings({ status: 2 });
      setItem(r);
    }, (error) => {
      setSaveSettings({ status: 0, error: error });
    })
  }

  const handleOpenSourceModal = () => {
    const sourceWidget = item ?? (widget && widget.id !== "new" ? widget : {});
    setSourceJson(JSON.stringify(sourceWidget ?? {}, null, 2));
    setSourceError();
    setCopyState();
    setShowSourceModal(true);
  };

  const handleCopySource = async () => {
    if (!sourceJson) return;

    if (!navigator?.clipboard?.writeText) {
      setCopyState("Clipboard is not available in this browser.");
      return;
    }

    try {
      await navigator.clipboard.writeText(sourceJson);
      setCopyState("Copied to clipboard.");
    } catch {
      setCopyState("Unable to copy. Please select and copy manually.");
    }
  };

  const handleApplySource = () => {
    try {
      const importedWidget = parseImportWidget(sourceJson, item?.id);
      setItem((current) => ({ ...current, ...importedWidget }));
      setSourceError();
      setCopyState();
      setShowSourceModal(false);
    } catch (ex) {
      setSourceError(ex?.message ?? "Invalid JSON.");
    }
  };

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
              <div className="card-header bg-light">
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
                <div className="card-actions">
                  <button type="button" className="btn btn-sm btn-ghost-secondary" onClick={handleOpenSourceModal}>
                    View Source
                  </button>
                </div>
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
                        <ColorInput name="headerColor" value={item?.headerColor} defaultValue={defaultWidgetColors.headerColor} onChange={handleChange} />
                      </div>

                      <div className="col-3 mb-3">
                        <label className="form-label">Header Text Color</label>
                        <ColorInput name="headerTextColor" value={item?.headerTextColor} defaultValue={defaultWidgetColors.headerTextColor} onChange={handleChange} />
                      </div>

                      <div className="col-3 mb-3">
                        <label className="form-label">Card Background Color</label>
                        <ColorInput name="backgroundColor" value={item?.backgroundColor} defaultValue={defaultWidgetColors.backgroundColor} onChange={handleChange} />
                      </div>
                      <div className="col-3 mb-3">
                        <label className="form-label">Card Text Color</label>
                        <ColorInput name="textColor" value={item?.textColor} defaultValue={defaultWidgetColors.textColor} onChange={handleChange} />
                      </div>
                      <div className="col-3 mb-3">
                        <label className="form-label">Card Border Color</label>
                        <ColorInput name="borderColor" value={item?.borderColor} defaultValue={defaultWidgetColors.borderColor} onChange={handleChange} />
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

    <Modal showModal={showSourceModal} onHide={() => setShowSourceModal(false)} size="lg">
      <div className="modal-header">
        <h5 className="modal-title">Widget Source JSON</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <p className="text-secondary mb-0">Copy this JSON or paste JSON from another environment, then apply it to this form.</p>
          <button type="button" className="btn btn-icon" onClick={handleCopySource} title="Copy JSON" aria-label="Copy JSON">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <path d="M15 3v4a1 1 0 0 0 1 1h4"></path>
              <path d="M18 17h-7a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h4l5 5v7a2 2 0 0 1 -2 2z"></path>
              <path d="M16 17v2a2 2 0 0 1 -2 2h-7a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h2"></path>
            </svg>
          </button>
        </div>
        <textarea className="form-control font-monospace" rows={18} value={sourceJson} onChange={(e) => setSourceJson(e.target.value)} />
        {sourceError && <div className="alert alert-danger mt-3 mb-0" role="alert">{sourceError}</div>}
        {copyState && <div className="text-secondary mt-2">{copyState}</div>}
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-link link-secondary" data-bs-dismiss="modal">
          Close
        </button>
        <button type="button" className="btn btn-primary" onClick={handleApplySource}>
          Apply
        </button>
      </div>
    </Modal>
  </PageHeader>
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}


export default EditWidget;
