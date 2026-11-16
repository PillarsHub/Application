import React from 'react';
import PropTypes from 'prop-types';
import { isPageHeaderBackgroundTransparent, pageHeaderBreadcrumbs } from '../pageHeader.mjs';

export default function PageHeaderWidget({ widget, customer, orderId, page }) {
  const settings = widget.settings ?? {};
  const breadcrumbs = pageHeaderBreadcrumbs(settings, { customerId: customer?.id, orderId, page });
  const name = settings.showCustomerName !== false ? customer?.fullName : '';
  if (!name && !breadcrumbs.length) return null;
  const alignment = widget.headerAlignment === 'center' ? 'center' : widget.headerAlignment === 'right' ? 'end' : 'start';
  return <div className={`page-header m-0 w-100 d-print-none text-${alignment}`} style={{ backgroundColor: isPageHeaderBackgroundTransparent(widget) ? 'transparent' : widget.headerColor ?? 'transparent' }}>
    <div className="row g-3 align-items-center">
      <div className="col">
        {breadcrumbs.length > 0 && <nav aria-label="Page breadcrumbs">
          <ol className={`breadcrumb breadcrumb-arrows justify-content-${alignment}`}>
            {breadcrumbs.map((crumb, index) => <li key={`${crumb.id}-${index}`} className="breadcrumb-item" aria-current={!crumb.link && index === breadcrumbs.length - 1 ? 'page' : undefined}>
              {crumb.link ? <a href={crumb.link}>{crumb.label}</a> : <span>{crumb.label}</span>}
            </li>)}
          </ol>
        </nav>}
        {name && <h2 className={`page-title justify-content-${alignment}`}><span className="text-break">{name}</span></h2>}
      </div>
    </div>
  </div>;
}

PageHeaderWidget.propTypes = { widget: PropTypes.object.isRequired, customer: PropTypes.object, orderId: PropTypes.string, page: PropTypes.object };
