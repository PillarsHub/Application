import React, { useEffect, useState } from 'react';
import { Outlet } from "react-router-dom";
import { GetScope } from "../features/authentication/hooks/useToken.jsx"
import { useParams } from "react-router-dom"
import BackOfficeMenu from './backOfficeMenu.jsx';
import CorporateMenu from './corporateMenu.jsx';
import DataLoading from '../components/dataLoading.jsx';
import useSubdomain from '../hooks/useSubdomain.js';
import { useTheme } from '../hooks/useTheme.js';
import AccountMenu from './accountMenu.jsx';
import AutoCompleteOrdersCustomers from '../components/autoCompleteOrdersCustomers.jsx';
import CustomerNav from './customers/customerNav.jsx';

const THEME_SETTING_SHOW_TOP_MENU = 'legacyMenu';
const THEME_COLOR_WIDGET_HEADER = "widgetHeaderColor";
const THEME_COLOR_WIDGET_HEADER_TEXT = "widgetHeaderTextColor";
const THEME_COLOR_WIDGET_BACKGROUND = "widgetBackgroundColor";
const THEME_COLOR_WIDGET_TEXT = "widgetTextColor";
const THEME_COLOR_WIDGET_BORDER = "widgetBorderColor";
const THEME_COLOR_PAGE_BACKGROUND = "pageBackgroundColor";
const THEME_COLOR_BUTTON = "buttonColor";
const THEME_COLOR_BUTTON_TEXT = "buttonTextColor";
const THEME_SETTING_CUSTOMER_SUBMENU_MODE = "customerSubmenuMode";
const THEME_SETTING_CUSTOMER_SUBMENU_COLOR = "customerSubmenuColor";
const THEME_SETTING_CUSTOMER_SUBMENU_TEXT_COLOR = "customerSubmenuTextColor";

const getThemeSettingValue = (theme, ...names) => {
  if (!Array.isArray(theme?.settings) || names.length === 0) return undefined;

  const normalizedNames = names.map((name) => name.toLowerCase());
  const setting = theme.settings.find((item) => normalizedNames.includes(item?.name?.toLowerCase()));

  return setting?.value;
};

const getThemeColorValue = (theme, name, defaultValue) => {
  if (!Array.isArray(theme?.colors)) return defaultValue;
  const color = theme.colors.find((item) => item?.name?.toLowerCase() === name.toLowerCase());
  return color?.value ?? defaultValue;
};

const parseBooleanSetting = (value, defaultValue = true) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }

  return defaultValue;
};

const parseColorToRgb = (color) => {
  if (!color || typeof color !== 'string') return null;

  const value = color.trim();

  const hexMatch = value.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    const int = parseInt(hex, 16);
    return {
      r: (int >> 16) & 255,
      g: (int >> 8) & 255,
      b: int & 255
    };
  }

  const rgbMatch = value.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(',').map((p) => Number.parseFloat(p.trim()));
    if (parts.length >= 3 && parts.every((n, i) => i > 2 || Number.isFinite(n))) {
      return {
        r: Math.max(0, Math.min(255, Math.round(parts[0]))),
        g: Math.max(0, Math.min(255, Math.round(parts[1]))),
        b: Math.max(0, Math.min(255, Math.round(parts[2])))
      };
    }
  }

  const rgbSpaceMatch = value.match(/^rgba?\(\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)(?:\s*\/\s*[0-9.]+)?\s*\)$/i);
  if (rgbSpaceMatch) {
    return {
      r: Math.max(0, Math.min(255, Math.round(Number.parseFloat(rgbSpaceMatch[1])))),
      g: Math.max(0, Math.min(255, Math.round(Number.parseFloat(rgbSpaceMatch[2])))),
      b: Math.max(0, Math.min(255, Math.round(Number.parseFloat(rgbSpaceMatch[3]))))
    };
  }

  // Fallback: let the browser normalize any valid CSS color.
  if (typeof document !== 'undefined') {
    const probe = document.createElement('span');
    probe.style.color = '';
    probe.style.color = value;
    if (probe.style.color) {
      document.body.appendChild(probe);
      const computed = window.getComputedStyle(probe).color;
      document.body.removeChild(probe);
      const computedMatch = computed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
      if (computedMatch) {
        return {
          r: Number.parseInt(computedMatch[1], 10),
          g: Number.parseInt(computedMatch[2], 10),
          b: Number.parseInt(computedMatch[3], 10)
        };
      }
    }
  }

  return null;
};

const mixRgb = (base, target, weight) => {
  const w = Math.max(0, Math.min(1, weight));
  return {
    r: Math.round(base.r * (1 - w) + target.r * w),
    g: Math.round(base.g * (1 - w) + target.g * w),
    b: Math.round(base.b * (1 - w) + target.b * w)
  };
};

const rgbToCss = ({ r, g, b }, alpha = 1) => `rgba(${r}, ${g}, ${b}, ${alpha})`;

const relativeLuminance = ({ r, g, b }) => {
  const normalize = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };

  const R = normalize(r);
  const G = normalize(g);
  const B = normalize(b);

  return (0.2126 * R) + (0.7152 * G) + (0.0722 * B);
};

const CustomerLayout = () => {
  const { customerId } = useParams();
  const [searchText, setSearchText] = useState();
  const { subdomain } = useSubdomain();
  const { theme, loading, error } = useTheme({ subdomain: subdomain });

  useEffect(() => {
    document.documentElement.style.setProperty("--ph-widget-header-bg", getThemeColorValue(theme, THEME_COLOR_WIDGET_HEADER, "#ffffff"));
    document.documentElement.style.setProperty("--ph-widget-header-text", getThemeColorValue(theme, THEME_COLOR_WIDGET_HEADER_TEXT, "#1d273b"));
    document.documentElement.style.setProperty("--ph-widget-bg", getThemeColorValue(theme, THEME_COLOR_WIDGET_BACKGROUND, "#ffffff"));
    document.documentElement.style.setProperty("--ph-widget-text", getThemeColorValue(theme, THEME_COLOR_WIDGET_TEXT, "#1d273b"));
    document.documentElement.style.setProperty("--ph-widget-border", getThemeColorValue(theme, THEME_COLOR_WIDGET_BORDER, "#e6e7e9"));
    document.documentElement.style.setProperty("--tblr-body-bg", getThemeColorValue(theme, THEME_COLOR_PAGE_BACKGROUND, "#f1f5f9"));
    document.documentElement.style.setProperty("--ph-button-bg", getThemeColorValue(theme, THEME_COLOR_BUTTON, "#206bc4"));
    document.documentElement.style.setProperty("--ph-button-text", getThemeColorValue(theme, THEME_COLOR_BUTTON_TEXT, "#ffffff"));
  }, [theme]);

  if (loading) return <DataLoading title="Loading Theme" />;
  if (error) return `Error! ${error}`;

  const baseNavbarColor = parseColorToRgb(theme?.headerColor ?? '#1d273b') ?? { r: 29, g: 39, b: 59 };
  const baseTextColor = parseColorToRgb(theme?.headerTextColor ?? 'rgba(255,255,255,.8)') ?? { r: 255, g: 255, b: 255 };
  const submenuModeRaw = (getThemeSettingValue(
    theme,
    THEME_SETTING_CUSTOMER_SUBMENU_MODE,
    'customerMenuStyle',
    'customerSubMenuMode'
  ) ?? 'auto').toString().trim().toLowerCase();
  const submenuMode = ['auto', 'light', 'dark', 'custom'].includes(submenuModeRaw) ? submenuModeRaw : 'auto';
  const customSubmenuColor = parseColorToRgb(getThemeSettingValue(
    theme,
    THEME_SETTING_CUSTOMER_SUBMENU_COLOR,
    'customerSubmenuBg',
    'customerSubMenuColor'
  ) ?? '');
  const customSubmenuTextColor = parseColorToRgb(getThemeSettingValue(
    theme,
    THEME_SETTING_CUSTOMER_SUBMENU_TEXT_COLOR,
    'customerSubmenuText',
    'customerSubMenuTextColor'
  ) ?? '');

  const hasDarkText = relativeLuminance(baseTextColor) < 0.35;
  const isLightNavbar = relativeLuminance(baseNavbarColor) > 0.38;
  const shouldDarkenCustomerSection = hasDarkText || isLightNavbar;

  let customerMenuTone = shouldDarkenCustomerSection
    ? mixRgb(baseNavbarColor, { r: 0, g: 0, b: 0 }, 0.09)
    : mixRgb(baseNavbarColor, { r: 255, g: 255, b: 255 }, 0.06);

  if (submenuMode === 'dark') {
    customerMenuTone = mixRgb(baseNavbarColor, { r: 0, g: 0, b: 0 }, 0.09);
  } else if (submenuMode === 'light') {
    customerMenuTone = mixRgb(baseNavbarColor, { r: 255, g: 255, b: 255 }, 0.06);
  } else if (submenuMode === 'custom' && customSubmenuColor) {
    customerMenuTone = customSubmenuColor;
  }

  const customerMenuTextTone = (submenuMode === 'custom' && customSubmenuTextColor)
    ? customSubmenuTextColor
    : baseTextColor;
  const isLightCustomerMenuTone = relativeLuminance(customerMenuTone) > 0.52;
  const customerMenuHighlightTone = isLightCustomerMenuTone
    ? { r: 0, g: 0, b: 0 }
    : { r: 255, g: 255, b: 255 };
  const customerMenuActiveAlpha = isLightCustomerMenuTone ? 0.24 : 0.16;
  const customerMenuStrongActiveAlpha = isLightCustomerMenuTone ? 0.30 : 0.22;

  const inlineStyle = {
    "--tblr-navbar-bg": (theme?.headerColor ?? '#1d273b'),
    '--tblr-navbar-border-color': (theme?.headerColor ?? '#243049'),
    '--tblr-icon-color': (theme?.headerTextColor ?? 'rgba(255,255,255,.7)'),
    '--tblr-nav-link-font-size': "1rem",
    "--tblr-nav-link-font-weight": "400",
    "--tblr-body-color": (theme?.headerTextColor ?? 'rgba(255, 255, 255, 0.8)'),
    "--ph-customer-menu-bg": rgbToCss(customerMenuTone, 1),
    "--ph-customer-menu-text": rgbToCss(customerMenuTextTone, 1),
    "--ph-customer-menu-separator": rgbToCss(customerMenuTextTone, 0.2),
    "--ph-customer-menu-active": rgbToCss(customerMenuHighlightTone, customerMenuActiveAlpha),
    "--ph-customer-menu-focus": rgbToCss(customerMenuHighlightTone, 0.62),
    "--ph-customer-menu-active-strong": rgbToCss(customerMenuHighlightTone, customerMenuStrongActiveAlpha)
  };

  if (theme?.favicon?.url) {
    const favicon = document.querySelector('link[rel="icon"]');

    if (favicon) {
      favicon.href = theme?.favicon?.url;
    } else {
      const newFavicon = document.createElement('link');
      newFavicon.rel = 'icon';
      newFavicon.href = theme?.favicon?.url;
      document.head.appendChild(newFavicon);
    }
  }

  document.title = theme?.title ? `${theme.title}` : 'Pillars';

  const handleNavItemClick = () => {
    const navbarCollapse = document.querySelector('.navbar-collapse');
    if (navbarCollapse.classList.contains('show')) {
      // Use Bootstrap's collapse methods to handle the animation
      const collapseInstance = new window.bootstrap.Collapse(navbarCollapse, {
        toggle: false,
      });
      collapseInstance.hide();
    }
  };

  const handleChange = (name, value) => {
    setSearchText(value);

    if (value?.type === 'customer') location = `/customers/${value.id}/summary`;
    if (value?.type === 'order') location = `/customers/${value.customerId}/orders/${value.id}`;
  }

  const showTopMenu = parseBooleanSetting(
    getThemeSettingValue(theme, THEME_SETTING_SHOW_TOP_MENU, 'showTopMenu'),
    true
  );

  const searchPlaceholder = GetScope() == undefined ? "Search Team or Orders" : "Search Team";
  const navCustomerId = GetScope() == undefined ? customerId : GetScope();

  return (<>
    <aside className="navbar navbar-vertical navbar-expand-lg" style={inlineStyle}>
      <div className="container-fluid">
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#sidebar-menu" aria-controls="sidebar-menu" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <h1 className="navbar-brand navbar-brand-autodark">
          <a href='/'>
            <img src={theme?.logo?.url ?? "/images/logo.png"} alt="Pillars" className="navbar-brand-image" />
          </a>
        </h1>
        <div className="navbar-nav flex-row d-lg-none">
          <div className="nav-item dropdown">
            <AccountMenu />
          </div>
        </div>
        <div className="collapse navbar-collapse" id="sidebar-menu">
          {GetScope() == undefined && <CorporateMenu customerId={navCustomerId ?? ''} showCustomer={!showTopMenu} itemClick={handleNavItemClick} />}
          {GetScope() != undefined && <BackOfficeMenu customerId={navCustomerId ?? ''} itemClick={handleNavItemClick} />}
        </div>
      </div>
    </aside>



    <header className="navbar navbar-expand navbar-light d-print-none">
      <div className="container-xl">
        <div className="navbar-nav flex-row order-md-last d-none d-lg-flex">
          <div className="nav-item dropdown ">
            <AccountMenu />
          </div>
        </div>
        <div className={`${(GetScope() == undefined && customerId && showTopMenu) ? 'flex-row d-lg-flex align-items-center justify-content-center w-100' : 'flex-row justify-content-center w-100'}`} id="navbar-menu">
          {GetScope() == undefined && customerId && showTopMenu && <>
            <CustomerNav customerId={customerId} itemClick={handleNavItemClick} />
          </>}

          <div className={(GetScope() == undefined && customerId && showTopMenu) ? 'ms-auto me-auto ms-lg-0 me-lg-0 pe-lg-3' : 'ms-auto me-auto'} style={{ maxWidth: '600px' }}>
            <AutoCompleteOrdersCustomers name="search" placeholder={searchPlaceholder} value={searchText} showIcon={true} onChange={handleChange} />
          </div>
        </div>
      </div>
    </header>

    <Outlet />
  </>
  )
};

export default CustomerLayout;
