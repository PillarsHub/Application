import React, { useState, useRef, useEffect } from "react";
import { useFetch } from "../../hooks/useFetch";
import { ClearTheme } from "../../hooks/useTheme";
import { SendRawRequest, SendRequest } from "../../hooks/usePost";
import PageHeader, { CardHeader } from "../../components/pageHeader";
import SettingsNav from "./settingsNav";
import ColorInput from "../../components/colorInput";
import TextInput from "../../components/textInput";
import SelectInput from "../../components/selectInput";
import SaveButton from "../../components/saveButton";

const THEME_COLOR_WIDGET_HEADER = "widgetHeaderColor";
const THEME_COLOR_WIDGET_HEADER_TEXT = "widgetHeaderTextColor";
const THEME_COLOR_WIDGET_BACKGROUND = "widgetBackgroundColor";
const THEME_COLOR_WIDGET_TEXT = "widgetTextColor";
const THEME_COLOR_WIDGET_BORDER = "widgetBorderColor";
const THEME_COLOR_PAGE_BACKGROUND = "pageBackgroundColor";
const THEME_COLOR_BUTTON = "buttonColor";
const THEME_COLOR_BUTTON_TEXT = "buttonTextColor";
const THEME_SETTING_SHOW_TOP_MENU = "legacyMenu";
const THEME_SETTING_CUSTOMER_SUBMENU_MODE = "customerSubmenuMode";
const THEME_SETTING_CUSTOMER_SUBMENU_COLOR = "customerSubmenuColor";
const THEME_SETTING_CUSTOMER_SUBMENU_TEXT_COLOR = "customerSubmenuTextColor";

const DEFAULT_THEME_COLORS = {
  [THEME_COLOR_WIDGET_HEADER]: "#ffffff",
  [THEME_COLOR_WIDGET_HEADER_TEXT]: "#1d273b",
  [THEME_COLOR_WIDGET_BACKGROUND]: "#ffffff",
  [THEME_COLOR_WIDGET_TEXT]: "#1d273b",
  [THEME_COLOR_WIDGET_BORDER]: "#e6e7e9",
  [THEME_COLOR_PAGE_BACKGROUND]: "#f1f5f9",
  [THEME_COLOR_BUTTON]: "#206bc4",
  [THEME_COLOR_BUTTON_TEXT]: "#ffffff"
};

const findNamedItem = (items, name) => {
  if (!Array.isArray(items) || !name) return undefined;
  return items.find((item) => item?.name?.toLowerCase() === name.toLowerCase());
};

const getNamedValue = (items, name) => findNamedItem(items, name)?.value;

const upsertNamedValue = (items, name, value) => {
  const next = Array.isArray(items) ? [...items] : [];
  const index = next.findIndex((item) => item?.name?.toLowerCase() === name.toLowerCase());
  const updated = { name, value };

  if (index >= 0) {
    next[index] = { ...next[index], ...updated };
  } else {
    next.push(updated);
  }

  return next;
};

const parseBoolean = (value, defaultValue = true) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return defaultValue;
};

const Theme = () => {
  const fileInputRef = useRef(null);
  const [saveSettings, setSaveSettings] = useState();
  const [uploadTitle, setUploadTitle] = useState("");
  const [item, setItem] = useState({ headerColor: "#1d273b", loginColor: "#f1f5f9" });
  const { data: theme, loading, error } = useFetch('/api/v1/Theme');

  useEffect(() => {
    setItem(theme)
  }, [theme])

  if (error) return `Error! ${error}`;

  const handleChange = (name, value) => {
    if (name == 'subdomain') {
      if (isValidSubdomain(value)) {
        setItem(v => ({ ...v, [name]: value, errorText: '' }));
      } else {
        setItem(v => ({ ...v, [name]: value, errorText: 'Please enter a valid subdomain.' }));
      }
    } else {
      setItem(v => ({ ...v, [name]: value }));
    }
  }

  const handleThemeColorChange = (name, value) => {
    setItem((current) => ({
      ...current,
      colors: upsertNamedValue(current?.colors, name, value)
    }));
  };

  const handleThemeSettingChange = (name, value) => {
    setItem((current) => ({
      ...current,
      settings: upsertNamedValue(current?.settings, name, `${value}`)
    }));
  };

  const handleButtonClick = (title) => {
    setUploadTitle(title);
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === "image/jpeg" || selectedFile.type === "image/png") {

        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("title", uploadTitle);
        formData.append("Description", "Header Logo");
        formData.append("category", "Theme_Staged");

        SendRawRequest("PUT", '/api/v1/blobs', null, formData, (r) => {
          let doc = { documentId: r.id, url: r.url }
          setItem(v => ({ ...v, [uploadTitle]: doc }));
        }, (error, code) => {
          alert(`${code}: ${error}`);
        });

      } else {
        alert("Please select a .jpg or .png image file.");
      }
    }
  };

  const handleSave = () => {
    setSaveSettings({ status: 1 });
    SendRequest("PUT", '/api/v1/Theme', item, () => {
      setSaveSettings({ status: 2 });
      ClearTheme();
    }, (error, code) => {
      const responseObject = JSON.parse(error);
      if (code == 400) {
        setSaveSettings({ status: 0, error: {} });
        setItem(v => ({ ...v, errorText: 'Please enter a valid subdomain.' }));
      } else if (code == 409) {
        setSaveSettings({ status: 0, error: {} });
        setItem(v => ({ ...v, errorText: `'${responseObject.subdomain}' is not available. Please select another subdomain.` }));
      } else {
        setSaveSettings({ status: 0, error: error });
        alert(code + ": " + error);
      }
    });
  }

  const showDomain = true;
  const logoUrl = item?.logo?.url ?? '/images/logo.png';
  const faviconUrl = item?.favicon?.url ?? '/favicon.ico';
  const loginLogo = item?.loginLogo?.url ?? '/images/logo-dark.png'
  const widgetHeaderColor = getNamedValue(item?.colors, THEME_COLOR_WIDGET_HEADER) ?? DEFAULT_THEME_COLORS[THEME_COLOR_WIDGET_HEADER];
  const widgetHeaderTextColor = getNamedValue(item?.colors, THEME_COLOR_WIDGET_HEADER_TEXT) ?? DEFAULT_THEME_COLORS[THEME_COLOR_WIDGET_HEADER_TEXT];
  const widgetBackgroundColor = getNamedValue(item?.colors, THEME_COLOR_WIDGET_BACKGROUND) ?? DEFAULT_THEME_COLORS[THEME_COLOR_WIDGET_BACKGROUND];
  const widgetTextColor = getNamedValue(item?.colors, THEME_COLOR_WIDGET_TEXT) ?? DEFAULT_THEME_COLORS[THEME_COLOR_WIDGET_TEXT];
  const widgetBorderColor = getNamedValue(item?.colors, THEME_COLOR_WIDGET_BORDER) ?? DEFAULT_THEME_COLORS[THEME_COLOR_WIDGET_BORDER];
  const pageBackgroundColor = getNamedValue(item?.colors, THEME_COLOR_PAGE_BACKGROUND) ?? DEFAULT_THEME_COLORS[THEME_COLOR_PAGE_BACKGROUND];
  const buttonColor = getNamedValue(item?.colors, THEME_COLOR_BUTTON) ?? DEFAULT_THEME_COLORS[THEME_COLOR_BUTTON];
  const buttonTextColor = getNamedValue(item?.colors, THEME_COLOR_BUTTON_TEXT) ?? DEFAULT_THEME_COLORS[THEME_COLOR_BUTTON_TEXT];
  const showTopMenu = parseBoolean(getNamedValue(item?.settings, THEME_SETTING_SHOW_TOP_MENU), true);
  const customerSubmenuMode = (getNamedValue(item?.settings, THEME_SETTING_CUSTOMER_SUBMENU_MODE) ?? "auto").toLowerCase();
  const customerSubmenuColor = getNamedValue(item?.settings, THEME_SETTING_CUSTOMER_SUBMENU_COLOR) ?? "#243049";
  const customerSubmenuTextColor = getNamedValue(item?.settings, THEME_SETTING_CUSTOMER_SUBMENU_TEXT_COLOR) ?? (item?.headerTextColor ?? "#ffffff");
  const customerMenuPlacement = showTopMenu ? "topNavigation" : "sideNavigation";

  const inlineStyle = {
    "--tblr-navbar-bg": (item?.headerColor ?? '#1d273b'),
    '--tblr-navbar-border-color': (item?.headerColor ?? '#243049'),
    '--tblr-icon-color': (item?.headerTextColor ?? '#ffffff'),
    '--tblr-nav-link-font-size': "1rem",
    "--tblr-nav-link-font-weight": "400",
    "--tblr-theme-body-color": (item?.headerTextColor ?? '#ffffff')
  };

  return <PageHeader title="Theme" preTitle="Settings">
    <CardHeader>
      <SaveButton settings={saveSettings} onClick={handleSave} />
    </CardHeader>
    <SettingsNav loading={loading} pageId="theme">
      <div className="card-header">
        <span className="card-title">Theme</span>
      </div>
      <div className="card-body">
        <input type="file" accept=".jpg, .jpeg, .png" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileChange} />

        <div className="card mb-4">
          <div className="card-body p-3">
            <div className="border-bottom pb-2 mb-3">
              <h3 className="h3 mb-1">Branding</h3>
              <p className="text-secondary small mb-0">Manage the brand assets shown throughout the application.</p>
            </div>

            <div className="mb-3 row">
              <label className="col-3 col-form-label text-secondary">Header Logo</label>
              <div className="col">
                <header className="navbar navbar-expand-md navbar-dark theme-navbar" style={inlineStyle}>
                  <div className="container-xl">
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar-menu" aria-controls="navbar-menu" aria-expanded="false" aria-label="Toggle navigation">
                      <span className="navbar-toggler-icon"></span>
                    </button>
                    <h1 className="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3">
                      <img src={logoUrl} alt="Pillars" className="navbar-brand-image" />
                    </h1>
                    <div className="collapse navbar-collapse" id="navbar-menu">
                      <div className="d-flex flex-column flex-md-row flex-fill align-items-stretch align-items-md-center">
                        <ul className="navbar-nav">
                          <li className="nav-item">
                            <a className="nav-link" href="/thisIsJustForDisplay" onClick={(e) => e.preventDefault()}>
                              <span className="nav-link-icon d-md-none d-lg-inline-block">
                                <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-users" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><circle cx="9" cy="7" r="4"></circle><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path><path d="M21 21v-2a4 4 0 0 0 -3 -3.85"></path></svg>
                              </span>
                              <span className="nav-link-title">Customers</span>
                            </a>
                          </li>
                        </ul>
                        <div className="ms-auto me-3">
                          <button onClick={() => handleButtonClick("logo")} className="btn btn-default">
                            Change
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </header>
                <small className="form-hint mt-1">Maximum file size: 1 MB. Supported formats: JPG and PNG.</small>
              </div>
            </div>

            <div className="mb-3 row">
              <label className="col-3 col-form-label text-secondary">Favicon</label>
              <div className="col">
                <ul className="nav nav-tabs card-header-tabs mt-2 mb-2 ms-0 me-0 border" data-bs-toggle="tabs" role="tablist">
                  <li className="nav-item" role="presentation">
                    <a href="#tabs-home-9" className="nav-link active" data-bs-toggle="tab" aria-selected="true" role="tab">
                      <img src={faviconUrl} alt="Pillars" className="me-2" style={{ width: "20px", height: "20px" }} />
                      {item?.title ? `${item?.title}` : "Pillars"}
                    </a>
                  </li>
                  <li className="ms-auto">
                    <button onClick={() => handleButtonClick("favicon")} className="btn btn-link me-3">
                      Change
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mb-3 row">
              <label className="col-3 col-form-label text-secondary">Application Title</label>
              <div className="col">
                <TextInput placeholder="Pillars" name="title" value={item?.title ?? ''} errorText={item?.titleError} onChange={handleChange} />
              </div>
            </div>

            {showDomain && <div className="mb-3 row">
              <label className="col-3 col-form-label text-secondary">Subdomain</label>
              <div className="col">
                <div className="input-group">
                  <span className="input-group-text">https://</span>
                  <TextInput placeholder="subdomain" name="subdomain" value={item?.subdomain ?? ''} errored={item?.errorText} onChange={handleChange} />
                  <span className="input-group-text">.pillarshub.com</span>
                  {item?.errorText && <div className="invalid-feedback">{item?.errorText}</div>}
                </div>
              </div>
            </div>}
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-body p-3">
            <div className="border-bottom pb-2 mb-3">
              <h3 className="h3 mb-1">Navigation</h3>
              <p className="text-secondary small mb-0">Configure the top navigation bar appearance and behavior.</p>
            </div>

            <div className="mb-3 row">
              <label className="col-3 col-form-label text-secondary">Navigation Background Color</label>
              <div className="col">
                <ColorInput name="headerColor" value={item?.headerColor ?? '#1d273b'} defaultValue="#1d273b" onChange={handleChange} />
              </div>
            </div>
            <div className="mb-3 row">
              <label className="col-3 col-form-label text-secondary">Navigation Text Color</label>
              <div className="col">
                <ColorInput name="headerTextColor" value={item?.headerTextColor ?? '#ffffff'} defaultValue="#ffffff" onChange={handleChange} />
              </div>
            </div>
            <div className="mb-0 row">
              <label className="col-3 col-form-label text-secondary">Customer Menu Placement</label>
              <div className="col">
                <SelectInput
                  name={THEME_SETTING_SHOW_TOP_MENU}
                  value={customerMenuPlacement}
                  onChange={(name, value) => handleThemeSettingChange(name, value === "topNavigation")}
                >
                  <option value="topNavigation">Top navigation</option>
                  <option value="sideNavigation">Side navigation</option>
                </SelectInput>
              </div>
            </div>
            {customerMenuPlacement === "sideNavigation" && <div className="mt-3 row">
              <label className="col-3 col-form-label text-secondary">Customer Menu Style</label>
              <div className="col">
                <SelectInput
                  name={THEME_SETTING_CUSTOMER_SUBMENU_MODE}
                  value={customerSubmenuMode}
                  onChange={handleThemeSettingChange}
                >
                  <option value="auto">Auto (theme-aware)</option>
                  <option value="dark">Always darker</option>
                  <option value="light">Always lighter</option>
                  <option value="custom">Custom color</option>
                </SelectInput>
              </div>
            </div>}
            {customerMenuPlacement === "sideNavigation" && customerSubmenuMode === "custom" && <div className="mt-3 mb-0 row">
              <label className="col-3 col-form-label text-secondary">Customer Menu Color</label>
              <div className="col">
                <ColorInput
                  name={THEME_SETTING_CUSTOMER_SUBMENU_COLOR}
                  value={customerSubmenuColor}
                  defaultValue="#243049"
                  onChange={handleThemeSettingChange}
                />
              </div>
            </div>}
            {customerMenuPlacement === "sideNavigation" && customerSubmenuMode === "custom" && <div className="mt-3 mb-0 row">
              <label className="col-3 col-form-label text-secondary">Customer Menu Text Color</label>
              <div className="col">
                <ColorInput
                  name={THEME_SETTING_CUSTOMER_SUBMENU_TEXT_COLOR}
                  value={customerSubmenuTextColor}
                  defaultValue={item?.headerTextColor ?? "#ffffff"}
                  onChange={handleThemeSettingChange}
                />
              </div>
            </div>}
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-body p-3">
            <div className="border-bottom pb-2 mb-3">
              <h3 className="h3 mb-1">Widget Defaults</h3>
              <p className="text-secondary small mb-0">Set fallback widget colors used when widget-specific colors are not configured.</p>
            </div>

            <div className="mb-3 row">
              <label className="col-3 col-form-label text-secondary">Header Color</label>
              <div className="col">
                <ColorInput name={THEME_COLOR_WIDGET_HEADER} value={widgetHeaderColor} defaultValue={DEFAULT_THEME_COLORS[THEME_COLOR_WIDGET_HEADER]} onChange={handleThemeColorChange} />
              </div>
            </div>
            <div className="mb-3 row">
              <label className="col-3 col-form-label text-secondary">Header Text Color</label>
              <div className="col">
                <ColorInput name={THEME_COLOR_WIDGET_HEADER_TEXT} value={widgetHeaderTextColor} defaultValue={DEFAULT_THEME_COLORS[THEME_COLOR_WIDGET_HEADER_TEXT]} onChange={handleThemeColorChange} />
              </div>
            </div>
            <div className="mb-3 row">
              <label className="col-3 col-form-label text-secondary">Background Color</label>
              <div className="col">
                <ColorInput name={THEME_COLOR_WIDGET_BACKGROUND} value={widgetBackgroundColor} defaultValue={DEFAULT_THEME_COLORS[THEME_COLOR_WIDGET_BACKGROUND]} onChange={handleThemeColorChange} />
              </div>
            </div>
            <div className="mb-3 row">
              <label className="col-3 col-form-label text-secondary">Text Color</label>
              <div className="col">
                <ColorInput name={THEME_COLOR_WIDGET_TEXT} value={widgetTextColor} defaultValue={DEFAULT_THEME_COLORS[THEME_COLOR_WIDGET_TEXT]} onChange={handleThemeColorChange} />
              </div>
            </div>
            <div className="mb-0 row">
              <label className="col-3 col-form-label text-secondary">Border Color</label>
              <div className="col">
                <ColorInput name={THEME_COLOR_WIDGET_BORDER} value={widgetBorderColor} defaultValue={DEFAULT_THEME_COLORS[THEME_COLOR_WIDGET_BORDER]} onChange={handleThemeColorChange} />
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-body p-3">
            <div className="border-bottom pb-2 mb-3">
              <h3 className="h3 mb-1">General Colors</h3>
              <p className="text-secondary small mb-0">Define global page and button colors used across the application.</p>
            </div>

            <div className="mb-3 row">
              <label className="col-3 col-form-label text-secondary">Page Background Color</label>
              <div className="col">
                <ColorInput name={THEME_COLOR_PAGE_BACKGROUND} value={pageBackgroundColor} defaultValue={DEFAULT_THEME_COLORS[THEME_COLOR_PAGE_BACKGROUND]} onChange={handleThemeColorChange} />
              </div>
            </div>
            <div className="mb-3 row">
              <label className="col-3 col-form-label text-secondary">Button Color</label>
              <div className="col">
                <ColorInput name={THEME_COLOR_BUTTON} value={buttonColor} defaultValue={DEFAULT_THEME_COLORS[THEME_COLOR_BUTTON]} onChange={handleThemeColorChange} />
              </div>
            </div>
            <div className="mb-0 row">
              <label className="col-3 col-form-label text-secondary">Button Text Color</label>
              <div className="col">
                <ColorInput name={THEME_COLOR_BUTTON_TEXT} value={buttonTextColor} defaultValue={DEFAULT_THEME_COLORS[THEME_COLOR_BUTTON_TEXT]} onChange={handleThemeColorChange} />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body p-3">
            <div className="border-bottom pb-2 mb-3">
              <h3 className="h3 mb-1">Login Page</h3>
              <p className="text-secondary small mb-0">Configure branding and background color for the login experience.</p>
            </div>

            <div className="mb-3 row">
              <label className="col-3 col-form-label text-secondary">Login Logo</label>
              <div className="col">
                <div className="border d-flex align-items-center p-3" style={{ backgroundColor: (item?.loginColor ?? '#f8fafc') }}>
                  <div className="d-flex align-items-center border p-4" style={{ backgroundColor: '#fff' }}>
                    <img src={loginLogo} alt="Pillars" style={{ maxWidth: '300px', maxHeight: '165px' }} />
                  </div>
                  <div className="ms-auto me-3">
                    <button onClick={() => handleButtonClick("loginLogo")} className="btn btn-default">
                      Change
                    </button>
                  </div>
                </div>
                <small className="form-hint mt-1">Maximum file size: 1 MB. Supported formats: JPG and PNG.</small>
              </div>
            </div>

            <div className="mb-0 row">
              <label className="col-3 col-form-label text-secondary">Login Background Color</label>
              <div className="col">
                <ColorInput name="loginColor" value={item?.loginColor ?? '#f8fafc'} defaultValue="#f8fafc" onChange={handleChange} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SettingsNav>
  </PageHeader>
}

function isValidSubdomain(subdomain) {
  if (subdomain == '') return true;
  // Define a regular expression pattern for a valid subdomain
  const subdomainPattern = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

  // Check if the provided subdomain matches the pattern
  const isValid = subdomainPattern.test(subdomain);

  return isValid;
}

export default Theme;
