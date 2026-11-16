import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';
import { useQuery, gql } from "@apollo/client";
import { useFetch } from "../../../hooks/useFetch.js";
import DataLoading from '../../../components/dataLoading.jsx';
import DataError from '../../../components/dataError.jsx';
import WidgetLayout from './widgetLayout.jsx';
import useOrderDetails from '../hooks/useOrderDetails.js';
import { ORDER_DETAIL_PAGE_ID, defaultOrderPage, defaultOrderWidgets } from '../orderPage.mjs';
import EmptyContent from '../../../components/emptyContent.jsx';

var GET_CUSTOMER = gql`query ($nodeIds: [String]!, $customerId: String, $periodDate: Date!) {
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
    customData
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
  customerStatuses {
    id
    name
    statusClass
    earningsClass
  }
  widgets (customerId: $customerId) {
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
}`;

var GET_WIDGETS = gql`query {
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
}`;

const WidgetContainer = forwardRef(({ customerId, orderId, dashboardId, periodId, onLoad, onEmpty }, ref) => {
  const orderResult = useOrderDetails(customerId, orderId);
  const [periodDate, setPeriodDate] = useState(new Date().toISOString());
  const { data: dashboard, loading: dbLoading, error: dbError } = useFetch(`/api/v1/dashboards/${dashboardId}`, {}, { isEmpty: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();
  const [data, setData] = useState();

  const { refetch } = useQuery(customerId ? GET_CUSTOMER : GET_WIDGETS, {
    variables: { nodeIds: [customerId], customerId: customerId, periodDate: periodDate },
    skip: true, // Initially skip the query
  });

  useEffect(() => {
    if (dashboard) {
      doRefresh();
    }
  }, [dashboard, periodDate, customerId])

  useImperativeHandle(ref, () => ({
    refreshData: () => {
      doRefresh();
      if (orderId) orderResult.refetch();
    }
  }));

  const handleDateChange = (value) => {
    setPeriodDate(value);
  }

  const doRefresh = () => {
    setLoading(true);
    refetch({ nodeIds: [customerId], customerId: customerId, periodDate: periodDate }, { fetchPolicy: 'no-cache' })
      .then((result) => {
        setLoading(false);
        if (onLoad) onLoad(result.data);
        if (dashboard.isEmpty && dashboardId !== ORDER_DETAIL_PAGE_ID) {
          if (onEmpty) onEmpty(result.data);
        } else {
          setData(result.data);
        }
      })
      .catch((error) => {
        alert(error);
        setLoading(false);
        setError(error);
      });
  }

  if (loading || dbLoading || (orderId && orderResult.loading)) return <DataLoading />;
  if (orderId && orderResult.error) return <DataError error={orderResult.error} />;
  if (orderId && !orderResult.context.order) return <EmptyContent title="Order not found" text="This order is not available for the selected customer." />;
  if (dbError) return <DataError error={dbError} />;
  if (error) return <DataError error={error} />;

  let customer = data?.customers?.[0] ?? { id: customerId, cards: [] };
  let trees = data?.trees;

  let compensationPlans = data?.compensationPlans;
  const useDefault = dashboard?.isEmpty && dashboardId === ORDER_DETAIL_PAGE_ID;
  const layout = useDefault ? defaultOrderPage() : dashboard;
  const widgets = useDefault ? defaultOrderWidgets : data?.widgets;

  if (!data) return <></>;
  return <>
    <WidgetLayout widgets={widgets} customer={customer} compensationPlans={compensationPlans} trees={trees} date={periodDate} setDate={handleDateChange} periodId={periodId} orderContext={orderId ? orderResult.context : undefined} page={layout}>{layout?.children}</WidgetLayout>
  </>
});


export default WidgetContainer

WidgetContainer.displayName = 'WidgetContainer';

WidgetContainer.propTypes = {
  dashboardId: PropTypes.string.isRequired,
  customerId: PropTypes.string,
  orderId: PropTypes.string,
  periodId: PropTypes.number,
  onLoad: PropTypes.func,
  onEmpty: PropTypes.func
}
