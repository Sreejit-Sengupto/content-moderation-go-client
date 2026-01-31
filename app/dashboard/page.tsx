import { ContentList } from "@/components/ContentList";

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
            </div>
            <ContentList />
        </div>
    );
}
