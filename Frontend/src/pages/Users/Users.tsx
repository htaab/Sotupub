import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, UserPlus } from "lucide-react";
import UserFormModal from "@/components/Forms/UserFormModal";
import { useUsers } from "@/hooks/useUsers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Users = () => {
  const {
    users,
    pagination,
    isLoading,
    isFetching,  // Add this
    error,
    refetch,     // Add this
    resetFilters, // Add this
    handlePageChange,
    handleLimitChange, // Add this
    handleSearch,
    handleSort,
    handleRoleChange,
    handleActiveStatusChange,
    sort,
    order,
    search,      // Add this
    limit,       // Add this
    role,        // Add this
    isActive     // Add this
  } = useUsers();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <span>Users List</span>
            <div className="flex flex-wrap gap-2">
              {/* Add reset filters button */}
              <Button variant="outline" onClick={resetFilters}>
                Reset Filters
              </Button>
              {/* Add value to maintain input state */}
              <input
                type="text"
                value={search}
                placeholder="Search users..."
                className="px-3 py-2 border rounded-md"
                onChange={(e) => handleSearch(e.target.value)}
              />
              {/* Add value to maintain select state */}
              <Select 
                value={role || 'all'} 
                onValueChange={(value) => handleRoleChange(value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="project manager">Project Manager</SelectItem>
                  <SelectItem value="stock manager">Stock Manager</SelectItem>
                  <SelectItem value="technician">Technician</SelectItem>
                </SelectContent>
              </Select>
              {/* Add value to maintain select state */}
              <Select 
                value={isActive === undefined ? 'all' : String(isActive)}
                onValueChange={(value) => handleActiveStatusChange(value === 'all' ? undefined : value === 'true')}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
              {/* Add refresh button */}
              <Button variant="outline" onClick={() => refetch()}>
                Refresh
              </Button>
              <UserFormModal
                triggerMessage={
                  <Button variant="outline">
                    <UserPlus className="mr-2" />
                    Add User
                  </Button>
                }
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-muted-foreground">
              {pagination && `Total: ${pagination.total} users`}
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

          <div className="relative">
            {isFetching && !isLoading && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" />
              </div>
            )}
            <Table>
              <TableHeader className="text-xl">
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('name')}
                  >
                    Full name {sort === 'name' && (order === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('email')}
                  >
                    Email {sort === 'email' && (order === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>Phone number</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('role')}
                  >
                    Role {sort === 'role' && (order === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('isActive')}
                  >
                    Status {sort === 'isActive' && (order === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow className="text-lg">
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 " />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow className="text-lg">
                    <TableCell colSpan={6}>Error: {error.message}</TableCell>
                  </TableRow>
                ) : users && users?.length > 0 ?
                  (
                    users.map((user) => (
                      <TableRow className="text-lg" key={user._id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phoneNumber || 'N/A'}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>{user.isActive ? 'Active' : 'Inactive'}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-4">
                            <UserFormModal
                              triggerMessage={
                                <Button variant={"outline"} size={"icon"}>
                                  <Edit className="text-green-700" />
                                </Button>
                              }
                              user={user}
                            />
                            <Button variant="destructive">
                              <Trash2 />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) :
                  (
                    <TableRow className="text-lg">
                      <TableCell colSpan={6}>
                        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                          <UserPlus size={48} className="mb-2 opacity-50" />
                          <p className="text-lg font-medium">No Users Found</p>
                          <p className="text-sm">Start by adding a new user or try a different search</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                }
              </TableBody>
            </Table>

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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;
