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
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, UserPlus } from "lucide-react";
import UserFormModal from "@/components/Forms/UserFormModal";
import { useUsers } from "@/hooks/useUsers";

const Users = () => {
  const { users, pagination, isLoading, error } = useUsers();
  console.log('Users Data:', users);
  console.log('Pagination:', pagination);
  console.log('Loading:', isLoading);
  console.log('Error:', error);
  const user = {
    id: 1,
    name: "name",
    phone: "123456789",
    email: "test@test.com",
    number: 10,
    picture: "",
  };
  return (
    <div className="">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <span>Users List</span>
            <div>
              <UserFormModal
                role="Project Manager"
                triggerMessage={
                  <Button variant="outline">
                    <UserPlus />
                    Add User
                  </Button>
                }
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="text-xl">
              <TableRow>
                <TableHead>Full name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone number</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="text-lg">
                <TableCell>Usr</TableCell>
                <TableCell>pm@mail.com</TableCell>
                <TableCell>234567898</TableCell>
                <TableCell>qqqqqq</TableCell>
                <TableCell>ssss</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-4">
                    <UserFormModal
                      role="Project Manager"
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
            </TableBody>
          </Table>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;
