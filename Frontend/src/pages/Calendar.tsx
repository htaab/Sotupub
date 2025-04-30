import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useQuery } from "@tanstack/react-query";
import { projectService } from "@/services/projectService";
import { Project } from "@/types/project";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { format } from "date-fns";
import { EventClickArg } from '@fullcalendar/core';

const Calendar = () => {
  const [selectedEvent, setSelectedEvent] = useState<Project | null>(null);

  // Fetch all projects for the calendar
  const { data, isLoading, error } = useQuery({
    queryKey: ["projects-calendar"],
    queryFn: async () => {
      // Fetch all projects without pagination
      const response = await projectService.getProjects({ limit: 1000 });
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch projects");
      }
      return response.data.projects;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Transform projects into calendar events
  const events = data?.map((project) => ({
    id: project._id,
    title: project.name,
    start: project.beginDate,
    end: project.endDate,
    backgroundColor: getStatusColor(project.status),
    borderColor: getStatusColor(project.status),
    extendedProps: { project },
  })) || [];

  // Handle event click to show details
  const handleEventClick = (info: EventClickArg) => {
    setSelectedEvent(info.event.extendedProps.project as Project);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-xl">
            <span className="calendar-icon mr-2">📅</span>
            Project Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-[600px] w-full" />
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">
              <p>{error instanceof Error ? error.message : "Failed to load projects"}</p>
            </div>
          ) : (
            <div className="rounded-md overflow-hidden">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                selectable={true}
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                events={events}
                eventClick={handleEventClick}
                aspectRatio={1.8}
                displayEventTime={false}
                dayMaxEvents={true}
                eventDisplay="block"
                nowIndicator={true}
                height="auto"
                eventContent={(eventInfo) => {
                  return (
                    <div className="p-1.5 overflow-hidden">
                      <div className="text-xs font-semibold truncate flex items-center">
                        {eventInfo.event.title}
                      </div>
                      <div className="text-xs opacity-75 truncate mt-0.5">
                        {format(new Date(eventInfo.event.start || new Date()), 'MMM d')} -
                        {format(new Date(eventInfo.event.end || new Date()), 'MMM d')}
                      </div>
                    </div>
                  )
                }}
                dayCellClassNames="hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                eventClassNames="rounded-md shadow-sm hover:shadow-md transition-all duration-200 mb-2 mx-3"
                dayHeaderClassNames="text-sm font-medium bg-slate-50 dark:bg-slate-800"
                moreLinkClassNames="text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-800 px-2 py-0.5 rounded-full transition-colors"
                moreLinkContent={({ num }) => `+${num} more`}
                buttonText={{
                  today: 'Today',
                  month: 'Month',
                  week: 'Week',
                  day: 'Day'
                }}
                titleFormat={{ year: 'numeric', month: 'long' }}
                firstDay={1}
                slotLabelFormat={{
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                }}
                allDaySlot={false}
                slotLabelClassNames="text-xs font-medium text-slate-500 dark:text-slate-400"
                viewClassNames="border rounded-md shadow-sm"
                stickyHeaderDates={true}
                fixedWeekCount={false}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEvent && (
        <Card className="shadow-md border-l-4" style={{ borderLeftColor: getStatusColor(selectedEvent.status) }}>
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center">
              <span className="text-lg">{selectedEvent.name}</span>
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${selectedEvent.status === "Completed" ? "bg-green-100 text-green-800" :
                  selectedEvent.status === "In Progress" ? "bg-blue-100 text-blue-800" :
                    selectedEvent.status === "Cancelled" ? "bg-red-100 text-red-800" :
                      "bg-yellow-100 text-yellow-800"
                  }`}>
                  {selectedEvent.status}
                </span>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300">
                  {format(new Date(selectedEvent.beginDate), 'MMM dd')} - {format(new Date(selectedEvent.endDate), 'MMM dd, yyyy')}
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg shadow-sm">
                <h4 className="text-sm font-medium mb-2 text-slate-500 dark:text-slate-400">Company:</h4>
                <p className="text-sm font-medium">{selectedEvent.entreprise || "N/A"}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg shadow-sm">
                <h4 className="text-sm font-medium mb-2 text-slate-500 dark:text-slate-400">Description:</h4>
                <p className="text-sm">{selectedEvent.description || "No description provided"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg shadow-sm">
                  <h4 className="text-sm font-medium mb-2 text-slate-500 dark:text-slate-400">Start Date:</h4>
                  <p className="text-sm font-medium">{format(new Date(selectedEvent.beginDate), 'MMM dd, yyyy')}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg shadow-sm">
                  <h4 className="text-sm font-medium mb-2 text-slate-500 dark:text-slate-400">End Date:</h4>
                  <p className="text-sm font-medium">{format(new Date(selectedEvent.endDate), 'MMM dd, yyyy')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg shadow-sm">
                  <h4 className="text-sm font-medium mb-2 text-slate-500 dark:text-slate-400">Client:</h4>
                  <p className="text-sm">
                    {typeof selectedEvent.client === 'object' && selectedEvent.client !== null
                      ? selectedEvent.client.name
                      : typeof selectedEvent.client === 'string'
                        ? selectedEvent.client
                        : "N/A"}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg shadow-sm">
                  <h4 className="text-sm font-medium mb-2 text-slate-500 dark:text-slate-400">Project Manager:</h4>
                  <p className="text-sm">
                    {typeof selectedEvent.projectManager === 'object' && selectedEvent.projectManager !== null
                      ? selectedEvent.projectManager.name
                      : typeof selectedEvent.projectManager === 'string'
                        ? selectedEvent.projectManager
                        : "N/A"}
                  </p>
                </div>
              </div>

              {/* Products section */}
              {selectedEvent.products && selectedEvent.products.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg shadow-sm">
                  <h4 className="text-sm font-medium mb-3 text-slate-500 dark:text-slate-400">Products:</h4>
                  <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100 dark:bg-slate-800">
                        <tr>
                          <th className="text-left p-3 font-medium text-slate-600 dark:text-slate-300 rounded-tl-md">Name</th>
                          <th className="text-left p-3 font-medium text-slate-600 dark:text-slate-300">Reference</th>
                          <th className="text-left p-3 font-medium text-slate-600 dark:text-slate-300">Category</th>
                          <th className="text-right p-3 font-medium text-slate-600 dark:text-slate-300">Price</th>
                          <th className="text-right p-3 font-medium text-slate-600 dark:text-slate-300 rounded-tr-md">Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEvent.products.map((item, index) => (
                          <tr key={index} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <td className="p-3">{item.product.name}</td>
                            <td className="p-3 text-slate-500 dark:text-slate-400">{item.product.reference}</td>
                            <td className="p-3">{item.product.category}</td>
                            <td className="p-3 text-right">${item.product.price.toFixed(2)}</td>
                            <td className="p-3 text-right">{item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-100 dark:bg-slate-800 font-medium">
                        <tr>
                          <td colSpan={3} className="p-3 rounded-bl-md">Total</td>
                          <td className="p-3 text-right">
                            ${selectedEvent.products.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toFixed(2)}
                          </td>
                          <td className="p-3 text-right rounded-br-md">
                            {selectedEvent.products.reduce((sum, item) => sum + item.quantity, 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Helper function to get color based on project status
function getStatusColor(status: string): string {
  switch (status) {
    case "Completed":
      return "#10b981"; // emerald-500 - a more vibrant green
    case "In Progress":
      return "#3b82f6"; // blue-500 - a brighter, more engaging blue
    case "Cancelled":
      return "#f43f5e"; // rose-500 - a softer red that's less harsh
    default: // To Do
      return "#f59e0b"; // amber-500 - a warmer, more inviting yellow
  }
}

export default Calendar;