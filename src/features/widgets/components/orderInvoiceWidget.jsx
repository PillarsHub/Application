import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { GetScope } from '../../authentication/hooks/useToken.jsx';
import { orderPermissions, orderTotals } from '../orderPage.mjs';
import { getInvoiceTotalRows } from '../invoiceTotals.mjs';
import OrderDetailBonuses from '../../../pages/customers/orderDetailBonuses.jsx';

export default function OrderInvoiceWidget({ context, widget, isPreview }) {
  const [tab, setTab] = useState('details');
  const { order, customer, countries, customerId } = context;
  const settings = widget.settings ?? {};
  const canViewCommissions = orderPermissions(GetScope(), customerId).canViewCommissions && settings.showCommissions !== false;
  const address = order.shipAddress;
  const totals = orderTotals(order);
  const money = value => Number(value ?? 0).toLocaleString('en-US', { style: 'currency', currency: order.currencyCode ?? 'USD' });
  const totalRow = (label, value, className = '', key) => <tr key={key} className={className}><td colSpan="3" className="strong text-end">{label}</td><td className="text-end" style={{ fontVariantNumeric: 'tabular-nums' }}>{money(value)}</td></tr>;
  return <>
    {canViewCommissions && <div className="card-header bg-light">
      <ul className="nav nav-tabs card-header-tabs nav-fill" role="tablist">
        {['details', 'commissions'].map(name => <li className="nav-item" key={name}><button type="button" role="tab" aria-selected={tab === name} className={`nav-link ${tab === name ? 'active' : ''}`} onClick={() => setTab(name)}>{name === 'details' ? 'Details' : 'Commissions'}</button></li>)}
      </ul>
    </div>}
    {tab === 'commissions' && canViewCommissions ? (isPreview ? <div className="card-body text-muted">Commission details appear here for this order.</div> : <OrderDetailBonuses orderId={order.id} />) : <div className="card-body">
      {settings.showShippingAddress !== false && <div className="mb-3">
        <p className="h3 mb-2">{order.shipTo ?? customer?.fullName}</p>
        <address>{[address?.line1, address?.line2, address?.line3].filter(Boolean).map((line, i) => <React.Fragment key={i}>{line}<br /></React.Fragment>)}
          {[address?.city, [address?.stateCode, address?.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')}<br />
          {countries?.find(country => country.iso2?.toLowerCase() === address?.countryCode?.toLowerCase())?.name ?? address?.countryCode}
        </address>
      </div>}
      <div className="table-responsive"><table className="table table-transparent align-middle">
        <thead><tr><th>Product</th><th className="text-center">Qty</th><th className="text-end">Unit Price</th><th className="text-end">Amount</th></tr></thead>
        <tbody>
          {(order.lineItems ?? []).map((item, index) => <tr key={`${item.productId}-${index}`}>
            <td>{item.description}</td><td className="text-center">{item.quantity}</td><td className="text-end">{money(item.price)}</td><td className="text-end">{money(Number(item.price ?? 0) * Number(item.quantity ?? 0))}</td>
          </tr>)}
          {!order.lineItems?.length && <tr><td colSpan="4" className="text-muted text-center py-4">No line items on this order.</td></tr>}
        </tbody>
        <tbody className="order-invoice-totals">
          {settings.spaceBeforeTotals === true && <tr aria-hidden="true"><td colSpan="4" className="p-0 border-0" style={{ height: '1rem' }} /></tr>}
          {getInvoiceTotalRows(order, settings).map(row => totalRow(row.label, row.value, row.className, row.id))}
          {totalRow('Invoice Total', totals.invoiceTotal, 'table-light')}
          {settings.showBalance !== false && <>
            {totalRow('Total Paid', totals.totalPaid)}
            {totalRow(totals.balanceDue <= 0 ? 'Credit' : 'Balance Due', Math.abs(totals.balanceDue), totals.balanceDue <= 0 ? 'table-success' : 'table-warning')}
          </>}
        </tbody>
      </table></div>
    </div>}
  </>;
}

OrderInvoiceWidget.propTypes = { context: PropTypes.object.isRequired, widget: PropTypes.object.isRequired, isPreview: PropTypes.bool };
