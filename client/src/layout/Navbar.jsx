"use client";
import { useAuthStore } from "@/store/authStore";
import { Logo, NAV_LINKS } from "@/utils/constants";
import { Menu, Search, Ticket, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const Navbar = () => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { isAuthenticated, logout, role, isLoading } = useAuthStore();
    const dropdownRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const pathname = usePathname();

    const isHome = pathname === "/";
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileDropdownOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
                setIsMobileMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsMobileMenuOpen(false);
                setIsSearchOpen(false);
            }
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleLogout = async () => {
        await logout();
        setIsProfileDropdownOpen(false);
        setIsMobileMenuOpen(false);
    };

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <>
            {/* ── Desktop + Tablet Header ── */}
            <header className={`w-full z-50 px-4 md:px-8 lg:px-24 flex items-center justify-between ${isHome ? 'absolute py-6 md:py-8 lg:py-12 bg-transparent' : 'py-2 md:py-2 lg:py-6'}`}>

                {/* Logo */}
                <Logo />

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-6 lg:gap-8">

                    {/* Search bar — expands inline on open */}
                    <div className={`
                        flex items-center gap-(--space-2) rounded-full overflow-hidden
                        border transition-[width,opacity,padding,border-color] duration-350 ease-[ease]
                        ${isSearchOpen
                            ? "w-[220px] opacity-100 px-(--space-4) py-(--space-2) border-white/20"
                            : "w-0 opacity-0 px-0 py-0 border-transparent"
                        }
                    `}>
                        <Search size={16} color="var(--color-text-secondary)" className="shrink-0" />
                        <input
                            type="text"
                            placeholder="Search movies…"
                            className="bg-transparent border-none outline-none text-(--color-text-primary) text-[length:var(--text-sm)] w-full"
                        />
                    </div>

                    {/* Search toggle */}
                    <button
                        aria-label={isSearchOpen ? "Close search" : "Open search"}
                        type="button"
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        className="p-(--space-2) rounded-full bg-transparent border-none cursor-pointer flex items-center justify-center transition-colors duration-120 hover:bg-white/10"
                    >
                        {isSearchOpen
                            ? <X size={20} color="var(--color-text-secondary)" />
                            : <Search size={20} color="var(--color-text-secondary)" />
                        }
                    </button>

                    {/* Nav links */}
                    <nav className="flex items-center gap-6 lg:gap-8">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-[length:var(--text-md)] font-semibold text-(--color-text-primary) no-underline transition-colors duration-120 hover:text-(--color-accent)"
                            >
                                {link.label}
                            </Link>
                        ))}

                        {/* Auth — Desktop */}
                        {isAuthenticated ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    aria-label="Profile menu"
                                    type="button"
                                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                    className="bg-transparent border-none cursor-pointer rounded-full p-0"
                                >
                                    <User
                                        size={35}
                                        color="var(--color-text-inverse)"
                                        className="bg-(--color-accent) p-(--space-2) rounded-full"
                                    />
                                </button>

                                {isProfileDropdownOpen && (
                                    <div className="absolute right-0 top-[calc(100%+var(--space-2))] w-[200px] rounded-md shadow-(--shadow-lg) bg-(--color-surface-raised) border border-(--color-border-strong) py-(--space-1) z-(--z-dropdown)">
                                        <Link
                                            href={`/${role?.toLowerCase()}/dashboard`}
                                            onClick={() => setIsProfileDropdownOpen(false)}
                                            className="block px-(--space-4) py-(--space-2) text-[length:--text-md] text-(--color-text-primary) no-underline transition-colors duration-120 hover:bg-(--color-accent-dim)"
                                        >
                                            Profile
                                        </Link>
                                        <button
                                            type="button"
                                            disabled={isLoading}
                                            onClick={handleLogout}
                                            className="flex w-full px-(--space-4) py-(--space-2) text-[length:--text-md] text-(--color-text-primary) bg-transparent border-none cursor-pointer text-left transition-colors duration-120 hover:bg-(--color-accent-dim)"
                                        >
                                            {isLoading ? "Logging out..." : "Logout"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link href="/login" className="btn btn-primary text-(--color-accent-text)">
                                Sign in
                            </Link>
                        )}
                    </nav>
                </div>

                {/* Mobile: right-side controls */}
                <div className="flex md:hidden items-center gap-2">
                    {/* Mobile search toggle */}
                    <button
                        aria-label={isSearchOpen ? "Close search" : "Open search"}
                        type="button"
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        className="p-(--space-2) rounded-full bg-transparent border-none cursor-pointer flex items-center justify-center"
                    >
                        {isSearchOpen
                            ? <X size={20} color="var(--color-text-secondary)" />
                            : <Search size={20} color="var(--color-text-secondary)" />
                        }
                    </button>

                    {/* Hamburger */}
                    <button
                        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                        type="button"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-(--space-2) rounded-md bg-transparent border-none cursor-pointer flex items-center justify-center"
                    >
                        {isMobileMenuOpen
                            ? <X size={24} color="var(--color-text-primary)" />
                            : <Menu size={24} color="var(--color-text-primary)" />
                        }
                    </button>
                </div>
            </header>

            {/* ── Mobile Search Bar ── */}
            <div className={`
                md:hidden absolute w-full z-40 px-(--space-4)
                transition-[opacity,top] duration-200 ease-ease
                ${isSearchOpen ? "opacity-100 top-18 pointer-events-auto" : "opacity-0 top-15 pointer-events-none"}
            `}>
                <div className="flex items-center gap-(--space-2) px-(--space-4) py-(--space-3) bg-(--color-surface-raised) border border-(--color-border-default) rounded-lg shadow-(--shadow-md)">
                    <Search size={16} color="var(--color-text-muted)" />
                    <input
                        type="text"
                        placeholder="Search movies…"
                        className="bg-transparent border-none outline-none text-(--color-text-primary) text-[length:--text-md] w-full"
                    />
                </div>
            </div>

            {/* ── Mobile Menu Drawer ── */}
            <>
                {/* Backdrop */}
                <div
                    onClick={closeMobileMenu}
                    className={`
                        fixed inset-0 bg-(--color-overlay) z-[calc(var(--z-overlay)-1)]
                        transition-opacity duration-200 ease-[ease]
                        ${isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
                    `}
                />

                {/* Drawer panel */}
                <div
                    ref={mobileMenuRef}
                    className={`
                        md:hidden fixed top-0 right-0 h-dvh w-[min(80vw,320px)]
                        bg-(--color-surface) border-l border-(--color-border-subtle)
                        z-(--z-overlay) flex flex-col shadow-(--shadow-xl) overflow-y-auto
                        transition-transform duration-350 ease-[ease]
                        ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}
                    `}
                >
                    {/* Drawer header */}
                    <div className="flex items-center justify-between px-(--space-6) py-(--space-5) border-b border-(--color-border-subtle)">
                        <Link href="/" onClick={closeMobileMenu} className="link-logo flex items-center gap-2">
                            <Ticket size={28} color="var(--color-accent)" className="-rotate-20" />
                            <span className="font-display font-bold text-[length:--text-xl] text-(--color-text-primary)">
                                Ticketify
                            </span>
                        </Link>
                        <button
                            aria-label="Close menu"
                            type="button"
                            onClick={closeMobileMenu}
                            className="bg-transparent border-none cursor-pointer p-(--space-1) rounded-md flex"
                        >
                            <X size={20} color="var(--color-text-muted)" />
                        </button>
                    </div>

                    {/* Nav links */}
                    <nav className="py-(--space-4) grow">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={closeMobileMenu}
                                className="
                                    block px-(--space-6) py-(--space-3)
                                    text-[length:--text-md] font-semibold text-(--color-text-primary) no-underline
                                    border-l-[3px] border-transparent
                                    transition-[background-color,color,border-color] duration-120
                                    hover:bg-(--color-accent-dim) hover:border-l-(--color-accent) hover:text-(--color-accent)
                                "
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Auth section */}
                    <div className="p-(--space-6) border-t border-(--color-border-subtle)">
                        {isAuthenticated ? (
                            <div className="flex flex-col gap-(--space-3)">
                                {/* User badge */}
                                <div className="flex items-center gap-(--space-3) p-(--space-3) rounded-md bg-(--color-surface-raised)">
                                    <User
                                        size={32}
                                        color="var(--color-text-inverse)"
                                        className="bg-(--color-accent) p-(--space-2) rounded-full shrink-0"
                                    />
                                    <span className="text-[length:--text-sm)] text-(--color-text-secondary) capitalize">
                                        {role?.toLowerCase()}
                                    </span>
                                </div>

                                <Link
                                    href={`/${role?.toLowerCase()}/dashboard`}
                                    onClick={closeMobileMenu}
                                    className="btn btn-outline-primary w-full justify-center"
                                >
                                    My Dashboard
                                </Link>
                                <button
                                    type="button"
                                    disabled={isLoading}
                                    onClick={handleLogout}
                                    className="btn btn-ghost w-full justify-center"
                                >
                                    {isLoading ? "Logging out..." : "Logout"}
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                onClick={closeMobileMenu}
                                className="btn btn-primary w-full justify-center text-(--color-accent-text)"
                            >
                                Sign in
                            </Link>
                        )}
                    </div>
                </div>
            </>
        </>
    );
};

export default Navbar;