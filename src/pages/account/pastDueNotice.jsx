import React from "react";
import PropTypes from "prop-types";
import { useFetch } from "../../hooks/useFetch.js";

export default function PastDueNotice({ token, notice, className = "mt-3", showPayButton = true, showAfterDays = 1 }) {
  const { notice: fetchedNotice } = usePastDueNotice(token, { showAfterDays });
  const pastDueNotice = notice ?? fetchedNotice;
  if (!pastDueNotice) {
    return null;
  }

  const handleManage = () => {
    location = "/account/invoices";
  };

  return (
    <div className={`alert alert-${pastDueNotice.severity} ${className}`} role="alert">
      <h4 className="alert-title">{pastDueNotice.title}</h4>
      <div>{pastDueNotice.message}</div>
      {showPayButton && (
        <div className="mt-3">
          <button type="button" className={`btn btn-outline-${pastDueNotice.severity === "danger" ? "danger" : "warning"}`} onClick={handleManage}>
            Manage Billing
          </button>
        </div>
      )}
    </div>
  );
}

PastDueNotice.propTypes = {
  token: PropTypes.any,
  notice: PropTypes.object,
  className: PropTypes.string,
  showPayButton: PropTypes.bool,
  showAfterDays: PropTypes.number
};

export function usePastDueNotice(token, options = {}) {
  const parsedShowAfterDays = Number(options.showAfterDays ?? 1);
  const showAfterDays = Number.isFinite(parsedShowAfterDays) && parsedShowAfterDays > 0 ? parsedShowAfterDays : 1;
  const { data: daysLateData, loading, error } = useFetch("/api/v1/EnvironmentInvoices/daysLate");
  const notice = getPastDueNoticeFromDaysPastDue(token, daysLateData, { showAfterDays });
  return { notice, daysPastDue: Number(daysLateData) || 0, loading, error };
}

export function getPastDueNotice(token, options = {}) {
  return getPastDueNoticeFromDaysPastDue(token, getDaysPastDue(token), options);
}

export function getPastDueNoticeFromDaysPastDue(token, daysPastDueRaw, options = {}) {
  const parsedShowAfterDays = Number(options.showAfterDays ?? 1);
  const showAfterDays = Number.isFinite(parsedShowAfterDays) && parsedShowAfterDays > 0 ? parsedShowAfterDays : 1;
  const parsedDaysPastDue = Number(daysPastDueRaw);
  const daysPastDue = Number.isFinite(parsedDaysPastDue) && parsedDaysPastDue > 0 ? parsedDaysPastDue : 0;
  if (daysPastDue < showAfterDays) {
    return null;
  }

  const disableDate = getDisableDateText(token, daysPastDue);

  if (daysPastDue >= 15) {
    return {
      severity: "danger",
      title: "Account Access Paused",
      message: "Your account access has been paused because payment is overdue. Please make a payment to restore access.",
      daysPastDue,
      blockEnvironmentLogin: true
    };
  }

  if (daysPastDue >= 10) {
    return {
      severity: "danger",
      title: "Final Payment Reminder",
      message: `Your invoice is ${daysPastDue} day${daysPastDue === 1 ? "" : "s"} overdue. Please pay by ${disableDate} to avoid an interruption in service.`,
      daysPastDue,
      blockEnvironmentLogin: false
    };
  }

  return {
    severity: "warning",
    title: "Payment Reminder",
    message: "Your invoice is past due. Please make a payment soon to avoid any interruption in service.",
    daysPastDue,
    blockEnvironmentLogin: false
  };
}

function getDaysPastDue(token) {
  const rawDays = token?.daysPastDue
    ?? token?.invoiceDaysPastDue
    ?? token?.billing?.daysPastDue
    ?? token?.invoice?.daysPastDue
    ?? 0;

  const parsed = Number(rawDays);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

function getDisableDateText(token, daysPastDue) {
  const dueDateRaw = token?.dueDate
    || token?.invoiceDueDate
    || token?.billing?.dueDate
    || token?.invoice?.dueDate;

  if (!dueDateRaw) {
    const fallbackDate = new Date();
    const daysUntilDisable = Math.max(15 - Number(daysPastDue || 0), 0);
    fallbackDate.setDate(fallbackDate.getDate() + daysUntilDisable);
    return fallbackDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }

  const dueDate = new Date(dueDateRaw);
  if (Number.isNaN(dueDate.getTime())) {
    const fallbackDate = new Date();
    const daysUntilDisable = Math.max(15 - Number(daysPastDue || 0), 0);
    fallbackDate.setDate(fallbackDate.getDate() + daysUntilDisable);
    return fallbackDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }

  dueDate.setDate(dueDate.getDate() + 15);
  return dueDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
