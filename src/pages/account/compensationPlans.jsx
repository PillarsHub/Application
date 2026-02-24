import React, { useState, useEffect, useRef } from 'react';
import { useFetch } from '../../hooks/useFetch.js'
import CheckBox from "../../components/checkbox.jsx"
import Switch from "../../components/switch.jsx"
import PageHeader from '../../components/pageHeader.jsx';

const CompensationPlans = () => {
  const [search, setSearch] = useState('');
  const [averageMin, setAverageMin] = useState('');
  const [averageMax, setAverageMax] = useState('');
  const [params, setParams] = useState({ retail: true, unilevel: true, affiliate: true, binary: true, other: true, priveOnly: false });
  const { loading, error, data, refetch } = useFetch("/api/v1/Templates", params);
  const isFirstRender = useRef(true);

  const handleChange = (name, value) => {
    setParams(values => ({ ...values, [name]: value }));
  }

  const handleSearch = (e) => {
    e.preventDefault();
    refetch({ ...params, search: search, averageMin: averageMin, averageMax: averageMax });
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
    } else {
      refetch(params);
    }
  }, [params])

  if (loading) return <span>loading....</span>;
  if (error) return `Error! ${error}`;

  let hasTemplates = data && data.length > 0;

  return <>
    <PageHeader title="Compensation Plan Library" preTitle="Account" >
      <div className="page-body">
        <div className="container-xl">
          <div className="row g-4">
            <div className="col-md-3">
              <form onSubmit={handleSearch} >
                <div className="subheader mb-2">Bonus Types</div>
                <div className="mb-4">
                  <label className="form-check">
                    <CheckBox name="retail" value={params.retail} onChange={handleChange} />
                    <span className="form-check-label">Retail</span>
                  </label>
                  <label className="form-check">
                    <CheckBox name="unilevel" value={params.unilevel} onChange={handleChange} />
                    <span className="form-check-label">Unilevel / Team</span>
                  </label>
                  <label className="form-check">
                    <CheckBox name="affiliate" value={params.affiliate} onChange={handleChange} />
                    <span className="form-check-label">Affiliate</span>
                  </label>
                  <label className="form-check">
                    <CheckBox name="binary" value={params.binary} onChange={handleChange} />
                    <span className="form-check-label">Binary / Duel Team</span>
                  </label>
                  <label className="form-check">
                    <CheckBox name="other" value={params.other} onChange={handleChange} />
                    <span className="form-check-label">Other / Custom</span>
                  </label>
                </div>

                <div className="subheader mb-2">Average Payout</div>
                <div className="row g-1 align-items-center mb-3">
                  <div className="col">
                    <div className="input-icon">
                      <input type="text" className="form-control" name="averageMin" value={averageMin} placeholder="Min" autoComplete="off" onChange={(e) => setAverageMin(e.target.value)} />
                      <span className="input-icon-addon">%</span>
                    </div>
                  </div>
                  <div className="col">
                    <div className="input-icon">
                      <input type="text" className="form-control" name="averageMax" value={averageMax} placeholder="Max" autoComplete="off" onChange={(e) => setAverageMax(e.target.value)} />
                      <span className="input-icon-addon">%</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="input-icon mb-3">
                    <input type="text" className="form-control" value={search} placeholder="Search…" onChange={(e) => setSearch(e.target.value)} />
                    <span className="input-icon-addon">
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><circle cx="10" cy="10" r="7"></circle><line x1="21" y1="21" x2="15" y2="15"></line></svg>
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="row">
                    <span className="col">Private templates only</span>
                    <span className="col-auto">
                      <Switch name="priveOnly" value={params.priveOnly} onChange={handleChange} />
                    </span>
                  </label>
                  <label className="row">
                    <span className="col">Shared templates only</span>
                    <span className="col-auto">
                      <Switch name="sharedOnly" value={params.sharedOnly} onChange={handleChange} />
                    </span>
                  </label>
                </div>

                <div className="mt-5">
                  <button type="submit" className="btn btn-primary w-100">
                    Confirm changes
                  </button>
                </div>
              </form>
            </div>

            <div className="col-md-9">
              <div className="row row-cards">
                <div className="space-y">
                  {!hasTemplates &&
                    <div className="empty">
                      <p className="empty-title">No results found</p>
                      <p className="empty-subtitle text-muted">
                        Try adjusting your search or filter to find what youre looking for.
                      </p>
                    </div>
                  }


                  {hasTemplates && data && data.map((template) => {

                    const distinctBonusDefinitions = template?.bonusDefinitions?.filter((bonus, index, self) => {
                      if (self.findIndex((b) => b.bonusClass === bonus.bonusClass) === index) {
                        return true;
                      }
                      return false;
                    }) ?? undefined;

                    return <a key={template.id} href={`/account/compensationplans/${template.id}/detail`} className="d-block link-dark">
                      <div className="card">
                        {template.scope == 'Private' &&
                          <div className="ribbon bg-info">Private</div>
                        }
                        {template.scope == 'Shared' &&
                          <div className="ribbon bg-danger">Shared</div>
                        }
                        <div className="row g-0">
                          <div className="col-auto">
                            <div className="card-body">
                            </div>
                          </div>
                          <div className="col">
                            <div className="card-body ps-0">
                              <div className="row">
                                <div className="col">
                                  <h3 className="mb-0">{template.name}</h3>
                                </div>
                              </div>
                              <div className="row">
                                <div className="col-md">
                                  {template.description}
                                </div>
                              </div>
                              <div className="row">
                                <div className="col-md">
                                  <div className="mt-3 list-inline list-inline-dots mb-0 text-muted d-sm-block d-none">
                                    {template.avgPayoutPercent && <div className="list-inline-item" title="Average Payout">
                                      Average Payout: <strong>{template.avgPayoutPercent}%</strong>
                                    </div>}
                                    {template.maxPayoutPercent && <div className="list-inline-item" title="Maximum Payout">
                                      Maximum Payout: <strong>{template.maxPayoutPercent}%</strong>
                                    </div>}
                                    <div className="list-inline-item" title="Ways to Earn">
                                      Ways to Earn: <strong>{template.waysToEarn}</strong>
                                    </div>
                                  </div>
                                </div>
                                <div className="col-md-auto">
                                  <div className="mt-3 badges">

                                    {distinctBonusDefinitions && (
                                      <div>
                                        {distinctBonusDefinitions.sort((a, b) => b.index - a.index).slice(0, 3).map((bonus) => {
                                          return <span key={bonus.bonusClass} className="badge badge-outline text-muted border fw-normal badge-pill">
                                            {bonus.bonusClass}
                                          </span>
                                        })}
                                        {distinctBonusDefinitions.length > 3 &&
                                          <span className="badge badge-outline text-muted border fw-normal badge-pill">
                                            + {distinctBonusDefinitions.length - 3} more
                                          </span>
                                        }
                                      </div>
                                    )}

                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </a>
                  })
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageHeader >
  </>
};

export default CompensationPlans;