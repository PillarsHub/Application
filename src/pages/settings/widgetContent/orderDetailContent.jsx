import React from 'react';
import PropTypes from 'prop-types';
import Switch from '../../../components/switch.jsx';
import { orderWidgetTypes } from '../../../features/widgets/orderPage.mjs';
import InvoiceTotalsContent from './invoiceTotalsContent.jsx';

export default function OrderDetailContent({ widget, updateWidget }) {
  const options = {
    [orderWidgetTypes.OrderSummary]: [['showExternalIds', 'Show external order IDs'], ['showVolumes', 'Show volumes'], ['showTracking', 'Show tracking'], ['showNotes', 'Show notes'], ['showActions', 'Show order actions']],
    [orderWidgetTypes.OrderPayments]: [['showTotal', 'Show total paid'], ['expandFirst', 'Expand first payment', false]],
    [orderWidgetTypes.OrderInvoice]: [['showShippingAddress', 'Show shipping address'], ['showBalance', 'Show paid amount and balance'], ['showCommissions', 'Show commissions tab for corporate users']]
  };
  return <>
    <p className="text-muted">Uses the customer and order selected on an Order page. Existing access restrictions always apply.</p>
    {widget.type === orderWidgetTypes.OrderCommissions && <p className="text-muted">Shows the selected order&apos;s commission details to corporate users only. Place this widget below a custom invoice to keep commissions available independently of the Invoice widget&apos;s tab.</p>}
    {(options[widget.type] ?? []).map(([name, title, defaultValue = true]) => <Switch key={name} name={name} title={title} value={widget.settings?.[name] ?? defaultValue} onChange={(key, value) => updateWidget(current => ({ ...current, settings: { ...current.settings, [key]: value } }))} />)}
    {widget.type === orderWidgetTypes.OrderInvoice && <InvoiceTotalsContent widget={widget} updateWidget={updateWidget} />}
  </>;
}

OrderDetailContent.propTypes = { widget: PropTypes.object.isRequired, updateWidget: PropTypes.func.isRequired };
