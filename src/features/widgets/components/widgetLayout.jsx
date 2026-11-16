import React from 'react';
import PropTypes from 'prop-types';
import Widget from './widget.jsx';
import { orderPermissions, orderWidgetTypes, PAGE_HEADER_WIDGET_TYPE, supportsPageHeader } from '../orderPage.mjs';
import { GetScope } from '../../authentication/hooks/useToken.jsx';

export default function WidgetLayout({ children: cards, widgets = [], customer, compensationPlans, trees, date, setDate, periodId, orderContext, isPreview = false, page }) {
  const permissions = orderPermissions(GetScope(), orderContext?.customerId);
  const buildCard = (card) => {
    const widget = widgets.find(w => w.id === card.widgetId);
    if (widget?.state === 1) return null;
    if (!isPreview && widget?.type === PAGE_HEADER_WIDGET_TYPE && !supportsPageHeader(page)) return null;
    if (!isPreview && widget?.type === orderWidgetTypes.OrderCommissions && !permissions.canViewCommissions) return null;
    if (!isPreview && widget?.type === orderWidgetTypes.OrderPayments &&
      (!permissions.canViewPayments || !orderContext?.order?.payments?.length)) return null;
    const children = (card.children ?? []).map(buildCard).filter(Boolean);
    if (!widget && !children.length) return null;
    return <div key={card.id} className={`col-sm-12 col-lg-${card.columns > 6 ? '12' : '6'} col-xl-${card.columns}`}>
      {widget && <Widget widget={widget} customer={customer} compensationPlans={compensationPlans} trees={trees} date={date} setDate={setDate} periodId={periodId} orderContext={orderContext} isPreview={isPreview} page={page} />}
      {children.length > 0 && <div className="card card-borderless card-transparent"><div className="row row-cards row-deck">{children}</div></div>}
    </div>;
  };
  return <div className="row row-deck row-cards">{(cards ?? []).map(buildCard)}</div>;
}

WidgetLayout.propTypes = {
  children: PropTypes.array, widgets: PropTypes.array, customer: PropTypes.object,
  compensationPlans: PropTypes.array, trees: PropTypes.array, date: PropTypes.string,
  setDate: PropTypes.func, periodId: PropTypes.number, orderContext: PropTypes.object, isPreview: PropTypes.bool,
  page: PropTypes.object
};
