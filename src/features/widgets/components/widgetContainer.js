import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useQuery, gql } from "@apollo/client";
import { useFetch } from "../../../hooks/useFetch";
import DataLoading from '../../../components/dataLoading';
import DataError from '../../../components/dataError';
import Widget from './widget';

var GET_CUSTOMER = gql`query ($nodeIds: [String]!, $periodDate: Date!) {
  customers(idList: $nodeIds) {
    id
    fullName
    enrollDate
    profileImage
    webAlias
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
    widgets {
      id
      name
      title
      description
      type
      state
      showDatePicker
      headerColor
      headerTextColor
      headerAlignment
      backgroundColor
      textColor
      borderColor
      settings
      css
      panes {
        imageUrl
        title
        text
        description
        values {
          text
          value
        }
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

const WidgetContainer = ({ customerId, dashboardId, periodId, onLoad, onEmpty }) => {
  const [periodDate] = useState(new Date().toISOString());
  const { data: dashboard, loading: dbLoading, error: dbError } = useFetch(`/api/v1/dashboards/${dashboardId}`, {}, { isEmpty: true });

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState();

  const { refetch } = useQuery(GET_CUSTOMER, {
    variables: { nodeIds: [customerId], periodDate: periodDate },
    skip: true, // Initially skip the query
  });

  useEffect(() => {
    if (dashboard) {
      setLoading(true);
      refetch({ nodeIds: [customerId], periodDate: periodDate })
        .then((result) => {
          setLoading(false);
          if (onLoad) onLoad(result.data);
          if (dashboard.isEmpty) {
            if (onEmpty) onEmpty(result.data);
          } else {
            setData(result.data);
          }
        })
        .catch((error) => {
          setLoading(false);
          console.error('Refetch error:', error);
        });
    }
  }, [dashboard])

  if (loading || dbLoading) return <DataLoading />;
  if (dbError) return <DataError error={dbError} />;

  let customer = data?.customers[0] ?? { id: customerId, cards: [] };
  let trees = data?.trees;

  let compensationPlans = data?.compensationPlans;
  let widgets = customer?.widgets;

  if (!data) return <></>;

  return <>
    <div className="row row-deck row-cards">
      {dashboard && dashboard?.children && dashboard.children.map((card) => {
        return buildCard(card, widgets, customer, compensationPlans, trees, periodDate, periodId);
      })}
    </div>
  </>
}

function buildCard(card, widgets, customer, compensationPlans, trees, date, periodId) {
  if ((card?.widgetId || card?.children) && widgets !== undefined) {
    let widget = widgets.find((w) => w.id === card?.widgetId ?? '');
    if (widget?.state == 1) return <></>
    if (!widget && (!card.children || card.children.length == 0)) return <></>

    return <div key={card?.id} className={`col-sm-12 col-lg-${card?.columns > 6 ? '12' : '6'} col-xl-${card?.columns}`}>
      {card?.widgetId && widget && <Widget key={card?.widgetId} widget={widget} customer={customer} compensationPlans={compensationPlans} trees={trees} date={date} periodId={periodId} />}
      {card.children && card.children.length > 0 && <>
        <div className="card card-borderless card-transparent">
          <div className="row row-cards row-deck">
            {card.children.map((c) => {
              return buildCard(c, widgets, customer, compensationPlans, trees, date);
            })}
          </div>
        </div>
      </>}
    </div>
  }
}

export default WidgetContainer

WidgetContainer.propTypes = {
  dashboardId: PropTypes.string.isRequired,
  customerId: PropTypes.string.isRequired,
  periodId: PropTypes.number,
  onLoad: PropTypes.func,
  onEmpty: PropTypes.func
}