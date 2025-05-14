import React, { useState } from 'react';
import PropTypes from 'prop-types';
import EmptyContent from "./emptyContent"

const RankAdvance2 = ({ currentRank, ranks, valueMap, showRankId = false, showItemPercent = true }) => {
  const initialRank = ranks ? ranks.slice().sort((a, b) => a.rankId - b.rankId).find(r => r.rankId > currentRank) || ranks.find(r => r.rankId === currentRank) || null : null;
  const [rank, setRank] = useState(initialRank);

  //const colors = ["bg-red", "bg-primary", "bg-success", "bg-danger", "bg-warning", "bg-info"]

  if (!rank) return <><EmptyContent title="No ranks found" text="Ranks are not available at the moment." /></>;
  //var percent = Math.trunc(getPercentTotal(rank));

  var handleSetRank = (nextRankId) => {
    var nextRank = ranks.find((r) => r.rankId == nextRankId);
    setRank(nextRank);
  }

  /* const mappedConditions = rank.requirements?.flatMap((requirement) =>
    requirement?.conditions?.map((condition) => {
      const value = valueMap?.find((m) => m.valueId === condition.valueId);
      const percentage = getPercent(condition.value, condition.required);
      const displayValue = value?.text ?? condition.valueId;

      return {
        percentage,
        displayValue,
      };
    }) || []
  ); */

  return <>
    <div className="card-header">
      <h3 className="card-title">{rank.rankName}{showRankId ? ` (${rank.rankId})` : ''}</h3>
      <div className="card-actions">
        <button data-bs-toggle="dropdown" type="button" className="btn-action dropdown-toggle" aria-expanded="false">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-chevron-down"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M6 9l6 6l6 -6" /></svg>
        </button>
        <div className="dropdown-menu dropdown-menu-end">
          {ranks && ranks.map((rank) => {
            let percent = getPercentTotal(rank);

            return <button key={rank.rankId} className="dropdown-item" onClick={() => handleSetRank(rank.rankId)}>
              {percent >= 100 && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon dropdown-item-icon"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 9m-6 0a6 6 0 1 0 12 0a6 6 0 1 0 -12 0" /><path d="M12 15l3.4 5.89l1.598 -3.233l3.598 .232l-3.4 -5.889" /><path d="M6.802 12l-3.4 5.89l3.598 -.233l1.598 3.232l3.4 -5.889" /></svg>}
              {percent < 100 && <span className="icon dropdown-item-icon" />}
              {rank.rankName}{showRankId ? ` (${rank.rankId})` : ''}
            </button>
          })}
        </div>
      </div>
    </div>
    <div className="card-body">
      {rank.requirements && rank.requirements.map((requirement) => {
        return requirement?.conditions && requirement.conditions.map((condition) => {
          let value = valueMap?.find(m => m.valueId == condition.valueId);
          var percent = getPercent(condition.value, condition.required);
          var color = "bg-success";
          if (percent < 100) color = "bg-warning";
          if (percent < 50) color = "bg-danger";

          return <div key={condition.valueId} className="mb-3">
            <div className="row">
              <div className="col">
                <label className="form-label">{value?.text ?? condition.valueId}</label>
              </div>
              <div className="col-auto text-end">
                {condition.value} / {getRankRequirements(condition)}
              </div>
              {showItemPercent && <div className="col-12">
                <div className="progress progress-lg">
                  <div className={`progress-bar ${color}`} style={{ width: percent + '%' }} ></div>
                </div>
              </div>}
            </div>
            <td></td>
          </div>
        })
      })}
    </div>
  </>
}

function getPercentTotal(rank) {
  var percents = rank?.requirements?.map(requirement => {
    return requirement?.conditions?.map(condition => {
      return getPercent(condition.value, condition.required);
    })
  });

  var percent = percents ? calculateAverage(percents.flat()) : 0;
  return percent > 100 ? 100 : percent;
}

function calculateAverage(array) {
  var total = 0;
  var count = 0;

  array.forEach((item) => {
    total += item;
    count++;
  });

  return Math.trunc((total / count) * 10) / 10;
}

function getPercent(x, y) {
  let percent = x / y * 100;
  if (percent > 100) percent = 100;

  return Math.trunc(percent * 10, 0) / 10;
}

function getRankRequirements(condition) {
  if (condition.legCap > 0) {
    let percent = (condition.legCap / condition.required) * 100;
    return <>{condition.required.toLocaleString("en-US")} <span className="text-muted small lh-base-muted"> {percent}% cap</span></>
  }

  if (condition.legValue > 0) {
    return <>{condition.required.toLocaleString("en-US")} <span className="text-muted small lh-base-muted"> legs with </span>{condition.legValue.toLocaleString("en-US")}</>
  }

  return <>{condition.required.toLocaleString("en-US")}</>
}

export default RankAdvance2;

RankAdvance2.propTypes = {
  currentRank: PropTypes.string.isRequired,
  ranks: PropTypes.any.isRequired,
  valueMap: PropTypes.array,
  showRankId: PropTypes.bool,
  showItemPercent: PropTypes.bool
}
