/**
 * ProjectsTable - Material Dashboard Style
 * Projects table component matching Material Dashboard design
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MoreVertical } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Project {
  id: string;
  title: string;
  company?: string;
  budget?: string;
  status: "completed" | "in_progress" | "pending" | "cancelled";
  completion: number;
  logo?: string;
}

interface ProjectsTableProps {
  projects: Project[];
  title?: string;
}

export function ProjectsTable({ projects, title = "Projects" }: ProjectsTableProps) {
  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-[#4CAF50] text-white hover:bg-[#43A047]",
      in_progress: "bg-[#1A73E8] text-white hover:bg-[#1662C4]",
      pending: "bg-[#fb8c00] text-white hover:bg-[#f57c00]",
      cancelled: "bg-[#F44335] text-white hover:bg-[#E53935]",
    };

    const labels = {
      completed: "Completed",
      in_progress: "In Progress",
      pending: "Pending",
      cancelled: "Cancelled",
    };

    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <Card className="relative bg-white border-0 shadow-md-lg overflow-hidden">
      <CardHeader className="p-4 pb-3 border-b border-[#dee2e6]">
        <div className="flex items-center justify-between">
          <h6 className="text-base font-bold text-[#344767]">{title}</h6>
          <button className="text-[#7b809a] hover:text-[#344767] transition-colors">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#dee2e6] hover:bg-transparent">
                <TableHead className="text-xs uppercase font-bold text-[#7b809a] py-3 px-4">
                  Job / Company
                </TableHead>
                <TableHead className="text-xs uppercase font-bold text-[#7b809a] py-3 px-4 text-center">
                  Budget
                </TableHead>
                <TableHead className="text-xs uppercase font-bold text-[#7b809a] py-3 px-4 text-center">
                  Status
                </TableHead>
                <TableHead className="text-xs uppercase font-bold text-[#7b809a] py-3 px-4 text-center">
                  Completion
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow
                  key={project.id}
                  className="border-b border-[#f0f2f5] hover:bg-[#f8f9fa] transition-colors"
                >
                  <TableCell className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={project.logo} />
                        <AvatarFallback className="bg-gradient-to-br from-[#EC407A] to-[#D81B60] text-white text-xs">
                          {project.title.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-[#344767]">
                          {project.title}
                        </p>
                        {project.company && (
                          <p className="text-xs font-light text-[#7b809a]">
                            {project.company}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-center">
                    <p className="text-sm font-semibold text-[#344767]">
                      {project.budget || "N/A"}
                    </p>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-center">
                    {getStatusBadge(project.status)}
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#f0f2f5] rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#1A73E8] to-[#49a3f1] h-full rounded-full transition-all duration-300"
                          style={{ width: `${project.completion}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-[#7b809a] min-w-[35px] text-right">
                        {project.completion}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
