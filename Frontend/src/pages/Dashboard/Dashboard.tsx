import { useLocation } from "react-router-dom";
import { ChartExemple } from "./ChartExemple";
import { useEffect } from "react";
import { toast } from "sonner";

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
    <div>
      <div>
        <ChartExemple />
      </div>
    </div>
  );
};

export default Dashboard;
