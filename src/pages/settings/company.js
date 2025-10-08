import React, { useState, useEffect, useRef, useCallback } from "react";
import { useFetch } from "../../hooks/useFetch";
import { SendRequest } from "../../hooks/usePost";
import PageHeader from "../../components/pageHeader";
import SettingsNav from "./settingsNav";
import TextInput from "../../components/textInput";
import TimeZoneSelect from "../../components/timeZoneSelect";

const AUTOSAVE_DELAY_MS = 800;

const shallowEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const k of aKeys) {
    if (a[k] !== b[k]) return false;
  }
  return true;
};

const Company = () => {
  const { data, loading, error } = useFetch("/api/v1/CompanyData");
  const [values, setValues] = useState();
  const [status, setStatus] = useState("idle"); // idle | saving | saved | error

  const lastSavedRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    if (data) {
      setValues(data);
      lastSavedRef.current = data;
      setStatus("idle");
    }
  }, [data]);

  const handleChange = (name, value) => {
    setValues((v) => ({ ...(v || {}), [name]: value }));
  };

  const doSave = useCallback(
    (payload) => {
      if (!payload) return;
      setStatus("saving");
      const seq = ++requestSeqRef.current;

      SendRequest(
        "PUT",
        "/api/v1/CompanyData",
        payload,
        () => {
          if (seq === requestSeqRef.current) {
            lastSavedRef.current = payload;
            setStatus("saved");
            setTimeout(() => {
              if (seq === requestSeqRef.current) setStatus("idle");
            }, 1200);
          }
        },
        (err) => {
          if (seq === requestSeqRef.current) {
            console.error(err);
            setStatus("error");
          }
        }
      );
    },
    []
  );

  // Auto-save debounced on change
  useEffect(() => {
    if (!values) return;
    if (shallowEqual(values, lastSavedRef.current)) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      doSave(values);
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [values, doSave]);

  if (error) return `Error! ${error}`;

  return (
    <PageHeader title="Business Information" preTitle="Settings">
      <SettingsNav loading={loading} pageId="company">
        <div className="card-header d-flex align-items-center justify-content-between">
          <span className="card-title">Business Information</span>

          {/* Status indicator */}
          <small className="text-muted">
            {status === "saving" && "Saving…"}
            {status === "saved" && "Saved"}
            {status === "error" && (
              <span
                className="text-danger text-decoration-underline"
                role="button"
                onClick={() => doSave(values)}
              >
                Error — Retry
              </span>
            )}
          </small>
        </div>

        <div className="card-body bg-light">
          <div className="row row-cards">
            <div className="col-12 mb-3">
              <label className="form-label required">Business Name</label>
              <TextInput
                name="name"
                value={values?.name ?? ""}
                onChange={handleChange}
              />
            </div>

            <div className="col-12">
              <div className="row row-cards">
                <div className="col-md-6">
                  <fieldset className="fo">
                    <div className="row row-cards">
                      <div className="col-12">
                        <label className="form-label">Phone Number</label>
                        <TextInput
                          name="phone"
                          value={values?.phone ?? ""}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Email Address</label>
                        <TextInput
                          name="email"
                          value={values?.email ?? ""}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </fieldset>
                </div>

                <div className="col-md-6">
                  <fieldset className="fo">
                    <div className="row row-cards">
                      <div className="col-12">
                        <label className="form-label">Address</label>
                        <TextInput
                          name="line1"
                          value={values?.line1 ?? ""}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-sm-12 col-md-5">
                        <label className="form-label">City</label>
                        <TextInput
                          name="city"
                          value={values?.city ?? ""}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-sm-12 col-md-3">
                        <label className="form-label">State</label>
                        <TextInput
                          name="stateCode"
                          value={values?.stateCode ?? ""}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-sm-12 col-md-4">
                        <label className="form-label">Zip Code</label>
                        <TextInput
                          name="zip"
                          value={values?.zip ?? ""}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </fieldset>
                </div>
              </div>
            </div>

            <div className="col-12 mb-3">
              <label className="form-label">Time Zone</label>
              <TimeZoneSelect
                name="timeZone"
                value={values?.timeZone ?? ""}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
      </SettingsNav>
    </PageHeader>
  );
};

export default Company;
