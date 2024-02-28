import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Post } from '../../../hooks/usePost';
import OffCanvas from '../../../components/offCanvas';
import StatusPill from '../statusPill';
import Avatar from '../../../components/avatar';
import LocalDate from '../../../util/LocalDate';
import { GetScope } from "../../../features/authentication/hooks/useToken"

let GET_CUSTOMER = `query ($nodeIds: [String]!, $period: BigInt!, $treeId: ID!) {
  customers(idList: $nodeIds) {
    id
    fullName
    enrollDate
    profileImage
    status
    {
      id,
      name,
      statusClass
    }
    emailAddress
    customerType {
    id
    name
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
    cards(idList: ["TreeSlideout"], periodId: $period){
      id
      values{
        value
        valueName
        valueId
      }
    }
  }
  tree(id: $treeId)
  {
    id
    nodes(nodeIds:$nodeIds)
    {
      nodeId
      uplineId
      uplineLeg
      upline{
        fullName
      }
    }
  }
}`;

const TreeSideCard = ({ customerId, periodId, treeId, showModal }) => {
  const [customer, setCustomer] = useState(undefined);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClose = () => setShow(false);

  const handleShowPlacemntModel = () => {
    showModal({ nodeId: customer.tree.nodeId, uplineId: customer.tree.uplineId, uplineLeg: customer.tree.uplineLeg });
  }

  useEffect(() => {
    if (customerId) {
      setLoading(true);
      setShow(true);
      Post('/graphql', { query: GET_CUSTOMER, variables: { nodeIds: [customerId], period: parseInt(periodId), treeId: treeId } }, (r) => {
        r.data.customers[0].tree = r.data.tree.nodes[0];
        setCustomer(r.data.customers[0]);
        setLoading(false);
      }, (error) => {
        alert(error);
      });
    } else{
      setShow(false);
    }
  }, [customerId]);

  return <OffCanvas showModal={show} onHide={handleClose} >
    {loading && <span>loading...</span>}
    {customer && <>
      <div className="card-header">
        <h2 className="card-title">
          <div className="row g-2 align-items-top">
            <div className="col-auto">
              <Avatar name={customer?.fullName} url={customer?.profileImage} size="" />
            </div>
            <div className="col ">
              <h2 className="card-title m-0">{customer?.fullName}</h2>
              <a className='small text-muted' href={`/customers/${customer.id}/summary`}>{customer.id}</a>
            </div>
          </div>
        </h2>
        <div className="card-actions">
          <button type="button" className="btn-close text-reset" onClick={handleClose} ></button>
        </div>
      </div>
      <div className="card-body">
        <dl className="row">
          <dd className="col-5"></dd>
          <dd className="col-7 text-end"><StatusPill status={customer.status} /></dd>

          <dd className="col-5">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2 text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><rect x="4" y="5" width="16" height="16" rx="2" /><line x1="16" y1="3" x2="16" y2="7" /><line x1="8" y1="3" x2="8" y2="7" /><line x1="4" y1="11" x2="20" y2="11" /><line x1="11" y1="15" x2="12" y2="15" /><line x1="12" y1="15" x2="12" y2="18" /></svg>
            Enroll date</dd>
          <dd className="col-7 text-end"><LocalDate dateString={customer.enrollDate} /></dd>

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
        </dl>
      </div>
      <div className="card-body">
        <h3 className="card-title" >Upline</h3>
        <dl className="row">
          <dd className="col-5">Name</dd>
          <dd className="col-7 text-end">{customer.tree.upline.fullName}</dd>
          <dd className="col-5">Leg</dd>
          <dd className="col-7 text-end">{customer.tree.uplineLeg}</dd>
        </dl>
        {(GetScope() == undefined || (GetScope() == customer.tree.uplineId && customer.tree.uplineLeg == "Holding Tank") ) && <button className="btn w-100" onClick={handleShowPlacemntModel}>Change Placement</button>}
      </div>
      <div className="card-body">
        <h3 className="card-title" >Business Overview</h3>

        <div className="datagrid">
          {customer.cards && customer.cards[0]?.values && customer.cards[0]?.values.map((stat) => {
            return <div key={stat.valueId} className="datagrid-item">
              <div className="datagrid-title">{stat.valueName} {stat.valueId == stat.valueName ? `` : `(${stat.valueId})`}</div>
              <div className="datagrid-content">{stat.value}</div>
            </div>
          })}
        </div>

      </div>
    </>}
  </OffCanvas>
}

export default TreeSideCard;

TreeSideCard.propTypes = {
  customerId: PropTypes.string,
  periodId: PropTypes.string.isRequired,
  treeId: PropTypes.string.isRequired,
  showModal: PropTypes.func.isRequired
}
