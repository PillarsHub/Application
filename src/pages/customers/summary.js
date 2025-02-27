import React, { useEffect, useState } from 'react';
import { useParams } from "react-router-dom"
import { useQuery, gql } from "@apollo/client";
import { useFetch } from "../../hooks/useFetch";
import { GetScope, GetToken } from "../../features/authentication/hooks/useToken"
import PageHeader, { CardHeader } from '../../components/pageHeader';
import ChangeStatusModal from './changeStatusModal';
import DataLoading from '../../components/dataLoading';
import DataError from '../../components/dataError';
import Modal from '../../components/modal';
import StatusPill from './statusPill';
import Avatar from '../../components/avatar';
import LocalDate from "../../util/LocalDate";
import PeriodDatePicker from '../../components/periodDatePicker';
import DataCard from '../../components/dataCard';
import RankAdvance from '../../components/rankAdvance';
import { SendRequest } from '../../hooks/usePost';

import Widget from '../../features/widgets/components/widget';

var GET_CUSTOMER = gql`query ($nodeIds: [String]!, $periodDate: Date!) {
  customers(idList: $nodeIds) {
    id
    fullName
    enrollDate
    profileImage
    webAlias
    status {
      id
      name
      statusClass
    }
    emailAddress
    customerType {
      id
      name
    }
    socialMedia {
      name
      value
    }
    language
    customData
    phoneNumbers {
      type
      number
    }
    addresses {
      type
      line1
      line2
      line3
      city
      stateCode
      zip
      countryCode
    }
    cards(idList: ["Dashboard"], date: $periodDate) {
      id
      values {
        value
        valueName
        valueId
      }
    }
    widgets {
      id
      name
      title
      description
      type
      state
      showDatePicker
      headerColor
      headerTextColor
      headerAlignment
      backgroundColor
      textColor
      borderColor
      settings
      css
      panes {
        imageUrl
        title
        text
        description
        values {
          text
          value
        }
      }
    }
  }
  trees {
    id
    name
    nodes(nodeIds: $nodeIds, date: $periodDate) {
      nodeId
      uplineId
      uplineLeg
      upline {
        fullName
        profileImage
      }
    }
  }
  compensationPlans {
    period(date: $periodDate) {
      rankAdvance(nodeIds: $nodeIds) {
        nodeId
        rankId
        rankName
        requirements {
          maintanance
          conditions {
            legCap
            legValue
            required
            value
            valueId
          }
        }
      }
    }
  }
  customerStatuses {
    id
    name
    statusClass
    earningsClass
  }
}`;

Array.prototype.firstOrDefault = function () {
  if (this.length == 0) return null;
  return this[0];
};


const CustomerSummary = () => {
  let params = useParams()
  //const queryParams = new URLSearchParams(window.location.search)
  //const periodParam = queryParams.get("periodId") ?? "0";
  const [status, setStatus] = useState({ id: "INIT", name: "INIT" });
  const [periodDate, setPeriodDate] = useState(new Date().toISOString());
  const [showDelete, setShowDelete] = useState(false);
  const { data: dashboard, loading: dbLoading, error: dbError } = useFetch('/api/v1/dashboards/CSDB', {}, { id: 'CSDB', children: [] });

  const { loading, error, data, refetch } = useQuery(GET_CUSTOMER, {
    variables: { nodeIds: [params.customerId], periodDate: periodDate },
  });

  useEffect(() => {
    if (params.customerId) {
      SendRequest("POST", `/api/v1/Recent`, { customerId: params.customerId }, () => {
        //DoNothing
      }, (error) => {
        alert(error)
      })
    }
  }, [params])

  const handlePeriodChange = (name, value) => {
    setPeriodDate(value);
    refetch({ nodeIds: [params.customerId], periodDate: value });
  };

  if (loading || dbLoading) return <DataLoading />;
  if (error) return <DataError error={error} />;
  if (dbError) return <DataError error={dbError} />;

  const handleHide = () => setShowDelete(false);
  const handleShow = () => setShowDelete(true);

  const handleDelete = () => {
    SendRequest("DELETE", `/api/v1/Customers/${params.customerId}`, {}, () => {
      window.location = '/';
    }, (error) => {
      alert(error)
    })
  }

  const hasScope = GetScope() != undefined;
  const token = GetToken();

  let customer = data.customers[0] ?? { id: params.customerId, cards: [] };
  let currentRank = customer.cards?.[0]?.values.find(v => v.valueId.toLowerCase() == 'rank')?.value ?? 0;
  let rankAdvance = data.compensationPlans.flatMap(plan => plan.period || []).find(period => period.rankAdvance?.length > 0)?.rankAdvance || null;
  let address = customer.addresses ? customer.addresses[0] : { line1: '' };
  let trees = data.trees;
  let statuses = data.customerStatuses;
  if (customer.status == undefined) customer.status = { id: "Active", name: "Active" };

  let compensationPlans = data?.compensationPlans;
  let widgets = customer?.widgets;

  if (status.id == "INIT") setStatus(customer.status);

  return <>
    <PageHeader preTitle="Customer Detail" title={customer.fullName} pageId='summary' customerId={customer.id}>
      <CardHeader>
        {!hasScope && <>
          <div className="btn-list">
            {/* <a href={`/customers/${params.customerId}/shop`} className="btn btn-default">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-shopping-cart" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M6 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path><path d="M17 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path><path d="M17 17h-11v-14h-2"></path><path d="M6 5l14 1l-1 7h-13"></path></svg>
              Create Order
            </a> */}

            {token?.environmentId == '00' && <>
              <a href={`/Customers/${customer.id}/Edit`} className="btn btn-default">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-user-edit"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" /><path d="M6 21v-2a4 4 0 0 1 4 -4h3.5" /><path d="M18.42 15.61a2.1 2.1 0 0 1 2.97 2.97l-3.39 3.42h-3v-3l3.42 -3.39z" /></svg>
                Edit Customer
              </a>

              <div className="dropdown">
                <a href="#" className="btn btn-default btn-icon" data-bs-toggle="dropdown" aria-expanded="false">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="19" r="1"></circle><circle cx="12" cy="5" r="1"></circle></svg>
                </a>
                <div className="dropdown-menu dropdown-menu-end">
                  <a href={`/Customers/${customer.id}/Edit`} className="dropdown-item">Edit Customer</a>
                  <a href="#" className="dropdown-item" data-bs-toggle="modal" data-bs-target="#modal-status">Update Status</a>
                  <button className="dropdown-item text-danger" onClick={handleShow}>Delete</button>
                </div>
              </div>
            </>}

            {token?.environmentId != '00' && <>
              <a href="#" className="btn btn-default" data-bs-toggle="modal" data-bs-target="#modal-status">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-user-edit"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" /><path d="M6 21v-2a4 4 0 0 1 4 -4h3.5" /><path d="M18.42 15.61a2.1 2.1 0 0 1 2.97 2.97l-3.39 3.42h-3v-3l3.42 -3.39z" /></svg>
                Update Status
              </a>
            </>}

          </div>
        </>}
      </CardHeader>
      <div className="container-xl">
        <div className="row row-deck row-cards">
          {dashboard && dashboard?.children && dashboard.children.map((card) => {
            return buildCard(card, widgets, customer, compensationPlans, trees, periodDate);
          })}
          {dashboard.children.length == 0 && <>
            <div className="col-md-5 col-xl-4">
              <div className="card">
                <div className="card-header">
                  <div className="row w-100 g-2 align-items-center">
                    <div className="col-auto">
                      <Avatar className="me-2" name={customer.fullName} url={customer.profileImage} />
                    </div>
                    <div className="col">
                      <h4 className="card-title m-0">
                        <span>{customer.fullName}</span>
                      </h4>
                      <div className="text-muted">
                        {customer.customerType?.name ?? 'Unknown'}
                      </div>
                    </div>
                    <div className="col-auto">
                      <StatusPill status={status} />
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <dl className="row">
                    <dd className="col-5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2 text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><rect x="4" y="5" width="16" height="16" rx="2" /><line x1="16" y1="3" x2="16" y2="7" /><line x1="8" y1="3" x2="8" y2="7" /><line x1="4" y1="11" x2="20" y2="11" /><line x1="11" y1="15" x2="12" y2="15" /><line x1="12" y1="15" x2="12" y2="18" /></svg>
                      Enroll date</dd>
                    <dd className="col-7 text-end">
                      <LocalDate dateString={customer.enrollDate} />
                    </dd>
                    <dd className="col-5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2 text-muted" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7.5 7.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M3 6v5.172a2 2 0 0 0 .586 1.414l7.71 7.71a2.41 2.41 0 0 0 3.408 0l5.592 -5.592a2.41 2.41 0 0 0 0 -3.408l-7.71 -7.71a2 2 0 0 0 -1.414 -.586h-5.172a3 3 0 0 0 -3 3z" /></svg>
                      Handle
                    </dd>
                    <dd className="col-7 text-end">{customer.webAlias ?? customer.id}</dd>
                    {!hasScope && <>
                      <dd className="col-5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2 text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M3 5m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z"></path><path d="M3 7l9 6l9 -6"></path></svg>
                        Email</dd>
                      <dd className="col-7 text-end">{customer.emailAddress}</dd>


                      <dd className="col-5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2 text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2"></path><path d="M15 7a2 2 0 0 1 2 2"></path><path d="M15 3a6 6 0 0 1 6 6"></path></svg>
                        Phone</dd>
                      <dd className="col-7 text-end">{customer.phoneNumbers && customer.phoneNumbers.length > 0 && customer.phoneNumbers[0].number}</dd>

                      <dd className="col-5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2 text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M12 20l-3 -3h-2a3 3 0 0 1 -3 -3v-6a3 3 0 0 1 3 -3h10a3 3 0 0 1 3 3v6a3 3 0 0 1 -3 3h-2l-3 3"></path><path d="M8 9l8 0"></path><path d="M8 13l6 0"></path></svg>
                        Language</dd>
                      <dd className="col-7 text-end">{customer.language}</dd>

                      <dd className="col-5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2 text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M8 7v-2a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v2"></path><line x1="12" y1="12" x2="12" y2="12.01"></line><path d="M3 13a20 20 0 0 0 18 0"></path></svg>
                        Merchant</dd>
                      <dd className="col-7 text-end">{customer.merchantId}</dd>

                      <dd className="col-5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2 text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M17 8v-3a1 1 0 0 0 -1 -1h-10a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3m0 4v3a1 1 0 0 1 -1 1h-12a2 2 0 0 1 -2 -2v-12"></path><path d="M20 12v4h-4a2 2 0 0 1 0 -4h4"></path></svg>
                        Payment Status</dd>
                      <dd className="col-7 text-end">{status.earningsClass}</dd>

                      <dd className="col-5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2 text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><circle cx="12" cy="11" r="3"></circle><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z"></path></svg>
                        Shipping Address</dd>
                      <dd className="col-7 text-end">
                        <address>
                          {address?.line1} {address?.line2} {address?.line3}<br />
                          {address?.city}, {address?.stateCode} {address?.postalCode} <br />
                          {address?.countryCode}
                        </address>
                      </dd>
                    </>}
                  </dl>
                </div>
              </div>
            </div>
            <div className="col-md-7 col-xl-8">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Business Overview</h3>
                  <div className="card-actions">
                    <PeriodDatePicker value={periodDate} onChange={handlePeriodChange} />
                  </div>
                </div>
                <div className="card-body">
                  <div className="datagrid">
                    <DataCard data={customer.cards[0]?.values} />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-5 col-xl-4">
              <div className="card">
                <RankAdvance currentRank={currentRank} ranks={rankAdvance} />
              </div>
            </div>
            <div className="col-md-7 col-xl-8">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">
                    Organization
                  </h3>
                </div>
                <div className="list-group list-group-flush">
                  {trees.map((tree) => {
                    return tree.nodes.map((node) => {
                      return <div key={tree.id} className="list-group-item">
                        <a className="row align-items-center text-reset" href={`/Customers/${node.uplineId}/Summary`}>
                          <div className="col-auto">
                            <Avatar name={node.upline?.fullName} url={node.upline?.profileImage} size="sm" />
                          </div>
                          <div className="col text-truncate">
                            <span className='text-reset' >{node.upline?.fullName}</span>
                            <div className="d-block text-muted text-truncate mt-n1">{tree.name}</div>
                          </div>
                        </a>
                      </div>
                    })
                  })}
                </div>
              </div>
            </div>
          </>}
          {!hasScope && <>
            <div className="col-md-12">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Account Activity</h3>
                </div>
                <div className="table-responsive">
                  <table className="table table-vcenter card-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Message</th>
                        <th>Submitted By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* @foreach(var item in @Model.Customer.ActivityLog)
                                          { */}
                      <tr>
                        <td></td>
                        <td></td>
                        <td className="text-muted"></td>
                      </tr>
                      {/* } */}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>}

        </div>
        <ChangeStatusModal customerId={customer.id} id="modal-status" statusId={status.id} setStatus={setStatus} statuses={statuses} />
      </div>
    </PageHeader >

    <Modal showModal={showDelete} size="sm" onHide={handleHide}>
      <div className="modal-body">
        <input type="hidden" />
        <input value="@Model.CustomerId" type="hidden" />
        <div className="modal-title">Are you sure?</div>
        <div>Do you wish to delete &apos;<em>{customer.fullName}&apos;</em>?</div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-link link-secondary me-auto" data-bs-dismiss="modal">Cancel</button>
        <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete Customer</button>
      </div>
    </Modal>

  </>
};

function buildCard(card, widgets, customer, compensationPlans, trees, date) {
  if ((card?.widgetId || card?.children) && widgets !== undefined) {
    let widget = widgets.find((w) => w.id === card?.widgetId ?? '');
    if (!widget && (!card.children || card.children.length == 0)) return <></>

    return <div key={card?.id} className={`col-sm-12 col-lg-${card?.columns > 6 ? '12' : '6'} col-xl-${card?.columns}`}>
      {card?.widgetId && widget && <Widget key={card?.widgetId} widget={widget} customer={customer} compensationPlans={compensationPlans} trees={trees} date={date} />}
      {card.children && card.children.length > 0 && <>
        <div className="card card-borderless card-transparent">
          <div className="row row-cards row-deck">
            {card.children.map((c) => {
              return buildCard(c, widgets, customer, compensationPlans, trees, date);
            })}
          </div>
        </div>
      </>}
    </div>
  }
}

export default CustomerSummary;