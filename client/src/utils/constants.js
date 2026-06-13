import { Ticket } from "lucide-react";
import { FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa6";
import { FaTwitter } from "react-icons/fa";
import Link from "next/link";

export const Logo = () => (
    <Link href="/" className="link-logo flex items-center gap-2 bg-transparent shrink-0">
        <Ticket size={36} color="var(--color-accent)" className="-rotate-20" />
        <h1 className="text-xl md:text-2xl font-bold link-logo">Ticketify</h1>
    </Link>
)

export const NAV_LINKS = [
    { href: "/", label: "Home" },
    { href: "/movies", label: "Movies" },
    { href: "#", label: "Genres", children: [] },
    { href: "/theaters", label: "Theaters", children: [] }
];

export const LEGAL_LINKS = [
    { href: "/terms", label: "Terms of Use" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/cookie", label: "Cookie Policy" }
];

export const CONTACT_LINKS = [
    { href: "/contact", label: "Contact Us" },
    { href: "/help", label: "Help" },
    { href: "/support", label: "Support" }
];

export const SOCIAL_LINKS = [
    { href: "https://facebook.com", label: "Facebook", icon: <FaFacebook /> },
    { href: "https://twitter.com", label: "Twitter", icon: <FaTwitter /> },
    { href: "https://instagram.com", label: "Instagram", icon: <FaInstagram /> },
    { href: "https://youtube.com", label: "YouTube", icon: <FaYoutube /> },
]

export function formatDuration(minutes) {
    if (!minutes) return null;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatYear(dateStr) {
    if (!dateStr) return null;
    return new Date(dateStr).getFullYear();
}

export function StatusBadge({ status }) {
    if (!status) return null;
    const map = {
        NOW_SHOWING: { label: "Now Showing", cls: "badge badge-success pill" },
        COMING_SOON: { label: "Coming Soon", cls: "badge badge-info pill" },
        ENDED: { label: "Ended", cls: "badge badge-muted pill" },
    };
    const { label, cls } = map[status] ?? { label: status, cls: "badge badge-muted pill" };
    return <span className={cls}>{label}</span>;
}

export function StarRating({ rating = 4 }) {
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
                <svg
                    key={i}
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill={i < rating ? "var(--color-accent)" : "var(--color-border-default)"}
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M8 1l1.854 3.755L14 5.519l-3 2.923.708 4.131L8 10.5l-3.708 2.073L5 8.442 2 5.519l4.146-.764L8 1z" />
                </svg>
            ))}
        </div>
    );
}