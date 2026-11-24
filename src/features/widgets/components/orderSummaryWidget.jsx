import useWidgetText from '../hooks/useWidgetText.js';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { GetScope, GetSettings } from '../../authentication/hooks/useToken.jsx';
import { SendRequest } from '../../../hooks/usePost.js';
import { orderPermissions } from '../orderPage.mjs';
import LocalDate from '../../../util/LocalDate.jsx';
import Modal from '../../../components/modal.jsx';
import AutoComplete from '../../../components/autocomplete.jsx';

export default function OrderSummaryWidget({ context, widget, isPreview }) {
  const { widgetText, sourceTitle } = useWidgetText();
  const { order, customerId, refetch } = context;
  const [showMove, setShowMove] = useState(false);
  const [targetCustomer, setTargetCustomer] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { canEdit } = orderPermissions(GetScope(), customerId, GetSettings()?.ecommerce?.enableEdit);
  const settings = widget.settings ?? {};
  const volumes = {};
  (order.lineItems ?? []).forEach(item => (item.volume ?? []).forEach(v => {
    if (v.volumeId) volumes[v.volumeId] = (volumes[v.volumeId] ?? 0) + Number(v.volume ?? 0);
  }));
  const transfer = () => {
    if (!canEdit || isPreview || !targetCustomer || saving) return;
    if (targetCustomer === order.customerId) { setShowMove(false); return; }
    setSaving(true);
    setError('');
    SendRequest('PATCH', `/api/v1/Orders/${encodeURIComponent(order.id)}`, [{ op: 'replace', path: '/customerId', value: targetCustomer }], () => {
      setSaving(false);
      setShowMove(false);
      if (targetCustomer !== customerId) {
        window.location.assign(`/customers/${encodeURIComponent(targetCustomer)}/orders/${encodeURIComponent(order.id)}`);
      } else {
        refetch?.();
      }
    }, message => { setSaving(false); setError(String(message)); });
  };
  // Previously created widgets saved this default title. Treat it like a blank
  // title so existing layouts also regain the original order-number header.
  const translatedTitle = typeof sourceTitle === 'string' && sourceTitle !== widget.title;
  const customTitle = widget.title && (widget.title !== 'Order Summary' || translatedTitle) ? widget.title : null;
  const titleAlignment = widget.headerAlignment === 'center' ? 'mx-auto' : widget.headerAlignment === 'right' ? 'ms-auto' : '';
  const row = (label, value) => <React.Fragment key={label}><dd className="col-5">{label}</dd><dd className="col-7 text-end text-break">{value}</dd></React.Fragment>;
  return <>
    <div className="card-header order-summary-header" style={{ backgroundColor: widget.headerColor ?? 'var(--ph-widget-header-bg, #ffffff)' }}>
      <h3 className={`card-title text-break ${titleAlignment}`}>{customTitle ?? <>{widgetText("Order {orderId}", { orderId: order.id })}{settings.showExternalIds !== false && order.externalIds && <> ({order.externalIds})</>}</>}</h3>
      {canEdit && !isPreview && settings.showActions !== false && <div className="card-actions btn-actions">
        <div className="dropdown">
          <button type="button" className="btn-action" data-bs-toggle="dropdown" aria-expanded="false" aria-label={widgetText("Order actions")}>
            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /><circle cx="12" cy="5" r="1" /></svg>
          </button>
          <div className="dropdown-menu dropdown-menu-end">
            <a className="dropdown-item" href={`/customers/${encodeURIComponent(customerId)}/orders/${encodeURIComponent(order.id)}/edit`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="icon dropdown-item-icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" /><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" /><path d="M16 5l3 3" /></svg>{widgetText("Edit Order")}</a>
            <button className="dropdown-item" onClick={() => { setTargetCustomer(order.customerId); setError(''); setShowMove(true); }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="icon dropdown-item-icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><path d="M9 15h6" /><path d="M12.5 17.5l2.5 -2.5l-2.5 -2.5" /></svg>{widgetText("Transfer Order")}</button>
          </div>
        </div>
      </div>}
    </div>
    <div className="card-body">
      <dl className="row mb-0">
        {row(widgetText('Order Date'), <LocalDate dateString={order.orderDate} />)}
        {row(widgetText('Invoice Date'), <LocalDate dateString={order.invoiceDate} />)}
        {row(widgetText('Order Type'), order.orderType)}
        {settings.showVolumes !== false && Object.entries(volumes).filter(([, value]) => value !== 0).map(([id, value]) => row(id, Math.round(value * 1000) / 1000))}
        {row(widgetText('Status'), order.statusDetail?.name ?? order.status)}
        {settings.showTracking !== false && row(widgetText('Tracking'), order.trackingUrl ? <a href={order.trackingUrl} target="_blank" rel="noreferrer">{order.tracking}</a> : order.tracking)}
        {settings.showNotes !== false && row(widgetText('Notes'), order.notes)}
      </dl>
    </div>
    {showMove && <Modal showModal={showMove} onHide={() => { if (!saving) setShowMove(false); }}>
      <div className="modal-header"><h5 className="modal-title">{widgetText("Transfer Order")}</h5></div>
      <div className="modal-body">
        <label className="form-label">{widgetText("Place Under")}</label>
        <AutoComplete name="customerId" value={targetCustomer} onChange={(_, value) => setTargetCustomer(value)} />
        {error && <div className="text-danger mt-2" role="alert">{error}</div>}
      </div>
      <div className="modal-footer">
        <button className="btn btn-link" disabled={saving} onClick={() => setShowMove(false)}>{widgetText("Cancel")}</button>
        <button className="btn btn-primary" disabled={saving || !targetCustomer} onClick={transfer}>{saving ? widgetText('Transferring...') : widgetText('Transfer')}</button>
      </div>
    </Modal>}
  </>;
}

OrderSummaryWidget.propTypes = { context: PropTypes.object.isRequired, widget: PropTypes.object.isRequired, isPreview: PropTypes.bool };
