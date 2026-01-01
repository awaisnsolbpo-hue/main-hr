/**
 * ReportsLineChart - Material Dashboard Style
 * Line chart component matching Material Dashboard design
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ReportsLineChartProps {
  color?: "primary" | "info" | "success" | "warning" | "error" | "dark";
  title: string;
  description: string | React.ReactNode;
  date: string;
  chart: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
    };
  };
}

const colorConfig = {
  primary: { line: "#e91e63", gradient: "rgba(236, 64, 122, 0.4)" },
  info: { line: "#1A73E8", gradient: "rgba(73, 163, 241, 0.4)" },
  success: { line: "#4CAF50", gradient: "rgba(102, 187, 106, 0.4)" },
  warning: { line: "#fb8c00", gradient: "rgba(255, 167, 38, 0.4)" },
  error: { line: "#F44335", gradient: "rgba(239, 83, 80, 0.4)" },
  dark: { line: "#344767", gradient: "rgba(66, 66, 74, 0.4)" },
};

export function ReportsLineChart({
  color = "success",
  title,
  description,
  date,
  chart,
}: ReportsLineChartProps) {
  const colors = colorConfig[color];

  const data = {
    labels: chart.labels,
    datasets: [
      {
        label: chart.datasets.label,
        data: chart.datasets.data,
        borderColor: colors.line,
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, colors.gradient);
          gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
          return gradient;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointBackgroundColor: colors.line,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#fff",
        titleColor: "#344767",
        bodyColor: "#7b809a",
        borderColor: "#dee2e6",
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function (context) {
            return context.parsed.y.toString();
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
    scales: {
      y: {
        grid: {
          display: true,
          drawBorder: false,
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          color: "#7b809a",
          font: {
            size: 12,
          },
          padding: 10,
        },
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: "#7b809a",
          font: {
            size: 12,
          },
          padding: 10,
        },
      },
    },
  };

  return (
    <Card className="relative bg-white border-0 shadow-md-lg overflow-hidden">
      <CardHeader className="p-4 pb-0">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h6 className="text-xs uppercase font-bold text-[#7b809a] mb-1">
              {title}
            </h6>
            <h4 className="text-lg font-bold text-[#344767] mb-1">{description}</h4>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="h-[200px]">
          <Line data={data} options={options} />
        </div>
        <div className="mt-4 pt-3 border-t border-[#dee2e6]">
          <p className="text-sm font-light text-[#7b809a]">
            <i className="far fa-clock mr-1"></i>
            {date}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
