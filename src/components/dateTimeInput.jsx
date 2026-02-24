import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

const SESSION_TZ_KEY = 'preferredTimeZone';

/** "local" (or missing) => undefined (browser local); otherwise an IANA tz string */
function resolveStoredTimeZone() {
  try {
    const raw = localStorage.getItem(SESSION_TZ_KEY);
    if (!raw || /^local$/i.test(raw.trim())) return undefined;
    return raw;
  } catch {
    return undefined;
  }
}

/** Parse as UTC instant. If no zone is present, assume UTC by appending Z. */
function parseAsInstant(dateString) {
  if (!dateString) return null;
  const hasZone = /[Zz]$|[+-]\d{2}:\d{2}$/.test(dateString);
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
  const iso = hasZone ? dateString : (isDateOnly ? `${dateString}T00:00:00Z` : `${dateString}Z`);
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

/** Returns offset minutes for `timeZone` at `date` (e.g., -420 for UTC-07:00). */
function getTimeZoneOffsetMinutes(timeZone, date) {
  if (!timeZone) {
    return -date.getTimezoneOffset();
  }

  const part = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'shortOffset',
    hour12: false
  }).formatToParts(date).find(p => p.type === 'timeZoneName')?.value || 'UTC';

  const m = part.match(/([UG]MT|UTC)\s*([+-]\d{1,2})(?::?(\d{2}))?/i);
  if (!m) return 0;
  const sign = m[2].startsWith('-') ? -1 : 1;
  const hh = Math.abs(parseInt(m[2], 10)) || 0;
  const mm = m[3] ? parseInt(m[3], 10) : 0;
  return sign * (hh * 60 + mm);
}

/** Format a UTC ISO string for <input type="datetime-local"> in the given tz */
function formatForInput(isoUtc, timeZone) {
  if (!isoUtc) return '';
  const d = parseAsInstant(isoUtc);
  if (!d) return '';

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(d);

  const get = (type) => parts.find(p => p.type === type)?.value;
  const yyyy = get('year');
  const mm = get('month');
  const dd = get('day');
  const hh = get('hour');
  const mi = get('minute');

  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

/** Parse a "YYYY-MM-DDTHH:mm" wall time in `timeZone`, return ISO UTC */
function parseFromInput(localValue, timeZone) {
  if (!localValue) return '';

  const m = localValue.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) return '';

  const [, y, mo, d, h, mi] = m.map(Number);
  const guessUtcMs = Date.UTC(y, mo - 1, d, h, mi, 0, 0);
  const guessDate = new Date(guessUtcMs);

  // Two passes handle DST boundary instants.
  const offset1 = getTimeZoneOffsetMinutes(timeZone, guessDate);
  const realUtcMs1 = guessUtcMs - offset1 * 60_000;
  const realDate1 = new Date(realUtcMs1);

  const offset2 = getTimeZoneOffsetMinutes(timeZone, realDate1);
  const realUtcMs2 = guessUtcMs - offset2 * 60_000;

  return new Date(realUtcMs2).toISOString();
}

const DateTimeInput = ({
  className = 'form-control',
  name,
  value,
  onChange,
  disabled,
  placeholder,
  errorText,
  errored,
  allowEmpty = true
}) => {
  const tz = useMemo(resolveStoredTimeZone, []);

  useEffect(() => {
    if (!allowEmpty && !value) {
      onChange(name, new Date().toISOString());
    }
  }, [value, allowEmpty]);

  const handleChange = (event) => {
    const v = event.target.value;
    onChange(name, v ? parseFromInput(v, tz) : '');
  };

  const displayDate = value ? formatForInput(value, tz) : '';
  const inputClass = (errorText || errored) ? `${className} is-invalid` : className;

  return (
    <>
      <input
        type="datetime-local"
        className={inputClass}
        placeholder={placeholder ?? ''}
        name={name}
        value={displayDate}
        disabled={disabled}
        onChange={handleChange}
        autoComplete="off"
      />
      {errorText && <div className="invalid-feedback">{errorText}</div>}
    </>
  );
};

export default DateTimeInput;

DateTimeInput.propTypes = {
  className: PropTypes.string,
  name: PropTypes.string.isRequired,
  /** ISO 8601 string (UTC), e.g., "2025-10-07T16:30:00.000Z" */
  value: PropTypes.string.isRequired,
  /** onChange(name, isoUtcString) */
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  errorText: PropTypes.string,
  errored: PropTypes.bool,
  allowEmpty: PropTypes.bool
};
