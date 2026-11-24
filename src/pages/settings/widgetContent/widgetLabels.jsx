import React, { useId } from 'react';
import PropTypes from 'prop-types';
import { widgetLabelDefaults } from '../../../features/widgets/widgetLabels.mjs';
import { widgetLabelKey } from '../../../features/widgets/widgetText.mjs';

function WidgetLabels({ type, labels = {}, updateWidget }) {
  const inputId = useId();
  const defaults = widgetLabelDefaults[type] ?? [];
  if (!defaults.length) return null;
  const changeLabel = (key, value) => updateWidget(current => {
    const next = { ...current.settings?.labels };
    if (value === undefined) delete next[key];
    else next[key] = value;
    return { ...current, settings: { ...current.settings, labels: next } };
  });
  return <details className="mt-4 border rounded p-3">
    <summary className="fw-semibold">Labels</summary>
    <p className="form-hint mt-3">Customize these labels with plain text or a translation reference such as <code>{'{{i18n.yourKey}}'}</code>. Reset restores the original wording. Keep placeholders such as <code>{'{count}'}</code> when shown.</p>
    <div className="row g-3">
      {defaults.map(fallback => {
        const key = widgetLabelKey(fallback);
        const id = `${inputId}-${key}`;
        const Input = fallback.length > 80 ? 'textarea' : 'input';
        return <div className="col-12 col-lg-6" key={key}>
          <label className="form-label text-break" htmlFor={id}>{fallback}</label>
          <div className="d-flex gap-2 align-items-start">
            <Input id={id} className="form-control" style={{ minWidth: 0 }} rows={Input === 'textarea' ? 3 : undefined} value={labels[key] ?? fallback} onChange={event => changeLabel(key, event.target.value)} />
            <button type="button" className="btn btn-outline-secondary flex-shrink-0" aria-label={`Reset label ${fallback}`} disabled={!Object.hasOwn(labels, key)} onClick={() => changeLabel(key, undefined)}>Reset</button>
          </div>
        </div>;
      })}
    </div>
  </details>;
}

WidgetLabels.propTypes = { type: PropTypes.string, labels: PropTypes.object, updateWidget: PropTypes.func.isRequired };

export default React.memo(WidgetLabels);
