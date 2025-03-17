import { useState } from "react";
import { ThemeProvider } from "./components/theme-provider";
import Sidebar from "./components/Nav/Sidebar";
import Topbar from "./components/Nav/topbar/Topbar";
import { Toaster } from "@/components/ui/sonner";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import Dashboard from "./pages/Dashboard/Dashboard";
import Clients from "./pages/Client/Clients";
import Login from "./pages/Auth/Login";
import ProjectManagers from "./pages/ProjectManager/ProjectManagers";
import Technicians from "./pages/Technician/Technicians";
import StockManager from "./pages/StockManager/StockManagers";
import Projects from "./pages/Project/Projects";
import Calendar from "./pages/Calendar";
import Products from "./pages/product/Products";
import ProjectTasks from "./pages/Project/ProjectTasks";
import ProjectForm from "./pages/Project/ProjectForm";
import ClientForm from "./pages/Client/ClientForm";
import PmForm from "./pages/ProjectManager/PmForm";
import TechnicianForm from "./pages/Technician/TechnicianForm";
import StockManagerForm from "./pages/StockManager/StockManagerForm";
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
          path: "/stock-managers",
          element: <StockManager />,
        },
        {
          path: "/create-new-sm",
          element: <StockManagerForm />,
        },
        {
          path: "/technicians",
          element: <Technicians />,
        },
        {
          path: "/create-technician",
          element: <TechnicianForm />,
        },
        {
          path: "/project-managers",
          element: <ProjectManagers />,
        },
        {
          path: "/create-new-pm",
          element: <PmForm />,
        },
        {
          path: "/clients",
          element: <Clients />,
        },
        {
          path: "/create-new-client",
          element: <ClientForm />,
        },
        {
          path: "/projects",
          element: <Projects />,
        },
        {
          path: "/projects/new-project",
          element: <ProjectForm />,
        },
        {
          path: "/projects/:id/Tasks",
          element: <ProjectTasks />,
        },
        {
          path: "/products",
          element: <Products />,
        },
        {
          path: "/calendar",
          element: <Calendar />,
        },
      ],
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
