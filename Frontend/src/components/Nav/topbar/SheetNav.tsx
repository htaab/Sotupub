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
  BadgeDollarSign,
  BookText,
  BookUser,
  LayoutDashboard,
  LayoutList,
  Menu,
  Notebook,
  Settings,
  UserCog,
  UsersRound,
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
    title: "Blogs",
    icon: <BookText />,
    link: "/blogs",
  },
  {
    title: "Bookings",
    icon: <Notebook />,
    link: "/bookings",
  },
  {
    title: "Categories",
    icon: <LayoutList />,
    link: "/Categories",
  },
  {
    title: "Services",
    icon: <BadgeDollarSign />,
    link: "/services",
  },
  {
    title: "Tnkers Pro",
    icon: <UserCog />,
    link: "/tnkerspro",
  },
  {
    title: "Tnkers",
    icon: <UsersRound />,
    link: "/tnkers",
  },
  {
    title: "Agencies",
    icon: <BookUser />,
    link: "/agencies",
  },
  // {
  //     title: "Plans",
  //     icon: <Banknote />,
  //     link: "/plans",
  // },
  {
    title: "Settings",
    icon: <Settings />,
    link: "/settings",
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
      <SheetContent
        side="left"
        className="bg-gradient-to-br from-foreground/5 overflow-scroll"
      >
        <SheetHeader>
          <SheetTitle>
            <img
              src={logoSrc}
              className={`overflow-hidden transition-all`}
              alt=""
            />
          </SheetTitle>
        </SheetHeader>
        {navItems.map((item, index) => (
          <Link
            to={item.link}
            key={index}
            className={`mb-2 p-3 flex items-center last:mb-0 cursor-pointer rounded-md transition-all 
                    ${
                      item.link === activeLink
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
              <h4 className="font-semibold">Hello Tnker</h4>
              <span className="text-xs">tntinker7@gmail.com</span>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default SheetNav;
