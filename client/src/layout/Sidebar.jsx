"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
    LayoutDashboard,
    Film,
    Building,
    Tv,
    Tag,
    Calendar,
    Star,
    Users,
    Settings,
    LogOut,
    X,
    ChevronLeft,
    ChevronRight,
    Ticket,
    Sparkles
} from "lucide-react";

const Sidebar = ({ isOpen, onClose }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { user, role, permissions, logout } = useAuthStore();
    const pathname = usePathname();
    const router = useRouter();

    // Load collapsed state from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem("sidebar-collapsed");
        if (stored) {
            setIsCollapsed(stored === "true");
        }
    }, []);

    const toggleCollapse = () => {
        const nextState = !isCollapsed;
        setIsCollapsed(nextState);
        localStorage.setItem("sidebar-collapsed", String(nextState));
    };

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    const getRoleBadgeStyle = (roleName) => {
        switch (roleName?.toUpperCase()) {
            case "OWNER":
                return "bg-(--color-danger-dim) text-(--color-danger) border border-danger/20";
            case "MANAGER":
                return "bg-(--color-info-dim) text-(--color-info) border border-info/20";
            case "STAFF":
                return "bg-(--color-accent-dim) text-(--color-accent) border border-accent/20";
            default:
                return "bg-(--color-success-dim) text-(--color-success) border border-success/20";
        }
    };

    // Define all sidebar items with their paths, icons, and required permissions
    const sidebarItems = [
        {
            name: "Overview",
            href: `/${role?.toLowerCase()}/dashboard`,
            icon: LayoutDashboard,
            permission: null,
        },
        {
            name: "Movies",
            href: `/${role?.toLowerCase()}/dashboard/movies`,
            icon: Film,
            permission: "movie:list",
        },
        {
            name: "Cast & Crew",
            href: `/${role?.toLowerCase()}/dashboard/cast`,
            icon: Sparkles,
            permission: "movie:list",
        },
        {
            name: "Theaters",
            href: `/${role?.toLowerCase()}/dashboard/theaters`,
            icon: Building,
            permission: "cinema:list",
        },
        {
            name: "Screens",
            href: `/${role?.toLowerCase()}/dashboard/screens`,
            icon: Tv,
            permission: "screen:list",
        },
        {
            name: "Genres",
            href: `/${role?.toLowerCase()}/dashboard/genres`,
            icon: Tag,
            permission: "genre:list",
        },
        {
            name: "Shows",
            href: `/${role?.toLowerCase()}/dashboard/shows`,
            icon: Calendar,
            permission: "show:list",
        },
        {
            name: "Reviews",
            href: `/${role?.toLowerCase()}/dashboard/reviews`,
            icon: Star,
            permission: "review:read-all",
        },
        {
            name: "Users",
            href: `/${role?.toLowerCase()}/dashboard/users`,
            icon: Users,
            permission: "user:list",
        },
        {
            name: "Settings",
            href: `/${role?.toLowerCase()}/dashboard/settings`,
            icon: Settings,
            permission: "setting:read",
        },
    ];

    // Filter items based on user permissions
    const filteredItems = sidebarItems.filter(item => {
        if (!item.permission) return true;
        return permissions?.includes(item.permission);
    });

    const userInitial = user?.firstName?.[0]?.toUpperCase() || "U";
    const userFullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User";

    return (
        <>
            {/* Mobile Sidebar Backdrop */}
            <div
                onClick={onClose}
                className={`
                    fixed inset-0 bg-(--color-overlay) z-40 md:hidden
                    transition-opacity duration-300
                    ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
                `}
            />

            {/* Sidebar Container */}
            <aside
                className={`
                    fixed md:sticky top-0 left-0 h-screen bg-(--color-surface) border-r border-(--color-border-subtle)
                    transition-all duration-300 flex flex-col justify-between z-50 md:z-30 shrink-0
                    ${isCollapsed ? "md:w-[80px]" : "w-[260px] md:w-[260px]"}
                    ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                `}
            >
                {/* Header Section */}
                <div className="flex items-center justify-between px-4 py-5 border-b border-(--color-border-subtle) h-[73px]">
                    <div className={`flex items-center gap-2 overflow-hidden ${isCollapsed ? "md:justify-center md:w-full" : ""}`}>
                        <Ticket
                            size={28}
                            className={`text-(--color-accent) shrink-0 -rotate-20 transition-transform duration-300 ${isCollapsed ? "md:rotate-0" : ""}`}
                        />
                        <span
                            className={`
                                font-display font-bold text-xl text-(--color-text-primary) whitespace-nowrap
                                transition-all duration-300
                                ${isCollapsed ? "md:w-0 md:opacity-0 md:pointer-events-none" : "w-auto opacity-100"}
                            `}
                        >
                            Ticketify
                        </span>
                    </div>

                    {/* Desktop Collapse Toggle */}
                    <button
                        onClick={toggleCollapse}
                        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        className="hidden md:flex p-1.5 rounded-md hover:bg-(--color-surface-hover) text-(--color-text-muted) hover:text-(--color-text-primary) border border-transparent hover:border-(--color-border-default) transition-colors"
                    >
                        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>

                    {/* Mobile Close Button */}
                    <button
                        onClick={onClose}
                        aria-label="Close menu"
                        className="md:hidden p-1.5 rounded-md hover:bg-(--color-surface-hover) text-(--color-text-muted) hover:text-(--color-text-primary) transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5 scrollbar-thin">
                    {filteredItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.name === "Overview"
                            ? pathname === item.href
                            : (pathname === item.href || pathname.startsWith(item.href + "/"));

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={onClose}
                                className={`
                                    flex items-center link-logo gap-3 px-3 py-3 rounded-md font-medium text-[14px]
                                    transition-all duration-200 group relative
                                    ${isActive
                                        ? "bg-(--color-accent-dim) text-(--color-accent) border-l-[3px] border-(--color-accent) pl-[9px]"
                                        : "text-(--color-text-secondary) hover:bg-(--color-surface-hover) hover:text-(--color-text-primary)"
                                    }
                                    ${isCollapsed ? "md:justify-center md:px-0 md:pl-0 md:border-l-0 md:after:content-['']" : ""}
                                `}
                            >
                                <Icon
                                    size={20}
                                    className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? "text-(--color-accent)" : "text-(--color-text-muted) group-hover:text-(--color-text-primary)"}`}
                                />
                                <span
                                    className={`
                                        whitespace-nowrap transition-all duration-300
                                        ${isCollapsed ? "md:absolute md:left-full md:ml-4 md:px-2 md:py-1 md:bg-(--color-surface-raised) md:border md:border-(--color-border-strong) md:rounded-md md:shadow-md md:opacity-0 md:pointer-events-none md:group-hover:opacity-100 md:group-hover:translate-x-2 md:z-50" : ""}
                                    `}
                                >
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Section (User Info & Logout) */}
                <div className="p-4 border-t border-(--color-border-subtle) bg-(--color-surface-raised) md:bg-transparent">
                    {isCollapsed ? (
                        <div className="flex flex-col items-center gap-4">
                            <div
                                title={userFullName}
                                className="w-10 h-10 rounded-full bg-(--color-purple-dim) flex items-center justify-center text-(--color-accent) font-semibold shrink-0 border border-(--color-border-strong)"
                            >
                                {userInitial}
                            </div>
                            <button
                                onClick={handleLogout}
                                aria-label="Sign out"
                                className="p-2 rounded-md hover:bg-(--color-danger-dim) text-(--color-text-muted) hover:text-(--color-danger) transition-colors border border-transparent hover:border-(--color-danger)/20"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-(--color-purple-dim) flex items-center justify-center text-(--color-accent) font-semibold shrink-0 border border-(--color-border-strong)">
                                    {userInitial}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-sm text-(--color-text-primary) truncate">
                                        {userFullName}
                                    </p>
                                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 uppercase tracking-wider ${getRoleBadgeStyle(role)}`}>
                                        {role || "Customer"}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-md border border-(--color-border-default) hover:border-danger/30 text-sm font-semibold text-(--color-text-secondary) hover:text-(--color-danger) hover:bg-(--color-danger-dim) transition-all duration-200"
                            >
                                <LogOut size={16} />
                                <span>Sign out</span>
                            </button>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;