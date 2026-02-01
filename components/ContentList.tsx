"use client";

import { useEffect, useState } from "react";
import { useContentStore, Content } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

export function ContentList() {
    const contents = useContentStore((state) => state.contents);
    const setContents = useContentStore((state) => state.setContents);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await api.get("/content");
                setContents(response.data);
            } catch (error) {
                console.error("Error fetching content:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, [setContents]);

    const getStatusColor = (status: string) => {
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

    if (loading) {
        return (
            <div className="text-center text-muted-foreground py-12">
                Loading content...
            </div>
        );
    }

    if (contents.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-12">
                No content uploaded yet.
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {contents.map((content) => (
                <Card key={content.id} className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            ID: {content.id.substring(0, 8)}...
                        </CardTitle>
                        <Badge className={getStatusColor(content.finalStatus)}>
                            {!content.finalStatus ? "PENDING" : content.finalStatus}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 mt-2">
                            {content.image && (
                                <div className="aspect-video relative rounded-md overflow-hidden bg-muted">
                                    <img
                                        src={content.image}
                                        alt="Content"
                                        className="object-cover w-full h-full"
                                    />
                                </div>
                            )}
                            {content.text && (
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                    {content.text}
                                </p>
                            )}
                            <div className="text-xs text-muted-foreground pt-2">
                                Uploaded {new Date(content.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
