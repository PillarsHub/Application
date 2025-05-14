import React, { useEffect, useState } from "react";
import { useQuery, gql } from "@apollo/client";
import PropTypes from 'prop-types';
import { ToLocalDate, FormatDate } from "../util/LocalDate";

const GET_PERIOD_DETAILS = gql`
  query ($date: Date!) {
    compensationPlans {
      id
      name
      periods(date: $date, previous: 104) {
        id
        begin
        end
        status
      }
    }
  }
`;

const PeriodPicker = ({ periodId, setPeriodId, options }) => {
  const currentDate = new Date(Date.now());
  const isoDate = currentDate.toISOString();
  const dateOnly = isoDate.split('T')[0];

  const cacheKey = `periodDetails_${dateOnly}`;

  const [opts, setOpts] = useState();
  //const [planIds] = useState(options?.planIds)
  //const [defaultPlanId] = useState(options?.defaultPlan)
  //const [defaultPeriodIndex] = useState(options?.defaultIndex ?? 0);
  //const [hideTime] = useState(options?.hideTime ?? false);
  //const [hideOpen] = useState(options?.hideOpen ?? false);
  //const [tabbedUI] = useState(options?.tabbedUI ?? false);
  const [activePlan, setActivePlan] = useState();
  const [activePeriod, setActivePeriod] = useState();

  const [localData, setLocalData] = useState(() => {
    //const cachedData = sessionStorage.getItem(cacheKey);
    //return cachedData ? JSON.parse(cachedData) : null;
    return null;
  });

  useEffect(() => {
    setOpts({ ...options })
  }, [options]);

  const { loading, error } = useQuery(GET_PERIOD_DETAILS, {
    variables: { date: dateOnly },
    skip: !!localData, // Skip API call if local data is present
    onCompleted: (fetchedData) => {
      var filtered = {
        compensationPlans: !opts.planIds || opts.planIds.length === 0
          ? fetchedData.compensationPlans
          : fetchedData.compensationPlans
            .filter(plan => opts.planIds.includes(parseInt(plan.id)))
            .sort((a, b) => opts.planIds.indexOf(parseInt(a.id)) - opts.planIds.indexOf(parseInt(b.id)))
      };

      sessionStorage.setItem(cacheKey, JSON.stringify(filtered));
      setLocalData(filtered);

      const defaultPlan = filtered.compensationPlans.find(plan => parseInt(plan.id) === opts.defaultPlanId) || filtered.compensationPlans[0];
      setActivePlan(defaultPlan);
    },
  });

  useEffect(() => {
    if (localData && (periodId ?? 0) === 0) {
      const periodCopy = [...activePlan.periods].reverse();
      const fpId = periodCopy[opts.defaultIndex ?? 0]?.id;
      if (fpId) {
        setPeriodId(fpId, false);
      }
    }

    if (localData && (periodId ?? 0) > 0) {
      setActivePlan(findPlanForPeriod(periodId));
      setActivePeriod(findPeriod(periodId));
    }

  }, [periodId, localData]);

  const findPlanForPeriod = (pId) => {
    for (const plan of localData.compensationPlans) {
      const matchingPeriod = plan.periods.find(period => parseInt(period.id) === pId);
      if (matchingPeriod) return plan;
    }

    return null;
  };

  const findPeriod = (pId) => {
    for (const plan of localData.compensationPlans) {
      const matchingPeriod = plan.periods.find(period => parseInt(period.id) === pId);
      if (matchingPeriod) return matchingPeriod
    }

    return null;
  };

  const handleChange = (event) => {
    const value = event.target.value;
    setPeriodId(value, true);
  };

  const handlePlanChange = (planId) => {
    var plan = localData.compensationPlans.find(p => p.id == planId);
    setActivePlan(plan);
  }

  const formatDate = (date, hideTime) => {
    if (options.localTime ?? true) {
      return ToLocalDate(date, hideTime);
    } else {
      return FormatDate(date, hideTime);
    }
  }

  if (loading) return <span>-</span>;
  if (error) return `Error! ${error}`;
  if (!localData) return null;

  if (opts.tabbedUI) {
    return <>
      <button type="button" className="btn dropdown-toggle" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
        {formatDate(activePeriod?.begin, true)} {!opts.hideEnd && <>- {formatDate(activePeriod?.end, true)}</>}
      </button>

      <div className="dropdown-menu dropdown-menu-card dropdown-menu-end">
        <div className="card d-flex flex-column">
          {localData.compensationPlans.length > 1 && <div className="card-header">
            <ul className="nav nav-tabs card-header-tabs" data-bs-toggle="tabs" role="tablist">
              {localData.compensationPlans.map((plan) => {
                return <li key={plan.id} className={`nav-item`} role="presentation">
                  <a href={`#tabs-profile-${plan.id}`} className={`nav-link ${plan.id == activePlan?.id ? 'active' : ''}`} data-bs-toggle="tab" aria-selected="false" tabIndex="-1" role="tab" onClick={(e) => { e.stopPropagation(); handlePlanChange(plan.id) }}>{plan.name}</a>
                </li>
              })}
            </ul>
          </div>}
          <div className="" style={{ maxWidth: "1000px", maxHeight: "500px", overflow: "auto" }}>
            {activePlan && (
              <div key={activePlan.id}>
                {[...activePlan.periods].reverse().map((period) => {
                  if (period.status.toLowerCase() === "closed" || !opts.hideOpen) {
                    return <button key={period.id} className={`dropdown-item ${period.id == periodId ? 'active' : ''}`} onClick={() => setPeriodId(period.id, true)}>
                      <div className="d-block">
                        <div>{formatDate(period.begin, opts.hideTime)}</div>
                        {!opts.hideEnd && <div className="small text-muted">to {formatDate(period.end, opts.hideTime)}</div>}
                      </div>
                    </button>
                  }
                })}
              </div>
            )}
          </div>
        </div>
      </div >
    </>
  } else {
    return <>
      <select className="form-select" value={periodId} onChange={handleChange}>
        {localData.compensationPlans.length > 1 ? (
          localData.compensationPlans.map((plan) => {
            return (
              <optgroup key={plan.id} label={plan.name}>
                {getOptions(plan, formatDate, opts)}
              </optgroup>
            );
          })
        ) : (
          getOptions(localData.compensationPlans[0], formatDate, opts)
        )}
      </select>
    </>
  }
};

function getOptions(plan, formatDate, opts) {
  const periods = [...plan.periods].reverse();
  return (
    periods &&
    periods.map((period) => {
      return (
        <option key={period.id} value={period.id}>
          {opts.hideEnd && <>{formatDate(period.begin, true)}</>}
          {!opts.hideEnd && <>{formatDate(period.end, true)}</>}
        </option>
      );
    })
  );
}

export default PeriodPicker;

PeriodPicker.propTypes = {
  periodId: PropTypes.any.isRequired,
  setPeriodId: PropTypes.func.isRequired,
  options: PropTypes.any
};
