import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

function PieChart({ data }) {
  return (
    <div style={{ width: 350, height: 350, margin: "0 auto" }}>
      <Pie data={data} options={{ maintainAspectRatio: false }} />
    </div>
  );
}

export default PieChart;
