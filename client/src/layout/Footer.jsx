import { CONTACT_LINKS, LEGAL_LINKS, Logo, NAV_LINKS, SOCIAL_LINKS } from "@/utils/constants"
import Link from "next/link"

const ListComponent = ({ title, links }) => {
    return (
        <div className="flex flex-col items-start justify-start gap-y-4">
            <h4 className="font-bold text-(--color-accent)">{title}</h4>
            {links?.map((link) => (
                <Link
                    className="text-(--color-text-secondary) hover:text-(--color-primary)"
                    key={link.href}
                    href={link.href}
                >
                    {link.label}
                </Link>
            ))}
        </div>
    )
}

const Footer = () => {
    return (
        <footer className="w-full border-y border-border/50">
            <div className="px-6 py-12 sm:px-12 md:px-16 lg:px-24 lg:py-24 w-full flex flex-col lg:flex-row items-start justify-between gap-10">
                <div className="flex flex-col items-start justify-start w-full lg:w-1/4">
                    <Logo />
                    <p className="mt-5 text-(--color-text-secondary)">
                        Welcome to Ticketify - Your one-stop destination for all movie lovers.
                        Book tickets for your favorite movies and enjoy a seamless ticketing experience.
                    </p>

                    {/* social media links */}
                    <div className="flex flex-row items-center gap-x-2 mt-5">
                        {SOCIAL_LINKS.map((link) => (
                            <Link
                                aria-label={link.label}
                                className="text-(--color-text-secondary) hover:text-(--color-primary)"
                                key={link.href}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <span className="text-(--color-accent) text-xl px-3">{link.icon}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="flex flex-row flex-wrap gap-x-16 gap-y-8 w-full lg:w-3/5 lg:gap-x-24">
                    <ListComponent title={"Quick Links"} links={NAV_LINKS} />
                    <ListComponent title={"Legal Links"} links={LEGAL_LINKS} />
                    <ListComponent title={"Contact Links"} links={CONTACT_LINKS} />
                </div>
            </div>

            <div className="w-full flex flex-col sm:flex-row items-center justify-center py-5 gap-y-2 gap-x-5 border-t text-center">
                <p className="text-(--color-text-secondary)">
                    © {new Date().getFullYear()} Ticketify. All rights reserved.
                </p>
                <p className="text-(--color-text-secondary)">
                    Made with <span>❤️</span> by{" "}
                    <span className="font-bold text-(--color-primary)">Waqas Ali Abid</span>
                </p>
            </div>
        </footer>
    )
};

export default Footer;
