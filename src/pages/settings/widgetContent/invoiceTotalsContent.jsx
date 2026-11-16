import React, { useId } from 'react';
import PropTypes from 'prop-types';
import Switch from '../../../components/switch.jsx';
import { getInvoiceTotalSettings, invoiceTotalDefinitions } from '../../../features/widgets/invoiceTotals.mjs';

export default function InvoiceTotalsContent({ widget, updateWidget }) {
  const inputId = useId();
  const rows = getInvoiceTotalSettings(widget.settings);
  const updateRows = update => updateWidget(current => ({
    ...current,
    settings: { ...current.settings, invoiceTotals: update(getInvoiceTotalSettings(current.settings)) }
  }));
  const updateRow = (id, changes) => updateRows(current => current.map(row => row.id === id ? { ...row, ...changes } : row));
  const moveRow = (id, direction) => updateRows(current => {
    const index = current.findIndex(row => row.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= current.length) return current;
    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });

  return <div className="mt-4">
    <h4>Invoice totals</h4>
    <Switch name="spaceBeforeTotals" title="Add spacing before totals" value={widget.settings?.spaceBeforeTotals === true} onChange={(_, value) => updateWidget(current => ({ ...current, settings: { ...current.settings, spaceBeforeTotals: value } }))} />
    <p className="text-muted">Choose which rows to display, edit their labels, and move them up or down. Invoice Total always follows these rows.</p>
    <p className="form-hint">Items Total adds each line item&apos;s price × quantity. Discount appears only when nonzero. Blank labels use the original name.</p>
    <ol className="list-group list-unstyled mb-3">
      {rows.map((row, index) => {
        const name = invoiceTotalDefinitions.find(item => item.id === row.id).label;
        const labelId = `${inputId}-${row.id}`;
        return <li className="list-group-item" key={row.id}>
          <div className="row g-2 align-items-center">
            <div className="col-auto">
              <input type="checkbox" className="form-check-input m-0" aria-label={`Show ${name}`} checked={row.visible} onChange={event => updateRow(row.id, { visible: event.target.checked })} />
            </div>
            <div className="col" style={{ minWidth: 0 }}>
              <label className="form-label mb-1" htmlFor={labelId}>{name}</label>
              <input id={labelId} name={`invoiceTotalLabel-${row.id}`} className="form-control" aria-label={`${name} label`} value={row.label} placeholder={name} onChange={event => updateRow(row.id, { label: event.target.value })} />
            </div>
            <div className="col-auto d-flex gap-1">
              <button type="button" className="btn btn-sm btn-icon btn-ghost-secondary" aria-label={`Move ${name} up`} title="Move up" disabled={index === 0} onClick={() => moveRow(row.id, -1)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19v-14m-5 5l5 -5l5 5" /></svg>
              </button>
              <button type="button" className="btn btn-sm btn-icon btn-ghost-secondary" aria-label={`Move ${name} down`} title="Move down" disabled={index === rows.length - 1} onClick={() => moveRow(row.id, 1)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14m-5 -5l5 5l5 -5" /></svg>
              </button>
            </div>
          </div>
        </li>;
      })}
    </ol>
    <div className="border rounded p-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
      <strong>Invoice Total</strong><span className="text-muted small">Fixed below the rows above</span>
    </div>
  </div>;
}

InvoiceTotalsContent.propTypes = { widget: PropTypes.object.isRequired, updateWidget: PropTypes.func.isRequired };
