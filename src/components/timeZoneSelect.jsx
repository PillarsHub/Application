// TimeZoneSelect.jsx
import React, { useMemo } from "react";
import PropTypes from "prop-types";
import SelectInput from "./selectInput";

const SESSION_TZ_KEY = "preferredTimeZone";

const TIME_ZONES = {
  Americas: [
    "UTC",
    "America/Anchorage",
    "America/Los_Angeles",
    "America/Phoenix",
    "America/Denver",
    "America/Chicago",
    "America/New_York",
    "America/Toronto",
    "America/Mexico_City",
    "America/Bogota",
    "America/Lima",
    "America/Santiago",
    "America/Sao_Paulo",
    "America/Buenos_Aires",
    "Pacific/Honolulu",
  ],
  Europe: [
    "Europe/London",
    "Europe/Dublin",
    "Europe/Lisbon",
    "Europe/Madrid",
    "Europe/Paris",
    "Europe/Amsterdam",
    "Europe/Berlin",
    "Europe/Rome",
    "Europe/Zurich",
    "Europe/Stockholm",
    "Europe/Warsaw",
    "Europe/Athens",
    "Europe/Helsinki",
    "Europe/Moscow",
  ],
  "Middle East & Africa": [
    "Africa/Casablanca",
    "Africa/Lagos",
    "Africa/Cairo",
    "Africa/Johannesburg",
    "Asia/Jerusalem",
    "Asia/Riyadh",
    "Asia/Dubai",
  ],
  Asia: [
    "Asia/Karachi",
    "Asia/Kolkata",
    "Asia/Dhaka",
    "Asia/Bangkok",
    "Asia/Singapore",
    "Asia/Hong_Kong",
    "Asia/Taipei",
    "Asia/Tokyo",
    "Asia/Seoul",
  ],
  Oceania: [
    "Australia/Perth",
    "Australia/Adelaide",
    "Australia/Sydney",
    "Pacific/Auckland",
  ],
};

function getStoredOrDefault() {
  try {
    const v = localStorage.getItem(SESSION_TZ_KEY);
    if (!v || /^local$/i.test(v.trim())) return "local";
    return v;
  } catch {
    return "local";
  }
}

function formatOffsetLabelForTZ(tz) {
  if (tz === "UTC") return "UTC±00:00";
  const now = new Date();
  const part =
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "shortOffset",
      hour12: false,
    })
      .formatToParts(now)
      .find((p) => p.type === "timeZoneName")?.value || "UTC";

  const m = part.match(/([UG]MT|UTC)\s*([+-]\d{1,2})(?::?(\d{2}))?/i);
  if (!m) return "UTC";
  const sign = m[2].startsWith("-") ? "-" : "+";
  const hh = Math.abs(parseInt(m[2], 10)).toString().padStart(2, "0");
  const mm = m[3] ? m[3] : "00";
  return `UTC${sign}${hh}:${mm}`;
}

function makeTzLabel(tz) {
  if (tz === "UTC") return "(UTC±00:00) UTC";
  return `(${formatOffsetLabelForTZ(tz)}) ${tz}`;
}

export default function TimeZoneSelect({
  name = SESSION_TZ_KEY,
  value,
  onChange,
  className,
  disabled,
  emptyOption,
  showCurrentZoneHint = true,
  hintClassName = "form-hint",
}) {
  const current = value ?? getStoredOrDefault();

  const { groups, detectedTz, detectedOffset } = useMemo(() => {
    const detectedTz =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "Auto-detect";
    const detectedOffset = formatOffsetLabelForTZ(detectedTz);

    const groups = Object.entries(TIME_ZONES).map(([group, tzs]) => ({
      group,
      options: tzs.map((tz) => ({ value: tz, label: makeTzLabel(tz) })),
    }));
    return { groups, detectedTz, detectedOffset };
  }, []);

  const handleChange = (n, v) => {
    try {
      localStorage.setItem(SESSION_TZ_KEY, v);
    } catch {
      /* ignore */
    }
    onChange && onChange(n, v);
  };

  return (
    <>
      <SelectInput
        className={className ?? "form-select"}
        name={name}
        value={current}
        onChange={handleChange}
        disabled={disabled}
        emptyOption={emptyOption}
      >
        {/* Neutral “local” option (no "my") */}
        <option value="local">Use local timezone</option>
        <option disabled>──────────</option>

        {groups.map((g) => (
          <optgroup key={g.group} label={g.group}>
            {g.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </optgroup>
        ))}
      </SelectInput>

      {showCurrentZoneHint && (
        <small className={hintClassName}>
          Current local timezone: <strong>{detectedTz}</strong> ({detectedOffset})
        </small>
      )}
    </>
  );
}

/* PropTypes */
TimeZoneSelect.propTypes = {
  /** Field name (used in onChange) */
  name: PropTypes.string.isRequired,
  /** Selected value: "local" or an IANA zone like "America/Denver" */
  value: PropTypes.string,
  /** onChange callback: (name, value) */
  onChange: PropTypes.func,
  /** Optional CSS class for the <select> */
  className: PropTypes.string,
  /** Disable the control */
  disabled: PropTypes.bool,
  /** Placeholder text if you use an empty/invalid value */
  emptyOption: PropTypes.string,
  /** Show hint with detected browser timezone under the input */
  showCurrentZoneHint: PropTypes.bool,
  /** Class for the hint element */
  hintClassName: PropTypes.string,
};
