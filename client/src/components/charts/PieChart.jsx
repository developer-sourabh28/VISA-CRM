import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

// Custom plugin for center text
const centerTextPlugin = {
  id: 'centerText',
  beforeDraw(chart) {
    const { ctx, width, height, options } = chart;
    const text = options.plugins.centerText?.text;
    const textColor = options.plugins.centerText?.color || '#000';
    const fontSize = options.plugins.centerText?.fontSize || 20;

    if (text) {
      ctx.restore();
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.fillStyle = textColor;

      const textX = (width - ctx.measureText(text).width) / 2;
      const textY = height / 2;

      ctx.fillText(text, textX, textY);
      ctx.save();
    }
  },
};

ChartJS.register(ArcElement, Tooltip, Legend, centerTextPlugin);

function PieChart({ data, centerText }) {
  const options = {
    maintainAspectRatio: false,
    cutout: '70%', // Doughnut effect
    plugins: {
      centerText: {
        text: centerText,
        color: '#ffffff', // Center label color
        fontSize: 24,
      },
      legend: {
        display: false, // Hide legend if desired
      },
      tooltip: {
        enabled: true,
      },
    },
  };

  return (
    <div style={{ width: 250, height: 250, margin: "0 auto" }}>
      <Pie data={data} options={options} />
    </div>
  );
}

export default PieChart;
