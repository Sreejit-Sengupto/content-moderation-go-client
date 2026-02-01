"use client";

import { useEffect, useState } from "react";
import { useContentStore, Content, Status } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";
import Link from "next/link";

export function AdminContentList() {
    const contents = useContentStore((state) => state.contents);
    console.log(contents);

    const setContents = useContentStore((state) => state.setContents);
    const [loading, setLoading] = useState(true);
    const [selectedContent, setSelectedContent] = useState<Content | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [textStatus, setTextStatus] = useState<Status>("PENDING");
    const [imageStatus, setImageStatus] = useState<Status>("PENDING");
    const [videoStatus, setVideoStatus] = useState<Status>("PENDING");
    const [finalStatus, setFinalStatus] = useState<Status>("PENDING");
    const [reason, setReason] = useState("");

    useEffect(() => {
        fetchContent();
    }, []);

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

    const handleReview = (content: Content) => {
        setSelectedContent(content);
        setTextStatus(content.textStatus);
        setImageStatus(content.imageStatus);
        setVideoStatus(content.videoStatus);
        setFinalStatus(content.finalStatus);
        setReason("");
        setIsModalOpen(true);
    };

    const handleUpdate = async () => {
        if (!selectedContent) return;

        try {
            await api.patch("/content/update", {
                contentId: selectedContent.id,
                textStatus,
                imageStatus,
                videoStatus,
                finalStatus,
                reason,
            });

            // Refresh content
            await fetchContent();
            setIsModalOpen(false);
            setSelectedContent(null);
        } catch (error) {
            console.error("Error updating content:", error);
            alert("Failed to update content");
        }
    };

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
        return <div className="text-center py-12">Loading...</div>;
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Content Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contents.map((content) => (
                                <TableRow key={content.id}>
                                    <TableCell className="font-mono text-xs">
                                        {content.id.substring(0, 8)}...
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            {content.text && <Badge variant="outline">TXT</Badge>}
                                            {content.image && <Badge variant="outline">IMG</Badge>}
                                            {content.video && <Badge variant="outline">VID</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(content.finalStatus)}>
                                            {content.finalStatus}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(content.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Link href={`/admin/content/${content.id}`}>
                                                <Button variant="outline" size="sm">
                                                    View Details
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleReview(content)}
                                            >
                                                Review
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Custom Modal */}
            {isModalOpen && selectedContent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
                        <h2 className="text-2xl font-bold mb-4">Review Content</h2>

                        <div className="grid gap-6 mb-6">
                            {/* Content Display */}
                            <div className="space-y-4 p-4 bg-muted rounded-md">
                                {selectedContent.image && (
                                    <div>
                                        <Label>Image</Label>
                                        <div className="mt-2 aspect-video relative rounded-md overflow-hidden bg-black/10">
                                            <img
                                                src={selectedContent.image}
                                                alt="Content"
                                                className="object-contain w-full h-full"
                                            />
                                        </div>
                                    </div>
                                )}
                                {selectedContent.text && (
                                    <div>
                                        <Label>Text</Label>
                                        <p className="mt-1 p-2 bg-background rounded border text-sm">
                                            {selectedContent.text}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Status Updates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Text Status</Label>
                                    <Select
                                        value={textStatus}
                                        onValueChange={(v) => setTextStatus(v as Status)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PENDING">PENDING</SelectItem>
                                            <SelectItem value="APPROVED">APPROVED</SelectItem>
                                            <SelectItem value="REJECTED">REJECTED</SelectItem>
                                            <SelectItem value="FLAGGED">FLAGGED</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Image Status</Label>
                                    <Select
                                        value={imageStatus}
                                        onValueChange={(v) => setImageStatus(v as Status)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PENDING">PENDING</SelectItem>
                                            <SelectItem value="APPROVED">APPROVED</SelectItem>
                                            <SelectItem value="REJECTED">REJECTED</SelectItem>
                                            <SelectItem value="FLAGGED">FLAGGED</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Video Status</Label>
                                    <Select
                                        value={videoStatus}
                                        onValueChange={(v) => setVideoStatus(v as Status)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PENDING">PENDING</SelectItem>
                                            <SelectItem value="APPROVED">APPROVED</SelectItem>
                                            <SelectItem value="REJECTED">REJECTED</SelectItem>
                                            <SelectItem value="FLAGGED">FLAGGED</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Final Status</Label>
                                    <Select
                                        value={finalStatus}
                                        onValueChange={(v) => setFinalStatus(v as Status)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PENDING">PENDING</SelectItem>
                                            <SelectItem value="APPROVED">APPROVED</SelectItem>
                                            <SelectItem value="REJECTED">REJECTED</SelectItem>
                                            <SelectItem value="FLAGGED">FLAGGED</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Reason for Update (Audit Log)</Label>
                                <Input
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Enter reason for this change..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpdate} disabled={!reason}>
                                Update Content
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
