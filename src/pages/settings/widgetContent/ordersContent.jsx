import React, { useId } from "react";
import PropTypes from 'prop-types';
import Switch from "../../../components/switch.jsx";
import { useFetch } from '../../../hooks/useFetch.js';
import { ORDER_DETAIL_PAGE_ID } from '../../../features/widgets/orderPage.mjs';


const OrdersContent = ({ widget, updateWidget }) => {
  const selectId = useId();
  const { data: pages, loading, error, refetch } = useFetch('/api/v1/Dashboards');
  const orderPages = (Array.isArray(pages) ? pages : [])
    .filter(page => page.type === 'Order' && page.id !== ORDER_DETAIL_PAGE_ID)
    .sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id)));
  const selectedPageId = widget.settings?.orderDetailPageId || ORDER_DETAIL_PAGE_ID;
  const missingSelection = selectedPageId !== ORDER_DETAIL_PAGE_ID && !orderPages.some(page => page.id === selectedPageId);

  const handleWidgetSettingsChange = (name, value) => {
    updateWidget((v) => ({
      ...v,
      settings: {
        ...v.settings,
        [name]: value,
      },
    }));
  };

  return <>
    <div className="mb-2 border-bottom">
      <Switch name="useExternalIds" value={widget?.settings?.['useExternalIds']} title="Show External Id" onChange={handleWidgetSettingsChange} />
    </div>
    <div className="mb-3">
      <label className="form-label" htmlFor={selectId}>Order detail page</label>
      <select id={selectId} name="orderDetailPageId" className="form-select" value={selectedPageId} disabled={loading} onChange={event => handleWidgetSettingsChange('orderDetailPageId', event.target.value)}>
        <option value={ORDER_DETAIL_PAGE_ID}>Order Details (System)</option>
        {missingSelection && <option value={selectedPageId} disabled>{loading || error ? selectedPageId : `Unavailable page (${selectedPageId})`}</option>}
        {orderPages.map(page => <option key={page.id} value={page.id}>{page.name || page.id}</option>)}
      </select>
      {loading && <div className="form-hint">Loading Order pages...</div>}
      {error && <div className="text-danger small mt-1" role="alert">Unable to load Order pages. <button type="button" className="btn btn-link btn-sm p-0" onClick={() => refetch()}>Retry</button></div>}
      <div className="form-hint">Orders open this page with the selected customer and order number.</div>
    </div>
  </>
}

export default OrdersContent;

OrdersContent.propTypes = {
  widget: PropTypes.any.isRequired,
  updateWidget: PropTypes.func.isRequired
}
