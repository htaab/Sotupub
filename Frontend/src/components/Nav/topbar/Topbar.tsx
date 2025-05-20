import { ModeToggle } from "@/components/mode-toggle";

import SheetNav from "./SheetNav";
import { AvatarMenu } from "./AvatarMenu";
import NotificationBell from "@/components/notifications/NotificationBell";

const Topbar = () => {
  return (
    <nav className="h-16 flex items-center px-5 shadow-lg dark:shadow-border/10">
      <div className="xl:hidden">
        <SheetNav />
      </div>
      <div className="ml-auto flex items-center">
        <ModeToggle className="mr-5" />
        <NotificationBell className="mr-5" />
        <AvatarMenu />
      </div>
    </nav>
  );
};

export default Topbar;
