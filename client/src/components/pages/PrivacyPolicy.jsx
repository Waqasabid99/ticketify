const sections = [
    {
        heading: "1. Introduction",
        body: `Ticketify ("we", "us", or "our") respects your privacy and is committed to protecting the personal information you share with us. This Privacy Policy explains what information we collect, how we use it, and the choices you have when you use our website and mobile application (the "Service").`,
    },
    {
        heading: "2. Information We Collect",
        body: `We collect information you provide directly to us, such as your name, email address, phone number, and payment details when you register an account or book a ticket. We also automatically collect certain information when you use the Service, including device information, IP address, browser type, and usage data such as the movies, showtimes, and theaters you view or book.`,
    },
    {
        heading: "3. How We Use Your Information",
        body: `We use the information we collect to process your bookings and payments, send booking confirmations and reminders, provide customer support, improve and personalize the Service, and communicate with you about offers, updates, or changes to our policies. We do not sell your personal information to third parties.`,
    },
    {
        heading: "4. Payment Information",
        body: `Payments are processed by trusted third-party payment providers (such as Stripe). We do not store your full card details on our servers. Payment providers may collect and process your payment information in accordance with their own privacy policies.`,
    },
    {
        heading: "5. Cookies and Tracking",
        body: `We use cookies and similar technologies to keep you signed in, remember your preferences, and understand how you use the Service. For more detail, please see our Cookie Policy.`,
    },
    {
        heading: "6. Sharing Your Information",
        body: `We may share your information with theaters and partners to fulfil your bookings, with service providers who help us operate the Service (such as payment processors and hosting providers), and when required by law or to protect the rights and safety of Ticketify, our users, or the public.`,
    },
    {
        heading: "7. Data Security",
        body: `We use reasonable administrative, technical, and physical safeguards to protect your information. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.`,
    },
    {
        heading: "8. Your Rights",
        body: `Depending on your location, you may have the right to access, correct, or delete the personal information we hold about you, and to object to or restrict certain processing. You can update most of your account information directly from your profile settings, or contact us to make a request.`,
    },
    {
        heading: "9. Children's Privacy",
        body: `The Service is not directed to children under the age of 13, and we do not knowingly collect personal information from children under 13.`,
    },
    {
        heading: "10. Changes to This Policy",
        body: `We may update this Privacy Policy from time to time. If we make material changes, we will notify you by posting the updated policy on this page with a new effective date.`,
    },
    {
        heading: "11. Contact Us",
        body: `If you have any questions about this Privacy Policy, please contact us at support@ticketify.com.`,
    },
];

const PrivacyPolicy = () => {
    return (
        <main className="min-h-screen mt-5 bg-(--color-bg-page) font-(family-name:--font-body)">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
                <p className="eyebrow mb-1">Legal</p>
                <h1 className="font-(family-name:--font-display) text-3xl md:text-4xl font-extrabold text-(--color-text-primary) tracking-tight mb-2">
                    Privacy Policy
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

export default PrivacyPolicy;