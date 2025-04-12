import React, { useEffect, useState } from "react";
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid'; // Using uuid library for fallback
import { useQuery, gql } from "@apollo/client";
import { WidgetTypes } from "../hooks/useWidgets";
import { ToLocalDate } from "../../../util/LocalDate";

import Avatar from '../../../components/avatar';
import Calendar from '../../../components/calendar';
import RankAdvance from '../../../components/rankAdvance';
import PeriodDatePicker from "../../../components/periodDatePicker";

import "./widget.css";
import EmptyContent from "../../../components/emptyContent";
import SocialMediaLink from "../../../components/socialMediaLink";
import { SocialMediaPlatforms } from "../../../components/socialMediaIcon";
import HtmlWidget from "./htmlWidget";
import EarningsTable from "../../../components/earningsTable";
import PeriodPicker from "../../../components/periodPicker";
import RecruiterWidget from "./recruiterWidget";
import OrdersWidget from "./ordersWidget";
import ProfileWidget from "./profileWidget";

var GET_CUSTOMER = gql`query ($nodeIds: [String]!, $periodDate: Date!) {
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
}`;

const generateUUID = () => {
  try {
    return crypto.randomUUID().replace(/-/g, '_');
  } catch (e) {
    return uuidv4().replace(/-/g, '_');
  }
};

const Widget = ({ widget, customer, compensationPlans, trees, isPreview = false, date, periodId, supressQuery = false }) => {
  const [wDate, setWDate] = useState(date);
  const [loading, setLoading] = useState(false);
  const [sCustomer, setSCustomer] = useState(customer);
  const [widgetValues, setWidgetValues] = useState(date);

  const [widgetId] = useState(() => 'wd_' + generateUUID());

  if (!supressQuery) {
    const { refetch } = useQuery(GET_CUSTOMER, {
      variables: { nodeIds: [customer?.id], periodDate: date },
      skip: true, // Initially skip the query
    });

    useEffect(() => {
      if (wDate != date && !isPreview) {
        setLoading(true);
        refetch({ nodeIds: [customer.id], periodDate: wDate })
          .then((result) => {
            setLoading(false);
            setSCustomer(result.data?.customers[0]);
          })
          .catch((error) => {
            setLoading(false);
            console.error('Refetch error:', error);
          });
      }
    }, [wDate]);
  }

  useEffect(() => {
    if (widget && widget.type == WidgetTypes.Earnings) {
      var pId = periodId ?? 0;//(widget?.settings?.['periodId']?.trim() ?? 0);
      setWidgetValues({ periodId: pId })
    }
  }, [widget]);

  if (widget == undefined) return <EmptyContent title="Widget not found" text="Please check your widget library to verify it has been configured correctly." />;

  const inlineStyle = {
    "--tblr-bg-surface": (widget?.backgroundColor ?? '#ffffff'),
    "--tblr-card-color": (widget?.textColor ?? '#1d273b'),
    "--tblr-table-color": (widget?.textColor ?? '#1d273b'),
    "--tblr-card-title-color": (widget?.headerTextColor ?? '#1d273b'),
    "--tblr-card-title-gb": (widget?.headerColor ?? '#ffffff'),
    "--tblr-border-color": (widget?.borderColor ?? '#e6e7e9'),
  };

  var msStyle = widget?.headerAlignment == 'center' || widget?.headerAlignment == "right" ? "ms-auto" : '';
  var meStyle = widget?.headerAlignment == 'center' || widget?.headerAlignment == "left" ? "me-auto" : '';

  const modifiedCss = widget?.css?.replace(/([^,{}]+)(?=\s*{)/g, (match) => `.${widgetId} ${match}`) ?? '';

  useEffect(() => {
    setSCustomer(customer);
  }, [customer]);

  const handleDateChange = (name, value) => {
    setWDate(value);
  }

  const handlePeriodChange = (pId, u) => {
    if (u) {
      setWidgetValues(v => ({ ...v, periodId: Number(pId) }));
    }
  };

  const styleTag = {
    __html: modifiedCss,
  };

  return <div style={{ display: "contents" }} className={widgetId}><div className={`card h-100 ${isPreview ? '' : ''}`} style={inlineStyle}>
    {widget.title && <div className="card-header" style={{ backgroundColor: (widget?.headerColor ?? '#ffffff') }}>
      <h3 className={`card-title ${msStyle} ${meStyle}`}>{widget.title}</h3>
      {widget.showDatePicker && widget.type != WidgetTypes.Earnings && <>
        <div className="card-actions">
          <PeriodDatePicker name="date" value={wDate} onChange={handleDateChange} />
        </div>
      </>}
      {widget.showDatePicker && widget.type == WidgetTypes.Earnings && <>
        <div className="card-actions">
          <PeriodPicker periodId={widgetValues?.periodId ?? 0} setPeriodId={handlePeriodChange} />
        </div>
      </>}

    </div>}
    <style dangerouslySetInnerHTML={styleTag} />
    {Content(widget, sCustomer, compensationPlans, trees, isPreview, widgetValues, loading)}
  </div></div>
}

function Content(widget, customer, compensationPlans, trees, isPreview, widgetValues, loading) {
  const [carouselId] = useState(() => 'carousel_' + + generateUUID());

  if (!compensationPlans) {
    compensationPlans = [{ period: { rankAdvance: [{ rankId: 10, rankName: 'Example Rank', requirements: [{ conditions: [{ valueId: "Personal Volume", value: 20, required: 20 }, { valueId: "Group Volume", value: 90, required: 200 }] }] }] } }]
  }

  if (!customer) {
    customer = {
      id: "EX456", fullName: 'Example Customer', profileImage: '', customerType: { name: 'Customer' }, status: { name: 'Active', statusClass: "Active" },
      emailAddress: 'example@pillarshub.com', language: "en",
      phoneNumbers: [{ type: 'Mobile', number: '(555) 555-5555' }, { type: 'Work', number: '(333) 333-3333' }],
      addresses: [{ type: "Shipping", line1: '', line2: '', line3: '', city: '', stateCode: '', zip: '', countryCode: '' }],
      cards: [{ values: [{ valueName: 'Example', valueId: 'Ex', value: '22' }] }]
    }
  }

  if (isPreview) {
    trees = trees?.map((tree) => ({
      ...tree,
      nodes: [{ upline: { fullName: 'Example Customer' } }]
    }))

    customer = { ...customer, socialMedia: SocialMediaPlatforms.map((p) => ({ name: p.name, value: 'preview' })) };
  }


  if (widget?.type == WidgetTypes.Profile) {
    return <>
      <ProfileWidget customer={customer} widget={widget} />
    </>
  }

  if (widget.type == WidgetTypes.Card) {
    var values = [
      ...(customer.cards[0]?.values || []),
      { valueName: "Customer Type", valueId: "CustType", value: customer.customerType.name },
      { valueName: "Status", valueId: "Status", value: customer.status.name },
      { valueName: "Email", valueId: "Email", value: customer.emailAddress },
      { valueName: "Handle", valueId: "Handle", value: customer.webAlias ?? customer.id },
      { valueName: "Enroll Date", valueId: "EnrollDate", value: ToLocalDate(customer.enrollDate, true) },
      { valueName: "Phone", valueId: "Phone", value: customer.phoneNumbers && customer.phoneNumbers.length > 0 ? customer.phoneNumbers[0].number : '' }
    ];

    var compact = (widget?.settings?.['compact'] ?? false);
    var showCustomer = (widget?.settings?.['customer'] ?? false);

    const cardContent = (pane, value, compact) => {
      if (compact) {
        return <>
          <dd className="col-3">{pane.text}</dd>
          <dd className="col-9 text-end">{value}</dd>
        </>
      } else {
        return <>
          <div className="datagrid-title tooltip2">
            {pane.text}
            {pane.description && <span className="tooltiptext">{pane.description}</span>}
          </div>
          <div className="h2 datagrid-content">
            {value}
          </div>
        </>
      }
    }

    if (widget.panes) {
      return <div className="card-body" style={{ whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
        {showCustomer && <>
          <h1 className="d-flex align-items-center">
            <span className="me-3">
              <Avatar name={customer?.fullName} url={customer?.profileImage} size="sm" />
            </span>
            <span className='cardTitle'>{customer?.fullName}</span>
          </h1>
        </>}
        <div className={compact ? '' : 'datagrid widgetDatagrid'}>
          {widget.panes.map((pane) => {
            const emptyValue = isPreview ? pane.values?.length > 0 ? pane.values[0].value : Math.floor(Math.random() * (5000 - 100 + 1)) + 100 : 0;
            const stat = values?.find((s) => s.valueId == pane.title) ?? { value: emptyValue };
            const value = loading ? '-' : pane.values?.length > 0 ? pane.values.find((m) => m.value == stat.value)?.text ?? '-' : stat.value;
            return <div key={pane.title} className={compact ? 'row' : 'datagrid-item'} style={{ color: pane.imageUrl }}>
              {(cardContent(pane, value, compact))}
            </div>
          })}
        </div>
      </div>
    } else {
      return <div className="card-body">
        <div className="datagrid widgetDatagrid">
          {values && values.map((stat) => {
            return <div key={stat.valueId} className="datagrid-item">
              {(cardContent({ text: `${stat.valueName} ${stat.valueId == stat.valueName ? `` : `(${stat.valueId})`}` }, stat.value, compact))}
            </div>
          })}
        </div>
      </div>
    }
  }

  if (widget.type == WidgetTypes.Banner) {
    return <>
      {(widget?.panes?.length ?? 0) == 0 && <>
        <EmptyContent />
      </>}

      <div id={carouselId} className="carousel slide" data-bs-ride="carousel">
        <div className="carousel-inner content-bottom">
          {widget.panes && widget.panes.map((p, index) => {
            let active = index === 0; // Set 'active' to true for the first item
            return (
              <div key={p.title} className={`carousel-item ${active ? 'active' : ''}`}>
                <div className="image-container">
                  <img className="img-fluid" alt="" src={p.imageUrl} />
                </div>
                {p.title && <> <div className="carousel-caption-background d-none d-md-block"></div>
                  <div className="carousel-caption">
                    <h1>{p.title}</h1>
                    <p>{p.text}</p>
                  </div></>}
              </div>
            );
          })}
        </div>
        {widget.panes && widget.panes.length > 1 && <>
          <a className="carousel-control-prev" href={`#${carouselId}`} role="button" data-bs-slide="prev">
            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Previous</span>
          </a>
          <a className="carousel-control-next" href={`#${carouselId}`} role="button" data-bs-slide="next">
            <span className="carousel-control-next-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Next</span>
          </a>
        </>}
      </div>
    </>
  }

  if (widget.type == WidgetTypes.Rank) {
    let rankAdvance = compensationPlans.flatMap(plan => plan.period || []).find(period => period.rankAdvance?.length > 0)?.rankAdvance || null;
    let currentRank = customer?.cards?.[0]?.values.find(v => v.valueId.toLowerCase() == 'rank')?.value ?? 0;

    var showRankId = (widget?.settings?.['showRankId'] ?? false);
    var itemPercent = (widget?.settings?.['itemPercent'] ?? false);

    var valueMap = widget?.panes?.map(p => ({ valueId: p.title, text: p.text, description: p.description }));

    return <>
      <RankAdvance currentRank={currentRank} ranks={rankAdvance} showRankId={showRankId} showItemPercent={itemPercent ? false : true} valueMap={valueMap} />
    </>
  }

  if (widget.type == WidgetTypes.Upline) {
    let panes = widget.panes ?? trees?.map((tree) => ({
      title: tree.name,
      text: tree.name,
      imageUrl: "true"
    }))

    return <div className="list-group list-group-flush">
      {panes && panes?.map((pane) => {
        if (pane.imageUrl.toLowerCase() == "true") {
          const node = trees?.find(tree => tree.name == pane.title)?.nodes?.[0];
          if (node) {
            return <div key={pane.title} className="list-group-item widgetListItem">
              <a className="row align-items-center text-reset" href={`/Customers/${node.uplineId}/Summary`}>
                <div className="col-auto">
                  <Avatar name={node.upline?.fullName} url={node.upline?.profileImage} size="sm" />
                </div>
                <div className="col text-truncate">
                  <span className='text-reset' >{node.upline?.fullName}</span>
                  <small className="d-block muted text-truncate mt-n1">{pane.text}</small>
                </div>
              </a>
            </div>
          }
        }
      })}
    </div>
  }

  if (widget.type == WidgetTypes.Calendar) {
    return <Calendar name={widget.id} />
  }

  if (widget.type == WidgetTypes.SocialLinks) {
    return <div className="card-body">
      <div className="row g-2 align-items-center justify-content-center">
        {customer.socialMedia && customer.socialMedia.some(item => item.value) && <>
          <div className="row g-2 justify-content-center">
            {customer.socialMedia.map((link) => {
              if (link.value) {
                return <div key={link.name} className="col-auto py-3">
                  <SocialMediaLink socialMediaId={link.name} link={link.value} />
                </div>
              }
            })}
          </div>
        </>}

        {!customer.socialMedia?.some(item => item.value) && <>
          <div className="empty">
            <p className="empty-title">No Social Links Configured</p>
          </div>
        </>}

      </div>
    </div>
  }

  if (widget.type == WidgetTypes.Recruiter) {
    var columTitle = widget?.settings?.['columnTitle'] ?? "";
    var maxRows = widget?.settings?.['maxRows'] ?? 10;
    var timePeriod = widget?.settings?.['timePeriod'] ?? "";
    var recruiterTypes = widget?.settings?.['recruiterTypes'] ?? [];
    var enrolledTypes = widget?.settings?.['enrolledTypes'] ?? [];
    var rCompact = (widget?.settings?.['compact'] ?? false);
    var showPercent = (widget?.settings?.['showPercent'] ?? false);
    var treeId = (widget?.settings?.['treeId'] ?? trees?.[0]?.id ?? 0);

    return <RecruiterWidget customerId={customer.id} treeId={treeId} columnTitle={columTitle} maxRows={maxRows} timePeriod={timePeriod} recruiterTypes={recruiterTypes} enrolledTypes={enrolledTypes} compact={rCompact} showPercent={showPercent} isPreview={isPreview} />
  }

  if (widget.type == WidgetTypes.Html) {
    const html = widget.panes ? widget.panes[0]?.text : '';
    return <HtmlWidget html={html} customer={customer} widget={widget} isPreview={isPreview}/>
  }

  if (widget.type == WidgetTypes.Earnings) {
    var overrides = widget.panes?.map((p) => ({ title: p.title, display: p.text, show: p.imageUrl.toLowerCase() == 'true' }));

    return <>
      <EarningsTable customerId={customer.id} periodId={widgetValues?.periodId ?? 0} overrides={overrides} />
    </>
  }

  if (widget.type == WidgetTypes.Orders) {
    var useExternalIds = (widget?.settings?.['useExternalIds'] ?? false);
    return <>
      <OrdersWidget customer={customer} widget={widget} useExternalId={useExternalIds} />
    </>
  }

  return <div id={`wdg_${widget.id}`} className={`card`}>
    <div className="card-body">
      {JSON.stringify(widget)}
    </div>
  </div>
}

export default Widget;

Widget.propTypes = {
  widget: PropTypes.any.isRequired,
  customer: PropTypes.any.isRequired,
  compensationPlans: PropTypes.any.isRequired,
  trees: PropTypes.any.isRequired,
  isPreview: PropTypes.bool,
  date: PropTypes.string.isRequired,
  supressQuery: PropTypes.bool,
  periodId: PropTypes.number
}
