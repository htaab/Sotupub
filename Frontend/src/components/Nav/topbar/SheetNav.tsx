import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Menu,
  UsersRound,
  FolderKanban,
  PackageSearch,
  CalendarRange,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/components/theme-provider";

const navItems = [
  {
    title: "Dashboard",
    icon: <LayoutDashboard />,
    link: "/",
  },
  {
    title: "Users",
    icon: <UsersRound />,
    link: "/users",
    role: ['admin', 'client', 'project manager', 'technician'],
  },
  {
    title: "Project manager",
    icon: <UsersRound />,
    link: "/project-managers",
  },
  {
    title: "Technicians",
    icon: <UsersRound />,
    link: "/technicians",
  },
  {
    title: "Stock managers",
    icon: <UsersRound />,
    link: "/stock-managers",
  },
  {
    title: "Clients",
    icon: <UsersRound />,
    link: "/clients",
  },
  {
    title: "Projects",
    icon: <FolderKanban />,
    link: "/projects",
  },
  {
    title: "Products",
    icon: <PackageSearch />,
    link: "/products",
  },
  {
    title: "Calendar",
    icon: <CalendarRange />,
    link: "/calendar",
  },
];

const SheetNav = () => {
  const location = useLocation();
  // the activeLink state is used to highlight the current active item of the sidebar.
  const [activeLink, setActiveLink] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const TriggerSheet = () => {
    setSheetOpen(!sheetOpen); // Close the sheet when a link is clicked
  };

  const { theme } = useTheme();
  const logoSrc =
    theme === "light"
      ? "/images/Logo Tinker black T.svg"
      : "/images/Logo Tinker w N.svg";

  useEffect(() => {
    // Update active link when the location changes
    setActiveLink(location.pathname);
  }, [location]);
  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild onClick={TriggerSheet}>
        <Button variant="outline" size="sm">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="overflow-scroll">
        <SheetHeader>
          <SheetTitle>
            <img src={logoSrc} alt="Logo" />
          </SheetTitle>
        </SheetHeader>
        {navItems.map((item, index) => (
          <Link
            to={item.link}
            key={index}
            className={`mb-2 p-3 flex items-center last:mb-0 cursor-pointer rounded-md transition-all 
                    ${item.link === activeLink
                ? "bg-primary/15 hover:bg-primary/50"
                : "hover:bg-secondary"
              }
                    `}
            onClick={TriggerSheet}
          >
            {item.icon}
            <p className={` font-medium leading-none ms-1`}>{item.title}</p>
          </Link>
        ))}
        <SheetFooter>
          <div className={"flex border-t p-2 w-full items-center"}>
            <Avatar className="h-14 w-14 me-2 border border-primary">
              <AvatarImage src="/images/Logo Tinker f.svg" alt="@shadcn" />
              <AvatarFallback className="text-center">
                Tnker Admin
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold">Hello User</h4>
              <span className="text-xs">user@gmail.com</span>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default SheetNav;
