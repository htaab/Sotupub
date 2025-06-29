import { useLocation } from "react-router-dom";
import { ChartExemple } from "./ChartExemple";
import { useEffect } from "react";
import { toast } from "sonner";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

const Dashboard = () => {
  const location = useLocation();
  useEffect(() => {
    if (location.state?.showToast) {
      toast.error(location.state.message);
      // Clear the state to prevent showing the toast again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);
  return (
    <>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 mb-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">Total Users <Users /></CardTitle>
            <CardDescription className="text-lg">
              10
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">Client <Users /></CardTitle>
            <CardDescription className="text-lg">
              3
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">project managers <Users /></CardTitle>
            <CardDescription className="text-lg">
              10
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">Stock managers <Users /></CardTitle>
            <CardDescription className="text-lg">
              10
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">Techniciens <Users /></CardTitle>
            <CardDescription className="text-lg">
              10
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
      <div>
        <div>
          <ChartExemple />
        </div>
      </div>
    </>
  );
};

export default Dashboard;
