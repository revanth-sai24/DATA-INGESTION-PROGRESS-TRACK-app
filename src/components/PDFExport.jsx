"use client";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  Description as ReportIcon,
  Assessment as AnalyticsIcon,
  ListAlt as TaskListIcon,
} from "@mui/icons-material";

export default function PDFExport({ darkMode, isOpen, onClose }) {
  const tasks = useSelector((state) => state.tasks.tasks);
  const projects = useSelector((state) => state.tasks.projects);
  const [exportType, setExportType] = useState("tasks");
  const [isExporting, setIsExporting] = useState(false);
  const [includeCompleted, setIncludeCompleted] = useState(true);
  const [includeArchived, setIncludeArchived] = useState(false);

  const generatePDF = async () => {
    setIsExporting(true);

    try {
      // Dynamic import to avoid SSR issues
      const jsPDF = (await import("jspdf")).default;
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, pageWidth, 40, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("Task Manager Report", 14, 25);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Generated on: ${new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`,
        14,
        35,
      );

      doc.setTextColor(0, 0, 0);
      let yPos = 55;

      if (exportType === "tasks" || exportType === "full") {
        // Filter tasks based on options
        let filteredTasks = tasks;
        if (!includeCompleted) {
          filteredTasks = filteredTasks.filter((t) => t.status !== "completed");
        }
        if (!includeArchived) {
          filteredTasks = filteredTasks.filter((t) => t.status !== "archived");
        }

        // Summary Section
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Summary", 14, yPos);
        yPos += 10;

        const summary = [
          ["Total Tasks", filteredTasks.length.toString()],
          [
            "Completed",
            filteredTasks
              .filter((t) => t.status === "completed")
              .length.toString(),
          ],
          [
            "In Progress",
            filteredTasks
              .filter((t) => t.status === "in-progress")
              .length.toString(),
          ],
          [
            "To Do",
            filteredTasks.filter((t) => t.status === "todo").length.toString(),
          ],
          [
            "On Hold",
            filteredTasks
              .filter((t) => t.status === "on-hold")
              .length.toString(),
          ],
          [
            "High Priority",
            filteredTasks
              .filter((t) => t.priority === "high")
              .length.toString(),
          ],
          ["Projects", projects.length.toString()],
        ];

        autoTable(doc, {
          startY: yPos,
          head: [["Metric", "Count"]],
          body: summary,
          theme: "striped",
          headStyles: { fillColor: [37, 99, 235] },
          margin: { left: 14, right: 14 },
        });

        yPos = doc.lastAutoTable.finalY + 15;

        // Tasks Table
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Task List", 14, yPos);
        yPos += 10;

        const taskTableData = filteredTasks.map((task) => [
          task.title?.substring(0, 30) || "-",
          task.project || "-",
          task.priority || "medium",
          task.status || "todo",
          task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-",
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [["Title", "Project", "Priority", "Status", "Due Date"]],
          body: taskTableData,
          theme: "grid",
          headStyles: { fillColor: [37, 99, 235] },
          margin: { left: 14, right: 14 },
          styles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 35 },
            2: { cellWidth: 25 },
            3: { cellWidth: 30 },
            4: { cellWidth: 30 },
          },
        });
      }

      if (exportType === "analytics" || exportType === "full") {
        if (exportType === "full") {
          doc.addPage();
          yPos = 20;
        }

        // Analytics Section
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Analytics & Insights", 14, yPos);
        yPos += 15;

        // Completion Rate
        const completionRate =
          tasks.length > 0
            ? Math.round(
                (tasks.filter((t) => t.status === "completed").length /
                  tasks.length) *
                  100,
              )
            : 0;

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Overall Completion Rate: ${completionRate}%`, 14, yPos);
        yPos += 10;

        // Priority Breakdown
        const priorityData = [
          [
            "High",
            tasks.filter((t) => t.priority === "high").length.toString(),
            `${Math.round((tasks.filter((t) => t.priority === "high").length / Math.max(tasks.length, 1)) * 100)}%`,
          ],
          [
            "Medium",
            tasks.filter((t) => t.priority === "medium").length.toString(),
            `${Math.round((tasks.filter((t) => t.priority === "medium").length / Math.max(tasks.length, 1)) * 100)}%`,
          ],
          [
            "Low",
            tasks.filter((t) => t.priority === "low").length.toString(),
            `${Math.round((tasks.filter((t) => t.priority === "low").length / Math.max(tasks.length, 1)) * 100)}%`,
          ],
        ];

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Priority Distribution", 14, yPos);
        yPos += 8;

        autoTable(doc, {
          startY: yPos,
          head: [["Priority", "Count", "Percentage"]],
          body: priorityData,
          theme: "striped",
          headStyles: { fillColor: [239, 68, 68] },
          margin: { left: 14, right: 14 },
        });

        yPos = doc.lastAutoTable.finalY + 15;

        // Project Performance
        if (projects.length > 0) {
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text("Project Performance", 14, yPos);
          yPos += 8;

          const projectData = projects.slice(0, 10).map((project) => {
            const projectName = project.name || project;
            const projectTasks = tasks.filter((t) => t.project === projectName);
            const completed = projectTasks.filter(
              (t) => t.status === "completed",
            ).length;
            const rate =
              projectTasks.length > 0
                ? Math.round((completed / projectTasks.length) * 100)
                : 0;
            return [
              projectName,
              projectTasks.length.toString(),
              completed.toString(),
              `${rate}%`,
            ];
          });

          autoTable(doc, {
            startY: yPos,
            head: [["Project", "Total Tasks", "Completed", "Completion Rate"]],
            body: projectData,
            theme: "grid",
            headStyles: { fillColor: [34, 197, 94] },
            margin: { left: 14, right: 14 },
          });

          yPos = doc.lastAutoTable.finalY + 15;
        }

        // Overdue Tasks
        const overdueTasks = tasks.filter((task) => {
          if (!task.dueDate || task.status === "completed") return false;
          return new Date(task.dueDate) < new Date();
        });

        if (overdueTasks.length > 0) {
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(239, 68, 68);
          doc.text(`Overdue Tasks (${overdueTasks.length})`, 14, yPos);
          doc.setTextColor(0, 0, 0);
          yPos += 8;

          const overdueData = overdueTasks
            .slice(0, 10)
            .map((task) => [
              task.title?.substring(0, 40) || "-",
              task.priority || "medium",
              new Date(task.dueDate).toLocaleDateString(),
            ]);

          autoTable(doc, {
            startY: yPos,
            head: [["Task", "Priority", "Due Date"]],
            body: overdueData,
            theme: "striped",
            headStyles: { fillColor: [239, 68, 68] },
            margin: { left: 14, right: 14 },
          });
        }
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${i} of ${pageCount} | Task Manager Report`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" },
        );
      }

      // Save
      const fileName = `task-report-${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div
        className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-xl shadow-2xl w-full max-w-md p-6 animate-scale-in`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
              <PdfIcon className="text-white" />
            </div>
            <div>
              <h2
                className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}
              >
                Export to PDF
              </h2>
              <p
                className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Generate a report
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${darkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Export Type Selection */}
        <div className="space-y-3 mb-6">
          <label
            className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
          >
            Report Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "tasks", label: "Tasks", icon: TaskListIcon },
              { id: "analytics", label: "Analytics", icon: AnalyticsIcon },
              { id: "full", label: "Full Report", icon: ReportIcon },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setExportType(id)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  exportType === id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                    : darkMode
                      ? "border-gray-600 hover:border-gray-500 bg-gray-700"
                      : "border-gray-200 hover:border-gray-300 bg-gray-50"
                }`}
              >
                <Icon
                  className={`mx-auto mb-1 ${exportType === id ? "text-blue-500" : darkMode ? "text-gray-400" : "text-gray-600"}`}
                />
                <div
                  className={`text-xs font-medium ${exportType === id ? "text-blue-600" : darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  {label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          <label
            className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
          >
            Include
          </label>
          <div className="space-y-2">
            <label
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${darkMode ? "bg-gray-700 hover:bg-gray-650" : "bg-gray-50 hover:bg-gray-100"}`}
            >
              <input
                type="checkbox"
                checked={includeCompleted}
                onChange={(e) => setIncludeCompleted(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span
                className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Completed Tasks
              </span>
            </label>
            <label
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${darkMode ? "bg-gray-700 hover:bg-gray-650" : "bg-gray-50 hover:bg-gray-100"}`}
            >
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span
                className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Archived Tasks
              </span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              darkMode
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={generatePDF}
            disabled={isExporting}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-white flex items-center justify-center gap-2 transition-all ${
              isExporting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
            }`}
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Generating...
              </>
            ) : (
              <>
                <DownloadIcon fontSize="small" />
                Export PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
