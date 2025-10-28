import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { v4 as uuidv4 } from "uuid";
import { Get } from "../hooks/useFetch";
import "./autocomplete.css";

/** utils */
const generateUUID = () => {
  try {
    return crypto.randomUUID().replace(/-/g, "_");
  } catch {
    return uuidv4().replace(/-/g, "_");
  }
};

const toQS = (obj) =>
  Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .flatMap(([k, v]) =>
      Array.isArray(v) ? v.map((x) => `${encodeURIComponent(k)}=${encodeURIComponent(x)}`) : `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
    )
    .join("&");

const useDebounced = (value, ms = 300) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
};

/** Display helpers — adjust to your shapes as needed */
const formatCustomer = (c) => `${c.fullName} (${c.webAlias ?? c.id})`;
const formatOrder = (o) => {
  const num = o.orderNumber ?? o.id;
  const date = o.orderDate ? new Date(o.orderDate).toLocaleDateString() : "";
  const amt = (o.totalAmount ?? o.total)?.toLocaleString?.(undefined, { style: "currency", currency: o.currencyCode ?? "USD" }) ?? "";
  const who = o.customerName ?? o.customer?.fullName ?? "";
  return `#${num}${date ? " • " + date : ""}${amt ? " • " + amt : ""}${who ? " • " + who : ""}`;
};

/** Promisify your Get() so we can run them in parallel */
const getJson = (url) =>
  new Promise((resolve, reject) =>
    Get(
      url,
      (data) => resolve(data),
      (err) => reject(err)
    )
  );

/**
 * New component: searches BOTH customers and orders.
 * onChange(name, { type: 'customer'|'order' | null, id: string | null })
 */
const AutoCompleteOrdersCustomers = ({
  name,
  value, // { type: 'customer'|'order', id } OR null
  placeholder = "Search customers or orders...",
  showIcon = true,
  onChange,
  allowNull = false,
  disabled,
  errorText,
  errored,
  showClear = false,
  // Optional knobs:
  minLength = 2,
  count = 10,
  scopeCustomerIds, // array of customerIds (strings) to scope order search (optional)
  showSectionHeaders
}) => {
  const [inputId] = useState(() => "modal_" + generateUUID());
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState({ customers: [], orders: [] });
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const reqSeq = useRef(0);

  const shouldShowHeaders =
    showSectionHeaders === "auto"
      ? results.customers.length > 0 && results.orders.length > 0
      : !!showSectionHeaders;


  // Keep text in sync when external value changes
  useEffect(() => {
    let cancelled = false;
    const syncFromValue = async () => {
      if (!value || !value.id || !value.type) {
        setText("");
        return;
      }
      setLoading(true);
      try {
        if (value.type === "customer") {
          const c = await getJson(`/api/v1/Customers/${value.id}`);
          if (!cancelled) setText(formatCustomer(c));
        } else if (value.type === "order") {
          const o = await getJson(`/api/v1/Orders/${value.id}`);
          if (!cancelled) setText(formatOrder(o));
        }
      } catch {
        if (!cancelled) setText("");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    syncFromValue();
    return () => {
      cancelled = true;
    };
  }, [value?.id, value?.type]);

  // Build unified list with section labels
  const unifiedItems = useMemo(() => {
    const cust = results.customers.map((c) => ({
      key: `c:${c.id}`,
      kind: "customer",
      id: String(c.id),
      display: formatCustomer(c),
    }));

    const ords = results.orders.map((o) => {
      const customerId =
        o.customerId ??
        o.customerID ??                 // alt casing just in case
        o.customer?.id ?? null;         // nested customer
      return {
        key: `o:${o.id}`,
        kind: "order",
        id: String(o.id),
        customerId: customerId ? String(customerId) : null,
        display: formatOrder(o),
      };
    });

    const list = [];
    if (cust.length) {
      if (shouldShowHeaders) list.push({ key: "__hdr_c", kind: "header", label: "Customers" });
      list.push(...cust);
    }
    if (ords.length) {
      if (shouldShowHeaders) list.push({ key: "__hdr_o", kind: "header", label: "Orders" });
      list.push(...ords);
    }
    return list;
  }, [results, shouldShowHeaders]);


  // Debounced search text
  const debounced = useDebounced(text, 300);

  // Fire dual search when text changes
  useEffect(() => {
    const q = debounced.trim();
    if (q.length < minLength) {
      setResults({ customers: [], orders: [] });
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    const mySeq = ++reqSeq.current;
    setLoading(true);

    const custQS = toQS({
      search: q,
      count,
      fullName: true,
      emailAddress: true,
      webAlias: true,
    });

    const orderQS = toQS({
      search: q,
      count,
      externalId: false,
      products: false,
      tracking: true,
      ...(Array.isArray(scopeCustomerIds) && scopeCustomerIds.length
        ? { customerIds: scopeCustomerIds }
        : {}),
    });

    Promise.allSettled([
      getJson(`/api/v1/Customers/Find?${custQS}`),
      getJson(`/api/v1/Orders/Find?${orderQS}`),
    ]).then(([cRes, oRes]) => {
      // Ignore stale responses
      if (reqSeq.current !== mySeq) return;

      const customers =
        cRes.status === "fulfilled"
          ? (cRes.value ?? []).filter((x) => x.scopeLevel !== "Upline")
          : [];
      const orders = oRes.status === "fulfilled" ? oRes.value ?? [] : [];

      setResults({ customers, orders });
      setOpen(true);
      setActiveIndex(-1);
      setLoading(false);
    });
  }, [debounced, minLength, count, Array.isArray(scopeCustomerIds) ? scopeCustomerIds.join(",") : ""]);

  // Close on outside click
  useEffect(() => {
    const onDoc = (e) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const handlePick = (item) => {
    if (!item || item.kind === "header") return;
    setText(item.display);
    setOpen(false);

    if (item.kind === "order") {
      onChange?.(name, { type: "order", id: item.id, customerId: item.customerId });
    } else {
      onChange?.(name, { type: "customer", id: item.id });
    }
  };

  const handleClear = () => {
    setText("");
    if (allowNull) onChange?.(name, null);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!open) {
      if (e.key === "ArrowDown" && unifiedItems.length) {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }
    const navigables = unifiedItems.filter((x) => x.kind !== "header");
    if (!navigables.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % navigables.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? navigables.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = navigables[Math.max(0, activeIndex)];
      if (pick) handlePick(pick);
      else if (!text && allowNull) onChange?.(name, null);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  const className = "form-control";
  const inputClass = (errorText || errored) ? `${className} is-invalid` : className;
  const showClearIcon = showClear && text !== "";
  const groupClass = showClearIcon ? "input-group input-group-flat" : "input-icon";

  return (
    <div className={groupClass} ref={containerRef} style={{ position: "relative" }}>
      <input
        id={inputId}
        className={inputClass}
        placeholder={placeholder}
        name={name}
        disabled={disabled}
        autoComplete="off"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => {
          if ((results.customers.length || results.orders.length) && text.length >= minLength) setOpen(true);
        }}
      />

      {showClearIcon && (
        <span className="input-group-text">
          <a
            href="#"
            className="link-secondary"
            data-bs-toggle="tooltip"
            aria-label="Clear search"
            onClick={(e) => {
              e.preventDefault();
              handleClear();
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24"
              strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" />
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </a>
        </span>
      )}

      {showIcon && !showClearIcon && !loading && (
        <span className="input-icon-addon">
          <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24"
            strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" />
            <circle cx="10" cy="10" r="7" />
            <line x1="21" y1="21" x2="15" y2="15" />
          </svg>
        </span>
      )}

      {loading && (
        <span className="input-icon-addon">
          <div className="spinner-border spinner-border-sm text-secondary" role="status"></div>
        </span>
      )}

      {errorText && <div className="invalid-feedback">{errorText}</div>}

      {/* dropdown */}
      {open && unifiedItems.some(item => item.kind !== "header") && (
        <div className="autocomplete-items" style={{ zIndex: 10 }}>
          {unifiedItems.map((item) =>
            item.kind === "header" ? (
              <div
                key={item.key}
                className="autocomplete-section-header"
                aria-hidden="true"
                role="separator"
                tabIndex={-1}
              >
                {item.label}
              </div>
            ) : (
              <div
                key={item.key}
                className={`autocomplete-item ${unifiedItems
                  .filter((x) => x.kind !== "header")
                  .findIndex((n) => n.key === item.key) === activeIndex
                  ? "autocomplete-active"
                  : ""
                  }`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handlePick(item)}
              >
                <span
                  className={`badge me-2 ${item.kind === "customer" ? "bg-primary" : "bg-success"
                    }`}
                >
                  {item.kind === "customer" ? "C" : "O"}
                </span>
                <span>{item.display}</span>
              </div>
            )
          )}
        </div>
      )}

    </div>
  );
};

export default AutoCompleteOrdersCustomers;

AutoCompleteOrdersCustomers.propTypes = {
  name: PropTypes.string,
  value: PropTypes.shape({
    type: PropTypes.oneOf(["customer", "order"]),
    id: PropTypes.string,
    customerId: PropTypes.string, // only for type === 'order'
  }),
  placeholder: PropTypes.string,
  showIcon: PropTypes.bool,
  onChange: PropTypes.func,
  allowNull: PropTypes.bool,
  disabled: PropTypes.bool,
  errorText: PropTypes.string,
  errored: PropTypes.bool,
  showClear: PropTypes.bool,
  minLength: PropTypes.number,
  count: PropTypes.number,
  scopeCustomerIds: PropTypes.arrayOf(PropTypes.string),
  showSectionHeaders: PropTypes.oneOf([true, false, "auto"])
};
