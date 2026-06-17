const sections = [
    {
        heading: "1. What Are Cookies",
        body: `Cookies are small text files that are placed on your device when you visit a website. They help the site remember information about your visit, such as your preferences and login state, which can make your next visit easier and the Service more useful to you.`,
    },
    {
        heading: "2. How We Use Cookies",
        body: `Ticketify uses cookies to keep you signed in, remember your preferences (such as your selected theater or language), understand how visitors use our Service so we can improve it, and, where applicable, show you relevant offers and promotions.`,
    },
    {
        heading: "3. Types of Cookies We Use",
        body: `Essential cookies are required for the Service to function, such as keeping you logged in and processing bookings. Performance cookies help us understand how visitors interact with the Service so we can improve performance and usability. Functionality cookies remember your preferences to provide a more personalized experience. Advertising cookies, where used, help us deliver relevant offers and measure their effectiveness.`,
    },
    {
        heading: "4. Third-Party Cookies",
        body: `Some cookies may be set by trusted third parties we work with, such as payment processors and analytics providers, to help us operate and improve the Service. These third parties have their own privacy and cookie policies.`,
    },
    {
        heading: "5. Managing Cookies",
        body: `Most web browsers let you control cookies through their settings, including blocking or deleting them. Please note that disabling certain cookies, particularly essential ones, may affect how parts of the Service function, such as staying logged in or completing a booking.`,
    },
    {
        heading: "6. Changes to This Policy",
        body: `We may update this Cookie Policy from time to time to reflect changes in our practices or for legal reasons. Any changes will be posted on this page with a new effective date.`,
    },
    {
        heading: "7. Contact Us",
        body: `If you have any questions about how we use cookies, please contact us at support@ticketify.com.`,
    },
];

const CookiePolicy = () => {
    return (
        <main className="min-h-screen mt-5 bg-(--color-bg-page) font-(family-name:--font-body)">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
                <p className="eyebrow mb-1">Legal</p>
                <h1 className="font-(family-name:--font-display) text-3xl md:text-4xl font-extrabold text-(--color-text-primary) tracking-tight mb-2">
                    Cookie Policy
                </h1>
                <p className="text-(--color-text-muted) text-sm mb-10">
                    Last updated: June 17, 2026
                </p>

                <div className="flex flex-col gap-8">
                    {sections.map((section) => (
                        <div key={section.heading}>
                            <h2 className="text-(--color-text-primary) text-lg font-semibold mb-2">
                                {section.heading}
                            </h2>
                            <p className="text-(--color-text-secondary) text-sm leading-relaxed">
                                {section.body}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
};

export default CookiePolicy;