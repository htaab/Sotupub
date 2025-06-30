import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ProjectTrendsChartProps {
    data?: Array<{
        _id: { month: number; year: number; status: string };
        count: number;
    }>;
}

export const ProjectTrendsChart: React.FC<ProjectTrendsChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No trend data available
            </div>
        );
    }

    // Transform data for chart
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const chartData = data.reduce((acc, item) => {
        const key = `${monthNames[item._id.month - 1]} ${item._id.year}`;
        const existing = acc.find(d => d.month === key);

        if (existing) {
            existing[item._id.status] = item.count;
        } else {
            acc.push({
                month: key,
                [item._id.status]: item.count
            });
        }

        return acc;
    }, [] as any[]);

    return (
        <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="Completed" stroke="#22c55e" strokeWidth={2} />
                    <Line type="monotone" dataKey="In Progress" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="To Do" stroke="#f59e0b" strokeWidth={2} />
                    <Line type="monotone" dataKey="Cancelled" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};