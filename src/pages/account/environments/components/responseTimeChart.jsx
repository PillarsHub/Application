import React from 'react';
import PropTypes from 'prop-types';
import Chart from "react-apexcharts";

const ResponseTimeChart = ({ data }) => {

  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const groupedArray = data?.filter(item => new Date(item.date) >= oneDayAgo).reduce((acc, currentItem) => {
    const existingItem = acc.find(item => item.date === currentItem.date);
  
    if (existingItem) {
      // If the date already exists, update the sum and count
      existingItem.sumResponseTime += currentItem.averageResponseTime;
      existingItem.count += 1;
    } else {
      // If the date doesn't exist, add a new entry to the accumulator
      acc.push({
        sumResponseTime: currentItem.averageResponseTime,
        count: 1,
        date: currentItem.date,
      });
    }
  
    return acc;
  }, []) ?? [];

  // Sort the array by date from earliest to newest
  groupedArray.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Calculate the average response time for each date
  const averageResponseTimes = groupedArray.map(item => ([new Date(item.date).getTime(), Math.round(item.sumResponseTime / item.count) ]));
  const labels = groupedArray.map(item => (item.date));

  const aa = false;
  if (aa) return <>{JSON.stringify(labels)}</>

  var options = {
    series: [{
      name: 'Response Time',
      data: averageResponseTimes
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
      min: oneDayAgo,
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
    labels: labels,
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

export default ResponseTimeChart;

ResponseTimeChart.propTypes = {
  data: PropTypes.any.isRequired,
}
