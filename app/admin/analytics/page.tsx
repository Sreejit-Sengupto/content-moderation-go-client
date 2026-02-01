"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    AreaChart,
    Area,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
} from "recharts";

// Types for API responses
interface StatusCount {
    label: string;
    value: number;
}

interface MediaTypeCount {
    label: string;
    value: number;
}

interface RiskScoreRange {
    range: string;
    count: number;
}

interface TimeSeriesData {
    labels: string[];
    datasets: { label: string; data: number[] }[];
}

interface RadarDataPoint {
    mediaType: string;
    approved: number;
    rejected: number;
    flagged: number;
    pending: number;
}

interface ModerationSummary {
    totalContent: number;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    flaggedCount: number;
    totalAudits: number;
    avgRiskScore: number;
    contentLastWeek: number;
}

const COLORS = {
    APPROVED: "#22c55e",
    REJECTED: "#ef4444",
    FLAGGED: "#eab308",
    PENDING: "#6b7280",
};

const PIE_COLORS = ["#22c55e", "#ef4444", "#eab308", "#6b7280", "#3b82f6"];

export default function AnalyticsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<ModerationSummary | null>(null);
    const [statusDistribution, setStatusDistribution] = useState<StatusCount[]>([]);
    const [mediaBreakdown, setMediaBreakdown] = useState<MediaTypeCount[]>([]);
    const [riskDistribution, setRiskDistribution] = useState<RiskScoreRange[]>([]);
    const [moderationOverTime, setModerationOverTime] = useState<any[]>([]);
    const [auditActivity, setAuditActivity] = useState<any[]>([]);
    const [statusByMediaType, setStatusByMediaType] = useState<RadarDataPoint[]>([]);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const [
                summaryRes,
                statusRes,
                mediaRes,
                riskRes,
                timeRes,
                auditRes,
                statusMediaRes,
            ] = await Promise.all([
                api.get("/analytics/summary"),
                api.get("/analytics/status-distribution"),
                api.get("/analytics/media-type-breakdown"),
                api.get("/analytics/risk-score-distribution"),
                api.get("/analytics/moderation-over-time"),
                api.get("/analytics/audit-activity"),
                api.get("/analytics/status-by-media-type"),
            ]);

            setSummary(summaryRes.data);
            setStatusDistribution(statusRes.data.data || []);
            setMediaBreakdown(mediaRes.data.data || []);
            setRiskDistribution(riskRes.data.data || []);
            setStatusByMediaType(statusMediaRes.data.data || []);

            // Transform time series data for recharts
            const timeData = timeRes.data as TimeSeriesData;
            if (timeData.labels && timeData.datasets) {
                const transformed = timeData.labels.map((label, index) => {
                    const point: any = { date: label };
                    timeData.datasets.forEach((dataset) => {
                        point[dataset.label] = dataset.data[index] || 0;
                    });
                    return point;
                });
                setModerationOverTime(transformed);
            }

            // Transform audit activity data
            const auditData = auditRes.data as TimeSeriesData;
            if (auditData.labels && auditData.datasets) {
                const transformed = auditData.labels.map((label, index) => ({
                    date: label,
                    audits: auditData.datasets[0]?.data[index] || 0,
                }));
                setAuditActivity(transformed);
            }
        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-lg">Loading analytics...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/admin")}
                        className="mb-2"
                    >
                        &larr; Back to Admin
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Analytics Dashboard
                    </h1>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Content
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.totalContent}</div>
                            <p className="text-xs text-muted-foreground">
                                +{summary.contentLastWeek} this week
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Pending Review
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">
                                {summary.pendingCount}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Awaiting moderation
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Avg Risk Score
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${
                                summary.avgRiskScore >= 70 ? "text-red-600" :
                                summary.avgRiskScore >= 40 ? "text-yellow-600" : "text-green-600"
                            }`}>
                                {summary.avgRiskScore.toFixed(1)}%
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Across all content
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Audits
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.totalAudits}</div>
                            <p className="text-xs text-muted-foreground">
                                Manual reviews
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Status Overview Cards */}
            {summary && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="border-l-4 border-l-green-500">
                        <CardContent className="pt-4">
                            <div className="text-sm text-muted-foreground">Approved</div>
                            <div className="text-2xl font-bold text-green-600">
                                {summary.approvedCount}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-red-500">
                        <CardContent className="pt-4">
                            <div className="text-sm text-muted-foreground">Rejected</div>
                            <div className="text-2xl font-bold text-red-600">
                                {summary.rejectedCount}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-yellow-500">
                        <CardContent className="pt-4">
                            <div className="text-sm text-muted-foreground">Flagged</div>
                            <div className="text-2xl font-bold text-yellow-600">
                                {summary.flaggedCount}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-gray-500">
                        <CardContent className="pt-4">
                            <div className="text-sm text-muted-foreground">Pending</div>
                            <div className="text-2xl font-bold text-gray-600">
                                {summary.pendingCount}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Charts Row 1 */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Status Distribution Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statusDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) =>
                                        `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                                    }
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="label"
                                >
                                    {statusDistribution.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[entry.label as keyof typeof COLORS] || PIE_COLORS[index % PIE_COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Media Type Breakdown Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Media Type Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={mediaBreakdown}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) =>
                                        `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                                    }
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="label"
                                >
                                    {mediaBreakdown.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Moderation Over Time Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Moderation Activity Over Time (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={moderationOverTime}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="APPROVED"
                                stackId="1"
                                stroke={COLORS.APPROVED}
                                fill={COLORS.APPROVED}
                                fillOpacity={0.6}
                            />
                            <Area
                                type="monotone"
                                dataKey="REJECTED"
                                stackId="1"
                                stroke={COLORS.REJECTED}
                                fill={COLORS.REJECTED}
                                fillOpacity={0.6}
                            />
                            <Area
                                type="monotone"
                                dataKey="FLAGGED"
                                stackId="1"
                                stroke={COLORS.FLAGGED}
                                fill={COLORS.FLAGGED}
                                fillOpacity={0.6}
                            />
                            <Area
                                type="monotone"
                                dataKey="PENDING"
                                stackId="1"
                                stroke={COLORS.PENDING}
                                fill={COLORS.PENDING}
                                fillOpacity={0.6}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Charts Row 2 */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Risk Score Distribution Bar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Risk Score Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={riskDistribution}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="range" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                                    {riskDistribution.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={
                                                entry.range === "76-100"
                                                    ? "#ef4444"
                                                    : entry.range === "51-75"
                                                    ? "#f97316"
                                                    : entry.range === "26-50"
                                                    ? "#eab308"
                                                    : "#22c55e"
                                            }
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Audit Activity Line Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Audit Activity (Last 30 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={auditActivity}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="audits"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    dot={{ fill: "#8b5cf6" }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Status by Media Type Radar Chart */}
            {statusByMediaType.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Status by Media Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={400}>
                            <RadarChart data={statusByMediaType}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="mediaType" />
                                <PolarRadiusAxis />
                                <Radar
                                    name="Approved"
                                    dataKey="approved"
                                    stroke={COLORS.APPROVED}
                                    fill={COLORS.APPROVED}
                                    fillOpacity={0.3}
                                />
                                <Radar
                                    name="Rejected"
                                    dataKey="rejected"
                                    stroke={COLORS.REJECTED}
                                    fill={COLORS.REJECTED}
                                    fillOpacity={0.3}
                                />
                                <Radar
                                    name="Flagged"
                                    dataKey="flagged"
                                    stroke={COLORS.FLAGGED}
                                    fill={COLORS.FLAGGED}
                                    fillOpacity={0.3}
                                />
                                <Radar
                                    name="Pending"
                                    dataKey="pending"
                                    stroke={COLORS.PENDING}
                                    fill={COLORS.PENDING}
                                    fillOpacity={0.3}
                                />
                                <Legend />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
