import React from 'react';
import PropTypes from 'prop-types';
import Chart from "react-apexcharts";

const ResponseTimeChart = ({ data, startDate }) => {
  var options = {
    series: [{
      name: 'Response Time',
      data
    }],
    chart: {
      id: 'area-datetime',
      type: 'area',
      height: 100,
      parentHeightOffset: 0,
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      }
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      type: 'datetime',
      min: startDate,
      labels: {
        show: false,
        padding: 0,
        format: 'dd MMM hh:mm TT', // Set the format for X-axis labels
      },
      axisBorder: {
        show: false,
      },
      tickAmount: 10, // Adjust the number of ticks on the X-axis as needed
      tooltip: {
        enabled: false // Disable tooltip for X-axis labels
      }
    },
    yaxis: {
      tickAmount: 3,
      labels: {
        padding: 4
      },
    },
    tooltip: {
      x: {
        format: 'dd MMM hh:mm TT',
        formatter: function (val) {
          const options = { day: 'numeric', month: 'short', hour: 'numeric', minute: 'numeric', hour12: true };
          return new Date(val).toLocaleString(undefined, options);
        }
      },
      y: {
        formatter: function (val) {
          return val + ' ms'; // Append "ms" to the Y-axis value
        }
      },
      shared: true,
      intersect: false
    },
    grid: {
      padding: {
        top: -20,
        right: 0,
        left: -4,
        bottom: -4
      },
      strokeDashArray: 4,
    },
    colors: ["#206bc4"],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.9,
        stops: [0, 100]
      }
    },
  };


  return <>
    <Chart options={options} series={options.series} type={options.chart.type} height={options.chart.height} />
  </>
}

export default React.memo(ResponseTimeChart);

ResponseTimeChart.propTypes = {
  data: PropTypes.array.isRequired,
  startDate: PropTypes.number.isRequired,
}
