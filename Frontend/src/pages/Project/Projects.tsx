import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { List, FolderPlus, RefreshCcw, Edit, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import useProjects from "@/hooks/useProjects";
import { useAuthStore } from "@/store/auth-store";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/DatePicker";
import { useUsers } from "@/hooks/useUsers";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import ProjectFormModal from "@/components/Forms/project/ProjectFormModal";
import DeleteEntityModal from "@/components/Forms/common/DeleteEntityModal";
import { projectService } from "@/services/projectService";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import ProductsListModal from "@/components/projects/ProductsListModal";

const Projects = () => {
  const { user } = useAuthStore();
  const {
    projects,
    pagination,
    isLoading,
    error,
    refetch,
    resetFilters,
    handlePageChange,
    handleLimitChange,
    handleSearch,
    handleStatusChange,
    handleDateChange,
    status,
    search,
    limit,
    startDate,
    endDate,
    client,
    projectManager,
    stockManager,
    handleUserChange
  } = useProjects();
  const isAdmin = user?.role === "admin";

  // Only fetch users data if the current user is an admin
  const { users = [] } = useUsers({ enabled: isAdmin });
  const clients = isAdmin ? users.filter(user => user.role === "client") : [];
  const projectManagers = isAdmin ? users.filter(user => user.role === "project manager") : [];
  const stockManagers = isAdmin ? users.filter(user => user.role === "stock manager") : [];

  const [searchInput, setSearchInput] = useState(search);

  return (
    <>
      <Card className="mb-5">
        <CardHeader>
          <CardTitle className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <span>Projects List</span>
            <input
              type="text"
              value={searchInput}
              placeholder="Search projects..."
              className="px-3 py-2 border rounded-md"
              onChange={(e) => { setSearchInput(e.target.value); handleSearch(e.target.value) }}
            />
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => refetch()}>
                Refresh
              </Button>
              {user?.role === "admin" && (
                <ProjectFormModal
                  message={
                    <Button>
                      <FolderPlus className="mr-2" />
                      Add Project
                    </Button>
                  }
                />
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1" >
              <AccordionTrigger>Filters</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-3 md:flex-row">
                    <div className="w-full">
                      <Button variant="outline" onClick={resetFilters} className="w-full">
                        Reset Filters
                      </Button>
                    </div>
                    <Select
                      value={status || 'all'}
                      onValueChange={(value) => handleStatusChange(value === 'all' ? undefined : value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="To Do">To Do</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {user?.role === "admin" &&
                    <div className="flex flex-col gap-3 md:flex-row">
                      {/* Client filter */}
                      <Select
                        value={client || 'all'}
                        onValueChange={(value) => handleUserChange('client', value === 'all' ? undefined : value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Client" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Clients</SelectItem>
                          {clients.map(client => (
                            <SelectItem key={client._id} value={client._id}>Client : {client.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* Project Manager filter */}
                      <Select
                        value={projectManager || 'all'}
                        onValueChange={(value) => handleUserChange('projectManager', value === 'all' ? undefined : value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Project Manager" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Project Managers</SelectItem>
                          {projectManagers.map(manager => (
                            <SelectItem key={manager._id} value={manager._id}>Project Manager {manager.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* Stock Manager filter */}
                      <Select
                        value={stockManager || 'all'}
                        onValueChange={(value) => handleUserChange('stockManager', value === 'all' ? undefined : value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Stock Manager" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Stock Managers</SelectItem>
                          {stockManagers.map(manager => (
                            <SelectItem key={manager._id} value={manager._id}>Stock Manager {manager.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  }
                  <div className="flex flex-col gap-3 md:flex-row">
                    <div className="w-full">
                      <DatePicker
                        date={startDate ? new Date(startDate) : undefined}
                        onSelect={(date) => handleDateChange('startDate', date ? format(date, 'yyyy-MM-dd') : undefined)}
                        placeholder="Select start date"
                        fromDate={new Date()}
                      />
                    </div>
                    <div className="w-full">
                      <DatePicker
                        date={endDate ? new Date(endDate) : undefined}
                        onSelect={(date) => handleDateChange('endDate', date ? format(date, 'yyyy-MM-dd') : undefined)}
                        placeholder="Select end date"
                        fromDate={startDate ? new Date(startDate) : new Date()}
                      />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              {pagination && `Total: ${pagination.total} projects`}
            </div>
            <Select
              value={String(limit)}
              onValueChange={(value) => handleLimitChange(Number(value))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Items per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          // Loading state
          Array(3).fill(0).map((_, index) => (
            <Card key={index} className="opacity-80">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <Skeleton className="h-7 w-3/5" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-14 w-full rounded" />
                    <Skeleton className="h-14 w-full rounded" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t">
                <Skeleton className="h-8 w-20 rounded" />
                <Skeleton className="h-8 w-20 rounded" />
                <Skeleton className="h-8 w-20 rounded" />
              </CardFooter>
            </Card>
          ))
        ) : error ? (
          <div className="col-span-full text-center py-10 text-red-500">
            <p>{error instanceof Error ? error.message : "Failed to load projects"}</p>
          </div>
        ) : projects && projects.length > 0 ? (
          projects.map((project) => (
            <Card key={project._id} className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border-t-4" style={{
              borderTopColor:
                project.status === "Completed" ? "rgb(22, 163, 74)" :
                  project.status === "In Progress" ? "rgb(37, 99, 235)" :
                    project.status === "Cancelled" ? "rgb(220, 38, 38)" :
                      "rgb(234, 179, 8)"
            }}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-bold">{project.name}</CardTitle>
                  <span className={`text-xs font-medium px-2 py-1 rounded-md ${project.status === "Completed" ? "bg-green-100 text-green-800" :
                    project.status === "In Progress" ? "bg-blue-100 text-blue-800" :
                      project.status === "Cancelled" ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"
                    }`}>
                    {project.status}
                  </span>
                </div>
                <CardDescription>
                  <span className="font-medium">Company:</span> {project.entreprise || "N/A"}
                </CardDescription>
              </CardHeader>

              <CardContent className="pb-3">
                <div className="space-y-3">
                  <div className="bg-primary-foreground dark:bg-slate-900 p-2 rounded-md shadow-sm">
                    <h4 className="text-sm font-medium ">Description :</h4>
                    <p className="text-sm line-clamp-2">
                      {project.description || "No description provided"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-md shadow-sm">
                      <span className="block text-xs font-medium mb-1">Start Date</span>
                      <span className="font-medium">
                        {project.beginDate ? format(new Date(project.beginDate), 'MMM dd, yyyy') : "N/A"}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-md shadow-sm">
                      <span className="block text-xs font-medium mb-1">End Date</span>
                      <span className="font-medium">
                        {project.endDate ? format(new Date(project.endDate), 'MMM dd, yyyy') : "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs">
                    <div className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md flex gap-1">
                      <span className="font-medium">Client:</span> {
                        typeof project.client === 'object' && project.client !== null
                          ? project.client.name
                          : typeof project.client === 'string'
                            ? project.client
                            : <span className="text-amber-500 flex items-center">N/A <AlertTriangle className="h-3 w-3 ml-1" /></span>
                      }
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md flex gap-1">
                      <span className="font-medium">Manager:</span> {
                        typeof project.projectManager === 'object' && project.projectManager !== null
                          ? project.projectManager.name
                          : typeof project.projectManager === 'string'
                            ? project.projectManager
                            : <span className="text-amber-500 flex items-center">N/A <AlertTriangle className="h-3 w-3 ml-1" /></span>
                      }
                    </div>
                    {(project.products?.length > 0) && (
                      <>
                        <div className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md flex gap-1">
                          <span className="font-medium">Manager:</span> {
                            typeof project.stockManager === 'object' && project.stockManager !== null
                              ? project.stockManager.name
                              : typeof project.stockManager === 'string'
                                ? project.stockManager
                                : <span className="text-amber-500 flex items-center">N/A <AlertTriangle className="h-3 w-3 ml-1" /></span>
                          }
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                          <span className="font-medium">Products:</span> {project.products.length}
                        </div>
                        <ProductsListModal project={project} />
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
              {user?.role !== "stock manager" &&
                <CardFooter className="flex justify-end gap-2">
                  {user?.role === "admin" && (
                    <ProjectFormModal
                      project={project}
                      message={
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4 text-green-600" />
                        </Button>
                      }
                    />
                  )}
                  {user?.role === "admin" && (
                    <DeleteEntityModal
                      deleteFunction={projectService.deleteProject}
                      entity={project}
                      entityName={project.name}
                      entityType="Project"
                      queryKeys={[["projects"], ["products"], ["projects-calendar"]]}
                    />
                  )}
                  <Link to={`/projects/${project._id}/tasks`}>
                    <Button size="sm">
                      <List className="h-4 w-4 mr-1" />
                      Tasks
                    </Button>
                  </Link>
                </CardFooter>
              }
            </Card>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-muted">
            <div className="bg-muted/30 p-4 rounded-full mb-4">
              <FolderPlus className="h-12 w-12 opacity-50 text-primary/60" />
            </div>
            <h3 className="text-xl font-medium text-foreground mb-2">No projects found</h3>
            <p className="text-sm max-w-md text-center mb-6">
              Try adjusting your search filters or create a new project to get started
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 gap-2"
              onClick={resetFilters}
            >
              <RefreshCcw className="h-4 w-4" />
              Reset Filters
            </Button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                />
              </PaginationItem>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => handlePageChange(page)}
                    isActive={pagination.page === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </>
  );
};

export default Projects;
