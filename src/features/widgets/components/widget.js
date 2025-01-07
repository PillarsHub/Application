import React, { useEffect, useState } from "react";
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid'; // Using uuid library for fallback
import { useQuery, gql } from "@apollo/client";
import { WidgetTypes } from "../hooks/useWidgets";
import { ToLocalDate } from "../../../util/LocalDate";

import Avatar from '../../../components/avatar';
import StatusPill from '../../../pages/customers/statusPill';
import Calendar from '../../../components/calendar';
import RankAdvance from '../../../components/rankAdvance';
import PeriodDatePicker from "../../../components/periodDatePicker";

import "./widget.css";
import EmptyContent from "../../../components/emptyContent";
import SocialMediaLink from "../../../components/socialMediaLink";
import { SocialMediaPlatforms } from "../../../components/socialMediaIcon";
import HtmlWidget from "./htmlWidget";
import LocalDate from "../../../util/LocalDate";
import EarningsTable from "../../../components/earningsTable";
import PeriodPicker from "../../../components/periodPicker";
import RecruiterWidget from "./recruiterWidget";
import OrdersWidget from "./ordersWidget";

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
    var pCompact = (widget?.settings?.['compact'] ?? false);

    if (pCompact) {
      let address = customer.addresses ? customer.addresses[0] : { line1: '' };
      return <>
        <div className="card-header">
          <div className="row w-100 g-2 align-items-center">
            <div className="col-auto">
              <Avatar className="me-2" name={customer.fullName} url={customer.profileImage} />
            </div>
            <div className="col">
              <h4 className="card-title m-0">
                <span>{customer.fullName}</span>
              </h4>
              <div className="text-muted">
                {customer.customerType?.name ?? 'Unknown'}
              </div>
            </div>
            <div className="col-auto">
              <StatusPill status={customer.status} />
            </div>
          </div>
        </div>
        <div className="card-body">
          <dl className="row">
            <dd className="col-5">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2 text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><rect x="4" y="5" width="16" height="16" rx="2" /><line x1="16" y1="3" x2="16" y2="7" /><line x1="8" y1="3" x2="8" y2="7" /><line x1="4" y1="11" x2="20" y2="11" /><line x1="11" y1="15" x2="12" y2="15" /><line x1="12" y1="15" x2="12" y2="18" /></svg>
              Enroll date</dd>
            <dd className="col-7 text-end">
              <LocalDate dateString={customer.enrollDate} />
            </dd>
            <dd className="col-5">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2 text-muted" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7.5 7.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M3 6v5.172a2 2 0 0 0 .586 1.414l7.71 7.71a2.41 2.41 0 0 0 3.408 0l5.592 -5.592a2.41 2.41 0 0 0 0 -3.408l-7.71 -7.71a2 2 0 0 0 -1.414 -.586h-5.172a3 3 0 0 0 -3 3z" /></svg>
              Handle
            </dd>
            <dd className="col-7 text-end">{customer.webAlias ?? customer.id}</dd>
            {true && <>
              <dd className="col-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2 text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M3 5m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z"></path><path d="M3 7l9 6l9 -6"></path></svg>
                Email</dd>
              <dd className="col-7 text-end">{customer.emailAddress}</dd>


              <dd className="col-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2 text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2"></path><path d="M15 7a2 2 0 0 1 2 2"></path><path d="M15 3a6 6 0 0 1 6 6"></path></svg>
                Phone</dd>
              <dd className="col-7 text-end">{customer.phoneNumbers && customer.phoneNumbers.length > 0 && customer.phoneNumbers[0].number}</dd>

              <dd className="col-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2 text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M12 20l-3 -3h-2a3 3 0 0 1 -3 -3v-6a3 3 0 0 1 3 -3h10a3 3 0 0 1 3 3v6a3 3 0 0 1 -3 3h-2l-3 3"></path><path d="M8 9l8 0"></path><path d="M8 13l6 0"></path></svg>
                Language</dd>
              <dd className="col-7 text-end">{customer.language}</dd>

              <dd className="col-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2 text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M8 7v-2a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v2"></path><line x1="12" y1="12" x2="12" y2="12.01"></line><path d="M3 13a20 20 0 0 0 18 0"></path></svg>
                Merchant</dd>
              <dd className="col-7 text-end">{customer.merchantId}</dd>

              <dd className="col-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2 text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M17 8v-3a1 1 0 0 0 -1 -1h-10a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3m0 4v3a1 1 0 0 1 -1 1h-12a2 2 0 0 1 -2 -2v-12"></path><path d="M20 12v4h-4a2 2 0 0 1 0 -4h4"></path></svg>
                Payment Status</dd>
              <dd className="col-7 text-end">{status.earningsClass}</dd>

              <dd className="col-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2 text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><circle cx="12" cy="11" r="3"></circle><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z"></path></svg>
                Shipping Address</dd>
              <dd className="col-7 text-end">
                <address>
                  {address?.line1} {address?.line2} {address?.line3}<br />
                  {address?.city}, {address?.stateCode} {address?.postalCode} <br />
                  {address?.countryCode}
                </address>
              </dd>
            </>}
          </dl>
        </div>
      </>
    } else {
      return <div className="card-body py-4 text-center">
        <Avatar name={customer.fullName} url={customer.profileImage} size="xl" block={false} />
        <h3 className="m-0 mb-1"><a href={`/Customers/${customer.id}/Summary`}>{customer.fullName}</a></h3>
        <div className="widget-muted">{customer.customerType?.name}</div>
        <div className="mt-3">
          <StatusPill status={customer.status} />
        </div>
        {customer.socialMedia && <>
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
      </div>
    }
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
    return <HtmlWidget html={html} customer={customer} widget={widget} />
  }

  if (widget.type == WidgetTypes.Earnings) {
    var overrides = widget.panes?.map((p) => ({ title: p.title, display: p.text, show: p.imageUrl.toLowerCase() == 'true' }));

    return <>
      <EarningsTable customerId={customer.id} periodId={widgetValues?.periodId ?? 0} overrides={overrides} />
    </>
  }

  if (widget.type == WidgetTypes.Orders) {
    //var overrides = widget.panes?.map((p) => ({ title: p.title, display: p.text, show: p.imageUrl.toLowerCase() == 'true' }));
    return <>
      <OrdersWidget customer={customer} widget={widget} />
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
