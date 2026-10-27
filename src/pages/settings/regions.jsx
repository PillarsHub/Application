import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import PageHeader from '../../components/pageHeader';
import SettingsNav from './settingsNav';
import Modal from '../../components/modal';
import { SendRequest } from '../../hooks/usePost';

const GET_REGIONS = gql`query RegionList {
  regions {
    name
    id
    locales {
      countryCode
      country { name }
      stateCode
    }
  }
}`;

function coverageByCountry(locales = []) {
  const countries = new Map();
  locales.forEach(locale => {
    const code = (locale.countryCode ?? '').toUpperCase();
    if (!countries.has(code)) countries.set(code, { code, name: locale.country?.name ?? code, states: new Set() });
    countries.get(code).states.add((locale.stateCode ?? '').toUpperCase());
  });
  return [...countries.values()].sort((a, b) => a.name.localeCompare(b.name));
}

const Regions = () => {
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleteRegion, setDeleteRegion] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const deleteInFlight = useRef(false);
  const { loading, error, data, refetch } = useQuery(GET_REGIONS, { fetchPolicy: 'cache-and-network' });
  const finishDelete = () => {
    deleteInFlight.current = false;
    setDeletingId(null);
  };
  const handleShowDelete = region => {
    if (deleteInFlight.current) return;
    setDeleteRegion(region);
    setDeleteError('');
    setShowDelete(true);
  };
  const handleHideDelete = () => setShowDelete(false);
  const handleDelete = () => {
    if (deleteInFlight.current || !deleteRegion) return;
    const region = deleteRegion;
    deleteInFlight.current = true;
    setShowDelete(false);
    setDeletingId(region.id);
    setDeleteError('');
    SendRequest('DELETE', `/api/v1/regions/${region.id}`, {}, () => {
      refetch().catch(() => {
        setDeleteError('The region was deleted, but the list could not be refreshed. Reload the page to see the updated list.');
      }).finally(finishDelete);
    }, error => {
      setDeleteError(`Could not delete "${region.name}". ${typeof error === 'string' ? error : error?.message || 'Please try again.'}`);
      finishDelete();
    });
  };
  const regions = (data?.regions ?? []).filter(region =>
    `${region.name} ${coverageByCountry(region.locales ?? []).map(country => country.name).join(' ')}`
      .toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
  );

  return <><PageHeader preTitle="Settings" title="Regions">
    <SettingsNav pageId="regions" loading={loading && !data} error={error?.message}>
      <div className="card-header flex-wrap gap-3">
        <div className="flex-fill" style={{ flexBasis: '20rem' }}>
          <h3 className="card-title mb-1">Regions</h3>
        </div>
        <div className="ms-auto" style={{ flex: '1 1 16rem', maxWidth: '24rem' }}>
          <label className="visually-hidden" htmlFor="region-search">Search regions or countries</label>
          <input id="region-search" type="search" className="form-control" value={search}
            onChange={event => setSearch(event.target.value)} placeholder="Search regions or countries…" />
        </div>
      </div>
      {deletingId !== null && <div className="text-secondary m-3" role="status">Deleting region…</div>}
      {deleteError && <div className="alert alert-danger m-3" role="alert">{deleteError}</div>}
      <div className="table-responsive">
        <table className="table card-table table-vcenter">
          <thead><tr><th>Region</th><th>Coverage</th><th className="w-1"><span className="visually-hidden">Actions</span></th></tr></thead>
          <tbody>
            {regions.map(region => <tr key={region.id}>
              <td>{region.name}</td>
              <td>
                {coverageByCountry(region.locales ?? []).map(country =>
                  <div key={country.code}>{country.name}: <span className="text-secondary">{country.states.size} selected {country.states.size === 1 ? 'location' : 'locations'}</span></div>
                )}
                {!region.locales?.length && <span className="text-secondary">No locations selected</span>}
              </td>
              <td className="text-nowrap">
                <Link className="btn btn-ghost-secondary btn-icon" to={`/settings/regions/${region.id}`}
                  aria-label={`Edit ${region.name}`} title={`Edit ${region.name}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path>
                    <path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path>
                    <path d="M16 5l3 3"></path>
                  </svg>
                </Link>
                <button type="button" className="btn btn-ghost-secondary btn-icon"
                  aria-label={`Delete ${region.name}`} title={`Delete ${region.name}`}
                  disabled={deletingId !== null} onClick={() => handleShowDelete(region)}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-trash" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M4 7l16 0"></path>
                    <path d="M10 11l0 6"></path>
                    <path d="M14 11l0 6"></path>
                    <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path>
                    <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path>
                  </svg>
                </button>
              </td>
            </tr>)}
            {!regions.length && <tr><td colSpan="3" className="text-center text-secondary py-5">
              {search ? 'No regions match your search.' : 'No regions yet. Add a region to choose its included locations.'}
            </td></tr>}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3" className="text-end">
                <Link className="btn btn-primary" to="/settings/regions/new">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-map-plus" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M12 18.5l-3 -1.5l-6 3v-13l6 -3l6 3l6 -3v8.5"></path>
                    <path d="M9 4v13"></path>
                    <path d="M15 7v8"></path>
                    <path d="M16 19h6"></path>
                    <path d="M19 16v6"></path>
                  </svg>
                  Add Region
                </Link>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </SettingsNav>
  </PageHeader>
    <Modal showModal={showDelete} size="sm" onHide={handleHideDelete}>
      <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      <div className="modal-body text-center py-4">
        <h3>Are you sure?</h3>
        <div className="text-muted">Do you really want to remove <strong>{deleteRegion?.name}</strong>?</div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-link link-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" className="btn btn-danger ms-auto" disabled={deletingId !== null} onClick={handleDelete}>Delete Region</button>
      </div>
    </Modal>
  </>;
};

export default Regions;
