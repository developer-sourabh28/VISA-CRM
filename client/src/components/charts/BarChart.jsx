import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

function BarChart({ data }) {
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
    if (!data || !chartRef.current) return;

    // Destroy previous chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create the chart
    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels || [],
        datasets: [
          {
            label: data.datasets[0]?.label || 'Applications',
            data: data.datasets[0]?.data || [],
            backgroundColor: 'golden',
            borderColor: '#da9100',

            borderWidth: 6,

            // Added border radius for rounded bars
            borderRadius: 6,

            // Optional: round only the top edges
            borderSkipped: false, // or 'bottom' to skip border on bottom only
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
            ticks: {
              maxTicksLimit: 5,
              font: {
                size: 12
              }
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              maxTicksLimit: 8,
              font: {
                size: 11
              }
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            titleFont: {
              size: 12
            },
            bodyFont: {
              size: 12
            }
          },
        },
      },
    });
  }, [data]);

  return (
    <div className="relative w-full h-full">
      <canvas ref={chartRef}></canvas>
    </div>
  );
}

export default BarChart;
