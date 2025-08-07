import React from "react-dom/client";
import { useQuery, gql } from "@apollo/client";
import { useParams } from "react-router-dom"
import Chart from "react-apexcharts";
import PageHeader from "../../components/pageHeader";
import DataLoading from "../../components/dataLoading";
import TrendArrow from "../../components/trendArrow";
import { ToLocalDate } from "../../util/LocalDate";
import TopEarnersTable from "./topEarnersTable";
import DataError from "../../components/dataError";

var GET_PERIOD_DETAILS = gql`query ($period: BigInt) {
  compensationPlans {
    id
    name
    period: periods(at: $period) {
      id
      begin
      end
      compensationPlanId
      rankBonus: bonusSummary(group: RANK) {
        group
        description
        paidAmount
        paidCount
        customerPaidCount
        totalVolume
      }
      titleBonus: bonusSummary(group: BONUS_TITLE) {
        group
        description
        paidAmount
        paidCount
        customerPaidCount
        totalVolume
      }
      topEarners: bonusSummary(group: NODE_ID, first: 10) {
        group
        description
        paidAmount
        paidCount
        totalVolume
      }
      dateTypeBonus: bonusSummary(group: [COMMISSION_DATE]) {
        group
        description
        paidAmount
        paidCount
        customerPaidCount
        totalVolume
      }
      volumeSummary {
        description
        totalVolume
      }
    }
    firstTime: periods(at: $period, previous: 2) {
      id
      begin
      end
      firstTimeBonus: bonusSummary(group: [COMMISSION_DATE]) {
        group
        description
        paidAmount
        paidCount
        customerPaidCount
        totalVolume
      }
    }
    periods(at: $period, previous: 6) {
      id
      begin
      end
      status
      totalCommissions
      totalCustomers
      totalCustomersPaid
      totalVolume
    }
    ranks{
      id
      name
    }
  }
}`;

const PeriodDetail = () => {
  let params = useParams();
  const { loading, error, data, } = useQuery(GET_PERIOD_DETAILS, {
    variables: { period: parseInt(params.periodId) },
  });

  if (loading) return <DataLoading />;
  if (error) return <DataError error={error} />;

  let compensationPlan = data.compensationPlans.find((p) => p.period.length > 0);
  let summaryPeriod = compensationPlan.period[0];

  let period = compensationPlan.periods.find(x => x.begin == summaryPeriod.begin);
  let totalCommissionTrend = calculateTrend(compensationPlan.periods.map((period) => period.totalCommissions));
  let customersPaidTrend = calculateTrend(compensationPlan.periods.map((period) => period.totalCustomersPaid));
  let customersPaidPercent = period.totalCustomers > 0 ? (period.totalCustomersPaid / period.totalCustomers) * 100 : 0;
  let totalVolumeTrend = calculateTrend(compensationPlan.periods.map((period) => period.totalVolume));
  let totalFtVolume = compensationPlan.firstTime[1]?.firstTimeBonus.reduce((partialSum, a) => partialSum + a.totalVolume, 0) ?? 0;
  let totalFtVolumeTrend = calculateTrend(compensationPlan.firstTime.map(x => x.firstTimeBonus.reduce((partialSum, a) => partialSum + a.totalVolume, 0)));

  let topEarners = summaryPeriod.topEarners;
  let ranks = compensationPlan.ranks;

  const begin = new Date(period.begin);
  //const today = new Date();
  //let todayCommissionTotal = summaryPeriod.dateTypeBonus.find((bonus) => bonus.description == today.toISOString().split('T')[0])?.paidAmount ?? 0;
  //let prevCommissionTotal = summaryPeriod.dateTypeBonus.filter((bonus) => bonus.description != today.toISOString().split('T')[0]).map((bonus) => bonus.paidAmount);

  const daylyVolume = summaryPeriod.volumeSummary.map((volume) => { return { day: getDayFromDate(volume.description), value: volume.totalVolume } });
  const daylyBonus = summaryPeriod.dateTypeBonus.map((volume) => { return { day: getDayFromDate(volume.description), value: volume.paidAmount } });

  const totalDays = new Date(begin.getFullYear(), begin.getMonth() + 1, 0).getDate();
  let dayArray = [], dayVolume = [], dayBonus = [];
  for (let day = 1; day <= totalDays; day++) {
    dayArray.push(`${begin.getFullYear()}/${begin.getMonth() + 1}/${day}`);
    dayVolume.push(daylyVolume.find(volume => volume.day == day)?.value ?? 0)
    dayBonus.push(daylyBonus.find(volume => volume.day == day)?.value ?? 0)
  }


  let chart_commissions = {
    options: {
      chart: {
        type: "area",
        fontFamily: 'inherit',
        sparkline: {
          enabled: true
        },
        animations: {
          enabled: false
        },
      },
      dataLabels: {
        enabled: false,
      },
      fill: {
        opacity: .16,
        type: 'solid'
      },
      stroke: {
        width: 2,
        lineCap: "round",
        curve: "smooth",
      },
      grid: {
        strokeDashArray: 4,
      },
      xaxis: {
        labels: {
          padding: 0,
        },
        tooltip: {
          enabled: false
        },
        axisBorder: {
          show: false,
        },
      },
      yaxis: {
        labels: {
          padding: 4
        },
      },
      labels: compensationPlan.periods.map((period) => period.begin),
      colors: ["#206bc4"],
      legend: {
        show: false,
      },
    },
    series: [
      {
        name: "Commissions",
        data: compensationPlan.periods.map((period) => period.totalCommissions)
      }
    ]
  };

  let chart_new_volume = {
    options: {
      chart: {
        type: "line",
        fontFamily: 'inherit',
        height: 40.0,
        sparkline: {
          enabled: true
        },
        animations: {
          enabled: false
        },
      },
      fill: {
        opacity: 1,
      },
      stroke: {
        width: [2, 1],
        dashArray: [0, 3],
        lineCap: "round",
        curve: "smooth",
      },
      grid: {
        strokeDashArray: 4,
      },
      xaxis: {
        labels: {
          padding: 0,
        },
        tooltip: {
          enabled: false
        },
        type: 'datetime',
      },
      yaxis: {
        labels: {
          padding: 4
        },
      },
      labels: compensationPlan.periods.map((period) => period.begin),
      colors: ["#206bc4", "#a8aeb7"],
      legend: {
        show: false,
      }
    },
    series: [
      {
        name: "This Period",
        data: compensationPlan.periods.map((period) => period.totalCustomers)
      },
      {
        name: "Last Period",
        data: compensationPlan.periods.map((period) => period.totalVolume)
      }
    ]
  };

  let chart_total_volume = {
    options: {
      chart: {
        type: "line",
        fontFamily: 'inherit',
        height: 40.0,
        sparkline: {
          enabled: true
        },
        animations: {
          enabled: false
        },
      },
      fill: {
        opacity: 1,
      },
      stroke: {
        width: [2, 1],
        dashArray: [0, 3],
        lineCap: "round",
        curve: "smooth",
      },
      grid: {
        strokeDashArray: 4,
      },
      xaxis: {
        labels: {
          padding: 0,
        },
        tooltip: {
          enabled: false
        },
        axisBorder: {
          show: false,
        },
      },
      yaxis: {
        labels: {
          padding: 4
        },
      },
      labels: compensationPlan.periods.map((period) => period.begin),
      colors: ["#206bc4"],
      legend: {
        show: false,
      },
    },
    series: [{
      name: "Volume",
      data: compensationPlan.periods.map((period) => period.totalVolume)
    }]
  };

  let chart_volume_byday = {
    options: {
      chart: {
        type: "bar",
        fontFamily: 'inherit',
        height: 240,
        parentHeightOffset: 0,
        toolbar: {
          show: false,
        },
        animations: {
          enabled: false
        },
        stacked: true,
      },
      plotOptions: {
        bar: {
          columnWidth: '50%',
        }
      },
      dataLabels: {
        enabled: false,
      },
      fill: {
        opacity: 1,
      },
      grid: {
        padding: {
          top: -20,
          right: 0,
          left: -4,
          bottom: -4
        },
        strokeDashArray: 4,
        xaxis: {
          lines: {
            show: true
          }
        },
      },
      xaxis: {
        labels: {
          padding: 0,
        },
        tooltip: {
          enabled: false
        },
        axisBorder: {
          show: false,
        },
        type: 'datetime',
      },
      yaxis: {
        labels: {
          padding: 4
        },
      },
      labels: dayArray,
      colors: ["#206bc4", "#79a6dc", "#bfe399"],
      legend: {
        show: false,
      }
    },
    series: [{
      name: "Total Daily Volume",
      data: dayVolume
    }, {
      name: "R",
      data: []
    }, {
      name: "V",
      data: []
    }]
  }

  let chart_commission_earnedbyday = {
    options: {
      chart: {
        type: "area",
        fontFamily: 'inherit',
        height: 152,
        sparkline: {
          enabled: true
        },
        animations: {
          enabled: false
        },
      },
      markers: {
        shape: "circle",
        size: [3]
      },
      dataLabels: {
        enabled: false,
      },
      fill: {
        opacity: .16,
        type: 'solid'
      },
      stroke: {
        width: 2,
        lineCap: "round",
        curve: "smooth",
      },
      grid: {
        strokeDashArray: 4,
      },
      xaxis: {
        labels: {
          padding: 0,
        },
        tooltip: {
          enabled: false
        },
        axisBorder: {
          show: false,
        },
        type: 'datetime',
      },
      yaxis: {
        labels: {
          padding: 4
        },
      },
      labels: dayArray,
      colors: ["#bfe399"],
      legend: {
        show: false,
      },
      point: {
        show: false
      },
    },
    series: [{
      name: "Total Daily Commissions",
      data: dayBonus
    }]
  };

  let breadcrumbText = ToLocalDate(summaryPeriod.end, true);
  let periodBeginText = ToLocalDate(summaryPeriod.begin, false);
  let periodEndText = ToLocalDate(summaryPeriod.end, false);

  return <PageHeader title="Commission Period Summary" postTitle={`${periodBeginText} - ${periodEndText}`} breadcrumbs={[{ title: 'Commission Periods', link: `/commissions/periods?p=${compensationPlan.id}` }, { title: breadcrumbText }]} >
    <div className="container-xl">
      <div className="row row-deck row-cards">
        <div className="col-sm-6 col-lg-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="subheader">Commissions total</div>
              </div>
              <div className="d-flex align-items-baseline">
                <div className="h1 mb-0 me-2">{Math.round(period.totalCommissions ?? 0).toLocaleString("en-US", { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                <div className="me-auto">
                  <TrendArrow trend={totalCommissionTrend} />
                </div>
              </div>
            </div>
            <div className="chart-sm">
              <Chart options={chart_commissions.options} series={chart_commissions.series} type="area" height="40.0" />
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="subheader">Customers Paid</div>
              </div>
              <div className="h1 mb-3">{period.totalCustomersPaid.toLocaleString()}</div>
              <div className="d-flex mb-2">
                <div>Customer earning rate</div>
                <div className="ms-auto">
                  <TrendArrow trend={customersPaidTrend} />
                </div>
              </div>
              <div className="progress progress-sm">
                <div className="progress-bar bg-blue" style={{ width: `${customersPaidPercent}%` }} role="progressbar" aria-valuenow={customersPaidPercent} aria-valuemin="0" aria-valuemax="100">
                  <span className="visually-hidden">{customersPaidPercent}% Complete</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="subheader">First Time Volume</div>
              </div>
              <div className="d-flex align-items-baseline">
                <div className="h1 mb-3 me-2">{totalFtVolume}</div>
                <div className="me-auto">
                  <TrendArrow trend={totalFtVolumeTrend} />
                </div>
              </div>
              <div className="chart-sm">
                <Chart options={chart_new_volume.options} series={chart_new_volume.series} type="line" height="40.0" />
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="subheader">Total volume</div>
              </div>
              <div className="d-flex align-items-baseline">
                <div className="h1 mb-3 me-2">{Math.round(period.totalVolume).toLocaleString()}</div>
                <div className="me-auto">
                  <TrendArrow trend={totalVolumeTrend} />
                </div>
              </div>
              <div className="chart-sm">
                <Chart options={chart_total_volume.options} series={chart_total_volume.series} type="line" height="40.0" />
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="row row-cards">
            <div className="col-12">
              <div className="card">
                <div className="card-header border-0">
                  <h3 className="card-title" title="Commission volume by day">Volume summary</h3>
                  <div className="card-actions">
                    <a className="link-secondary" href={`/commissions/periods/${params.periodId}/volumesummary`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-external-link" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                        <path d="M11 7h-5a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-5"></path>
                        <line x1="10" y1="14" x2="20" y2="4"></line>
                        <polyline points="15 4 20 4 20 9"></polyline>
                      </svg>
                    </a>
                  </div>
                </div>
                <div className="card-body">
                  <div className="chart-lg">
                    <Chart options={chart_volume_byday.options} series={chart_volume_byday.series} type={chart_volume_byday.options.chart.type} height="240" />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <p className="mb-3">Customers Paid <strong>{period.totalCustomersPaid} </strong>of {period.totalCustomers}</p>
                  <div className="progress progress-separated mb-3">
                    <div className="progress-bar bg-primary" role="progressbar" style={{ width: "0%" }} ></div>
                    <div className="progress-bar bg-info" role="progressbar" style={{ width: "0%" }} ></div>
                    <div className="progress-bar bg-success" role="progressbar" style={{ width: `${(period.totalCustomersPaid / period.totalCustomers) * 100}%` }} ></div>
                  </div>
                  <div className="row">
                    <div className="col-auto d-flex align-items-center pe-2">
                      <span className="legend me-2 bg-primary"></span>
                      <span>12 Periods</span>
                      <span className="d-none d-md-inline d-lg-none d-xxl-inline ms-2 text-muted">0</span>
                    </div>
                    <div className="col-auto d-flex align-items-center px-2">
                      <span className="legend me-2 bg-info"></span>
                      <span>6 Periods</span>
                      <span className="d-none d-md-inline d-lg-none d-xxl-inline ms-2 text-muted">0</span>
                    </div>
                    <div className="col-auto d-flex align-items-center px-2">
                      <span className="legend me-2 bg-success"></span>
                      <span>New </span>
                      <span className="d-none d-md-inline d-lg-none d-xxl-inline ms-2 text-muted">{period.totalCustomersPaid}</span>
                    </div>
                    <div className="col-auto d-flex align-items-center ps-2">
                      <span className="legend me-2"></span>
                      <span>Unpaid</span>
                      <span className="d-none d-md-inline d-lg-none d-xxl-inline ms-2 text-muted">{period.totalCustomers - period.totalCustomersPaid}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card" /* style="height: calc(27rem + 10px)" */>
            <div className="card-header border-0">
              <div className="card-title">Commissions Earned</div>
            </div>
            <div className="position-relative">
              <div className="position-absolute top-0 left-0 px-3 mt-1 w-50">
                {/* <div className="row g-2">
                    <div className="col-auto">
                        <div className="chart-sparkline chart-sparkline-square" id="sparkline-activity"></div>
                    </div>
                    <div className="col">
                        <div>Today&apos;s Earning: {todayCommissionTotal}</div>
                        <TrendArrow trend={calculateTrend([...prevCommissionTotal, todayCommissionTotal])} />
                    </div>
                </div> */}
              </div>
              <div id="chart-commission-earnedbyday">
                <Chart options={chart_commission_earnedbyday.options} series={chart_commission_earnedbyday.series} type={chart_commission_earnedbyday.options.chart.type} height="152" />
              </div>
            </div>
            <div className="card-table table-responsive h-100" >
              <table className="table table-vcenter">
                <thead>
                  <tr>
                    <th>Bonus</th>
                    <th>Count</th>
                    <th className="text-end">Paid Amount</th>
                    <th>Percent</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryPeriod.titleBonus && summaryPeriod.titleBonus.map((bonus) => {
                    let percent = Math.round((bonus.paidAmount / period.totalCommissions) * 100);
                    return <tr key={bonus.description}>
                      <td>{bonus.description}</td>
                      <td><a href={`/commissions/periods/${params.periodId}/bonusDetail/${bonus.description}`}>{bonus.customerPaidCount}</a></td>
                      <td className="text-end" >{bonus.paidAmount.toLocaleString("en-US", { style: 'currency', currency: 'USD' })}</td>
                      <td className="text-center">
                        <div className="row align-items-center">
                          <div className="col-12 col-lg-auto">{percent}%</div>
                          <div className="col">
                            <div className="progress">
                              <div className="progress-bar" style={{ width: `${percent}%` }} role="progressbar" aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100" aria-label={`{percent}% Complete`}>
                                <span className="visually-hidden">{percent}% Complete</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-md-12 col-lg-7">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Rank Summary</h3>
            </div>
            <table className="table card-table table-vcenter">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Count</th>
                  <th className="text-end">Paid Amount</th>
                  <th>Percent</th>
                </tr>
              </thead>
              <tbody>
                {summaryPeriod.rankBonus && summaryPeriod.rankBonus.map((bonus) => {
                  let percent = Math.round((bonus.paidAmount / period.totalCommissions) * 100);
                  let rank = ranks.find(el => el.id == bonus.description) || { id: bonus?.description, name: bonus?.description };
                  return <tr key={bonus.description}>
                    <td>{rank?.name === '' ? ` - ` : rank?.name}</td>
                    <td><a href={`/commissions/periods/${params.periodId}/rankDetail/${bonus.description === '' ? '0' : bonus.description}`}>{bonus.customerPaidCount}</a></td>
                    <td className="text-end" >{bonus.paidAmount.toLocaleString("en-US", { style: 'currency', currency: 'USD' })}</td>
                    <td className="text-center">
                      <div className="row align-items-center">
                        <div className="col-12 col-lg-auto">{percent}%</div>
                        <div className="col">
                          <div className="progress">
                            <div className="progress-bar" style={{ width: `${percent}%` }} role="progressbar" aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100" aria-label={`{percent}% Complete`}>
                              <span className="visually-hidden">{percent}% Complete</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="col-md-12 col-lg-5">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Merchant Summary</h3>
            </div>
            <div className="table-responsive">
              <table className="table card-table table-vcenter">

              </table>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Leaders and Top Earners</h3>
              <div className="card-actions">
                <a className="link-secondary" href="/">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-external-link" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M11 7h-5a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-5"></path>
                    <line x1="10" y1="14" x2="20" y2="4"></line>
                    <polyline points="15 4 20 4 20 9"></polyline>
                  </svg>
                </a>
              </div>
            </div>
            <div className="table-responsive">
              <TopEarnersTable topEarners={topEarners} periodId={params.periodId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageHeader>
}

export default PeriodDetail;

function getDayFromDate(dateString) {
  const date = new Date(dateString);
  const day = date.getDate();
  return day;
}

function calculateTrend(values) {
  let cumulativeChangeAmount = 0;
  let initialValue = values[0];

  for (let i = 1; i < values.length; i++) {
    const finalValue = values[i];

    if (initialValue === 0) {
      initialValue = finalValue;
      continue;
    }

    const changeAmount = finalValue - initialValue;
    cumulativeChangeAmount += changeAmount;
    initialValue = finalValue;
  }

  const percentChange = (cumulativeChangeAmount / values[0]) * 100;
  return percentChange;
}