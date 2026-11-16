import React, { useId } from 'react';
import PropTypes from 'prop-types';
import Switch from '../../../components/switch.jsx';
import { pageHeaderBreadcrumbSettings } from '../../../features/widgets/pageHeader.mjs';
import { isOrderPage } from '../../../features/widgets/orderPage.mjs';

export default function PageHeaderContent({ widget, updateWidget, page }) {
  const inputId = useId();
  const rows = pageHeaderBreadcrumbSettings(widget.settings, isOrderPage(page));
  const updateSettings = (name, value) => updateWidget(current => ({ ...current, settings: { ...current.settings, [name]: value } }));
  const updateRows = update => updateWidget(current => ({ ...current, settings: { ...current.settings, breadcrumbs: update(pageHeaderBreadcrumbSettings(current.settings, isOrderPage(page))) } }));
  const changeRow = (index, name, value) => updateRows(current => current.map((row, i) => i === index ? { ...row, [name]: value } : row));
  const moveRow = (index, direction) => updateRows(current => {
    const target = index + direction;
    if (target < 0 || target >= current.length) return current;
    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });
  return <>
    <Switch name="showCustomerName" title="Show customer name" value={widget.settings?.showCustomerName !== false} onChange={updateSettings} />
    <Switch name="showBreadcrumbs" title="Show breadcrumbs" value={widget.settings?.showBreadcrumbs !== false} onChange={updateSettings} />
    <div className="mt-3">
      <h4>Breadcrumbs</h4>
      <p className="form-hint">Edit labels and optional links, or leave a link blank for the current page. Use {'{customerId}'} and {'{orderId}'} in links. Labels also support {'{pageName}'} for the current page&apos;s name. Order IDs are available on Order pages.</p>
      <ol className="list-group list-unstyled mb-3">
        {rows.map((row, index) => <li className="list-group-item" key={`${row.id}-${index}`}>
          <div className="row g-2 align-items-end">
            <div className="col-12 col-lg-4">
              <label className="form-label" htmlFor={`${inputId}-label-${index}`}>Label</label>
              <input id={`${inputId}-label-${index}`} className="form-control" aria-label={`Breadcrumb ${index + 1} label`} value={row.label} onChange={event => changeRow(index, 'label', event.target.value)} />
            </div>
            <div className="col-12 col-lg">
              <label className="form-label" htmlFor={`${inputId}-link-${index}`}>Link</label>
              <input id={`${inputId}-link-${index}`} className="form-control" aria-label={`Breadcrumb ${index + 1} link`} placeholder="Leave blank for current page" value={row.link} onChange={event => changeRow(index, 'link', event.target.value)} />
            </div>
            <div className="col-auto d-flex gap-1">
              <button type="button" className="btn btn-sm btn-icon btn-ghost-secondary" aria-label={`Move breadcrumb ${index + 1} up`} title="Move up" disabled={index === 0} onClick={() => moveRow(index, -1)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19v-14m-5 5l5 -5l5 5" /></svg>
              </button>
              <button type="button" className="btn btn-sm btn-icon btn-ghost-secondary" aria-label={`Move breadcrumb ${index + 1} down`} title="Move down" disabled={index === rows.length - 1} onClick={() => moveRow(index, 1)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14m-5 -5l5 5l5 -5" /></svg>
              </button>
              <button type="button" className="btn btn-sm btn-icon btn-ghost-danger" aria-label={`Remove breadcrumb ${index + 1}`} title="Remove breadcrumb" onClick={() => updateRows(current => current.filter((_, i) => i !== index))}>
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12m0 -12l-12 12" /></svg>
              </button>
            </div>
          </div>
        </li>)}
      </ol>
      <button type="button" className="btn btn-outline-primary" onClick={() => updateRows(current => [...current, { id: crypto.randomUUID(), label: '', link: '' }])}>Add breadcrumb</button>
    </div>
  </>;
}

PageHeaderContent.propTypes = { widget: PropTypes.object.isRequired, updateWidget: PropTypes.func.isRequired, page: PropTypes.object };
