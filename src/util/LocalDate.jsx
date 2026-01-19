import React from 'react';
import PropTypes from 'prop-types';

/**
 * LocalDate (backward compatible)
 * - Reads IANA tz from sessionStorage under SESSION_TZ_KEY.
 * - If the stored value is "local" (case-insensitive), empty, or missing,
 *   we format in the user's current local timezone (existing behavior).
 * - If input date has no 'Z' or numeric offset, we assume UTC by appending 'Z'.
 */
function LocalDate({ dateString, hideTime }) {
  if (!dateString) return <span>{' '}</span>;

  const tz = resolveStoredTimeZone();
  return <span>{formatInTimeZone(dateString, hideTime, tz)}</span>;
}

LocalDate.propTypes = {
  dateString: PropTypes.string,
  hideTime: PropTypes.bool
};

/** SessionStorage key you will set during login, e.g.:
 *   localStorage.setItem('preferredTimeZone', 'America/New_York')
 *   localStorage.setItem('preferredTimeZone', 'local')  // to use browser local time
 */
const SESSION_TZ_KEY = 'preferredTimeZone';

/** Read tz from sessionStorage. Return undefined to mean "use browser local". */
function resolveStoredTimeZone() {
  try {
    const raw = localStorage.getItem(SESSION_TZ_KEY);
    if (!raw) return undefined;
    const v = raw.trim();
    if (v === '' || /^local$/i.test(v)) return undefined; // special flag → browser local tz
    return v; // assume valid IANA tz like "America/Denver"
  } catch {
    return undefined; // if storage unavailable, fall back to local tz
  }
}

/** Parse a date string as an instant. If it lacks zone/offset, assume UTC. */
function parseAsInstant(dateString) {
  const hasZone = /[Zz]$|[+-]\d{2}:\d{2}$/.test(dateString);
  const iso = hasZone ? dateString : `${dateString}Z`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function formatInTimeZone(dateString, hideTime, timeZone /* undefined => browser local */) {
  const date = parseAsInstant(dateString);
  if (!date) return '';

  const base = hideTime
    ? { year: 'numeric', month: 'long', day: 'numeric' }
    : { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' };

  return new Intl.DateTimeFormat(undefined, { ...base, timeZone }).format(date);
}


function ToLocalDate(dateString, hideTime) {
  if (!dateString) return '';
  return formatInTimeZone(dateString, hideTime, resolveStoredTimeZone());
}

function FormatDate(dateString, hideTime) {
  if (!dateString) return '';
  return formatInTimeZone(dateString, hideTime, resolveStoredTimeZone());
}

export default LocalDate;
export { ToLocalDate, FormatDate };
