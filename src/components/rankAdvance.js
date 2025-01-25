import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Chart from "react-apexcharts";
import EmptyContent from "./emptyContent"

const RankAdvance = ({ currentRank, ranks, valueMap, showRankId = false, showItemPercent = true }) => {
  const initialRank = ranks ? ranks.slice().sort((a, b) => a.rankId - b.rankId).find(r => r.rankId > currentRank) || ranks.find(r => r.rankId === currentRank) || null : null;
  const [rank, setRank] = useState(initialRank);


  if (!rank) return <><EmptyContent title="No ranks found" text="Ranks are not available at the moment." /></>;
  var percent = Math.trunc(getPercentTotal(rank));

  var handleNextRank = () => {
    var nextRankId = Math.min(...ranks.filter((r) => r.rankId > rank.rankId).map((r) => r.rankId));
    if (nextRankId >= Infinity) {
      nextRankId = Math.min(...ranks.map((r) => r.rankId));
    }
    var nextRank = ranks.find((r) => r.rankId == nextRankId);
    setRank(nextRank);
  }

  var handlePrevRank = () => {
    var lastRankId = Math.max(...ranks.filter((r) => r.rankId < rank.rankId).map((r) => r.rankId));
    if (lastRankId < 0) {
      lastRankId = Math.max(...ranks.map((r) => r.rankId));
    }
    var lastRank = ranks.find((r) => r.rankId == lastRankId);
    setRank(lastRank);
  }

  var chart1 = {
    series: [percent],
    chart: {
      type: 'radialBar',
      offsetY: -20,
      sparkline: {
        enabled: true
      }
    },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        track: {
          background: "#e7e7e7",
          strokeWidth: '97%',
          margin: 5, // margin is in pixels
          dropShadow: {
            enabled: true,
            top: 2,
            left: 0,
            color: '#999',
            opacity: 1,
            blur: 2
          }
        },
        dataLabels: {
          name: {
            show: false
          },
          value: {
            offsetY: -2,
            fontSize: '22px'
          }
        }
      }
    },
    grid: {
      padding: {
        top: -10
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        shadeIntensity: 0.4,
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 50, 53, 91]
      },
    },
    labels: ['Average Results'],
  };

  const mappedConditions = rank.requirements?.flatMap((requirement) =>
    requirement?.conditions?.map((condition) => {
      const value = valueMap?.find((m) => m.valueId === condition.valueId);
      const percentage = getPercent(condition.value, condition.required);
      const displayValue = value?.text ?? condition.valueId;

      return {
        percentage,
        displayValue,
      };
    }) || []
  );


  var chart2 = {
    series: mappedConditions.map(c => c.percentage),
    chart: {
      type: 'radialBar',
      offsetY: -20,
      sparkline: {
        enabled: true
      }
    },
    plotOptions: {
      radialBar: {
        offsetY: 0,
        startAngle: -90,
        endAngle: 90,
        track: {
          background: "#e7e7e7",
          strokeWidth: '97%',
          margin: 5, // margin is in pixels
          dropShadow: {
            enabled: true,
            top: 2,
            left: 0,
            color: '#999',
            opacity: 1,
            blur: 2
          }
        },
        hollow: {
          margin: 5,
          size: '30%',
          background: 'transparent',
          image: undefined,
        },
        dataLabels: {
          showForZeroSeries: true,
          name: {
            show: false,
          },
          value: {
            offsetY: 0,
            show: true,
          }
        }
      }
    },
    colors: ['#1ab7ea', '#0084ff', '#39539E', '#0077B5'],
    labels: mappedConditions.map(c => c.displayValue),
    tooltip: {
      shared: true,
      hideEmptySeries: false,
    },
    legend: {
      show: false,
    }
  };

  const c1 = true;
  const chart = c1 ? chart1 : chart2;

  return <>
    <div id="carousel-rankAdvance" className="carousel slide" data-bs-ride="carousel" data-bs-interval="false">
      <div className="carousel-inner">
        <div className="card-header rank-advance-header">
          <ul className="pagination m-0">
            <li className="page-item">
              <button className="page-link tab-link" onClick={handlePrevRank}>
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><polyline points="15 6 9 12 15 18" /></svg>
              </button>
            </li>
          </ul>
          <h3 className="card-title ms-auto">{rank.rankName}{showRankId ? ` (${rank.rankId})` : ''}</h3>
          <ul className="pagination m-0 ms-auto">
            <li className="page-item">
              <button className="page-link tab-link" onClick={handleNextRank}>
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><polyline points="9 6 15 12 9 18" /></svg>
              </button>
            </li>
          </ul>
        </div>
        <Chart options={chart} series={chart.series} type={chart.chart.type} height={chart.chart.height} />
        <table className="table card-table table-vcenter">
          <thead>
            <tr>
              <th>Requirement</th>
              <th>Current</th>
              <th>Required</th>
              {showItemPercent && <th></th>}
            </tr>
          </thead>
          <tbody>
            {rank.requirements && rank.requirements.map((requirement) => {
              return requirement?.conditions && requirement.conditions.map((condition) => {
                let value = valueMap?.find(m => m.valueId == condition.valueId);
                return <tr key={condition.valueId}>
                  <td>
                    {value?.text ?? condition.valueId}
                  </td>
                  <td>{condition.value}</td>
                  <td>{getRankRequirements(condition)}</td>
                  {showItemPercent && <td className="w-25">
                    <div className="progress progress-xs">
                      <div className="progress-bar bg-primary" style={{ width: getPercent(condition.value, condition.required) + '.0%' }} ></div>
                    </div>
                  </td>}
                </tr>
              })
            })}
          </tbody>
        </table>
      </div>
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

export default RankAdvance;

RankAdvance.propTypes = {
  currentRank: PropTypes.string.isRequired,
  ranks: PropTypes.any.isRequired,
  valueMap: PropTypes.array,
  showRankId: PropTypes.bool,
  showItemPercent: PropTypes.bool
}
