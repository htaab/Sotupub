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
import { cn, getImageUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";

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
  const { user } = useAuthStore();
  const role = user?.role || "client";

  const navItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard />,
      link: "/",
      role: ['admin', 'client', 'project manager', 'stock manager', 'technician'],
    },
    {
      title: "Users",
      icon: <UsersRound />,
      link: "/users",
      role: ['admin'],
    },
    // {
    //   title: "Project manager",
    //   icon: <UsersRound />,
    //   link: "/project-managers",
    //   role: ['admin', 'client', 'project manager', 'technician'],
    // },
    // {
    //   title: "Technicians",
    //   icon: <UsersRound />,
    //   link: "/technicians",
    //   role: ['admin', 'client', 'project manager', 'technician'],
    // },
    // {
    //   title: "Stock managers",
    //   icon: <UsersRound />,
    //   link: "/stock-managers",
    //   role: ['admin', 'client', 'project manager', 'technician'],
    // },
    // {
    //   title: "Clients",
    //   icon: <UsersRound />,
    //   link: "/clients",
    //   role: ['admin', 'client', 'project manager', 'technician'],
    // },
    {
      title: "Projects",
      icon: <FolderKanban />,
      link: "/projects",
      role: ['admin', 'client', 'project manager', 'technician', "stock manager"],
    },
    {
      title: "Products",
      icon: <PackageSearch />,
      link: "/products",
      role: ['admin', 'stock manager'],
    },
    {
      title: "Calendar",
      icon: <CalendarRange />,
      link: "/calendar",
      role: ['admin', 'client', 'project manager', 'technician'],
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
                  src={user?.image ? getImageUrl(user.image) : `https://ui-avatars.com/api/?name=${user?.name}`}
                  alt="@shadcn"
                />
                <AvatarFallback className="text-center">{user?.name}</AvatarFallback>
              </Avatar>
              <div
                className={`flex flex-col overflow-hidden transition-all ${expanded ? "w-52 ml-3" : "w-0 opacity-0"
                  }`}
              >
                <h4 className="font-semibold">{user?.name}</h4>
                <span className="text-xs">{user?.email}</span>
                <span className="text-xs">{user?.role}</span>
              </div>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
};

export default Sidebar;
