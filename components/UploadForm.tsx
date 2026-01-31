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
    const [imageError, setImageError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });

    // Resize image if it exceeds max resolution
    const resizeImage = (file: File, maxMegapixels: number): Promise<File> => {
        return new Promise((resolve, reject) => {
            const img = new window.Image();
            const objectUrl = URL.createObjectURL(file);

            img.onload = () => {
                const currentMegapixels = (img.width * img.height) / 1_000_000;
                URL.revokeObjectURL(objectUrl);

                // If under limit, return original
                if (currentMegapixels <= maxMegapixels) {
                    resolve(file);
                    return;
                }

                // Calculate new dimensions maintaining aspect ratio
                const scaleFactor = Math.sqrt(maxMegapixels / currentMegapixels);
                const newWidth = Math.floor(img.width * scaleFactor);
                const newHeight = Math.floor(img.height * scaleFactor);

                // Create canvas and resize
                const canvas = document.createElement("canvas");
                canvas.width = newWidth;
                canvas.height = newHeight;
                const ctx = canvas.getContext("2d");

                if (!ctx) {
                    reject(new Error("Failed to get canvas context"));
                    return;
                }

                ctx.drawImage(img, 0, 0, newWidth, newHeight);

                // Convert to blob and then to file
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error("Failed to create blob"));
                            return;
                        }
                        const resizedFile = new File([blob], file.name, {
                            type: "image/jpeg",
                            lastModified: Date.now(),
                        });
                        resolve(resizedFile);
                    },
                    "image/jpeg",
                    0.9 // Quality
                );
            };

            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error("Failed to load image"));
            };

            img.src = objectUrl;
        });
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const inputElement = e.target;
        setImageError(null);

        if (file) {
            // Check file size (25MB limit)
            if (file.size > 25 * 1024 * 1024) {
                setImageError("Image size must be less than 25MB");
                setImagePreview(null);
                setValue("image", undefined);
                inputElement.value = "";
                return;
            }

            try {
                // Auto-resize if over 25MP limit
                const processedFile = await resizeImage(file, 24); // Use 24MP to have some buffer

                // Read for preview
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreview(reader.result as string);
                    setValue("image", processedFile);
                };
                reader.readAsDataURL(processedFile);
            } catch {
                setImageError("Failed to process image. Please try another file.");
                inputElement.value = "";
            }
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
                        {imageError && (
                            <p className="text-sm text-red-500">{imageError}</p>
                        )}
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
