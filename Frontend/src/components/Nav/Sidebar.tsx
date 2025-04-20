import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  UsersRound,
  PackageSearch,
  FolderKanban,
  CalendarRange,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Link, useLocation } from "react-router-dom";

// List of navigation items with title, icon, active state, and link

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  expanded: boolean;
  setExpanded: (value: boolean | ((prevValue: boolean) => boolean)) => void;
}

const Sidebar = ({
  className,
  expanded,
  setExpanded,
  ...props
}: SidebarProps) => {
  const location = useLocation();
  // the activeLink state is used to highlight the current active item of the sidebar.
  const [activeLink, setActiveLink] = useState("");

  const role = "admin";

  const navItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard />,
      link: "/",
      role: ["admin", "technicien", "stockist", "client"],
    },
    {
      title: "Users",
      icon: <UsersRound />,
      link: "/users",
      role: ["admin"],
    },
    {
      title: "Project manager",
      icon: <UsersRound />,
      link: "/project-managers",
      role: ["admin"],
    },
    {
      title: "Technicians",
      icon: <UsersRound />,
      link: "/technicians",
      role: ["admin"],
    },
    {
      title: "Stock managers",
      icon: <UsersRound />,
      link: "/stock-managers",
      role: ["admin"],
    },
    {
      title: "Clients",
      icon: <UsersRound />,
      link: "/clients",
      role: ["admin"],
    },
    {
      title: "Projects",
      icon: <FolderKanban />,
      link: "/projects",
      role: ["admin", "technicien", "stockist", "client"],
    },
    {
      title: "Products",
      icon: <PackageSearch />,
      link: "/products",
      role: ["admin"],
    },
    {
      title: "Calendar",
      icon: <CalendarRange />,
      link: "/calendar",
      role: ["admin"],
    },
  ];
  // the expanded state of our sidebar. this is a hook that keeps track of whether our sidebar is currently expanded or not.

  useEffect(() => {
    // Update active link when the location changes
    setActiveLink(location.pathname);
  }, [location]);
  return (
    <Card
      className={cn(
        `${expanded ? "w-[250px]" : "w-[150px]"
        } fixed h-full transition-all hidden xl:flex flex-col rounded-none`,
        className
      )}
      {...props}
    >
      <CardHeader className="relative mb-3">
        <CardTitle className="flex justify-center">
          {/* <img
            src={""}
            className={`overflow-hidden transition-all ${expanded ? "w-3/4" : "w-full"
              } `}
            alt=" Logo"
          /> */}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpanded((curr) => !curr)}
          className="absolute rounded-full -right-5 p-1.5 hover:bg-primary/50 transition-all"
        >
          {expanded ? <ChevronLeft /> : <ChevronRight />}
        </Button>
      </CardHeader>
      {/* Content */}
      <div className="overflow-auto h-full custom-scrollbar">
        <div className="min-h-full flex flex-col justify-between">
          <CardContent>
            {navItems
              .filter((item) => item.role.includes(role))
              .map((item, index) => (
                <Link
                  to={item.link}
                  key={index}
                  className={`mb-2 p-3 flex items-center last:mb-0 cursor-pointer rounded-md transition-all 
                                ${item.link === activeLink
                      ? "bg-primary/15 hover:bg-primary/50 dark:bg-primary/75 dark:hover:bg-primary"
                      : "hover:bg-secondary"
                    }
                                ${expanded ? "" : "flex-col"}`}
                >
                  {item.icon}
                  <p
                    className={`${expanded ? "text-lg" : "text-sm hidden"
                      } text-center font-medium leading-none ms-1`}
                  >
                    {item.title}
                  </p>
                </Link>
              ))}
          </CardContent>
          {/* end Content */}
          <CardContent>
            <div className="flex items-center justify-center">
              <Avatar className="h-14 w-14 border">
                <AvatarImage
                  src="https://github.com/shadcn.png"
                  alt="@shadcn"
                />
                <AvatarFallback className="text-center">User</AvatarFallback>
              </Avatar>
              <div
                className={`flex flex-col overflow-hidden transition-all ${expanded ? "w-52 ml-3" : "w-0 opacity-0"
                  }`}
              >
                <h4 className="font-semibold">User</h4>
                <span className="text-xs">user.email@gmail.com</span>
              </div>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
};

export default Sidebar;
