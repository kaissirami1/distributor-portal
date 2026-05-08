"use client";

import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    Cell, PieChart, Pie, Legend,
} from "recharts";

type DailyData = { date: string; count: number };
type StatusData = { label: string; value: number; color: string };
type CategoryData = { name: string; count: number };

type Props = {
    dailyData: DailyData[];
    statusData: StatusData[];
    topCategories: CategoryData[];
};

export function DashboardCharts({ dailyData, statusData, topCategories }: Props) {
    const hasActivity = dailyData.some((d) => d.count > 0);
    const hasStatus = statusData.some((d) => d.value > 0);
    const hasCategories = topCategories.length > 0;

    // Format date labels — show only every 5th day to avoid clutter
    const formattedDaily = dailyData.map((d, i) => ({
        ...d,
        label: i % 5 === 0 ? d.date.slice(5) : "",
    }));

    return (
        <div className="grid md:grid-cols-2 gap-6">
            {/* Submissions over time */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-5">Submissions (Last 30 Days)</h2>
                {hasActivity ? (
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={formattedDaily} barSize={6}>
                            <XAxis
                                dataKey="label"
                                tick={{ fill: "#6b7280", fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fill: "#6b7280", fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                allowDecimals={false}
                            />
                            <Tooltip
                                contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8 }}
                                labelStyle={{ color: "#a1a1aa", fontSize: 12 }}
                                itemStyle={{ color: "#f5f5f5" }}
                                formatter={(value) => [value, "Submissions"]}
                                labelFormatter={(label) => label || ""}
                            />
                            <Bar dataKey="count" fill="#d6b25e" radius={[3, 3, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
                        No submissions in the last 30 days
                    </div>
                )}
            </div>

            {/* Status breakdown donut */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-5">Status Breakdown</h2>
                {hasStatus ? (
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={statusData.filter((d) => d.value > 0)}
                                dataKey="value"
                                nameKey="label"
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={80}
                                paddingAngle={3}
                            >
                                {statusData
                                    .filter((d) => d.value > 0)
                                    .map((entry) => (
                                        <Cell key={entry.label} fill={entry.color} />
                                    ))}
                            </Pie>
                            <Legend
                                formatter={(value) => (
                                    <span style={{ color: "#a1a1aa", fontSize: 12 }}>{value}</span>
                                )}
                            />
                            <Tooltip
                                contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8 }}
                                itemStyle={{ color: "#f5f5f5" }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
                        No submissions yet
                    </div>
                )}
            </div>

            {/* Top categories */}
            {hasCategories && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 md:col-span-2">
                    <h2 className="text-lg font-semibold mb-5">Top Categories</h2>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={topCategories} layout="vertical" barSize={14}>
                            <XAxis
                                type="number"
                                tick={{ fill: "#6b7280", fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                allowDecimals={false}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                tick={{ fill: "#a1a1aa", fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                                width={120}
                            />
                            <Tooltip
                                contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8 }}
                                itemStyle={{ color: "#f5f5f5" }}
                                formatter={(value) => [value, "Submissions"]}
                            />
                            <Bar dataKey="count" fill="#60a5fa" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}