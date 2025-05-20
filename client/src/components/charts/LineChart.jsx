import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

function LineChart({ data }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    // Cleanup previous chart instance when component unmounts or data changes
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!data || !chartRef.current || !data.datasets || data.datasets.length < 2) return;

    // Destroy previous chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create the chart
    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels || [],
        datasets: [
          {
            label: data.datasets[0]?.label || 'Dataset 1',
            data: data.datasets[0]?.data || [],
            borderColor: '#4f46e5', // Primary color
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            tension: 0.3,
            fill: true,
          },
          {
            label: data.datasets[1]?.label || 'Dataset 2',
            data: data.datasets[1]?.data || [],
            borderColor: '#10b981', // Success color
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              drawBorder: false,
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    });
  }, [data]);

  return (
    <div className="w-full h-full">
      <canvas ref={chartRef} height="240"></canvas>
    </div>
  );
}

export default LineChart;
