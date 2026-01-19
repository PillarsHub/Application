import React, { useEffect } from 'react';
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

/** Format a UTC ISO string for <input type="datetime-local"> in the given tz */
function formatForInput(isoUtc, timeZone) {
  if (!isoUtc) return '';
  const d = new Date(isoUtc);
  if (isNaN(d.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, // undefined => browser local
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

  // en-CA yields 24h digits already; build "YYYY-MM-DDTHH:mm"
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

/** Parse a "YYYY-MM-DDTHH:mm" (wall time) as if it were in `timeZone`, return ISO UTC */
function parseFromInput(localValue, timeZone) {
  // Guard
  if (!localValue) return '';

  // Extract components
  // Expect "YYYY-MM-DDTHH:mm" (datetime-local)
  const m = localValue.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) return '';

  const [, y, mo, d, h, mi] = m.map(Number);

  // Start with the naive UTC instant for those components
  // (i.e., “pretend” wall-time is UTC), then adjust by tz offset at that instant.
  const guessUtcMs = Date.UTC(y, mo - 1, d, h, mi, 0, 0);
  const guessDate = new Date(guessUtcMs);

  // Compute offset for the target timezone at that instant, in minutes
  const offsetMinutes = getTimeZoneOffsetMinutes(timeZone, guessDate);

  // Real UTC = wall time minus the tz offset
  const realUtcMs = guessUtcMs - offsetMinutes * 60_000;
  const realUtc = new Date(realUtcMs);

  return realUtc.toISOString();
}

/** Returns offset minutes for `timeZone` at `date` (e.g., -420 for UTC-07:00).
 * timeZone === undefined means browser local, so we can just use getTimezoneOffset().
 */
function getTimeZoneOffsetMinutes(timeZone, date) {
  if (!timeZone) {
    // Browser local offset (note: JS returns minutes *behind* UTC, so sign is already correct)
    return date.getTimezoneOffset() * -1 * -1; // normalize? No—see below.

    // Actually, simpler and correct:
    // return -date.getTimezoneOffset();
  }

  // For a specific IANA tz, parse "shortOffset" like "GMT-7" or "UTC+05:30"
  const part = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'shortOffset',
    hour12: false
  }).formatToParts(date).find(p => p.type === 'timeZoneName')?.value || 'UTC';

  // Normalize to minutes: "UTC+05:30", "GMT-7", etc.
  const m = part.match(/([UG]MT|UTC)\s*([+-]\d{1,2})(?::?(\d{2}))?/i);
  if (!m) return 0;
  const sign = m[2].startsWith('-') ? -1 : 1;
  const hh = Math.abs(parseInt(m[2], 10)) || 0;
  const mm = m[3] ? parseInt(m[3], 10) : 0;
  return sign * (hh * 60 + mm);
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

  // Ensure a default when allowEmpty === false
  useEffect(() => {
    if (!allowEmpty && !value) {
      const nowIsoUtc = new Date().toISOString();
      onChange(name, nowIsoUtc);
    }
  }, [value, allowEmpty]);

  const tz = resolveStoredTimeZone();

  const handleChange = (event) => {
    const v = event.target.value;
    if (v) {
      const isoUtc = parseFromInput(v, tz);
      onChange(name, isoUtc);
    } else {
      onChange(name, '');
    }
  };

  // Display value for the input (in chosen tz or browser local if tz is undefined)
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
