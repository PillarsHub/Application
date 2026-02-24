import React from 'react';
import PropTypes from 'prop-types';
import Chart from "react-apexcharts";

const PayoutChart = ({ bonuses, ranks }) => {
  let useCode = ranks.length > 10;

  const reversedItems = [...bonuses].reverse();
  const orderedRanks = [...ranks];

  var series = reversedItems.filter(bonus => bonus.payoutScales).map((bonus) => {
    return {
      name: bonus.name,
      data: orderedRanks.map((rank) => bonus.payoutScales?.find((element) => element.rankId == rank.id)?.maxPayoutPercent ?? 0)
    }
  })

  var categories = orderedRanks.map((rank) => useCode ? rank.code : rank.name);

  var options = {
    series: series,
    chart: {
      type: 'bar',
      height: 350,
      stacked: true,
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      }
    },
    title: {
      text: 'Maximum Payout by Rank',
      align: 'left'
    },
    dataLabels: {
      enabled: true,
    },
    stroke: {
      curve: 'straight'
    },
    responsive: [{
      breakpoint: 480,
      options: {
        legend: {
          position: 'bottom',
          offsetX: -10,
          offsetY: 0
        }
      }
    }],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 2,
        dataLabels: {
          total: {
            enabled: true,
            style: {
              fontSize: '12px',
              fontWeight: 900
            }
          }
        }
      },
    },
    xaxis: {
      categories: categories
    },
    fill: {
      opacity: 0.8,
      type: 'off',
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.45,
        opacityTo: 0.25,
        stops: [20, 100, 100, 100]
      },
    },
    
    colors: ["#206bc4", "#2fb344", "#4299e1", "#d63939", "#f59f00", "#f76707", "#87bc45", "#27aeef", "#d6336c"],
    tooltip: {
      shared: true,
      intersect: false,
      inverseOrder: true,
      x: {
        show: true,
        formatter: (seriesName) => useCode ? ranks.find((r) => r.code == seriesName)?.name : seriesName,
      },
      z: {
        formatter: undefined,
        title: 'Size: '
      },
    }
  };


  return <>
    <h3 className="card-title"></h3>
    <Chart options={options} series={options.series} type={options.chart.type} height={options.chart.height} />
  </>
}

export default PayoutChart;

PayoutChart.propTypes = {
  bonuses: PropTypes.any.isRequired,
  ranks: PropTypes.any.isRequired
}

