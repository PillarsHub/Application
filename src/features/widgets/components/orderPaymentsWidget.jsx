import useWidgetText from '../hooks/useWidgetText.js';
import React, { useId } from 'react';
import PropTypes from 'prop-types';
import { GetScope } from '../../authentication/hooks/useToken.jsx';
import { orderPermissions, orderTotals } from '../orderPage.mjs';
import LocalDate from '../../../util/LocalDate.jsx';

export default function OrderPaymentsWidget({ context, widget, isPreview }) {
  const { widgetText } = useWidgetText();
  const accordionId = `order-payments-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const { order, customerId } = context;
  if (!isPreview && !orderPermissions(GetScope(), customerId).canViewPayments) return null;
  const currency = order.currencyCode ?? 'USD';
  const money = value => Number(value ?? 0).toLocaleString('en-US', { style: 'currency', currency });
  const showTotal = widget.settings?.showTotal !== false;
  const titleAlignment = widget.headerAlignment === 'center' ? 'mx-auto' : widget.headerAlignment === 'right' ? 'ms-auto' : '';
  const fields = [['paymentType', 'Type'], ['status', 'Status'], ['merchant', 'Merchant'], ['authorizationNumber', 'Authorization #'], ['transactionNumber', 'Transaction #'], ['reference', 'Reference'], ['response', 'Response']];
  return <>
    {(widget.title || showTotal) && <div className="card-header order-payments-header flex-wrap gap-3" style={{ backgroundColor: widget.headerColor ?? 'var(--ph-widget-header-bg, #ffffff)', color: 'var(--tblr-card-title-color)' }}>
      {widget.title && <h3 className={`card-title text-break ${titleAlignment}`}>{widget.title}</h3>}
      {showTotal && <div className="ms-auto text-end lh-sm flex-shrink-0">
        <span className="d-block small opacity-75 mb-1">{widgetText("Total Paid")}</span>
        <strong className="d-block fw-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>{money(orderTotals(order).totalPaid)}</strong>
      </div>}
    </div>}
    <div className="card-body">
      {!order.payments?.length && <p className="text-muted mb-0">{widgetText("No payments on this order.")}</p>}
      <div className="accordion order-payments-accordion" id={accordionId}>
        {(order.payments ?? []).map((payment, index) => {
          const id = `${accordionId}-${index}`;
          const expanded = widget.settings?.expandFirst === true && index === 0;
          return <div className="accordion-item" key={id}>
            <h2 className="accordion-header" id={`${id}-heading`}>
              <button className={`accordion-button ${expanded ? '' : 'collapsed'}`} type="button" data-bs-toggle="collapse" data-bs-target={`#${id}`} aria-expanded={expanded} aria-controls={id}>
                <span className="d-flex w-100 align-items-center justify-content-between gap-3 pe-2">
                  <span className="text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>{money(payment.amount)}</span>
                  <span className="text-muted fw-normal text-end"><LocalDate dateString={payment.date} /></span>
                </span>
              </button>
            </h2>
            <div id={id} className={`accordion-collapse collapse ${expanded ? 'show' : ''}`} aria-labelledby={`${id}-heading`} data-bs-parent={`#${accordionId}`}>
              <div className="accordion-body"><dl className="row mb-0">
                {fields.filter(([field]) => payment[field]).map(([field, label]) => <React.Fragment key={field}><dt className="col-5">{widgetText(label)}</dt><dd className="col-7 text-end text-break">{payment[field]}</dd></React.Fragment>)}
              </dl></div>
            </div>
          </div>;
        })}
      </div>
    </div>
  </>;
}

OrderPaymentsWidget.propTypes = { context: PropTypes.object.isRequired, widget: PropTypes.object.isRequired, isPreview: PropTypes.bool };
