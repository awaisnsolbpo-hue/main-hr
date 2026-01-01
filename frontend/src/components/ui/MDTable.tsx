/**
 * MDTable - Material Dashboard Table Component
 * Reusable table component with Material Dashboard styling
 */

import { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface MDTableProps {
  title?: string;
  children: ReactNode;
  headerActions?: ReactNode;
  className?: string;
}

interface MDTableHeaderProps {
  children: ReactNode;
  className?: string;
}

interface MDTableRowProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

interface MDTableCellProps {
  children: ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

export function MDTable({ title, children, headerActions, className }: MDTableProps) {
  return (
    <Card className={cn("relative bg-white border-0 shadow-md-lg overflow-hidden", className)}>
      {(title || headerActions) && (
        <CardHeader className="p-4 pb-3 border-b border-[#dee2e6]">
          <div className="flex items-center justify-between">
            {title && <h6 className="text-base font-bold text-[#344767]">{title}</h6>}
            {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>{children}</Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function MDTableHeader({ children, className }: MDTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow className={cn("border-b border-[#dee2e6] hover:bg-transparent", className)}>
        {children}
      </TableRow>
    </TableHeader>
  );
}

export function MDTableHeaderCell({ children, className }: MDTableCellProps) {
  return (
    <TableHead className={cn("text-xs uppercase font-bold text-[#7b809a] py-3 px-4", className)}>
      {children}
    </TableHead>
  );
}

export function MDTableBody({ children }: { children: ReactNode }) {
  return <TableBody>{children}</TableBody>;
}

export function MDTableRow({ children, onClick, className }: MDTableRowProps) {
  return (
    <TableRow
      onClick={onClick}
      className={cn(
        "border-b border-[#f0f2f5] hover:bg-[#f8f9fa] transition-colors",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </TableRow>
  );
}

export function MDTableCell({ children, className, align = "left" }: MDTableCellProps) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <TableCell className={cn("py-3 px-4", alignClass[align], className)}>
      {children}
    </TableCell>
  );
}
