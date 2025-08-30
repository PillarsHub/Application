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

import EmptyContent from "../../../components/emptyContent";
import SocialMediaLink from "../../../components/socialMediaLink";
import { SocialMediaPlatforms } from "../../../components/socialMediaIcon";
import HtmlWidget from "./htmlWidget";
import EarningsTable from "../../../components/earningsTable";
import PeriodPicker from "../../../components/periodPicker";
import RecruiterWidget from "./recruiterWidget";
import OrdersWidget from "./ordersWidget";
import ProfileWidget from "./profileWidget";
import DataLoading from "../../../components/dataLoading";
import CardWidget from "./cardWidget";
import CarouselWidget from "./carouselWidget";

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
    customData
  }
  compensationPlans {
    period(date: $periodDate) {
      begin
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
}`;

const generateUUID = () => {
  try {
    return crypto.randomUUID().replace(/-/g, '_');
  } catch (e) {
    return uuidv4().replace(/-/g, '_');
  }
};

const Widget = ({ widget, customer, compensationPlans, trees, isPreview = false, date, setDate, periodId, supressQuery = false }) => {
  const [wDate, setWDate] = useState(date);
  const [loading, setLoading] = useState(false);
  const [sCustomer, setSCustomer] = useState(customer);
  const [sCompPlan, setSCompPlan] = useState(compensationPlans);
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
            setSCompPlan(result.data?.compensationPlans);
          })
          .catch((error) => {
            setLoading(false);
            console.error('Refetch error:', error);
          });
      }
    }, [wDate]);
  }

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
    if (widget) {
      if (widget.showDatePicker && !supressQuery && widget.type == WidgetTypes.Earnings) {
        setWidgetValues(v => ({
          ...v,
          tabbedUI: widget?.settings?.['tabbedUI'] ?? false,
          hideOpen: widget?.settings?.['hideOpen'] ?? false,
          hideEnd: widget?.settings?.['hideEnd'] ?? false,
          localTime: widget?.settings?.['localTime'] ?? true,
          hideTime: widget?.settings?.['hideTime'] ?? false,
          defaultPlan: Number(widget?.settings?.['defaultPlan'] ?? null),
          defaultIndex: Number(widget?.settings?.['defaultIndex'] ?? 0),
          planIds: widget?.settings?.['planIds'] ? widget.settings['planIds'].split(',').map(Number) : null
        }));
      }
    }
  }, [widget])

  useEffect(() => {
    setSCompPlan(compensationPlans);
  }, [compensationPlans]);

  useEffect(() => {
    setSCustomer(customer);
  }, [customer]);

  const handleDateChange = (name, value) => {
    var pageDatePicker = (widget?.settings?.['pageDatePicker'] ?? false);
    if (pageDatePicker) {
      setDate(value);
    } else {
      setWDate(value);
    }
  }

  useEffect(() => {
    if (periodId) {
      setWidgetValues(v => ({ ...v, periodId: Number(periodId) }));
    }
  }, [periodId]);

  const handlePeriodChange = (pId) => {
    setWidgetValues(v => ({ ...v, periodId: Number(pId) }));
  };

  const styleTag = {
    __html: modifiedCss,
  };


  return <div style={{ display: "contents" }} className={widgetId}><div className={`card h-100 ${isPreview ? '' : ''}`} style={inlineStyle}>
    {(widget.title || widget.showDatePicker) && <div className="card-header" style={{ backgroundColor: (widget?.headerColor ?? '#ffffff') }}>
      <h3 className={`card-title ${msStyle} ${meStyle}`}>{widget.title}</h3>
      {widget.showDatePicker && !supressQuery && widget.type != WidgetTypes.Earnings && <>
        <div className="card-actions">
          <PeriodDatePicker name="date" value={wDate} onChange={handleDateChange} />
        </div>
      </>}
      {widget.showDatePicker && !supressQuery && widget.type == WidgetTypes.Earnings && <>
        <div className="card-actions">
          <PeriodPicker periodId={widgetValues?.periodId} setPeriodId={handlePeriodChange} options={widgetValues} />
        </div>
      </>}

    </div>}
    <style dangerouslySetInnerHTML={styleTag} />
    {Content(widget, sCustomer, sCompPlan, trees, isPreview, widgetValues, loading)}
  </div></div>
}

function Content(widget, customer, compensationPlans, trees, isPreview, widgetValues, loading) {
  if (!compensationPlans) {
    const periodBegin = new Date().toISOString().split('.')[0] + 'Z';
    compensationPlans = [{
      period: {
        begin: periodBegin, rankAdvance: [{
          nodeId: 'EX456', rankId: 10, rankName: 'Example Rank', requirements: [{
            conditions: [
              { valueId: "Personal Volume", value: 17, required: 20 },
              { valueId: "Group Volume", value: 90, required: 200 },
              { valueId: "Team Volume", value: 1250, required: 1250 }
            ]
          }]
        }]
      }
    }]
  }

  if (!customer) {
    customer = {
      id: "EX456", fullName: 'Example Customer', profileImage: '', customerType: { name: 'Customer' }, status: { name: 'Active', statusClass: "Active" },
      emailAddress: 'example@pillarshub.com', language: "en",
      phoneNumbers: [{ type: 'Mobile', number: '(555) 555-5555' }, { type: 'Work', number: '(333) 333-3333' }],
      addresses: [{ type: "Shipping", line1: '', line2: '', line3: '', city: '', stateCode: '', zip: '', countryCode: '' }],
      cards: [{ values: [{ valueName: 'Example', valueId: 'Ex', value: '22' }, { valueName: 'Rank', valueId: 'Rank', value: '10' }, { valueName: 'High Rank', valueId: 'HighRank', value: '10' }] }]
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
      { valueName: "Customer Name", valueId: "FullName", value: customer.fullName },
      { valueName: "Customer Type", valueId: "CustType", value: customer.customerType.name },
      { valueName: "Status", valueId: "Status", value: customer.status.name },
      { valueName: "Email", valueId: "Email", value: customer.emailAddress },
      { valueName: "Handle", valueId: "Handle", value: customer.webAlias ?? customer.id },
      { valueName: "Enroll Date", valueId: "EnrollDate", value: ToLocalDate(customer.enrollDate, true) },
      { valueName: "Phone", valueId: "Phone", value: customer.phoneNumbers && customer.phoneNumbers.length > 0 ? customer.phoneNumbers[0].number : '' }
    ];

    var compact = (widget?.settings?.['compact'] ?? false);
    var showCustomer = (widget?.settings?.['customer'] ?? false);

    return <CardWidget customer={customer} panes={widget.panes} values={values} compact={compact} showCustomer={showCustomer} isPreview={isPreview} loading={loading} />
  }

  if (widget.type == WidgetTypes.Banner) {
    return <CarouselWidget widget={widget} />
  }

  if (widget.type == WidgetTypes.Rank) {
    if (loading) return <><DataLoading /></>
    let period = compensationPlans?.flatMap(plan => plan.period || []).find(period => period.rankAdvance?.length > 0) || null;
    let currentRank = isPreview ? 10 : customer?.cards?.[0]?.values.find(v => v.valueId.toLowerCase() == 'rank')?.value ?? 0;

    var valueMap = widget?.panes?.map(p => ({ valueId: p.title, text: p.text, description: p.description, values: p.values }));

    var options = {
      chart: widget?.settings?.['chartType'] ?? 1,
      title: widget?.settings?.['titleType'] ?? 1,
      reqs: widget?.settings?.['requirementType'] ?? 1,
      tabs: widget?.settings?.['tabType'] ?? 0,
      showRankId: widget?.settings?.['showRankId'] ?? false,
      showItemPercent: (widget?.settings?.['itemPercent'] ?? false) ? false : true,
      showRankProgress: widget?.settings?.['showRankProgress'] ?? false
    };

    return <RankAdvance currentRank={currentRank} ranks={period?.rankAdvance || null} options={options} valueMap={valueMap} period={{ begin: period?.begin }} isPreview={isPreview} />
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
    return <HtmlWidget html={html} customer={customer} widget={widget} isPreview={isPreview} />
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
      <EmptyContent text={JSON.stringify(widget)} />
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
  setDate: PropTypes.func.isRequired,
  supressQuery: PropTypes.bool,
  periodId: PropTypes.number
}
