import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery, gql } from "@apollo/client";
import Chart from "react-apexcharts";
import EmptyContent from "./emptyContent"
import Modal from './modal';
import DataLoading from './dataLoading';

var GET_RANK = gql`query ($nodeIds: [String]!, $periodDate: Date!) {
  customers(idList: $nodeIds){
    values(idList: "Rank"){
      value
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
}`;

var GET_HIGH_RANK = gql`query ($nodeIds: [String]!) {
  customers(idList: $nodeIds){
    values(idList: "HighRank"){
      value
    }
  }
}`;

const RankAdvance = ({ currentRank, ranks, valueMap, period, options, isPreview }) => {
  const [initRanks, setInitRanks] = useState();
  const [lastRanks, setLastRanks] = useState();
  const [lastRankId, setLastRankId] = useState();
  const [activeRanks, setActiveRanks] = useState();
  const [activeRank, setActiveRank] = useState();
  const [showReqModal, setShowReqModal] = useState(false);
  const [activeTab, setActiveTab] = useState(1);
  const [loading, setLoading] = useState(false);
  const [customerId, setCustomerId] = useState(false);
  const [highRank, setHighRank] = useState();

  const { refetch } = useQuery(GET_RANK, {
    variables: { nodeIds: 0, periodDate: '2025-01-01' },
    skip: true, // Initially skip the query
  });

  const { refetch: fetchHighRank } = useQuery(GET_HIGH_RANK, {
    variables: { nodeIds: 0, periodDate: '2025-01-01' },
    skip: true, // Initially skip the query
  });

  useEffect(() => {
    if (customerId) {
      if (isPreview) {
        setHighRank(ranks[0]);
      } else {
        fetchHighRank({ nodeIds: customerId })
          .then((result) => {
            var highRankId = result.data.customers?.[0]?.values?.[0].value;
            const initialRank = ranks.slice().sort((a, b) => a.rankId - b.rankId).find(r => r.rankId == highRankId) || ranks.find(r => r.rankId === highRankId) ||
              ranks.slice().sort((a, b) => a.rankId - b.rankId).find(r => r.rankId > currentRank) || ranks.find(r => r.rankId === currentRank) || null;
            setHighRank(initialRank);
          })
          .catch((error) => {
            console.error('Refetch error:', error);
          });
      }
    }
  }, [customerId]);

  useEffect(() => {
    if (ranks && currentRank) {
      setCustomerId(ranks[0].nodeId);
      setInitRanks(ranks);
      setActiveRanks(ranks);

      const initialRank = ranks.slice().sort((a, b) => a.rankId - b.rankId).find(r => r.rankId > currentRank) || ranks.find(r => r.rankId === currentRank) || null;
      setActiveRank(initialRank);
    }
  }, [ranks, currentRank])

  if (loading) return <DataLoading />
  if (!activeRank) return <><EmptyContent title="No ranks found" text="Ranks are not available at the moment." />
    <div className="mb-3">{JSON.stringify(activeRanks)}</div>
    <div className="mb-3">{JSON.stringify(activeRank)}</div>
  </>;
  var percent = Math.trunc(getPercentTotal(activeRank));

  const handleHideReqModal = () => setShowReqModal(false);
  const handleShowReqModal = () => setShowReqModal(true);

  var handleNextRank = () => {
    var nextRankId = Math.min(...activeRanks.filter((r) => r.rankId > activeRank.rankId).map((r) => r.rankId));
    if (nextRankId >= Infinity) {
      nextRankId = Math.min(...activeRanks.map((r) => r.rankId));
    }
    var nextRank = activeRanks.find((r) => r.rankId == nextRankId);
    setActiveRank(nextRank);
  }

  var handlePrevRank = () => {
    var lastRankId = Math.max(...activeRanks.filter((r) => r.rankId < activeRank.rankId).map((r) => r.rankId));
    if (lastRankId < 0) {
      lastRankId = Math.max(...activeRanks.map((r) => r.rankId));
    }
    var lastRank = activeRanks.find((r) => r.rankId == lastRankId);
    setActiveRank(lastRank);
  }

  const handlePeriodChange = (periodIndex) => {
    setActiveTab(periodIndex);
    if (periodIndex === 1) {
      setActiveRanks(initRanks);
      const initialRank = ranks.slice().sort((a, b) => a.rankId - b.rankId).find(r => r.rankId > currentRank) || ranks.find(r => r.rankId === currentRank) || null;
      setActiveRank(initialRank);
    } else {
      if (lastRanks) {
        setActiveRanks(lastRanks);
        const initialRank = lastRanks.slice().sort((a, b) => a.rankId - b.rankId).find(r => r.rankId > lastRankId) || lastRanks.find(r => r.rankId === lastRankId) || lastRanks[0];
        setActiveRank(initialRank);
      } else {
        loadLastRank();
      }
    }
  }

  const loadLastRank = () => {
    if (isPreview) {
      setLastRankId(initRanks);
    } else {
      setLoading(true);
      refetch({ nodeIds: customerId, periodDate: subtractOneDay(period.begin) })
        .then((result) => {
          let newRankAdvance = result.data.compensationPlans?.flatMap(plan => plan.period || []).find(period => period.rankAdvance?.length > 0)?.rankAdvance || null;
          setLastRanks(newRankAdvance);
          setActiveRanks(newRankAdvance);

          var lastRankId = result.data.customers?.[0]?.values?.[0].value;
          setLastRankId(lastRankId);
          const initialRank = newRankAdvance.slice().sort((a, b) => a.rankId - b.rankId).find(r => r.rankId > lastRankId) || newRankAdvance.find(r => r.rankId === lastRankId) || null;
          setActiveRank(initialRank);
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
          console.error('Refetch error:', error);
        });
    }
  }

  const mappedConditions = activeRank.requirements?.flatMap((requirement) =>
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


  const chart1Series = [percent];
  const chart1Options = {
    chart: {
      type: 'radialBar',
      offsetY: -20,
      sparkline: {
        enabled: true
      },
      height: options.title == 1 ? 350 : 650
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
    labels: [activeRank.rankName],
  };

  const chart2Series = [percent];
  const chart2Options = {
    chart: {
      type: 'radialBar',
      sparkline: {
        enabled: true
      },
      height: 200
    },
    plotOptions: {
      radialBar: {
        hollow: {
          size: '70%',
        },
        dataLabels: {
          name: {
            show: false
          },
          value: {
            offsetY: 12,
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
    labels: [activeRank.rankName],
  };

  const chart3Series = mappedConditions.map(c => c.percentage);
  const chart3Options = {
    chart: {
      type: 'radialBar',
      height: 390,
      sparkline: {
        enabled: true
      },
      stroke: {
        width: 1,
        colors: undefined
      },
    },
    plotOptions: {
      radialBar: {
        offsetY: 0,
        startAngle: 0,
        endAngle: 270,
        hollow: {
          margin: 5,
          size: '30%',
          background: 'transparent',
          image: undefined,
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            show: false,
          }
        },
        barLabels: {
          enabled: true,
          useSeriesColors: true,
          offsetX: -8,
          fontSize: '12px',
          formatter: function (seriesName, opts) {
            return seriesName + ":  " + opts.w.globals.series[opts.seriesIndex] + "%"
          },
        },
      }
    },
    labels: mappedConditions.map(c => c.displayValue),
    responsive: [{
      breakpoint: 480,
      options: {
        legend: {
          show: false
        }
      }
    }],
    tooltip: {
      shared: true,
      hideEmptySeries: false,
    },
    legend: {
      show: false,
    }
  };

  const chartKey = `c${options.chart}-${activeRank.rankId}-${activeTab}`;
  const chartSeries = options.chart == 1 ? chart1Series : options.chart == 2 ? chart2Series : chart3Series;
  const chartOptions = options.chart == 1 ? chart1Options : options.chart == 2 ? chart2Options : chart3Options;

  return <>
    {options.tabs > 0 && <div className="card-header">
      <ul className="nav nav-tabs card-header-tabs nav-fill" data-bs-toggle="tabs" role="tablist">
        <li className="nav-item" role="presentation">
          <button className={`nav-link ${activeTab == 1 ? 'active' : ''}`} onClick={() => handlePeriodChange(1)}>Current Period</button>
        </li>
        {(options.tabs == 1 || options.tabs == 2) && <li className="nav-item" role="presentation">
          <button className={`nav-link ${activeTab == 2 ? 'active' : ''}`} onClick={() => handlePeriodChange(2)}>Last Period</button>
        </li>}
        {(options.tabs == 1 || options.tabs == 3) && <li className="nav-item" role="presentation">
          <button className={`nav-link ${activeTab == 3 ? 'active' : ''}`} onClick={() => setActiveTab(3)}>High Rank</button>
        </li>}
      </ul>
    </div>}
    {activeTab !== 3 && options.title == 1 && <div className="card-header rank-advance-header">
      <ul className="pagination m-0">
        <li className="page-item">
          <button className="page-link tab-link" onClick={handlePrevRank}>
            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><polyline points="15 6 9 12 15 18" /></svg>
          </button>
        </li>
      </ul>
      <h3 className="card-title ms-auto">{activeRank.rankName}{options.showRankId ? ` (${activeRank.rankId})` : ''}</h3>
      <ul className="pagination m-0 ms-auto">
        <li className="page-item">
          <button className="page-link tab-link" onClick={handleNextRank}>
            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><polyline points="9 6 15 12 9 18" /></svg>
          </button>
        </li>
      </ul>
    </div>}
    {activeTab !== 3 && chartOptions.chart > 0 && options.title == 1 && <div className={`${chartOptions.chart == 2 ? 'm-auto' : ''}`}>
      <Chart key={chartKey} options={chartOptions} series={chartSeries} type={chartOptions.chart.type} height={chartOptions.chart.height} />
    </div >}
    {activeTab !== 3 && options.title == 2 && <div className={`row ${options.chart == 2 ? 'm-auto' : ''}`}>
      <div className="col ms-3">
        <button className="page-link tab-link text-muted" style={{ height: "100%", float: "left" }} onClick={handlePrevRank}>
          <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><polyline points="15 6 9 12 15 18" /></svg>
        </button>
      </div>
      <div className="col-auto overflow-hidden">
        {options.chart > 0 && <Chart key={chartKey} options={chartOptions} series={chartSeries} type={chartOptions.chart.type} height={chartOptions.chart.height} />}
        <h3 className="card-title text-center ms-auto" style={{ color: "var(--tblr-card-color)" }}>{activeRank.rankName}{options.showRankId ? ` (${activeRank.rankId})` : ''}</h3>
      </div>
      <div className="col me-3">
        <button className="page-link tab-link ms-auto text-muted" style={{ height: "100%", float: "right" }} onClick={handleNextRank}>
          <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><polyline points="9 6 15 12 9 18" /></svg>
        </button>
      </div>
    </div>
    }
    {activeTab !== 3 && options.title == 3 && <div className={`row ${options.chart == 2 ? 'm-auto' : ''}`}>
      {options.chart > 0 && <Chart key={chartKey} options={chartOptions} series={chartSeries} type={chartOptions.chart.type} height={chartOptions.chart.height} />}
      <div className="col">
        <button className="page-link tab-link text-muted" style={{ height: "100%", float: "left" }} onClick={handlePrevRank}>
          <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><polyline points="15 6 9 12 15 18" /></svg>
        </button>
      </div>
      <div className="col-auto overflow-hidden">
        <h3 className="card-title text-center ms-auto mt-2" style={{ color: "var(--tblr-card-color)" }}>{activeRank.rankName}{options.showRankId ? ` (${activeRank.rankId})` : ''}</h3>
      </div>
      <div className="col">
        <button className="page-link tab-link ms-auto text-muted" style={{ height: "100%", float: "right" }} onClick={handleNextRank}>
          <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><polyline points="9 6 15 12 9 18" /></svg>
        </button>
      </div>
    </div>
    }

    {
      activeTab !== 3 && options.showRankProgress &&
      <ul className="steps steps-green mb-3">
        <li className={`step-item d-none ${currentRank == 0 ? 'active' : 'inactive'}`}></li>
        {ranks && ranks.map((rank) => {
          let activeClass = currentRank == rank.rankId ? 'active' : ''
          let stepColor = activeRank.rankId == rank.rankId ? 'step-mark' : ''
          return <li key={rank.rankId} className={`step-item ${activeClass} ${stepColor}`}></li>
        })}
      </ul>
    }

    {
      activeTab !== 3 && options.reqs == 1 && <table className="table card-table table-vcenter">
        <thead>
          <tr>
            <th>Requirement</th>
            <th>Current</th>
            <th>Required</th>
            {options.showItemPercent && <th></th>}
          </tr>
        </thead>
        <tbody>
          {activeRank.requirements && activeRank.requirements?.map((requirement) => {
            return requirement?.conditions && requirement.conditions.map((condition) => {
              let value = valueMap?.find(m => m.valueId == condition.valueId);
              var percent = getPercent(condition.value, condition.required);
              var hasMap = value?.values?.length > 0;

              return <tr key={condition.valueId}>
                <td>
                  {value?.text ?? condition.valueId}
                </td>
                <td>{truncateDecimals(condition.value, value?.values, 0)}</td>
                <td>{!hasMap && <span>{getRankRequirements(condition, true)}</span>}</td>
                {options.showItemPercent && <td className="w-25">
                  <div className="progress progress-xs">
                    <div className="progress-bar bg-primary" style={{ width: percent + '%' }} ></div>
                  </div>
                </td>}
              </tr>
            })
          })}
        </tbody>
      </table>
    }
    {
      activeTab !== 3 && options.reqs == 2 && <div className="ms-3 me-3">
        {activeRank.requirements && activeRank.requirements.map((requirement) => {
          return requirement?.conditions && requirement.conditions.map((condition) => {
            let value = valueMap?.find(m => m.valueId == condition.valueId);
            var percent = getPercent(condition.value, condition.required);
            var color = "bg-success";
            if (percent < 100) color = "bg-warning";
            if (percent < 50) color = "bg-danger";
            var hasMap = value?.values?.length > 0;

            return <div key={condition.valueId} className="mb-2">
              <div className="row">
                <div className="col">
                  <label className="form-label">{value?.text ?? condition.valueId} {getCapText(condition)}</label>
                </div>
                <div className="col-auto text-end">
                  {truncateDecimals(condition.value, value?.values, 0)} {!hasMap && <span>/ {getRankRequirements(condition, false)}</span>}
                </div>
                {options.showItemPercent && <div className="col-12">
                  <div className="progress progress-sm">
                    <div className={`progress-bar ${color}`} style={{ width: percent + '%' }} ></div>
                  </div>
                </div>}
              </div>
              <td></td>
            </div>
          })
        })}
      </div>
    }
    {
      activeTab !== 3 && options.reqs == 3 && <div className="card-footer">
        <div className="row align-items-center">
          <div className="col">
            <button className="btn btn-ligth w-100" onClick={handleShowReqModal}>View Requirements</button>
          </div>
          <div className="col-auto ms-auto">

          </div>
        </div>
        <Modal showModal={showReqModal} size="sm" centered={true} onHide={handleHideReqModal}>
          <div className="modal-header">
            <h5 className="modal-title">{activeRank.rankName}{options.showRankId ? ` (${activeRank.rankId})` : ''}</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            {activeRank.requirements && activeRank.requirements.map((requirement) => {
              return requirement?.conditions && requirement.conditions.map((condition) => {
                let value = valueMap?.find(m => m.valueId == condition.valueId);
                var percent = getPercent(condition.value, condition.required);
                var color = "bg-success";
                if (percent < 100) color = "bg-warning";
                if (percent < 50) color = "bg-danger";
                var hasMap = value?.values?.length > 0;

                return <div key={condition.valueId} className="mb-2">
                  <div className="row">
                    <div className="col">
                      <label className="form-label">{value?.text ?? condition.valueId} {getCapText(condition)}</label>
                    </div>
                    <div className="col-auto text-end">
                      {truncateDecimals(condition.value, value?.values, 0)} {!hasMap && <span>/ {getRankRequirements(condition, false)}</span>}
                    </div>
                    {options.showItemPercent && <div className="col-12">
                      <div className="progress">
                        <div className={`progress-bar ${color}`} style={{ width: percent + '%' }} ></div>
                      </div>
                    </div>}
                  </div>
                  <td></td>
                </div>
              })
            })}
          </div>
        </Modal>
      </div>
    }
    {
      activeTab == 3 && <>
        <div className="empty">
          <span className="mb-3 icon-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-xl icon icon-tabler icons-tabler-outline icon-tabler-award"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 9m-6 0a6 6 0 1 0 12 0a6 6 0 1 0 -12 0" /><path d="M12 15l3.4 5.89l1.598 -3.233l3.598 .232l-3.4 -5.889" /><path d="M6.802 12l-3.4 5.89l3.598 -.233l1.598 3.232l3.4 -5.889" /></svg>
          </span>
          {highRank && <p className="empty-title">{highRank.rankName}{options.showRankId ? ` (${highRank.rankId})` : ''}</p>}
          {!highRank && <p className="empty-title">Your highest rank will be shown here when earned.</p>}
        </div>
      </>
    }
  </>
}

function truncateDecimals(number, valueMap, digits) {
  var multiplier = Math.pow(10, digits);
  var adjustedNum = number * multiplier;
  var truncatedNum = Math[adjustedNum < 0 ? 'ceil' : 'floor'](adjustedNum);
  var result = truncatedNum / multiplier;

  if (valueMap && valueMap.length > 0) {
    var mapped = valueMap.find(entry => entry.value === result.toString());
    if (mapped) {
      return mapped.text;
    }
  }

  return result.toLocaleString();
}


function getPercentTotal(activeRank) {
  var percents = activeRank?.requirements?.map(requirement => {
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

function getRankRequirements(condition, showPercent) {
  if (condition.legCap > 0 && showPercent) {
    let percent = (condition.legCap / condition.required) * 100;
    return <>{condition.required.toLocaleString("en-US")} <span className="text-muted small lh-base-muted"> {percent}% cap</span></>
  }

  if (condition.legCap > 0 && !showPercent) {
    return <>{condition.required.toLocaleString("en-US")}</>
  }

  if (condition.legValue > 0) {
    return <>{condition.required.toLocaleString("en-US")} <span className="text-muted small lh-base-muted"> legs with </span>{condition.legValue.toLocaleString("en-US")}</>
  }

  return <>{condition.required.toLocaleString("en-US")}</>
}

function getCapText(condition) {
  if (condition.legCap > 0) {
    let percent = (condition.legCap / condition.required) * 100;
    return <span className="text-muted small lh-base-muted"> {percent}% cap</span>
  }
  return <></>
}

function subtractOneDay(isoDateString) {
  const date = new Date(isoDateString);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().split('.')[0] + 'Z';
}

export default RankAdvance;

RankAdvance.propTypes = {
  currentRank: PropTypes.string.isRequired,
  ranks: PropTypes.any.isRequired,
  valueMap: PropTypes.array,
  period: PropTypes.any.isRequired,
  options: PropTypes.any.isRequired,
  isPreview: PropTypes.bool
}
