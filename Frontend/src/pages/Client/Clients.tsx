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

const Clients = () => {
  const user = {
    id: 4,
    name: "name",
    phone: "123456789",
    email: "test@test.com",
    number: 21,
    picture: "",
  };
  return (
    <div className="">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <span>Clients List</span>
            <div>
              <UserFormModal
                role="Client"
                triggerMessage={
                  <Button variant="outline">
                    <UserPlus />
                    Add Technician
                  </Button>
                }
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="text-2xl">
              <TableRow>
                <TableHead>Full name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone number</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="text-lg">
                <TableCell className="font-medium">user001</TableCell>
                <TableCell>user@mail.com</TableCell>
                <TableCell>23456789</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-4">
                    <UserFormModal
                      role="Client"
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

export default Clients;
