import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import PageHeader, { CardHeader } from '../../components/pageHeader';
import SaveButton from '../../components/saveButton';
import DataLoading from '../../components/dataLoading';
import { Get } from '../../hooks/useFetch';
import { SendRequest } from '../../hooks/usePost';

const GET_DATA = gql`query RegionEditor($regionIds: [String]!, $isNew: Boolean!) {
  regions(idList: $regionIds) @skip(if: $isNew) {
    id
    name
    moneyOutMerchant { id }
    locales {
      countryCode
      stateCode
      country { iso2 name }
      state { iso2 countryIso2 name }
    }
  }
  countries { iso2 name }
  moneyOutMerchants { id name isPrimary }
}`;

const codeKey = code => (code ?? '').toUpperCase();
const sortByName = (a, b) => (a.name ?? '').localeCompare(b.name ?? '', undefined, { sensitivity: 'base', numeric: true });
const errorMessage = error => typeof error === 'string' ? error : error?.message || 'Please try again.';

function editableRegion(region) {
  return {
    name: region?.name ?? '',
    moneyOutMerchantId: region?.moneyOutMerchantId ?? null,
    locales: (region?.locales ?? []).map(locale => ({ countryCode: locale.countryCode, stateCode: locale.stateCode }))
  };
}

function selectionSignature(region) {
  return JSON.stringify([region.name, region.moneyOutMerchantId, region.locales.map(locale =>
    `${codeKey(locale.countryCode)}:${codeKey(locale.stateCode)}`).sort()]);
}

const CountryLocations = ({ country, existingLocales, selected, onChange, onRemove, disabled }) => {
  const [expanded, setExpanded] = useState(true);
  const [search, setSearch] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [catalog, setCatalog] = useState({ loading: true, states: [], error: '' });
  const selectAll = useRef(null);
  const countryCode = codeKey(country.iso2);

  useEffect(() => {
    let active = true;
    setCatalog({ loading: true, states: [], error: '' });
    Get(`/api/v1/Countries/${encodeURIComponent(countryCode)}/States`, states => {
      if (active) setCatalog({ loading: false, states: states ?? [], error: '' });
    }, error => {
      if (active) setCatalog({ loading: false, states: [], error: errorMessage(error) });
    });
    return () => { active = false; };
  }, [countryCode, attempt]);

  const selectedKeys = new Set(selected.map(codeKey));
  const options = new Map();
  catalog.states.forEach(state => {
    if (state.iso2) options.set(codeKey(state.iso2), { code: state.iso2, name: state.name ?? state.iso2 });
  });
  // Retain saved locations even when the country's catalog no longer lists them.
  existingLocales.forEach(locale => {
    const key = codeKey(locale.stateCode);
    if (!options.has(key)) options.set(key, {
      code: locale.stateCode,
      name: locale.state?.name ?? locale.stateCode ?? 'Country entry'
    });
  });
  const locations = [...options.values()].sort(sortByName);
  const filtered = locations.filter(location =>
    `${location.name} ${location.code ?? ''}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const allSelected = locations.length > 0 && locations.every(location => selectedKeys.has(codeKey(location.code)));

  useEffect(() => {
    if (selectAll.current) selectAll.current.indeterminate = selected.length > 0 && !allSelected;
  }, [selected.length, allSelected, expanded, catalog.loading]);

  const toggleLocation = (code, checked) => onChange(checked
    ? [...selected.filter(value => codeKey(value) !== codeKey(code)), code]
    : selected.filter(value => codeKey(value) !== codeKey(code)));
  const toggleAll = checked => {
    const merged = new Map(selected.map(code => [codeKey(code), code]));
    locations.forEach(location => merged.set(codeKey(location.code), location.code));
    onChange(checked ? [...merged.values()] : []);
  };

  return <section className="border rounded mb-3" aria-label={country.name}>
    <div className="d-flex align-items-center flex-wrap gap-2 p-3">
      <button type="button" className="btn btn-link text-reset p-0 text-decoration-none" onClick={() => setExpanded(value => !value)}
        aria-expanded={expanded} aria-controls={`locations-${countryCode}`}>
        <span aria-hidden="true" className="me-2">{expanded ? '▾' : '▸'}</span><strong>{country.name}</strong>
      </button>
      <span className="text-secondary">{allSelected ? `All ${locations.length} listed locations selected` : `${selected.length} selected`}</span>
      <button type="button" className="btn btn-outline-danger btn-sm ms-auto" disabled={disabled} onClick={onRemove}
        aria-label={`Remove ${country.name} from region`}>Remove country</button>
    </div>
    {expanded && <div className="p-3 border-top" id={`locations-${countryCode}`}>
      {catalog.loading && <div className="text-secondary mb-3" role="status">Loading locations…</div>}
      {catalog.error && <div className="alert alert-danger" role="alert">
        Could not load locations. {catalog.error}
        <button type="button" className="btn btn-sm btn-outline-danger ms-2" onClick={() => setAttempt(value => value + 1)}>Retry</button>
      </div>}
      <label className="form-label" htmlFor={`search-${countryCode}`}>Search states, provinces and territories</label>
      <input id={`search-${countryCode}`} type="search" className="form-control mb-3" value={search}
        onChange={event => setSearch(event.target.value)} placeholder="Search by name or code…" />
      <label className="form-check mb-3">
        <input ref={selectAll} type="checkbox" className="form-check-input" checked={allSelected}
          disabled={disabled || catalog.loading || !!catalog.error || !locations.length} onChange={event => toggleAll(event.target.checked)} />
        <span className="form-check-label">Select all locations in {country.name}</span>
      </label>
      <div className="overflow-auto" style={{ maxHeight: '20rem' }}>
        <div className="row g-2 mx-0">
          {filtered.map(location => <div className="col-12 col-sm-6 col-lg-4" key={codeKey(location.code)}>
            <label className="form-check mb-2">
              <input type="checkbox" className="form-check-input" checked={selectedKeys.has(codeKey(location.code))}
                disabled={disabled} onChange={event => toggleLocation(location.code, event.target.checked)} />
              <span className="form-check-label">{location.name}</span>
            </label>
          </div>)}
        </div>
        {!filtered.length && !catalog.loading && !catalog.error && <p className="text-secondary mb-0">
          {locations.length ? 'No locations match your search.' : 'No states, provinces or territories are available for this country.'}
        </p>}
      </div>
    </div>}
  </section>;
};

CountryLocations.propTypes = {
  country: PropTypes.object.isRequired,
  existingLocales: PropTypes.array.isRequired,
  selected: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired
};

const RegionEditor = ({ region, countries, moneyOutMerchants, isNew }) => {
  const navigate = useNavigate();
  const [baseline, setBaseline] = useState(() => editableRegion(region));
  const [draft, setDraft] = useState(() => editableRegion(region));
  const [includedCountries, setIncludedCountries] = useState(() => [...new Set((region?.locales ?? []).map(locale => codeKey(locale.countryCode)))]);
  const [countryToAdd, setCountryToAdd] = useState('');
  const [saveSettings, setSaveSettings] = useState({ status: 0 });
  const saveInFlight = useRef(false);
  const saving = saveSettings.status === 1;
  const dirty = selectionSignature(draft) !== selectionSignature(baseline);
  const hasUnlistedMerchant = draft.moneyOutMerchantId !== null
    && !moneyOutMerchants.some(merchant => String(merchant.id) === String(draft.moneyOutMerchantId));
  const countryOptions = new Map(countries.map(country => [codeKey(country.iso2), country]));
  (region?.locales ?? []).forEach(locale => {
    const code = codeKey(locale.countryCode);
    if (!countryOptions.has(code)) countryOptions.set(code, { iso2: code, name: locale.country?.name ?? code });
  });
  const availableCountries = [...countryOptions.values()].filter(country => !includedCountries.includes(codeKey(country.iso2))).sort(sortByName);
  const orderedCountries = includedCountries.map(code => countryOptions.get(code)).filter(Boolean).sort(sortByName);

  const changeDraft = next => {
    setDraft(next);
    setSaveSettings({ status: 0 });
  };
  const changeCountry = (code, stateCodes) => {
    changeDraft(values => ({ ...values, locales: [
      ...values.locales.filter(locale => codeKey(locale.countryCode) !== code),
      ...stateCodes.map(stateCode => ({ countryCode: code, stateCode }))
    ] }));
  };
  const submit = event => {
    event.preventDefault();
    if (saveInFlight.current) return;
    if (!draft.name.trim()) {
      setSaveSettings({ status: 0, error: 'Enter a region name.' });
      return;
    }
    const payload = { ...draft, name: draft.name.trim(), ...(isNew ? {} : { id: region.id }) };
    saveInFlight.current = true;
    setSaveSettings({ status: 1 });
    SendRequest(isNew ? 'POST' : 'PUT', isNew ? '/api/v1/regions' : `/api/v1/regions/${region.id}`, payload, result => {
      saveInFlight.current = false;
      setSaveSettings({ status: 2 });
      if (isNew) {
        if (result?.id) navigate(`/settings/regions/${result.id}`, { replace: true });
        else navigate('/settings/regions', { replace: true });
      } else {
        const next = editableRegion(payload);
        setDraft(next);
        setBaseline(next);
      }
    }, error => {
      saveInFlight.current = false;
      setSaveSettings({ status: 0, error: `Could not save the region. ${errorMessage(error)}` });
    });
  };

  return <PageHeader preTitle="Settings" title={isNew ? 'Create region' : baseline.name}
    breadcrumbs={[{ title: 'Regions', link: '/settings/regions' }, { title: isNew ? 'New region' : baseline.name }]}>
    <CardHeader>
      <SaveButton settings={saveSettings} onClick={submit} />
    </CardHeader>
    <div className="container-xl">
      <form onSubmit={submit}>
        <div className="card mb-3">
          <div className="card-header"><h3 className="card-title">General settings</h3></div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label required" htmlFor="region-name">Region name</label>
              <input id="region-name" name="name" className="form-control" value={draft.name} required disabled={saving}
                onChange={event => changeDraft(values => ({ ...values, name: event.target.value }))}
                placeholder="e.g. North America or Western US" />
            </div>
            <label className="form-label" htmlFor="region-money-out-merchant">Money-out merchant</label>
            <select id="region-money-out-merchant" name="moneyOutMerchantId" className="form-select"
              value={draft.moneyOutMerchantId ?? ''} disabled={saving}
              onChange={event => {
                const moneyOutMerchantId = event.target.value === '' ? null : Number(event.target.value);
                changeDraft(values => ({ ...values, moneyOutMerchantId }));
              }}>
              <option value="">Not set</option>
              {hasUnlistedMerchant && <option value={draft.moneyOutMerchantId}>Current merchant (ID: {draft.moneyOutMerchantId})</option>}
              {moneyOutMerchants.slice().sort(sortByName).map(merchant =>
                <option key={merchant.id} value={merchant.id}>{merchant.name}</option>
              )}
            </select>
          </div>
        </div>
        <div className="card mb-3">
          <div className="card-header">
            <div><h3 className="card-title mb-1">Included locations</h3>
              <div className="text-secondary">Add countries, then choose the states, provinces and territories included in this region.</div>
            </div>
          </div>
          <div className="card-body">
            <div className="row g-2 align-items-end mb-3">
              <div className="col-sm">
                <label className="form-label" htmlFor="add-country">Country</label>
                <select id="add-country" className="form-select" value={countryToAdd} disabled={saving || !availableCountries.length}
                  onChange={event => setCountryToAdd(event.target.value)}>
                  <option value="">{availableCountries.length ? 'Choose a country…' : 'All available countries have been added'}</option>
                  {availableCountries.map(country => <option key={country.iso2} value={codeKey(country.iso2)}>{country.name}</option>)}
                </select>
              </div>
              <div className="col-sm-auto">
                <button type="button" className="btn btn-outline-primary" disabled={saving || !countryToAdd} onClick={() => {
                  setIncludedCountries(values => [...new Set([...values, countryToAdd])]);
                  setCountryToAdd('');
                  setSaveSettings({ status: 0 });
                }}>Add country</button>
              </div>
            </div>
            {!orderedCountries.length && <div className="border rounded p-4 text-center text-secondary mb-3">
              No countries added. Choose a country above to start selecting locations.
            </div>}
            {orderedCountries.map(country => {
              const code = codeKey(country.iso2);
              return <CountryLocations key={code} country={country} disabled={saving}
                existingLocales={(region?.locales ?? []).filter(locale => codeKey(locale.countryCode) === code)}
                selected={draft.locales.filter(locale => codeKey(locale.countryCode) === code).map(locale => locale.stateCode)}
                onChange={codes => changeCountry(code, codes)} onRemove={() => {
                  setIncludedCountries(values => values.filter(value => value !== code));
                  changeCountry(code, []);
                }} />;
            })}
            <div className="text-secondary small">Selecting all includes the locations currently listed for that country.</div>
          </div>
        </div>
        <div className="text-secondary mb-4" role="status">{dirty ? 'Unsaved changes' : `${draft.locales.length} locations selected`}</div>
      </form>
    </div>
  </PageHeader>;
};

RegionEditor.propTypes = {
  region: PropTypes.object,
  countries: PropTypes.array.isRequired,
  moneyOutMerchants: PropTypes.array.isRequired,
  isNew: PropTypes.bool.isRequired
};

const RegionDetail = () => {
  const { regionId } = useParams();
  const isNew = !regionId || regionId.toLowerCase() === 'new';
  const { data, loading, error } = useQuery(GET_DATA, {
    variables: { regionIds: isNew ? [] : [regionId], isNew },
    fetchPolicy: 'network-only'
  });
  if (loading) return <DataLoading />;
  if (error || (!isNew && !data?.regions?.length)) return <PageHeader title="Region">
    <div className="container-xl">
      <div className="alert alert-danger" role="alert">{error ? `Could not load the region. ${error.message}` : 'Region not found.'}</div>
      <Link className="btn btn-outline-secondary" to="/settings/regions">Back to regions</Link>
    </div>
  </PageHeader>;
  const region = isNew ? undefined : data?.regions?.[0];
  return <RegionEditor key={regionId ?? 'new'}
    region={region ? { ...region, moneyOutMerchantId: region.moneyOutMerchant?.id ?? null } : undefined}
    countries={data?.countries ?? []} moneyOutMerchants={data?.moneyOutMerchants ?? []} isNew={isNew} />;
};

export default RegionDetail;
