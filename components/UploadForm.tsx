"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useContentStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { upload } from "@imagekit/next";
import api from "@/lib/api";

const formSchema = z.object({
    text: z.string().min(1, "Text is required"),
    image: z.any().optional(),
});

export function UploadForm() {
    const router = useRouter();
    const addContent = useContentStore((state) => state.addContent);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
                setValue("image", file); // Store the file object, not the base64 string
            };
            reader.readAsDataURL(file);
        }
    };

    const authenticator = async () => {
        try {
            const response = await fetch("/api/upload-auth");
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Request failed with status ${response.status}: ${errorText}`);
            }
            const data = await response.json();
            const { signature, expire, token } = data;
            return { signature, expire, token };
        } catch (error) {
            console.error("Authentication error:", error);
            throw new Error("Authentication request failed");
        }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        let imageUrl = "";

        if (values.image) {
            try {
                const authParams = await authenticator();
                const uploadResponse = await upload({
                    file: values.image,
                    fileName: values.image.name,
                    publicKey: process.env.NEXT_PUBLIC_PUBLIC_KEY as string,
                    ...authParams,
                    onProgress: (event) => {
                        setUploadProgress(Math.round((event.loaded / event.total) * 100));
                    }
                });
                imageUrl = uploadResponse.url || "";
            } catch (error) {
                console.error("Upload failed:", error);
                // Handle upload error (e.g., show a toast)
                return;
            }
        }

        try {
            await api.post("/upload/content", {
                text: values.text,
                image: imageUrl || undefined,
            });

            addContent({
                Text: values.text,
                Image: imageUrl,
            });

            router.push("/dashboard");
        } catch (error) {
            console.error("Failed to submit content:", error);
            // Handle submission error
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Upload Content</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="text">Text Content</Label>
                        <Textarea
                            id="text"
                            placeholder="Enter your text here..."
                            {...register("text")}
                        />
                        {errors.text && (
                            <p className="text-sm text-red-500">{errors.text.message as string}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="image">Image (Optional)</Label>
                        <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                        {imagePreview && (
                            <div className="mt-2">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-48 object-cover rounded-md"
                                />
                            </div>
                        )}
                        {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                        )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (uploadProgress > 0 ? `Uploading ${uploadProgress}%` : "Submitting...") : "Submit"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
