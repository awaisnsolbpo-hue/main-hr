/**
 * OrdersOverview - Material Dashboard Style
 * Timeline/activity overview component matching Material Dashboard design
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";

interface TimelineItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "success" | "error" | "warning" | "info";
}

interface OrdersOverviewProps {
  items: TimelineItem[];
  title?: string;
}

export function OrdersOverview({ items, title = "Orders overview" }: OrdersOverviewProps) {
  const getIcon = (type: string) => {
    const iconClasses = "h-4 w-4";
    switch (type) {
      case "success":
        return <CheckCircle2 className={`${iconClasses} text-[#4CAF50]`} />;
      case "error":
        return <XCircle className={`${iconClasses} text-[#F44335]`} />;
      case "warning":
        return <AlertCircle className={`${iconClasses} text-[#fb8c00]`} />;
      default:
        return <Clock className={`${iconClasses} text-[#1A73E8]`} />;
    }
  };

  const getLineColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-[#4CAF50]";
      case "error":
        return "bg-[#F44335]";
      case "warning":
        return "bg-[#fb8c00]";
      default:
        return "bg-[#1A73E8]";
    }
  };

  return (
    <Card className="relative bg-white border-0 shadow-md-lg overflow-hidden">
      <CardHeader className="p-4 pb-3">
        <h6 className="text-base font-bold text-[#344767] mb-1">{title}</h6>
        <p className="text-sm font-light text-[#7b809a]">
          <span className="font-bold text-[#344767]">+{items.length}%</span> this month
        </p>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="relative">
          {items.map((item, index) => (
            <div key={item.id} className="flex gap-4 pb-4 last:pb-0 relative">
              {/* Timeline Line */}
              {index !== items.length - 1 && (
                <div
                  className={`absolute left-[11px] top-8 bottom-0 w-[2px] ${getLineColor(
                    item.type
                  )} opacity-20`}
                />
              )}

              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">{getIcon(item.type)}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h6 className="text-sm font-semibold text-[#344767] mb-0.5">
                  {item.title}
                </h6>
                <p className="text-xs font-light text-[#7b809a] mb-2">
                  {item.description}
                </p>
                <p className="text-xs font-light text-[#7b809a]">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
