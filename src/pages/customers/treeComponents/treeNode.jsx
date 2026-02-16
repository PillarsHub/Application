import React from 'react-dom/client';
import PropTypes from 'prop-types';
import Avatar from '../../../components/avatar';
import Widget from "../../../features/widgets/components/widget";
import EmptyContent from "../../../components/emptyContent";

const TreeNode = ({ node, dashboard, trees, date }) => {

  if (node == undefined || node.customer == undefined) {
    return <div className="card d-flex flex-column" style={{ maxWidth: '140px', margin: 'auto', textTransform: "capitalize" }}>
      <div className="card-body text-center">
        <h3 className="align-items-center">
          <span className='cardTitle'>
            Empty {node.uplineLeg}
          </span>
        </h3>
        <dl className="row">
          {node.card?.values && node.card.values.map((stat) => {
            return <>
              <dd className="col-7">{stat.valueName} {stat.valueId == stat.valueName ? `` : `(${stat.valueId})`}</dd>
              <dt className="col-5  text-end">{stat.value}</dt>
            </>
          })}
        </dl>
      </div>
    </div>
  }

  var hasBack = ((dashboard?.children?.length ?? 0) > 1) && (dashboard?.children?.[1]?.widgetId ?? false);
  return <div className={`flip-card${hasBack ? '' : ' no-back'}`}>
    <div className="flip-card-inner">
      <div className="flip-card-front mb-2">
        {dashboard && dashboard.children.length > 2 && (
          buildCard(dashboard.children[0], node.customer.widgets, node.customer, node.compensationPlans, trees, date)
        )}
        {((dashboard?.children?.length ?? 0) <= 2) && <>
          <div className="card d-flex flex-column box-shadow">
            <div className="card-body d-flex flex-column">
              <h1 className="d-flex align-items-center">
                <span className="me-3">
                  <Avatar name={node.customer?.fullName} url={node.customer?.profileImage} size="sm" />
                </span>
                <span className='cardTitle'>{node.customer?.fullName}</span>
              </h1>
              <dl className="row">
                {node.card?.values && node.card.values.map((stat) => {
                  return <>
                    <dd className="col-7">{stat.valueName} {stat.valueId == stat.valueName ? `` : `(${stat.valueId})`}</dd>
                    <dt className="col-5  text-end">{stat.value}</dt>
                  </>
                })}
              </dl>
            </div>
          </div>
        </>}
      </div>
      {hasBack && <>
        <div className="flip-card-back mb-2">
          {dashboard && dashboard.children.length > 2 && (
            buildCard(dashboard.children[1], node.customer.widgets, node.customer, node.compensationPlans, trees, date)
          )}
          {((dashboard?.children?.length ?? 0) <= 2) && <>
            <div className="card d-flex flex-column box-shadow">
              <div className="card-body d-flex flex-column">
                <h3 className="d-flex align-items-center">
                  <span className='cardTitle'>{node.customer?.fullName} ({node.nodeId})</span>
                </h3>
                <dl className="row">
                  <dd className="col-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2 text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M3 5m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z"></path><path d="M3 7l9 6l9 -6"></path></svg>
                    Email</dd>
                  <dd className="col-8 text-end">{node.customer?.emailAddress}</dd>

                  <dd className="col-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2 text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2"></path><path d="M15 7a2 2 0 0 1 2 2"></path><path d="M15 3a6 6 0 0 1 6 6"></path></svg>
                    Phone</dd>
                  <dd className="col-8 text-end">{node.customer?.phoneNumbers && node.customer?.phoneNumbers.length > 0 && node.customer.phoneNumbers[0].number}</dd>

                  <dd className="col-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon me-2 text-muted" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M10 3h4v4h-4z"></path><path d="M3 17h4v4h-4z"></path><path d="M17 17h4v4h-4z"></path><path d="M7 17l5 -4l5 4"></path><path d="M12 7l0 6"></path></svg>
                    Leg</dd>
                  <dd className="col-8 text-end">{node.uplineLeg}</dd>

                </dl>

              </div>
            </div>
          </>}
        </div>
      </>}
    </div>
  </div>
}

function buildCard(card, widgets, customer, compensationPlans, trees, date) {
  if ((card?.widgetId || card?.children) && widgets !== undefined) {
    let widget = widgets.find((w) => w.id === card?.widgetId);
    if (!widget && (!card.children || card.children.length == 0)) return <div className="card">
      <EmptyContent title="This node is hidden" text="" />
    </div>

    return <div key={card?.id} className={`col-sm-12 col-lg-${card?.columns > 6 ? '12' : '6'} col-xl-${card?.columns}`}>
      {card?.widgetId && widget && <Widget key={card?.widgetId} widget={widget} customer={customer} compensationPlans={compensationPlans} trees={trees} date={date} setDate={() => { }} supressQuery={true} />}
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

export default TreeNode;

TreeNode.propTypes = {
  node: PropTypes.any.isRequired,
  dashboard: PropTypes.any.isRequired,
  trees: PropTypes.any.isRequired,
  date: PropTypes.any.isRequired
}
