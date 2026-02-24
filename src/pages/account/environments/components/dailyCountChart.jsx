import React from 'react';
import PropTypes from 'prop-types';
import Chart from "react-apexcharts";

const DailyCountChart = ({ data, height = 250 }) => {

  const days = 20;
  const currentDate = new Date();

  const last10Days = Array.from({ length: days }, (_, index) => {
    const day = new Date(currentDate);
    day.setDate(currentDate.getDate() - index);
    return day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }).reverse();

  // Group the items by the last 10 days in reverse order and sum the counts
  const groupedArray = last10Days.map(day => {
    const itemsForDay = data?.filter(item => {
      const localDate = new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return localDate === day;
    }) ?? [];

    const totalCount = itemsForDay.reduce((total, item) => total + item.callCount, 0);

    return { count: totalCount, date: day };
  });

  const series = groupedArray.map((currentItem) => currentItem.count);
  const categories = groupedArray.map((currentItem) => currentItem.date);

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

export default DailyCountChart;

DailyCountChart.propTypes = {
  data: PropTypes.any.isRequired,
  height: PropTypes.number,
}

