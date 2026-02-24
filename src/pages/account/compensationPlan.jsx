import React, { useState } from 'react';
import { useParams } from "react-router-dom"
import { useFetch } from '../../hooks/useFetch'
import PageHeader, { CardHeader } from '../../components/pageHeader.jsx';
import RanksCard from './components/ranksCard.jsx';
import BonusesCard from './components/bonusesCard.jsx';
import PayoutChart from './components/payoutChart.jsx';
import AssignTemplateModal from './components/assignTemplateModal.jsx';
import DeleteTemplateModal from './components/deleteTemplateModal.jsx';
import ShareTemplateModal from './components/shareTemplateModal.jsx';
import CopyTemplateModal from './components/copyTemplateModal.jsx';

const CompensationPlan = () => {
  const params = useParams();
  const [showDelete, setShowDelete] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showCopy, setShowCopy] = useState(false);
  const { loading, error, data } = useFetch("/api/v1/Templates/" + params.id);

  if (loading || !data) return <span>-</span>;
  if (error) return `Error! ${error}`;

  data.customerTypes = data.sourceGroups.find((element) => element.id.toLowerCase() == 'custtype')?.acceptedValues.map((c) => ({ ...c, uiId: c.uiId ?? crypto.randomUUID() }));

  const canCopy = false;// (data.scope == "Private" || data.scope == "Public");

  return <>

    <PageHeader title={data.name} pretitle="Compensation Plan Details">
      <CardHeader>
        <div className="col-auto ms-auto d-print-none">
          <div className="btn-list">
            <AssignTemplateModal templateId={params.id} />

            {canCopy && <div className="btn-group">
              <div className="dropdown">
                <a href="#" className="btn btn-default btn-icon" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="19" r="1"></circle><circle cx="12" cy="5" r="1"></circle></svg>
                </a>
                <div className="dropdown-menu dropdown-menu-end" >
                  {data.scope == "Private" && <a className="dropdown-item" href={`/templates/${params.id}/edit`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon dropdown-item-icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
                    Edit
                  </a>}
                  <button className="dropdown-item" onClick={() => setShowCopy(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon dropdown-item-icon" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M8 8m0 2a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2z"></path><path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2"></path></svg>
                    Make a copy
                  </button>
                  {data.scope == "Private" && <button className="dropdown-item" onClick={() => setShowShare(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon dropdown-item-icon" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M6 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"></path><path d="M18 6m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"></path><path d="M18 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"></path><path d="M8.7 10.7l6.6 -3.4"></path><path d="M8.7 13.3l6.6 3.4"></path></svg>
                    Share
                  </button>}
                  {/* <a className="dropdown-item" href="#">
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon dropdown-item-icon" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"></path><path d="M7 11l5 5l5 -5"></path><path d="M12 4l0 12"></path></svg>
                      Download (.pdf)
                    </a> */}
                  {data.scope == "Private" && <button className="dropdown-item text-danger" onClick={() => setShowDelete(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon dropdown-item-icon" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 7l16 0"></path><path d="M10 11l0 6"></path><path d="M14 11l0 6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
                    Delete template
                  </button>}
                </div>
              </div>
            </div>}
          </div>
        </div>
      </CardHeader>
      <div className="page-body">
        <div className="container-xl">
          <div className="row row-deck row-cards">
            <div className="col-12">
              <div className="row row-cards">
                <div className="col-sm-6 col-lg-3">
                  <div className="card card-sm">
                    <div className="card-body">
                      <div className="row align-items-center">
                        <div className="col-auto">
                          <div className="font-weight-medium">
                            <span className="h1 mb-3">{data.avgPayoutPercent}%</span>
                          </div>
                        </div>
                        <div className="col">
                          <div className="font-weight-medium">
                            Average Payout
                          </div>
                        </div>
                        <div className="col-auto">
                          <span className="form-help" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-html="true" title="<p>The <b>Average</b> percent of total volume to be payed out across all bonuses each period. This is just an estimate and can vary based on the number of customers.</p>">?</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                  <div className="card card-sm">
                    <div className="card-body">
                      <div className="row align-items-center">
                        <div className="col-auto">
                          <div className="font-weight-medium">
                            <span className="h1 mb-3">{data.maxPayoutPercent}%</span>
                          </div>
                        </div>
                        <div className="col">
                          <div className="font-weight-medium">
                            Maximum Payout
                          </div>
                        </div>
                        <div className="col-auto">
                          <span className="form-help" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-html="true" title="<p>The absolute <b>Maximum</b> percent of total volume that can be payed out across all bonuses each period.</p>">?</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                  <div className="card card-sm">
                    <div className="card-body">
                      <div className="row align-items-center">
                        <div className="col-auto">
                          <div className="font-weight-medium">
                            <span className="h1 mb-3">{data.bonusDefinitions.length}</span>
                          </div>
                        </div>
                        <div className="col">
                          <div className="font-weight-medium">
                            Ways to Earn
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-sm-6 col-lg-3">
                  <div className="card card-sm">
                    <div className="card-body">
                      <div className="row align-items-center">
                        <div className="col-auto">
                          <div className="font-weight-medium">
                            <span className="h1 mb-3">{data.ranks.length}</span>
                          </div>
                        </div>
                        <div className="col">
                          <div className="font-weight-medium">
                            Rank Achievements
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {data.ranks.length > 0 &&
              <div className="col-lg-12">
                <div className="card">
                  <div className="card-body">
                    <PayoutChart bonuses={data.bonusDefinitions} definitions={data.definitions} customerTypes={data.customerTypes} ranks={data.ranks} />
                  </div>
                </div>
              </div>
            }

            <div className="col-lg-12">
              <div className="card">
                <div className="">
                  <h2 className="accordion-header" id="heading-002">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-002" aria-expanded="false">
                      Glossary of Terms
                    </button>
                  </h2>
                  <div id="collapse-002" className="accordion-collapse collapse" data-bs-parent="#accordion-example">
                    <div className="accordion-body border-top pt-0">
                      <div className="pt-3 ms-3 me-3" style={{ columnCount: '3', columnGap: '70px', columnRule: '1px solid rgba(98,105,118,.26)' }}>
                        {data.definitions && data.definitions.sort((a, b) => a.index - b.index).map((term) => {
                          return <div key={term.name} style={{ breakInside: 'avoid-column' }} >
                            <div className="row">
                              <div className="col d-flex align-items-center">
                                <h3 className="card-title mb-1">{term.name}</h3>
                                {term.valueId && <small className="ms-1 text-muted">({term.valueId})</small>}
                              </div>
                            </div>
                            <div className="mb-4">{term.comment}</div>
                          </div>
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <RanksCard ranks={data.ranks} />
            <BonusesCard bonuses={data.bonusDefinitions} definitions={data.definitions} customerTypes={data.customerTypes} ranks={data.ranks} />
          </div>
        </div>
      </div>
    </PageHeader>

    <DeleteTemplateModal show={showDelete} setShow={setShowDelete} templateId={params.id} templateName={data?.name} />
    <ShareTemplateModal show={showShare} setShow={setShowShare} templateId={params.id} templateName={data?.name} />
    <CopyTemplateModal show={showCopy} setShow={setShowCopy} templateId={params.id} templateName={data?.name} />
  </>
};

export default CompensationPlan;