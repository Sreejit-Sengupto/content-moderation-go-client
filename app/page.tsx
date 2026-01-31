import { UploadForm } from "@/components/UploadForm";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Content Moderation System</h1>
        <p className="text-muted-foreground">
          Upload text and images for moderation.
        </p>
      </div>
      <UploadForm />
    </div>
  );
}
