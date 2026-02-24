import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useFetch } from '../../../../hooks/useFetch'
import Modal from '../../../../components/modal';
import DateTimeInput from '../../../../components/dateTimeInput';
import CheckBox from '../../../../components/checkbox';
import { SendRequest } from '../../../../hooks/usePost';

const PlanCard = ({ environmentId, status }) => {
  const [show, setShow] = useState(false);
  const [processDate, setProcessDate] = useState();
  const [understood, setUnderstood] = useState();
  const { error, data } = useFetch(`/api/v1/Environments/${environmentId}/compensationPlans`);

  useEffect(() => {
    if (data) {
      const dates = data.compensationPlans.map(plan => new Date(plan.beginDate));
      const minDate = new Date(Math.min(...dates));
      if (minDate instanceof Date && !isNaN(minDate)) {
        setProcessDate(minDate?.toISOString().split('T')[0] ?? null);
      }
    }
  }, [data])

  const handleHide = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleReprocess = () => {
    SendRequest("POST", `/api/v1/Environments/${environmentId}/reprocess?date=${processDate}`, {}, () => {
      handleHide();
    }, (error) => {
      alert(error);
    });
  }

  const handleChange = (name, value) => {
    if (name == "processDate") setProcessDate(value);
    if (name == "understood") setUnderstood(value);
  }

  if (error) return `Error! ${error}`;
  if (status == 1) {
    return <div className="card">
      <div className="card-body">
        <div className="empty">
          <p className="empty-title">No compensation plan configured</p>
          <p className="empty-subtitle text-muted">A compensation plan is required for the system to function properly.</p>
          <div className="empty-action">
            <a href="/templates" className="btn btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-affiliate" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M5.931 6.936l1.275 4.249m5.607 5.609l4.251 1.275"></path><path d="M11.683 12.317l5.759 -5.759"></path><circle cx="5.5" cy="5.5" r="1.5"></circle><circle cx="18.5" cy="5.5" r="1.5"></circle><circle cx="18.5" cy="18.5" r="1.5"></circle><circle cx="8.5" cy="15.5" r="4.5"></circle></svg>
              Setup Compensation Plan
            </a>
          </div>
        </div>
      </div>
    </div>
  }

  return <>
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          Compensation Plan
        </h3>
      </div>
      <div className="card-body">
        {/* {data?.compensationPlans && data.compensationPlans.map((plan) => {
          return <div key={plan.id} className="row g-0">
            <div className="col">
              <div className="card-body ps-0">
                <div className="row">
                  <div className="col">
                    <h3 className="mb-0">{plan.name}</h3>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md">
                    {JSON.stringify(plan)}
                  </div>
                </div>
                <div className="row">
                  <div className="col-md">
                    <div className="mt-3 list-inline list-inline-dots mb-0 text-muted d-sm-block d-none">
                      {/* {plan?.avgPayoutPercent && <div className="list-inline-item" title="Average Payout">
                        Average Payout: <strong>{plan.avgPayoutPercent}%</strong>
                      </div>}
                      {plan?.maxPayoutPercent && <div className="list-inline-item" title="Maximum Payout">
                        Maximum Payout: <strong>{plan.maxPayoutPercent}%</strong>
                      </div>}
                      <div className="list-inline-item" title="Ways to Earn">
                        Ways to Earn: <strong>{plan?.bonusDefinitions?.length}</strong>
                      </div> 
                    </div>
                  </div>
                  <div className="col-md-auto">
                    <div className="mt-3 badges">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        })} */}
      </div>
      <div className="card-footer">
        <div className="d-flex">
          {data?.queueCount > 0 && <span className="me-auto">{data.queueCount} In Queue</span>}
          <button className="btn btn-outline-default btn-sm ms-auto" onClick={handleShow} >Reprocess</button>
        </div>
        {/* <a href="https://docs.commissionsportal.com/en/integrations/ecommerce" >Learn more</a> */}
      </div>
    </div >

    <Modal showModal={show} size="sm" onHide={handleHide}>
      <div className="modal-header">
        <h5 className="modal-title">Reprocess Sources</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <p className="mb-4">
          All sources, values, and bonuses for periods on or after the selected date will be deleted and reprocessed.
          The values will not be accurate while reprocessing.
        </p>

        <div className="mb-3">
          <label className="form-label">Begin Date</label>
          <DateTimeInput name="processDate" value={processDate} onChange={handleChange} />
        </div>
        <div className="mb-3">
          <CheckBox name="understood" value={understood} onChange={handleChange} >
            <span className="form-check-label">I undsetand that this will cause values to be incorrect while processing.</span>
          </CheckBox>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-link link-secondary" data-bs-dismiss="modal">Cancel</button>
        {!understood && <button className="btn btn-primary ms-auto" disabled={true}>Reprocess Values</button>}
        {understood && <button className="btn btn-primary ms-auto" onClick={handleReprocess}>Reprocess Values</button>}
      </div>
    </Modal >

  </>
};

export default PlanCard;


PlanCard.propTypes = {
  environmentId: PropTypes.number.isRequired,
  status: PropTypes.number.isRequired
}
