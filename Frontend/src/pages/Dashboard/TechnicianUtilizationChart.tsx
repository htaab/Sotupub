import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TechnicianUtilizationChartProps {
    data?: Array<{
        _id: string;
        name: string;
        totalTasks: number;
        completedTasks: number;
    }>;
}

export const TechnicianUtilizationChart: React.FC<TechnicianUtilizationChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No technician data available
            </div>
        );
    }

    const chartData = data.map(tech => ({
        name: tech.name,
        completed: tech.completedTasks,
        pending: tech.totalTasks - tech.completedTasks,
        completionRate: tech.totalTasks > 0 ? (tech.completedTasks / tech.totalTasks * 100).toFixed(1) : '0'
    }));

    return (
        <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                        formatter={(value: number, name: string) => [
                            `${value} tasks`,
                            name === 'completed' ? 'Completed' : 'Pending'
                        ]}
                        labelFormatter={(label) => {
                            const tech = chartData.find(d => d.name === label);
                            return `${label} (${tech?.completionRate}% completion rate)`;
                        }}
                    />
                    <Bar dataKey="completed" stackId="a" fill="#22c55e" />
                    <Bar dataKey="pending" stackId="a" fill="#f59e0b" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};