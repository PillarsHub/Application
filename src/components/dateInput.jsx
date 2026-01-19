import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const SESSION_TZ_KEY = 'preferredTimeZone';

/** Resolve system timezone: "local" (or missing) => undefined (browser local); else IANA string */
function resolveStoredTimeZone() {
  try {
    const raw = localStorage.getItem(SESSION_TZ_KEY);
    if (!raw || /^local$/i.test(raw.trim())) return undefined;
    return raw;
  } catch {
    return undefined;
  }
}

/** Offset minutes for `timeZone` at the given instant (e.g., -420 for UTC-07:00). */
function getTimeZoneOffsetMinutes(timeZone, atInstant) {
  if (!timeZone) {
    // Browser local offset: JS returns minutes behind UTC; invert the sign to get "+/- minutes from UTC"
    return -atInstant.getTimezoneOffset();
  }
  const part = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'shortOffset',
    hour12: false
  }).formatToParts(atInstant).find(p => p.type === 'timeZoneName')?.value || 'UTC';

  const m = part.match(/([UG]MT|UTC)\s*([+-]\d{1,2})(?::?(\d{2}))?/i);
  if (!m) return 0;
  const sign = m[2].startsWith('-') ? -1 : 1;
  const hh = Math.abs(parseInt(m[2], 10)) || 0;
  const mm = m[3] ? parseInt(m[3], 10) : 0;
  return sign * (hh * 60 + mm);
}

/** Get Y/M/D *in a timezone* for a given UTC instant */
function getYMDInTZ(isoUtcString, timeZone) {
  const d = new Date(isoUtcString);
  if (isNaN(d)) return null;

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(d);

  const get = (t) => parts.find(p => p.type === t)?.value;
  const y = Number(get('year'));
  const m = Number(get('month'));
  const day = Number(get('day'));
  if (!y || !m || !day) return null;
  return { y, m, d: day };
}

/** Build a Date object (local) that points to the *calendar day* y-m-d for UI selection */
function dateFromYMDLocal(y, m, d) {
  // Use midday to avoid DST edge cases when calendars compute start/end of day
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/** Given a Y-M-D (selected in UI), interpret it as 00:00 in `timeZone` and return ISO UTC */
function ymdInTZToUtcISO(y, m, d, timeZone) {
  // Start with a UTC guess for that wall time
  const guessUtcMs = Date.UTC(y, m - 1, d, 0, 0, 0, 0);
  const guessInstant = new Date(guessUtcMs);

  // Pass 1: get offset at the guess
  const off1 = getTimeZoneOffsetMinutes(timeZone, guessInstant);
  const realUtcMs1 = guessUtcMs - off1 * 60_000;
  const realInstant1 = new Date(realUtcMs1);

  // Pass 2 (handles DST transitions right at midnight in that tz)
  const off2 = getTimeZoneOffsetMinutes(timeZone, realInstant1);
  const realUtcMs2 = guessUtcMs - off2 * 60_000;

  return new Date(realUtcMs2).toISOString();
}

const DateInput = ({ className = 'form-control', name, value, onChange, disabled, placeholder, errorText, errored, allowEmpty = true }) => {
  const tz = useMemo(resolveStoredTimeZone, []);

  // Initialize when empty & not allowed to be empty: set to "today 00:00" in system tz
  useEffect(() => {
    if (!allowEmpty && !value) {
      const now = new Date();
      // Derive today's YMD in the chosen tz
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).formatToParts(now);
      const y = Number(parts.find(p => p.type === 'year')?.value);
      const m = Number(parts.find(p => p.type === 'month')?.value);
      const d = Number(parts.find(p => p.type === 'day')?.value);
      if (y && m && d) {
        const iso = ymdInTZToUtcISO(y, m, d, tz);
        onChange(name, iso);
      } else {
        onChange(name, now.toISOString()); // safe fallback
      }
    }
  }, [value, allowEmpty]);

  const handleChange = (date) => {
    if (!date) {
      onChange(name, '');
      return;
    }
    // Extract Y/M/D from the picked date (as shown to the user)
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const isoUtc = ymdInTZToUtcISO(y, m, d, tz);
    
    onChange(name, isoUtc);
  };

  // Selected date for the DatePicker (convert stored UTC instant → Y/M/D in system tz)
  const selected = (() => {
    if (!value) return null;
    const ymd = getYMDInTZ(value, tz);
    if (!ymd) return null;
    return dateFromYMDLocal(ymd.y, ymd.m, ymd.d);
  })();

  const inputClass = (errorText || errored) ? `${className} is-invalid` : className;

  return (
    <>
      <div className="input-icon">
        <DatePicker
          selected={selected}
          onChange={handleChange}
          className={inputClass}
          placeholderText={placeholder ?? ''}
          name={name}
          autoComplete="off"
          disabled={disabled}
          dateFormat="yyyy-MM-dd"
          popperPlacement="bottom-end"
          // No need for non-standard props like `timezone`
        />
        <span className="input-icon-addon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
               viewBox="0 0 24 24" fill="currentColor"
               className="icon icon-tabler icons-tabler-filled icon-tabler-calendar">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M16 2a1 1 0 0 1 .993 .883l.007 .117v1h1a3 3 0 0 1 2.995 2.824l.005 .176v12a3 3 0 0 1 -2.824 2.995l-.176 .005h-12a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-12a3 3 0 0 1 2.824 -2.995l.176 -.005h1v-1a1 1 0 0 1 1.993 -.117l.007 .117v1h6v-1a1 1 0 0 1 1 -1zm3 7h-14v9.625c0 .705 .386 1.286 .883 1.366l.117 .009h12c.513 0 .936 -.53 .993 -1.215l.007 -.16v-9.625z" />
            <path d="M12 12a1 1 0 0 1 .993 .883l.007 .117v3a1 1 0 0 1 -1.993 .117l-.007 -.117v-2a1 1 0 0 1 -.117 -1.993l.117 -.007h1z" />
          </svg>
        </span>
      </div>

      {errorText && <div className="invalid-feedback">{errorText}</div>}
    </>
  );
};

export default DateInput;

DateInput.propTypes = {
  className: PropTypes.string,
  name: PropTypes.string.isRequired,
  /** ISO 8601 string (UTC), e.g. "2025-10-07T00:00:00.000Z" */
  value: PropTypes.string.isRequired,
  /** onChange(name, isoUtcString) */
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  errorText: PropTypes.string,
  errored: PropTypes.bool,
  allowEmpty: PropTypes.bool
};
