/**
 * ReportsBarChart - Material Dashboard Style
 * Bar chart component matching Material Dashboard design
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ReportsBarChartProps {
  color?: "primary" | "info" | "success" | "warning" | "error" | "dark";
  title: string;
  description: string;
  date: string;
  chart: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
    };
  };
}

const colorGradients = {
  primary: { start: "rgba(236, 64, 122, 0.8)", end: "rgba(216, 27, 96, 0.8)" },
  info: { start: "rgba(73, 163, 241, 0.8)", end: "rgba(26, 115, 232, 0.8)" },
  success: { start: "rgba(102, 187, 106, 0.8)", end: "rgba(67, 160, 71, 0.8)" },
  warning: { start: "rgba(255, 167, 38, 0.8)", end: "rgba(251, 140, 0, 0.8)" },
  error: { start: "rgba(239, 83, 80, 0.8)", end: "rgba(229, 57, 53, 0.8)" },
  dark: { start: "rgba(66, 66, 74, 0.8)", end: "rgba(25, 25, 25, 0.8)" },
};

export function ReportsBarChart({
  color = "info",
  title,
  description,
  date,
  chart,
}: ReportsBarChartProps) {
  const gradient = colorGradients[color];

  const data = {
    labels: chart.labels,
    datasets: [
      {
        label: chart.datasets.label,
        data: chart.datasets.data,
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, colorGradients[color].start);
          gradient.addColorStop(1, colorGradients[color].end);
          return gradient;
        },
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 10,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
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
          <Bar data={data} options={options} />
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
