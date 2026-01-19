import React, { useEffect, useMemo, useState } from 'react';
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

/** Minutes offset for `timeZone` at `atInstant` (e.g., -420 for UTC-07:00). */
function getTimeZoneOffsetMinutes(timeZone, atInstant) {
  if (!timeZone) return -atInstant.getTimezoneOffset();
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

/** Convert stored UTC instant → Y/M/D in system tz */
function getYMDInTZ(isoUtcString, timeZone) {
  if (!isoUtcString) return null;
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

/** Build a local Date for the calendar (use midday to avoid DST edge cases) */
function dateFromYMDLocal(y, m, d) {
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/** Interpret Y-M-D at a specific time (h:m:s:ms) in `timeZone`, return ISO UTC */
function ymdTimeInTZToUtcISO(y, m, d, h, mi, s, ms, timeZone) {
  // Guess UTC for that wall time
  const guessUtcMs = Date.UTC(y, m - 1, d, h, mi, s, ms);
  const guessInstant = new Date(guessUtcMs);

  // Pass 1
  const off1 = getTimeZoneOffsetMinutes(timeZone, guessInstant);
  const realUtcMs1 = guessUtcMs - off1 * 60_000;
  const realInstant1 = new Date(realUtcMs1);

  // Pass 2 (handles DST transitions on boundaries)
  const off2 = getTimeZoneOffsetMinutes(timeZone, realInstant1);
  const realUtcMs2 = guessUtcMs - off2 * 60_000;

  return new Date(realUtcMs2).toISOString();
}

/** Start-of-day (00:00:00.000) in tz → UTC ISO */
function startOfDayISO(y, m, d, tz) {
  return ymdTimeInTZToUtcISO(y, m, d, 0, 0, 0, 0, tz);
}
/** End-of-day (23:59:59.999) in tz → UTC ISO */
function endOfDayISO(y, m, d, tz) {
  return ymdTimeInTZToUtcISO(y, m, d, 23, 59, 59, 999, tz);
}

const DateRangeInput = ({
  className = 'form-control pe-4',
  name,
  startDate,
  endDate,
  onChange,
  disabled,
  placeholder,
  errorText,
  errored,
  allowEmpty = true
}) => {
  const tz = useMemo(resolveStoredTimeZone, []);

  // Internal UI state (Date objects for react-datepicker)
  const [begin, setBegin] = useState(null);
  const [end, setEnd] = useState(null);

  // Sync internal state whenever props change
  useEffect(() => {
    const startYMD = getYMDInTZ(startDate, tz);
    const endYMD = getYMDInTZ(endDate, tz);

    setBegin(startYMD ? dateFromYMDLocal(startYMD.y, startYMD.m, startYMD.d) : null);
    setEnd(endYMD ? dateFromYMDLocal(endYMD.y, endYMD.m, endYMD.d) : null);

  }, [startDate, endDate]);

  // Initialize if not allowed to be empty: set to today start/end in tz
  useEffect(() => {
    if (!allowEmpty && !startDate) {
      const now = new Date();
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
        const startIso = startOfDayISO(y, m, d, tz);
        const endIso = endOfDayISO(y, m, d, tz);
        setBegin(dateFromYMDLocal(y, m, d));
        setEnd(dateFromYMDLocal(y, m, d));
        onChange(name, startIso, endIso);
      } else {
        // Safe fallback (uses current instant)
        const iso = now.toISOString();
        setBegin(now);
        setEnd(now);
        onChange(name, iso, iso);
      }
    }

  }, [allowEmpty, startDate]);

  const handleChange = (update) => {
    const [s, e] = update; // Date | null
    setBegin(s);
    setEnd(e);

    if (!s && !e) {
      onChange(name, null, null);
      return;
    }

    const toStartIso = (dt) => {
      const y = dt.getFullYear();
      const m = dt.getMonth() + 1;
      const d = dt.getDate();
      return startOfDayISO(y, m, d, tz);
    };
    const toEndIso = (dt) => {
      const y = dt.getFullYear();
      const m = dt.getMonth() + 1;
      const d = dt.getDate();
      return endOfDayISO(y, m, d, tz);
    };

    const startIso = s ? toStartIso(s) : null;
    // If end not picked yet, use same day’s end-of-day
    const endIso = e ? toEndIso(e) : (s ? toEndIso(s) : null);

    onChange(name, startIso, endIso);
  };

  const inputClass = (errorText || errored) ? `${className} is-invalid` : className;

  return (
    <>
      <div className="input-group">
        <div className="input-icon w-100">
          <DatePicker
            className={inputClass}
            placeholderText={placeholder ?? ''}
            name={name}
            autoComplete="off"
            disabled={disabled}
            selectsRange
            swapRange
            startDate={begin}
            endDate={end}
            onChange={handleChange}
            dateFormat="yyyy-MM-dd"
            popperPlacement="bottom-end"
          />
          <span className="input-icon-addon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
              viewBox="0 0 24 24" fill="currentColor"
              className="icon icon-tabler icons-tabler-filled icon-tabler-calendar">
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M16 2a1 1 0 0 1 .993 .883l.007 .117v1h1a3 3 0 0 1 2.995 2.824l.005 .176v12a3 3 0 0 1 -2.824 2.995l-.176 .005h-12a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-12a3 3 0 0 1 2.824 -2.995l.176 -.005h1v-1a1 1 0 0 1 1.993 -.117l.007 .117v1h6v-1a1 1 0 0 1 1 -1zm3 7h-14v9.625c0 .705 .386 1.286 .883 1.366l.117 .009h12c .513 0 .936 -.53 .993 -1.215l .007 -.16v-9.625z" />
              <path d="M12 12a1 1 0 0 1 .993 .883l .007 .117v3a1 1 0 0 1 -1.993 .117l -.007 -.117v-2a1 1 0 0 1 -.117 -1.993l .117 -.007h1z" />
            </svg>
          </span>
        </div>
      </div>
      {errorText && <div className="invalid-feedback">{errorText}</div>}
    </>
  );
};

export default DateRangeInput;

DateRangeInput.propTypes = {
  className: PropTypes.string,
  name: PropTypes.string.isRequired,
  /** Start date as ISO UTC (e.g., "2025-10-01T00:00:00.000Z") */
  startDate: PropTypes.string.isRequired,
  /** End date as ISO UTC (e.g., "2025-10-01T23:59:59.999Z") */
  endDate: PropTypes.string.isRequired,
  /** onChange(name, startIsoUtc | null, endIsoUtc | null) */
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  errorText: PropTypes.string,
  errored: PropTypes.bool,
  allowEmpty: PropTypes.bool
};
