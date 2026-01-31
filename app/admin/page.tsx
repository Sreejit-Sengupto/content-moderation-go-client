import { AdminContentList } from "@/components/AdminContentList";

export default function AdminPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            </div>
            <AdminContentList />
        </div>
    );
}
