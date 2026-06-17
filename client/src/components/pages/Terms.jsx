const sections = [
    {
        heading: "1. Acceptance of Terms",
        body: `By creating an account or using Ticketify (the "Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.`,
    },
    {
        heading: "2. Eligibility",
        body: `You must be at least 13 years old to use the Service. By using Ticketify, you confirm that you meet this requirement and that all information you provide is accurate and complete.`,
    },
    {
        heading: "3. Account Registration",
        body: `You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Please notify us immediately if you believe your account has been used without your permission.`,
    },
    {
        heading: "4. Bookings and Payments",
        body: `When you book a ticket through Ticketify, you authorize us to charge the applicable amount, including any taxes and fees, to your chosen payment method. Seat availability and pricing are confirmed only once payment has been successfully processed. We are not responsible for bookings that fail due to incorrect payment details.`,
    },
    {
        heading: "5. Cancellations and Refunds",
        body: `Cancellation and refund eligibility depends on the specific theater and show policy, which will be shown at the time of booking. Refunds, where applicable, are issued to the original payment method and may take several business days to process.`,
    },
    {
        heading: "6. Show Changes",
        body: `Movie listings, showtimes, and seat layouts are provided by participating theaters and may change without notice. If a show is cancelled or rescheduled by the theater, we will make reasonable efforts to notify affected customers and offer a refund or rebooking option.`,
    },
    {
        heading: "7. User Conduct",
        body: `You agree not to misuse the Service, including attempting to access accounts or data that do not belong to you, interfering with the normal operation of the Service, or using automated systems to book tickets at scale without our permission.`,
    },
    {
        heading: "8. Intellectual Property",
        body: `All content on Ticketify, including the logo, design, and software, is owned by Ticketify or its licensors and is protected by applicable intellectual property laws. You may not copy, modify, or distribute any part of the Service without our prior written consent.`,
    },
    {
        heading: "9. Limitation of Liability",
        body: `Ticketify acts as a platform connecting users with theaters and is not responsible for the quality of the movie, venue, or in-theater experience. To the fullest extent permitted by law, Ticketify shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.`,
    },
    {
        heading: "10. Termination",
        body: `We reserve the right to suspend or terminate your account if you violate these Terms or use the Service in a way that could cause harm to us, other users, or third parties.`,
    },
    {
        heading: "11. Governing Law",
        body: `These Terms shall be governed by and interpreted in accordance with the laws of the jurisdiction in which Ticketify operates, without regard to conflict of law principles.`,
    },
    {
        heading: "12. Changes to These Terms",
        body: `We may update these Terms from time to time. Continued use of the Service after changes are posted constitutes acceptance of the revised Terms.`,
    },
    {
        heading: "13. Contact Us",
        body: `If you have any questions about these Terms, please contact us at support@ticketify.com.`,
    },
];

const TermsOfService = () => {
    return (
        <main className="min-h-screen mt-5 bg-(--color-bg-page) font-(family-name:--font-body)">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
                <p className="eyebrow mb-1">Legal</p>
                <h1 className="font-(family-name:--font-display) text-3xl md:text-4xl font-extrabold text-(--color-text-primary) tracking-tight mb-2">
                    Terms of Service
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

export default TermsOfService;