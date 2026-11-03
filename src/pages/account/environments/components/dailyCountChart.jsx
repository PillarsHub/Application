import React from 'react';
import PropTypes from 'prop-types';
import Chart from "react-apexcharts";

const DailyCountChart = ({ data, height = 250 }) => {

  const series = data.map(item => item.count);
  const categories = data.map(item => item.date);

  var options = {
    series: [{
      name: 'API Calls',
      data: series
    }],
    chart: {
      type: 'bar',
      height: height,
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      }
    },
    plotOptions: {
      bar: {
        columnWidth: '60%',
        dataLabels: {
          position: 'top', // top, center, bottom
        }
      }
    },
    dataLabels: {
      enabled: false,
      offsetY: -20,
      style: {
        fontSize: '14px',
        colors: ["#304758"]
      }
    },
    fill: {
      opacity: 1,
    },
    colors: ["#2fb344"],
    grid: {
      padding: {
        top: -20,
        right: 0,
        left: -4,
        bottom: -4
      },
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
      categories: categories
    },
    yaxis: {
      labels: {
        padding: 4
      }
    },
    tooltip: {
      shared: true,
      intersect: false
    }
  };


  return <>
    <Chart options={options} series={options.series} type={options.chart.type} height={options.chart.height} />
  </>
}

export default React.memo(DailyCountChart);

DailyCountChart.propTypes = {
  data: PropTypes.array.isRequired,
  height: PropTypes.number,
}

