import React from 'react';
import PropTypes from 'prop-types';
import DataLoading from '../../../../components/dataLoading';
import { useFetch } from '../../../../hooks/useFetch';
import LocalDate from '../../../../util/LocalDate';

const PlanCard = ({ environmentId, status }) => {
  const { loading, error, data } = useFetch(
    status == 1 ? null : `/api/v1/Environments/${environmentId}/compensationPlans`
  );

  if (error) return `Error! ${error}`;
  if (status == 1) {
    return <div className="card">
      <div className="card-body">
        <div className="empty">
          <p className="empty-title">No compensation plan configured</p>
          <p className="empty-subtitle text-muted">A compensation plan is required for the system to function properly.</p>
          <div className="empty-action">
            <a href="/account/compensationplans" className="btn btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-affiliate" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M5.931 6.936l1.275 4.249m5.607 5.609l4.251 1.275"></path><path d="M11.683 12.317l5.759 -5.759"></path><circle cx="5.5" cy="5.5" r="1.5"></circle><circle cx="18.5" cy="5.5" r="1.5"></circle><circle cx="18.5" cy="18.5" r="1.5"></circle><circle cx="8.5" cy="15.5" r="4.5"></circle></svg>
              Setup Compensation Plan
            </a>
          </div>
        </div>
      </div>
    </div>
  }

  if (loading) return <DataLoading title="Loading compensation plan" />;

  const plans = Array.isArray(data) ? data : (data?.compensationPlans ?? []);
  if (plans.length === 0) {
    return <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          Compensation Plan
        </h3>
      </div>
      <div className="card-body">
        <div className="empty">
          <p className="empty-title">No compensation plan returned</p>
          <p className="empty-subtitle text-muted">The environment is active, but no compensation plan data was found.</p>
        </div>
      </div>
    </div>
  }

  return <>
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title mb-1">
            Compensation Plan
          </h3>
        </div>
      </div>
      <div className="table-responsive">
        <table className="table card-table table-vcenter">
          <thead>
            <tr>
              <th>Name</th>
              <th>Begin Date</th>
              <th>Increment</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan, index) => {
              return <tr key={plan.id ?? `${plan.name}_${index}`}>
                <td>{plan.name ?? '-'}</td>
                <td>{plan.beginDate ? <LocalDate dateString={plan.beginDate} hideTime={true} /> : '-'}</td>
                <td>{plan.incrementAmount ?? '-'} {formatIncrementType(plan.incrementType)}</td>
              </tr>
            })}
          </tbody>
        </table>
      </div>
      <div className="card-footer border-top">
        <div className="row g-3 align-items-start">
          <div className="col">
            <div className="">
              {plans[0].description ?? 'No description provided.'}
            </div>
          </div>
        </div>
      </div>
    </div >
  </>
};

function formatIncrementType(value) {
  if (!value) return '-';

  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ');
}

export default PlanCard;


PlanCard.propTypes = {
  environmentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  status: PropTypes.number.isRequired
}
