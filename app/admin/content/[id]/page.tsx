"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import {
    ModerationResult,
    ModerationEvent,
    Audit,
    Status,
} from "@/lib/store";

// API response types matching Go JSON tags (camelCase)
interface ContentResponse {
    id: string;
    text?: string;
    image?: string;
    video?: string;
    textStatus: Status;
    imageStatus: Status;
    videoStatus: Status;
    finalStatus: Status;
    createdAt: string;
    updatedAt: string;
    moderationResult?: ModerationResult[];
    moderationEvents?: ModerationEvent[];
    audits?: Audit[];
}

export default function ContentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const contentId = params.id as string;

    const [content, setContent] = useState<ContentResponse | null>(null);
    const [results, setResults] = useState<ModerationResult[]>([]);
    const [events, setEvents] = useState<ModerationEvent[]>([]);
    const [audits, setAudits] = useState<Audit[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"results" | "events" | "audits">(
        "results"
    );

    useEffect(() => {
        if (contentId) {
            fetchAllData();
        }
    }, [contentId]);

    const fetchAllData = async () => {
        try {
            setLoading(true);

            const [contentRes, resultsRes, eventsRes, auditsRes] =
                await Promise.all([
                    api.get(`/content/${contentId}`),
                    api.get(`/content/${contentId}/results`),
                    api.get(`/content/${contentId}/events`),
                    api.get(`/content/${contentId}/audits`),
                ]);

            setContent(contentRes.data);
            setResults(
                (resultsRes.data as ContentResponse).moderationResult || []
            );
            setEvents(
                (eventsRes.data as ContentResponse).moderationEvents || []
            );
            setAudits((auditsRes.data as ContentResponse).audits || []);
        } catch (error) {
            console.error("Error fetching content details:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: Status) => {
        switch (status) {
            case "APPROVED":
                return "bg-green-500 hover:bg-green-600";
            case "REJECTED":
                return "bg-red-500 hover:bg-red-600";
            case "FLAGGED":
                return "bg-yellow-500 hover:bg-yellow-600";
            default:
                return "bg-gray-500 hover:bg-gray-600";
        }
    };

    const getRiskColor = (score: number) => {
        if (score >= 0.7) return "text-red-600";
        if (score >= 0.4) return "text-yellow-600";
        return "text-green-600";
    };

    const getEventTypeColor = (eventType: string) => {
        switch (eventType) {
            case "CREATED":
                return "bg-blue-500";
            case "UPDATED":
                return "bg-purple-500";
            case "MODERATED":
                return "bg-orange-500";
            default:
                return "bg-gray-500";
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case "REVIEWED":
                return "bg-blue-500";
            case "OVERRIDEN":
                return "bg-purple-500";
            default:
                return "bg-gray-500";
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-lg">Loading content details...</div>
            </div>
        );
    }

    if (!content) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="text-lg">Content not found</div>
                <Button onClick={() => router.push("/admin")}>
                    Back to Admin
                </Button>
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
                        Content Details
                    </h1>
                    <p className="text-muted-foreground font-mono text-sm mt-1">
                        ID: {content.id}
                    </p>
                </div>
                <Badge className={getStatusColor(content.finalStatus)}>
                    {content.finalStatus}
                </Badge>
            </div>

            {/* Content Preview */}
            <Card>
                <CardHeader>
                    <CardTitle>Content Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                            <Label className="text-muted-foreground">
                                Text Status
                            </Label>
                            <Badge
                                className={`mt-1 ${getStatusColor(content.textStatus)}`}
                            >
                                {content.textStatus}
                            </Badge>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">
                                Image Status
                            </Label>
                            <Badge
                                className={`mt-1 ${getStatusColor(content.imageStatus)}`}
                            >
                                {content.imageStatus}
                            </Badge>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">
                                Video Status
                            </Label>
                            <Badge
                                className={`mt-1 ${getStatusColor(content.videoStatus)}`}
                            >
                                {content.videoStatus}
                            </Badge>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">
                                Created
                            </Label>
                            <p className="text-sm mt-1">
                                {formatDate(content.createdAt)}
                            </p>
                        </div>
                    </div>

                    {content.image && (
                        <div>
                            <Label>Image</Label>
                            <div className="mt-2 aspect-video relative rounded-md overflow-hidden bg-black/10 max-w-md">
                                <img
                                    src={content.image}
                                    alt="Content"
                                    className="object-contain w-full h-full"
                                />
                            </div>
                        </div>
                    )}
                    {content.text && (
                        <div>
                            <Label>Text</Label>
                            <p className="mt-1 p-3 bg-muted rounded border text-sm">
                                {content.text}
                            </p>
                        </div>
                    )}
                    {content.video && (
                        <div>
                            <Label>Video</Label>
                            <p className="mt-1 p-2 bg-muted rounded border text-sm font-mono">
                                {content.video}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Tabs */}
            <div className="flex gap-2 border-b pb-2">
                <Button
                    variant={activeTab === "results" ? "default" : "ghost"}
                    onClick={() => setActiveTab("results")}
                >
                    Moderation Results ({results.length})
                </Button>
                <Button
                    variant={activeTab === "events" ? "default" : "ghost"}
                    onClick={() => setActiveTab("events")}
                >
                    Events ({events.length})
                </Button>
                <Button
                    variant={activeTab === "audits" ? "default" : "ghost"}
                    onClick={() => setActiveTab("audits")}
                >
                    Audit Logs ({audits.length})
                </Button>
            </div>

            {/* Tab Content */}
            {activeTab === "results" && (
                <div className="space-y-4">
                    {results.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center text-muted-foreground">
                                No moderation results available
                            </CardContent>
                        </Card>
                    ) : (
                        results.map((result) => (
                            <Card key={result.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">
                                                {result.mediaType}
                                            </Badge>
                                            <Badge
                                                className={getStatusColor(
                                                    result.status
                                                )}
                                            >
                                                {result.status}
                                            </Badge>
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                            {formatDate(result.createdAt)}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4">
                                        <div>
                                            <Label className="text-muted-foreground">
                                                Risk Score
                                            </Label>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                    <div
                                                        className={`h-2.5 rounded-full ${result.riskScore >=
                                                                0.7
                                                                ? "bg-red-500"
                                                                : result.riskScore >=
                                                                    0.4
                                                                    ? "bg-yellow-500"
                                                                    : "bg-green-500"
                                                            }`}
                                                        style={{
                                                            width: `${result.riskScore * 100}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                                <span
                                                    className={`font-semibold ${getRiskColor(result.riskScore)}`}
                                                >
                                                    {(
                                                        result.riskScore * 100
                                                    ).toFixed(1)}
                                                    %
                                                </span>
                                            </div>
                                        </div>
                                        {result.explanation && (
                                            <div>
                                                <Label className="text-muted-foreground">
                                                    Explanation
                                                </Label>
                                                <p className="mt-1 text-sm p-3 bg-muted rounded">
                                                    {result.explanation}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {activeTab === "events" && (
                <div className="space-y-4">
                    {events.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center text-muted-foreground">
                                No events available
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="relative">
                            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
                            {events.map((event, index) => (
                                <div
                                    key={event.id}
                                    className="relative pl-10 pb-6"
                                >
                                    <div className="absolute left-2.5 w-3 h-3 rounded-full bg-primary border-2 border-background"></div>
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center justify-between">
                                                <Badge
                                                    className={getEventTypeColor(
                                                        event.eventType
                                                    )}
                                                >
                                                    {event.eventType}
                                                </Badge>
                                                <span className="text-sm text-muted-foreground">
                                                    {formatDate(
                                                        event.createdAt
                                                    )}
                                                </span>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {event.payload &&
                                                Object.keys(event.payload).length >
                                                0 ? (
                                                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                                                    {JSON.stringify(
                                                        event.payload,
                                                        null,
                                                        2
                                                    )}
                                                </pre>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    No payload data
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === "audits" && (
                <div className="space-y-4">
                    {audits.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center text-muted-foreground">
                                No audit logs available
                            </CardContent>
                        </Card>
                    ) : (
                        audits.map((audit) => (
                            <Card key={audit.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <Badge
                                            className={getActionColor(
                                                audit.action
                                            )}
                                        >
                                            {audit.action}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            {formatDate(audit.createdAt)}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div>
                                        <Label className="text-muted-foreground">
                                            Reason
                                        </Label>
                                        <p className="mt-1 text-sm p-3 bg-muted rounded">
                                            {audit.reason || "No reason provided"}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
