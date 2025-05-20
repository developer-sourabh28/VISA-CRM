import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

function PieChart({ data }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!data || !chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const chartData = {
      labels: data.map((item) => item.status),
      datasets: [
        {
          data: data.map((item) => item.percentage),
          backgroundColor: [
            "#10b981", // Green for Approved
            "#f59e0b", // Yellow for In Progress
            "#ef4444", // Red for Rejected
          ],
          borderWidth: 1,
        },
      ],
    };

    const ctx = chartRef.current.getContext("2d");
    chartInstance.current = new Chart(ctx, {
      type: "pie",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || "";
                const value = context.raw || 0;
                return `${label}: ${value}%`;
              },
            },
          },
        },
      },
    });
  }, [data]);

  return (
    <div className="w-full h-[280px] relative">
      <canvas ref={chartRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

export default PieChart;
