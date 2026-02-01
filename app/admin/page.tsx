import { AdminContentList } from "@/components/AdminContentList";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <Link href="/admin/analytics">
                    <Button>View Analytics</Button>
                </Link>
            </div>
            <AdminContentList />
        </div>
    );
}
