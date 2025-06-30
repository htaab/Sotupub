import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Users, TrendingUp, Clock, BarChart3 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import {
  useProjectCompletionStats,
  useUserStats,
  useIncompleteProjectsCount,
  useProductManagerStats
} from '@/hooks/useStatistics';
import { ProjectCompletionChart } from './ProjectCompletionChart';
import { TechnicianUtilizationChart } from './TechnicianUtilizationChart';
import { ProjectTrendsChart } from './ProjectTrendsChart';
import { subMonths } from 'date-fns';

const Dashboard = () => {
  const location = useLocation();
  const { user } = useAuthStore();

  // Date range state (default to 6 months)
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>(() => {
    const to = new Date();
    const from = subMonths(to, 6);
    return { from, to };
  });

  const startDate = dateRange.from.toISOString();
  const endDate = dateRange.to.toISOString();

  // Fetch statistics based on user role
  const { data: projectStats, isLoading: isLoadingProjectStats } = useProjectCompletionStats(startDate, endDate);
  const { data: userStats, isLoading: isLoadingUserStats } = useUserStats();
  const { data: incompleteProjectsStats, isLoading: isLoadingIncompleteProjects } = useIncompleteProjectsCount();
  const { data: productManagerStats, isLoading: isLoadingProductManagerStats } = useProductManagerStats(startDate, endDate);

  useEffect(() => {
    if (location.state?.showToast) {
      toast.error(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const isAdmin = user?.role === 'admin';
  const isProjectManager = user?.role === 'project manager';
  const isTechnician = user?.role === 'technician';

  return (
    <div className="space-y-6">
      {/* Date Range Picker */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <DatePickerWithRange
            date={dateRange}
            onDateChange={setDateRange}
          />
        </div>
      </div>

      {/* Admin Statistics */}
      {isAdmin && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                Total Users <Users className="h-4 w-4" />
              </CardTitle>
              <CardDescription className="text-2xl font-bold">
                {isLoadingUserStats ? '...' : userStats?.totalUsers || 0}
              </CardDescription>
            </CardHeader>
          </Card>

          {userStats?.roleBreakdown.map((role) => (
            <Card key={role._id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 capitalize">
                  {role._id} <Users className="h-4 w-4" />
                </CardTitle>
                <CardDescription className="text-2xl font-bold">
                  {role.count}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Project Manager & Technician Statistics */}
      {(isProjectManager || isTechnician) && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                Incomplete Projects <Clock className="h-4 w-4" />
              </CardTitle>
              <CardDescription className="text-2xl font-bold">
                {isLoadingIncompleteProjects ? '...' : incompleteProjectsStats?.incompleteProjects || 0}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Project Completion Chart (All Roles) */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              Project Completion <TrendingUp className="h-4 w-4" />
            </CardTitle>
            <CardDescription>
              {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingProjectStats ? (
              <div className="h-[300px] flex items-center justify-center">
                Loading...
              </div>
            ) : (
              <ProjectCompletionChart data={projectStats} />
            )}
          </CardContent>
        </Card>

        {/* Product Manager Specific Charts */}
        {isAdmin && productManagerStats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                Average Project Duration <BarChart3 className="h-4 w-4" />
              </CardTitle>
              <CardDescription>
                Days to complete projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Math.round(productManagerStats.averageProjectDuration || 0)} days
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Product Manager Additional Charts */}
      {isAdmin && productManagerStats && (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Project Trends</CardTitle>
              <CardDescription>Project creation and completion over time</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProductManagerStats ? (
                <div className="h-[300px] flex items-center justify-center">
                  Loading...
                </div>
              ) : (
                <ProjectTrendsChart data={productManagerStats.projectTrends} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Technician Utilization</CardTitle>
              <CardDescription>Task completion rates by technician</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProductManagerStats ? (
                <div className="h-[300px] flex items-center justify-center">
                  Loading...
                </div>
              ) : (
                <TechnicianUtilizationChart data={productManagerStats.technicianUtilization} />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
