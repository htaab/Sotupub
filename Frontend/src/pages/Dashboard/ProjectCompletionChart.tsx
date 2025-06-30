import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ProjectCompletionChartProps {
    data?: {
        total: number;
        completed: number;
        completionPercentage: number;
        statusBreakdown: Array<{ _id: string; count: number }>;
    };
}

const COLORS = {
    'Completed': '#22c55e',
    'In Progress': '#3b82f6',
    'To Do': '#f59e0b',
    'Cancelled': '#ef4444'
};

export const ProjectCompletionChart: React.FC<ProjectCompletionChartProps> = ({ data }) => {
    if (!data || data.total === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No project data available
            </div>
        );
    }

    const chartData = data.statusBreakdown.map(item => ({
        name: item._id,
        value: item.count,
        percentage: ((item.count / data.total) * 100).toFixed(1)
    }));

    return (
        <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: number, name: string) => [
                            `${value} projects (${chartData.find(d => d.name === name)?.percentage}%)`,
                            name
                        ]}
                    />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
            <div className="text-center mt-4">
                <div className="text-2xl font-bold">{data.completionPercentage.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Projects Completed</div>
            </div>
        </div>
    );
};