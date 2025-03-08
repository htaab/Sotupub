import { useState } from "react";
import { ThemeProvider } from "./components/theme-provider";
import Sidebar from "./components/Nav/Sidebar";
import Topbar from "./components/Nav/topbar/Topbar";
import { Toaster } from "@/components/ui/sonner";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import Dashboard from "./pages/Dashbord/Dashboard";
import Clients from "./pages/Clients/Clients";
import Login from "./pages/Auth/Login";

const Layout = () => {
  const [expanded, setExpanded] = useState(true);
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <div className="flex">
        <Sidebar expanded={expanded} setExpanded={setExpanded} />
        <div
          className={`w-full transition-all ${
            expanded ? "xl:pl-[250px]" : "xl:pl-[150px]"
          }`}
        >
          <Topbar />
          <div className="p-3 md:p-8 mt-6 md:mt-0">
            <Outlet />
          </div>
          <Toaster />
        </div>
      </div>
    </ThemeProvider>
  );
};

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      // the Protected component redirect us to the login page if there is no user
      element: <Layout />,
      children: [
        {
          path: "/",
          element: <Dashboard />,
        },
        {
          path: "/",
          element: <Dashboard />,
        },
        {
          path: "/",
          element: <Dashboard />,
        },
      ],
    },
    {
      path: "/clients",
      element: <Clients />,
    },
    {
      path: "/login",
      element: (
        <ThemeProvider>
          {" "}
          <Login />
        </ThemeProvider>
      ),
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
