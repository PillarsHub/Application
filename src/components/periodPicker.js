import React, { useEffect, useState } from "react";
import { useQuery, gql } from "@apollo/client";
import PropTypes from 'prop-types';
import { ToLocalDate } from "../util/LocalDate";

const GET_PERIOD_DETAILS = gql`
  query ($date: Date!) {
    compensationPlans {
      id
      name
      periods(date: $date, previous: 10) {
        id
        begin
        end
        status
        totalCommissions
        totalCustomers
        totalCustomersPaid
        totalVolume
      }
    }
  }
`;

const PeriodPicker = ({ periodId, setPeriodId }) => {
  const currentDate = new Date(Date.now());
  const isoDate = currentDate.toISOString();
  const dateOnly = isoDate.split('T')[0];
  
  const cacheKey = `periodDetails_${dateOnly}`;

  // State to store data
  const [localData, setLocalData] = useState(() => {
    const cachedData = sessionStorage.getItem(cacheKey);
    return cachedData ? JSON.parse(cachedData) : null;
  });

  const { loading, error } = useQuery(GET_PERIOD_DETAILS, {
    variables: { date: dateOnly },
    skip: !!localData, // Skip API call if local data is present
    onCompleted: (fetchedData) => {
      sessionStorage.setItem(cacheKey, JSON.stringify(fetchedData));
      setLocalData(fetchedData);
    },
  });

  useEffect(() => {
    if (localData && (periodId ?? 0) === 0) {
      const periodCopy = [...localData.compensationPlans[0].periods].reverse();
      const fpId = periodCopy[0]?.id;
      if (fpId) {
        setPeriodId(fpId, false);
      }
    }
  }, [periodId, localData]);

  const handleChange = (event) => {
    const value = event.target.value;
    setPeriodId(value, true);
  };

  if (loading) return <span>-</span>;
  if (error) return `Error! ${error}`;
  if (!localData) return null;

  return (
    <select className="form-select" value={periodId} onChange={handleChange}>
      {localData.compensationPlans.length > 1 ? (
        localData.compensationPlans.map((plan) => {
          return (
            <optgroup key={plan.id} label={plan.name}>
              {getOptions(plan)}
            </optgroup>
          );
        })
      ) : (
        getOptions(localData.compensationPlans[0])
      )}
    </select>
  );
};

function getOptions(plan) {
  const periods = [...plan.periods].reverse();
  return (
    periods &&
    periods.map((period) => {
      return (
        <option key={period.id} value={period.id}>
          {ToLocalDate(period.end, true)}
        </option>
      );
    })
  );
}

export default PeriodPicker;

PeriodPicker.propTypes = {
  periodId: PropTypes.any.isRequired,
  setPeriodId: PropTypes.func.isRequired,
};
