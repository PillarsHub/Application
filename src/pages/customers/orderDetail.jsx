import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '../../components/pageHeader.jsx';
import WidgetContainer from '../../features/widgets/components/widgetContainer.jsx';
import EmptyContent from '../../components/emptyContent.jsx';
import { ORDER_DETAIL_PAGE_ID } from '../../features/widgets/orderPage.mjs';

export default function OrderDetail() {
  const { customerId, orderId, pageId } = useParams();
  const [data, setData] = useState();
  const [missing, setMissing] = useState(false);
  const dashboardId = pageId ?? ORDER_DETAIL_PAGE_ID;
  const isCustomPage = dashboardId !== ORDER_DETAIL_PAGE_ID;
  return <PageHeader title={isCustomPage ? undefined : data?.customers?.[0]?.fullName} breadcrumbs={isCustomPage ? undefined : [
    { title: 'Order History', link: '/customers/' + encodeURIComponent(customerId) + '/orders' },
    { title: 'Order Detail' }
  ]}>
    <div className="container-xl">
      <WidgetContainer key={customerId + '/' + orderId + '/' + dashboardId} customerId={customerId} orderId={orderId} dashboardId={dashboardId} onLoad={setData} onEmpty={() => setMissing(true)} />
      {missing && <EmptyContent title="Page not found" text="This order page has not been configured." />}
    </div>
  </PageHeader>;
}
