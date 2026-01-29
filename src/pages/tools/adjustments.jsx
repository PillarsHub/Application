import React, { useMemo, useState } from "react";
import PageHeader, { CardHeader } from "../../components/pageHeader";
import PeriodPicker from "../../components/periodPicker";
import AutoComplete from "../../components/autocomplete";
import Modal from "../../components/modal";
import EmptyContent from "../../components/emptyContent";
import TextArea from "../../components/textArea";
import SelectInput from "../../components/selectInput";
import DateInput from "../../components/dateInput";
import LocalDate from "../../util/LocalDate";

/**
 * Manual Adjustments (Design-only)
 * - Hard-coded catalog + mock rows
 * - In-memory Add/Edit/Delete
 * - Page name: Manual Adjustments
 * - Effect: Override / Adjust / Payment
 * - Customer filter + "Search within results" (two search boxes, clearly labeled)
 * - Reason dropdown removed; Notes textarea + optional chips
 */

const ADJUSTMENT_CATALOG = [
  // Overrides (replace calculated values)
  {
    key: "RANK",
    label: "Rank",
    effect: "Override",
    valueKind: "enum",
    unitLabel: null,
    enumOptions: ["Associate", "Team Lead", "Team Elite", "Director", "Sr Director"],
    helper: "This will replace the calculated Rank for this period.",
  },
  {
    key: "ACTIVE",
    label: "Active",
    effect: "Override",
    valueKind: "enum",
    unitLabel: null,
    enumOptions: ["Active", "Inactive"],
    helper: "This will replace the calculated Active status for this period.",
  },

  // KPI Adjustments (add/subtract)
  {
    key: "PV",
    label: "PV",
    effect: "Adjust",
    valueKind: "number",
    unitLabel: "PV",
    helper: "This will add or subtract from the calculated PV for this period.",
  },
  {
    key: "CV",
    label: "CV",
    effect: "Adjust",
    valueKind: "number",
    unitLabel: "CV",
    helper: "This will add or subtract from the calculated CV for this period.",
  },
  {
    key: "QV",
    label: "QV",
    effect: "Adjust",
    valueKind: "number",
    unitLabel: "QV",
    helper: "This will add or subtract from the calculated QV for this period.",
  },

  // Payments (manual earnings)
  {
    key: "MANUAL_PAYMENT",
    label: "Manual Payment",
    effect: "Payment",
    valueKind: "money",
    unitLabel: "$",
    helper: "This will create a manual payment entry for this period.",
  },
  /* {
    key: "MANUAL_BONUS",
    label: "Manual Bonus",
    effect: "Payment",
    valueKind: "money",
    unitLabel: "$",
    helper: "This will create a manual bonus payment entry for this period.",
  }, */
];

const PERIOD_OPTIONS = {
  hideTime: true,
  hideEnd: true,
  tabbedUI: true,
};

const findCatalogItem = (key) => ADJUSTMENT_CATALOG.find((c) => c.key === key);

const badgeClass = (effect) => {
  switch (effect) {
    case "Override":
      return "badge bg-azure-lt text-azure";
    case "Adjust":
      return "badge bg-orange-lt text-orange";
    case "Payment":
      return "badge bg-green-lt text-green";
    default:
      return "badge bg-secondary-lt text-secondary";
  }
};

const formatMoney = (val) => {
  const n = Number(val || 0);
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
};

const formatSignedNumber = (val) => {
  const n = Number(val || 0);
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
};

const displayValue = (row) => {
  const catalog = findCatalogItem(row.adjustmentKey);
  if (!catalog) return row.valueText ?? row.valueNumber ?? "";

  if (catalog.valueKind === "money") return formatMoney(row.valueNumber);
  if (catalog.valueKind === "number") return `${formatSignedNumber(row.valueNumber)} ${catalog.unitLabel || ""}`.trim();
  return row.valueText || "";
};

const displayAppliesTo = (row) => {
  if (row.beginDate || row.endDate) {
    return (
      <>
        <span className="text-muted">Range:</span>{" "}
        {row.beginDate ? <span className="me-2">{row.beginDate}</span> : <span className="me-2">—</span>}
        {row.endDate ? <span>{row.endDate}</span> : <span>—</span>}
      </>
    );
  }
  return <span className="text-muted">Period</span>;
};

const buildMockRows = () => {
  const nowIso = new Date().toISOString();
  return [
    {
      id: "a1",
      periodId: 60267,
      customerId: "12335",
      customerName: "Amanda Jones",
      adjustmentKey: "RANK",
      effect: "Override",
      valueText: "Team Elite",
      valueNumber: null,
      beginDate: null,
      endDate: null,
      notes: "Promoted early due to exception.",
      createdAt: nowIso,
    },
    {
      id: "a2",
      periodId: 60267,
      customerId: "12335",
      customerName: "Amanda Jones",
      adjustmentKey: "MANUAL_PAYMENT",
      effect: "Payment",
      valueText: null,
      valueNumber: 245.33,
      beginDate: null,
      endDate: null,
      notes: "Missing bonus — Customer support request",
      createdAt: nowIso,
    },
    {
      id: "a3",
      periodId: 60267,
      customerId: "22311",
      customerName: "Susan Jones",
      adjustmentKey: "PV",
      effect: "Adjust",
      valueText: null,
      valueNumber: 432.43,
      beginDate: "2025-10-01",
      endDate: "2025-10-31",
      notes: "Late PV credit",
      createdAt: nowIso,
    },
    {
      id: "a4",
      periodId: 60267,
      customerId: "99102",
      customerName: "Morgan A",
      adjustmentKey: "ACTIVE",
      effect: "Override",
      valueText: "Active",
      valueNumber: null,
      beginDate: null,
      endDate: null,
      notes: "",
      createdAt: nowIso,
    },
  ];
};

const ManualAdjustments = () => {
  const [periodId, setPeriodId] = useState(60267);

  // Filters
  const [customerFilter, setCustomerFilter] = useState(null); // customerId
  const [effectFilter, setEffectFilter] = useState("All"); // All | Override | Adjust | Payment

  // Search within results (separate from customer filter)
  const [searchText, setSearchText] = useState("");

  // In-memory rows
  const [rows, setRows] = useState(() => buildMockRows());

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Draft model (for add/edit)
  const [draft, setDraft] = useState({
    periodId,
    customerId: "",
    adjustmentKey: "",
    effect: "",
    valueText: "",
    valueNumber: "",
    beginDate: "",
    endDate: "",
    notes: "",
  });

  const filteredRows = useMemo(() => {
    let result = rows.filter((r) => Number(r.periodId) === Number(periodId));

    if (customerFilter) result = result.filter((r) => r.customerId === customerFilter);

    if (effectFilter !== "All") result = result.filter((r) => r.effect === effectFilter);

    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      result = result.filter((r) => {
        const catalog = findCatalogItem(r.adjustmentKey);
        return (
          (r.customerName || "").toLowerCase().includes(q) ||
          (r.customerId || "").toLowerCase().includes(q) ||
          (catalog?.label || "").toLowerCase().includes(q) ||
          (r.effect || "").toLowerCase().includes(q) ||
          (r.notes || "").toLowerCase().includes(q)
        );
      });
    }

    // Newest first
    result = [...result].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return result;
  }, [rows, periodId, customerFilter, effectFilter, searchText]);

  const selectedCatalog = draft.adjustmentKey ? findCatalogItem(draft.adjustmentKey) : null;

  const closeModal = () => setShowModal(false);

  const openAdd = () => {
    setEditingId(null);
    setDraft({
      periodId,
      customerId: customerFilter || "",
      adjustmentKey: "",
      effect: "",
      valueText: "",
      valueNumber: "",
      beginDate: "",
      endDate: "",
      notes: "",
    });
    setShowModal(true);
  };

  const openEdit = (id) => {
    const row = rows.find((r) => r.id === id);
    if (!row) return;

    setEditingId(id);
    setDraft({
      periodId: row.periodId,
      customerId: row.customerId,
      adjustmentKey: row.adjustmentKey,
      effect: row.effect,
      valueText: row.valueText || "",
      valueNumber: row.valueNumber ?? "",
      beginDate: row.beginDate || "",
      endDate: row.endDate || "",
      notes: row.notes || "",
    });
    setShowModal(true);
  };

  const handleDraftChange = (name, value) => {
    // switching adjustment key sets effect + clears relevant value fields
    if (name === "adjustmentKey") {
      const c = findCatalogItem(value);
      setDraft((d) => ({
        ...d,
        adjustmentKey: value,
        effect: c?.effect || "",
        valueText: "",
        valueNumber: "",
      }));
      return;
    }

    setDraft((d) => ({ ...d, [name]: value }));
  };

  const insertChipIntoNotes = (chipText) => {
    setDraft((d) => {
      const existing = (d.notes || "").trim();
      if (!existing) return { ...d, notes: chipText };
      // avoid duplicate exact chip substring if already included
      if (existing.toLowerCase().includes(chipText.toLowerCase())) return d;
      return { ...d, notes: `${existing} — ${chipText}` };
    });
  };

  const validateDraft = () => {
    if (!draft.adjustmentKey) return "Adjustment is required.";
    if (!draft.customerId) return "Customer is required.";

    const c = findCatalogItem(draft.adjustmentKey);
    if (!c) return "Invalid adjustment type.";

    if (c.valueKind === "money" || c.valueKind === "number") {
      if (draft.valueNumber === "" || draft.valueNumber === null) return "Value is required.";
      if (Number.isNaN(Number(draft.valueNumber))) return "Value must be a number.";
    } else {
      if (!draft.valueText) return "Value is required.";
    }

    return null;
  };

  const saveDraft = () => {
    const err = validateDraft();
    if (err) {
      alert(err);
      return;
    }

    const c = findCatalogItem(draft.adjustmentKey);

    // Design-only customer name handling:
    // We keep customerName = customerId if AutoComplete returns an id string.
    // In real impl you’ll map id->name.
    const customerName = draft.customerId;

    const base = {
      periodId: Number(periodId),
      customerId: draft.customerId,
      customerName,
      adjustmentKey: draft.adjustmentKey,
      effect: c.effect,
      beginDate: draft.beginDate || null,
      endDate: draft.endDate || null,
      notes: draft.notes || "",
      createdAt: new Date().toISOString(),
    };

    const valueFields =
      c.valueKind === "money" || c.valueKind === "number"
        ? { valueNumber: Number(draft.valueNumber), valueText: null }
        : { valueText: String(draft.valueText), valueNumber: null };

    if (editingId) {
      setRows((prev) =>
        prev.map((r) =>
          r.id === editingId
            ? {
              ...r,
              ...base,
              ...valueFields,
              createdAt: r.createdAt, // keep original created time for design
            }
            : r
        )
      );
    } else {
      const newId = `a_${Math.random().toString(16).slice(2)}`;
      setRows((prev) => [{ id: newId, ...base, ...valueFields }, ...prev]);
    }

    setShowModal(false);
  };

  const deleteRow = (id) => {
    if (!window.confirm("Delete this manual adjustment?")) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };


  const showConst = false;

  if (showConst) {
    return <PageHeader title="Adjustments">
      <EmptyContent />
    </PageHeader>
  }

  return (
    <PageHeader title="Manual Adjustments">
      {/* Top action bar */}
      <CardHeader>
        <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div className="btn-group" role="group" aria-label="Effect filter">
              {["All", "Override", "Adjust", "Payment"].map((x) => (
                <button
                  key={x}
                  type="button"
                  className={`btn btn-outline-secondary ${effectFilter === x ? "active" : ""}`}
                  onClick={() => setEffectFilter(x)}
                >
                  {x}
                </button>
              ))}
            </div>

            <button className="btn btn-primary" onClick={openAdd}>
              <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-playlist-add" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M19 8h-14"></path><path d="M5 12h9"></path><path d="M11 16h-6"></path><path d="M15 16h6"></path><path d="M18 13v6"></path></svg>
              Add adjustment
            </button>

          </div>
        </div>
      </CardHeader>

      <div className="container-xl">
        <div className="row row-cards">
          <div className="col-12">
            <div className="card">
              {/* Filters row */}
              <div className="card-body border-bottom py-3">
                <div className="row g-2 align-items-end">
                  <div className="col-sm-auto">
                    <PeriodPicker
                      periodId={periodId}
                      setPeriodId={(v) => setPeriodId(Number(v))}
                      options={PERIOD_OPTIONS}
                    />
                  </div>

                  <div className="col-sm">
                    <input
                      className="form-control"
                      placeholder="Search adjustments, notes, ids…"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="table-responsive">
                <table className="table card-table table-vcenter datatable">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Customer Id</th>
                      <th>Adjustment</th>
                      <th>Effect</th>
                      <th>Value</th>
                      <th>Applies to</th>
                      <th>Notes</th>
                      <th className="w-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={8}>
                          <div className="p-4 text-center text-muted">
                            No manual adjustments for this filter set.
                            <div className="mt-2">
                              <button className="btn btn-outline-primary" onClick={openAdd}>
                                Add adjustment
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row) => {
                        const catalog = findCatalogItem(row.adjustmentKey);
                        return (
                          <tr key={row.id}>
                            <td className="fw-semibold">{row.customerName}</td>
                            <td className="text-muted">{row.customerId}</td>
                            <td>
                              <div className="d-flex flex-column">
                                <span>{catalog?.label || row.adjustmentKey}</span>
                                <small className="text-muted">
                                  Created <LocalDate dateString={row.createdAt} hideTime={true} />
                                </small>
                              </div>
                            </td>
                            <td>
                              <span className={badgeClass(row.effect)}>{row.effect}</span>
                            </td>
                            <td className="fw-semibold">{displayValue(row)}</td>
                            <td>{displayAppliesTo(row)}</td>
                            <td className="text-muted" style={{ maxWidth: 360, whiteSpace: "normal" }}>
                              {row.notes || <span className="text-muted">—</span>}
                            </td>
                            <td>
                              <div className="btn-list flex-nowrap">
                                <button
                                  type="button"
                                  className="btn btn-ghost-secondary btn-icon"
                                  title="Edit"
                                  onClick={() => openEdit(row.id)}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="icon icon-tabler icon-tabler-edit"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    strokeWidth="2"
                                    stroke="currentColor"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" />
                                    <path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" />
                                    <path d="M16 5l3 3" />
                                  </svg>
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-ghost-danger btn-icon"
                                  title="Delete"
                                  onClick={() => deleteRow(row.id)}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="icon icon-tabler icon-tabler-trash"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    strokeWidth="2"
                                    stroke="currentColor"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path d="M4 7l16 0" />
                                    <path d="M10 11l0 6" />
                                    <path d="M14 11l0 6" />
                                    <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                                    <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paging placeholder (design only) */}
              <div className="card-footer d-flex align-items-center justify-content-between">
                <div className="text-muted">
                  Showing <span className="fw-semibold">{filteredRows.length}</span> manual adjustments for period{" "}
                  <span className="fw-semibold">{periodId}</span>.
                  <span className="ms-2">Paging can be enabled once rows exceed ~10–15.</span>
                </div>

                <div className="btn-list">
                  <button className="btn btn-outline-secondary" type="button" disabled>
                    Prev
                  </button>
                  <button className="btn btn-outline-secondary" type="button" disabled>
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal showModal={showModal} onHide={closeModal}>
        <div className="modal-header">
          <h5 className="modal-title">{editingId ? "Edit adjustment" : "Add adjustment"}</h5>
          <button type="button" className="btn-close" aria-label="Close" onClick={closeModal} />
        </div>

        <div className="modal-body">
          <div className="row g-3">
            {/* Adjustment selection */}
            <div className="col-12">
              <label className="form-label required">Adjustment</label>
              <SelectInput
                name="adjustmentKey"
                value={draft.adjustmentKey}
                emptyOption="Select an adjustment"
                onChange={handleDraftChange}
              >
                <optgroup label="Overrides (replace calculated)">
                  <option value="RANK">Rank</option>
                  <option value="ACTIVE">Active</option>
                </optgroup>
                <optgroup label="Adjustments (add/subtract)">
                  <option value="PV">PV</option>
                  <option value="CV">CV</option>
                  <option value="QV">QV</option>
                </optgroup>
                <optgroup label="Payments (manual earnings)">
                  <option value="MANUAL_PAYMENT">Manual Payment</option>
                  {/* <option value="MANUAL_BONUS">Manual Bonus</option> */}
                </optgroup>
              </SelectInput>

              {selectedCatalog?.helper ? (
                <div className="form-hint mt-1">
                  <span className={badgeClass(selectedCatalog.effect)}>{selectedCatalog.effect}</span>
                  <span className="ms-2">{selectedCatalog.helper}</span>
                </div>
              ) : (
                <div className="form-hint mt-1">Select an adjustment to see how it affects calculated results.</div>
              )}
            </div>

            {/* Customer */}
            <div className="col-12">
              <label className="form-label required">Customer</label>
              <AutoComplete
                name="customerId"
                onChange={handleDraftChange}
                placeholder="Search customer"
                value={draft.customerId}
                allowNull={false}
                showClear={true}
              />
            </div>

            {/* Value input: conditional */}
            <div className="col-8">
              <label className="form-label required">Value</label>

              {!selectedCatalog ? (
                <input className="form-control" disabled placeholder="Select an adjustment first" />
              ) : selectedCatalog.valueKind === "money" ? (
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    className="form-control"
                    name="valueNumber"
                    value={draft.valueNumber}
                    onChange={(e) => handleDraftChange(e.target.name, e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              ) : selectedCatalog.valueKind === "number" ? (
                <div className="input-group">
                  <input
                    className="form-control"
                    name="valueNumber"
                    value={draft.valueNumber}
                    onChange={(e) => handleDraftChange(e.target.name, e.target.value)}
                    placeholder="Use negative to subtract"
                  />
                  {selectedCatalog.unitLabel ? <span className="input-group-text">{selectedCatalog.unitLabel}</span> : null}
                </div>
              ) : (
                <SelectInput
                  name="valueText"
                  value={draft.valueText}
                  emptyOption="Select value"
                  onChange={handleDraftChange}
                >
                  {(selectedCatalog.enumOptions || []).map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </SelectInput>
              )}

              {selectedCatalog?.effect === "Adjust" ? (
                <div className="form-hint mt-1">Example: enter 100 to add, -100 to subtract.</div>
              ) : null}
            </div>

            {/* Optional date range */}
            <div className="col-md-4">
              <label className="form-label required">Date</label>
              <DateInput name="beginDate" value={draft.beginDate} onChange={handleDraftChange} />
            </div>

            {/* Notes + chips (replaces Reason dropdown) */}
            <div className="col-12">
              <label className="form-label">Reason / Notes</label>
              <TextArea
                name="notes"
                value={draft.notes}
                onChange={handleDraftChange}
                placeholder="Explain why this manual adjustment was made…"
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-link link-secondary" onClick={closeModal}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary ms-auto" onClick={saveDraft}>
            {editingId ? "Save changes" : "Add adjustment"}
          </button>
        </div>
      </Modal>
    </PageHeader>
  );
};

export default ManualAdjustments;
