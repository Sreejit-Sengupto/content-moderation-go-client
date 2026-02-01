"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Navbar() {
    const pathname = usePathname();

    const routes = [
        {
            href: "/",
            label: "Upload",
        },
        {
            href: "/dashboard",
            label: "Dashboard",
        },
        {
            href: "/admin",
            label: "Admin",
        },
        {
            href: "/admin/analytics",
            label: "Analytics",
        },
    ];

    return (
        <nav className="border-b bg-background">
            <div className="flex h-16 items-center px-4 container mx-auto">
                <div className="mr-8 font-bold text-xl">ContentMod</div>
                <div className="flex items-center space-x-4 lg:space-x-6">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-primary",
                                pathname === route.href
                                    ? "text-black dark:text-white"
                                    : "text-muted-foreground"
                            )}
                        >
                            {route.label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
}
