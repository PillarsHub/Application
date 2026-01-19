import React from "react-dom/client";
import { useState } from 'react';
import { useParams } from "react-router-dom"
import { useQuery, gql } from "@apollo/client";
import PageHeader from "../../components/pageHeader";
import Modal from "../../components/modal";
import DataLoading from "../../components/dataLoading";
import { Get } from "../../hooks/useFetch";
import { SendRequest } from "../../hooks/usePost";
import MultiSelect from "../../components/muliselect";

var GET_DATA = gql`query ($regionIds: [String]!) {
  regions(idList: $regionIds){
    id
    name
    locales {
      countryCode
      stateCode
      country {
        iso2
        name
      }
      state {
        iso2
        countryIso2
        name
      }
    }
  }  
  countries
    {
      iso2
      name
    }
}`;

const RegionDetail = () => {
  let params = useParams()
  const [show, setShow] = useState(false);
  const [states, setStates] = useState([]);
  const [activeItem, setActiveItem] = useState({});
  const { data, loading, error, refetch } = useQuery(GET_DATA, {
    variables: { regionIds: [params.regionId] },
  });

  if (loading) return <DataLoading />;
  if (error) return `Error! ${error}`;

  const handleChange = (name, value) => {
    setActiveItem(values => ({ ...values, [name]: value }))
  }

  const handleCountryChange = e => {
    let code = e.target.value;
    Get(`/api/v1/Countries/${code}/States`, (d) => {
      setStates(d);
    }, (error) => {
      alert(error);
    })

    handleChange('countryCode', code);
  }

  let region = data.regions[0];

  const handleClose = () => setShow(false);
  const handleShow = () => {
    setShow(true);
  }

  const handleRemoveState = (state) => {
    if (!state?.countryCode || !state?.stateCode || !region) return;

    const removeCountry = state.countryCode.toUpperCase();
    const removeState = state.stateCode.toUpperCase();

    // Keep every locale except the one matching country+state
    const localsWithItemRemoved = (region.locales ?? [])
      .filter(l => {
        const cc = (l?.countryCode ?? '').toUpperCase();
        const sc = (l?.stateCode ?? '').toUpperCase();
        return !(cc === removeCountry && sc === removeState);
      })
      // keep payload shape consistent with your handleSubmit
      .map(l => ({ countryCode: l.countryCode, stateCode: l.stateCode }));

    const item = {
      id: region.id,
      name: region.name,
      locales: localsWithItemRemoved
    };

    SendRequest('PUT', `/api/v1/regions/${item.id}`, item, () => {
      refetch();
    }, (error) => {
      alert(error);
    });
  };



  const handleSubmit = async e => {
    e.preventDefault();
    setShow(false);

    let locales = region.locales.map((l) => {
      if (l.countryCode.toUpperCase() != activeItem.countryCode.toUpperCase()) return { countryCode: l.countryCode, stateCode: l.stateCode };
    });

    let locals2 = activeItem.stateCodes.map((s) => {
      return { countryCode: activeItem.countryCode, stateCode: s };
    });

    const mergeResult = [...locals2, ...locales];
    let item = { id: region.id, name: region.name, locales: mergeResult.filter(n => n) };

    SendRequest('PUT', `/api/v1/regions/${item.id}`, item, () => {
      refetch();
    }, (error) => {
      alert(error);
    });
  }


  return <PageHeader title="Region Locales" breadcrumbs={[{ title: 'Regions', link: '/settings/regions' }, { title: region?.name }]}>
    <div className="container-xl">
      <div className="row row-cards">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header">
              <button className="btn btn-primary" onClick={() => handleShow('')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Add Locale
              </button>
            </div>
            <div>
              <div className="table-responsive">
                <table className="table card-table table-vcenter text-nowrap datatable">
                  <thead>
                    <tr>
                      <th>Country</th>
                      <th>States</th>
                      <th className="w-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {region?.locales && region.locales.map((item) => {
                      return <tr key={item.countryCode}>
                        <td>
                          {item.country?.name ?? item.countryCode}
                        </td>
                        <td>{item.state?.name ?? item.stateCode}</td>
                        <td>
                          <button className="btn btn-ghost-secondary btn-icon" onClick={() => handleRemoveState(item)}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-trash" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 7l16 0"></path><path d="M10 11l0 6"></path><path d="M14 11l0 6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
                          </button>
                        </td>
                      </tr>
                    })}

                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Modal showModal={show} onHide={handleClose} >
      <div className="modal-header">
        <h5 className="modal-title">Region</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">

        <div className="row">
          <div className="col-md-12">
            <div className="mb-3">
              <label className="form-label">Country</label>
              <select className="form-select" onChange={handleCountryChange} >
                <option disabled selected value> -- select an option -- </option>
                {data.countries && data.countries.map((country) => {
                  return <option key={country.iso2} value={country.iso2} >{country.name}</option>
                })}
              </select>
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-md-12">
            <div className="mb-3">
              <label className="form-label">States</label>
              <MultiSelect className="form-select" name="stateCodes" value={activeItem.stateCodes} onChange={handleChange}>
                {(states ?? [])
                  .slice()
                  .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', undefined, { sensitivity: 'base', numeric: true }))
                  .map((state) => (
                    <option key={state.iso2} value={state.iso2}>
                      {state.name}
                    </option>
                  ))}
              </MultiSelect>
              <span className="text-danger"></span>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
          Cancel
        </a>
        <button type="submit" className="btn btn-primary ms-auto" onClick={handleSubmit}>
          Save Region
        </button>
      </div>
    </Modal>

  </PageHeader>
}

export default RegionDetail;