import { useState } from "react";
import { lazy, Suspense } from "react";
import { ThemeProvider } from "./components/theme-provider";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Sidebar from "./components/Nav/Sidebar";
import Topbar from "./components/Nav/topbar/Topbar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ProtectedRoute } from "./components/Auth/protected-route";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationProvider } from './contexts/NotificationContext';

// Lazy load pages
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const Login = lazy(() => import("./pages/Auth/Login"));
const Clients = lazy(() => import("./pages/Client/Clients"));
const ProjectManagers = lazy(() => import("./pages/ProjectManager/ProjectManagers"));
const Technicians = lazy(() => import("./pages/Technician/Technicians"));
const StockManager = lazy(() => import("./pages/StockManager/StockManagers"));
const Projects = lazy(() => import("./pages/Project/Projects"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Products = lazy(() => import("./pages/product/Products"));
const ProjectTasks = lazy(() => import("./pages/Project/ProjectTasks"));
const ClientForm = lazy(() => import("./pages/Client/ClientForm"));
const Users = lazy(() => import("./pages/Users/Users"));
const Profile = lazy(() => import("./pages/Profile/Profile"));
const NotificationsPage = lazy(() => import("./pages/Notifications/NotificationsPage"));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinner size="lg" className="mx-auto mb-4" />
    </div>
  </div>
);

// Layout component
const Layout = () => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="flex">
      <Sidebar expanded={expanded} setExpanded={setExpanded} />
      <div
        className={`w-full transition-all ${expanded ? "xl:pl-[250px]" : "xl:pl-[150px]"
          }`}
      >
        <Topbar />
        <div className="p-3 md:p-8 mt-6 md:mt-0">
          <Suspense fallback={<div className="flex justify-center mt-10"><LoadingFallback /></div>}>
            <Outlet />
          </Suspense>
        </div>
        <Toaster richColors />
      </div>
    </div>
  );
};

// Router configuration
const routes = [
  {
    path: "/",
    element: (
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <ProtectedRoute>
          <NotificationProvider>
            <Layout />
          </NotificationProvider>
        </ProtectedRoute>
      </ThemeProvider>
    ),
    children: [
      {
        path: "/",
        element: <ProtectedRoute><Dashboard /></ProtectedRoute>
      },
      {
        path: "/stock-managers",
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <StockManager />
          </ProtectedRoute>
        )
      },
      {
        path: "/users",
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <Users />
          </ProtectedRoute>
        )
      },
      {
        path: "/technicians",
        element: (
          <ProtectedRoute allowedRoles={['admin', 'project manager']}>
            <Technicians />
          </ProtectedRoute>
        )
      },
      {
        path: "/project-managers",
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <ProjectManagers />
          </ProtectedRoute>
        )
      },
      {
        path: "/clients",
        element: (
          <ProtectedRoute allowedRoles={['admin', 'project manager']}>
            <Clients />
          </ProtectedRoute>
        )
      },
      {
        path: "/create-new-client",
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <ClientForm />
          </ProtectedRoute>
        )
      },
      {
        path: "/projects",
        element: (
          <ProtectedRoute allowedRoles={['admin', 'project manager', "client", "technician", "stock manager"]}>
            <Projects />
          </ProtectedRoute>
        )
      },
      {
        path: "/projects/:projectId/Tasks",
        element: (
          <ProtectedRoute allowedRoles={['admin', 'project manager', 'technician']}>
            <ProjectTasks />
          </ProtectedRoute>
        )
      },
      {
        path: "/products",
        element: (
          <ProtectedRoute allowedRoles={['admin', 'stock manager']}>
            <Products />
          </ProtectedRoute>
        )
      },
      {
        path: "/calendar",
        element: (
          <ProtectedRoute>
            <Calendar />
          </ProtectedRoute>
        )
      },
      {
        path: "/profile/:userId?",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        )
      },
      {
        path: "/notifications",
        element: (
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        )
      },
    ],
  },
  {
    path: "/login",
    element: (
      <ThemeProvider>
        <Suspense fallback={<div className="flex justify-center min-h-screen"><LoadingFallback /></div>}>
          <Login />
        </Suspense>
        <Toaster richColors />
      </ThemeProvider>
    ),
  },
];

function App() {
  const router = createBrowserRouter(routes);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
