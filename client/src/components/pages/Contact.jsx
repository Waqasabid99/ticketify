"use client";

import { useState } from "react";
import {
    Mail,
    Phone,
    MapPin,
    Clock,
    Send,
    User,
    CheckCircle2,
} from "lucide-react";
import { ErrorBox } from "@/components/ui/ErrorBox";
import Loader from "@/components/ui/Loader";
import { sendContactMessage } from "@/actions/contact.action";
import { toast } from "react-toastify";

/* ─── Shared input field ─── */
const FormField = ({
    label,
    name,
    id,
    value,
    onChange,
    onBlur,
    placeholder,
    type = "text",
    required,
    Icon,
    error,
}) => {
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="label">
                {label}
                {required && (
                    <span className="text-(--color-danger) ml-0.5" aria-hidden="true">*</span>
                )}
            </label>

            <div className="relative flex items-center">
                {Icon && (
                    <span
                        className="absolute left-3 pointer-events-none text-(--color-text-muted)"
                        aria-hidden="true"
                    >
                        <Icon size={15} />
                    </span>
                )}
                <input
                    id={id}
                    name={name}
                    type={type}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    required={required}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${id}-error` : undefined}
                    className={`
                        field field-filled w-full
                        ${Icon ? "pl-9" : ""}
                        ${error ? "field-error" : ""}
                    `}
                />
            </div>

            {error && (
                <p id={`${id}-error`} className="field-error-msg flex items-center gap-1" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
};

/* ─── Textarea variant for the message field ─── */
const TextAreaField = ({ label, name, id, value, onChange, onBlur, placeholder, required, error }) => {
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="label">
                {label}
                {required && (
                    <span className="text-(--color-danger) ml-0.5" aria-hidden="true">*</span>
                )}
            </label>

            <textarea
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder={placeholder}
                required={required}
                rows={5}
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-error` : undefined}
                className={`
                    field field-filled w-full resize-none
                    ${error ? "field-error" : ""}
                `}
            />

            {error && (
                <p id={`${id}-error`} className="field-error-msg flex items-center gap-1" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
};

/* ─── Contact info row, used in the left rail ─── */
const ContactInfoCard = ({ Icon, title, value, href }) => {
    const content = (
        <div className="flex items-start gap-3">
            <div
                className="
                    w-9 h-9 rounded-md shrink-0
                    bg-(--color-accent-dim) border border-(--color-border-accent)
                    flex items-center justify-center
                "
            >
                <Icon size={15} className="text-(--color-accent)" />
            </div>
            <div className="flex flex-col">
                <span className="text-(--color-text-muted) text-xs uppercase tracking-wide">{title}</span>
                <span className="text-(--color-text-primary) text-sm font-medium">{value}</span>
            </div>
        </div>
    );

    return (
        <div className="card rounded-xl border border-(--color-border-default) bg-(--color-surface) p-4">
            {href ? (
                <a href={href} className="hover:opacity-80 transition-opacity duration-(--transition-fast)">
                    {content}
                </a>
            ) : (
                content
            )}
        </div>
    );
};

/* ─── Validation ─── */
const validateField = (name, value) => {
    switch (name) {
        case "name":
            if (!value.trim()) return "Name is required.";
            if (value.trim().length < 2) return "Must be at least 2 characters.";
            return "";
        case "email":
            if (!value.trim()) return "Email is required.";
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address.";
            return "";
        case "subject":
            if (!value.trim()) return "Please select a topic.";
            return "";
        case "message":
            if (!value.trim()) return "Message is required.";
            if (value.trim().length < 10) return "Tell us a bit more (min. 10 characters).";
            return "";
        default:
            return "";
    }
};

const validateAll = (formData) => {
    const fields = ["name", "email", "subject", "message"];
    const errors = {};
    fields.forEach((field) => {
        const msg = validateField(field, formData[field]);
        if (msg) errors[field] = msg;
    });
    return errors;
};

const ContactPage = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });

    const [fieldErrors, setFieldErrors] = useState({});
    const [serverError, setServerError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        const msg = validateField(name, value);
        setFieldErrors((prev) => ({ ...prev, [name]: msg }));
    };

    const dismissFieldError = (index) => {
        const errorKeys = Object.keys(fieldErrors).filter((k) => fieldErrors[k]);
        const keyToDismiss = errorKeys[index];
        if (keyToDismiss) {
            setFieldErrors((prev) => ({ ...prev, [keyToDismiss]: "" }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = validateAll(formData);
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setServerError("");
        setIsLoading(true);
        try {
            const response = await sendContactMessage(formData);
            console.log(response)
            if (response) {
                setSubmitted(true);
                setFormData({ name: "", email: "", subject: "", message: "" });
                toast.success(response.message);
            }
        } catch (err) {
            setServerError(err.message);
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fieldErrorList = Object.values(fieldErrors).filter(Boolean);
    const hasErrors = fieldErrorList.length > 0 || !!serverError;
    const errorPayload = serverError ? [serverError, ...fieldErrorList] : fieldErrorList;

    return (
        <main className="min-h-screen mt-5 bg-(--color-bg-page) text-(--color-text-secondary) font-(family-name:--font-body)">

            {/* Ambient glow, consistent with checkout/booking pages */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-(--color-accent)/5 blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10">

                {/* Header */}
                <div className="mb-10">
                    <p className="eyebrow mb-1">We're here to help</p>
                    <h1 className="font-(family-name:--font-display) text-3xl md:text-4xl font-extrabold text-(--color-text-primary) tracking-tight m-0">
                        Get in Touch
                    </h1>
                    <p className="text-(--color-text-muted) text-sm mt-2 m-0 max-w-md">
                        Questions about a booking, a refund, or just want to say hi? Send us a message and our team will get back to you.
                    </p>
                </div>

                {/* Two-column layout */}
                <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">

                    {/* LEFT — Contact info */}
                    <div className="flex flex-col gap-4">
                        <ContactInfoCard
                            Icon={Mail}
                            title="Email"
                            value="support@ticketify.com"
                            href="mailto:support@ticketify.com"
                        />
                        <ContactInfoCard
                            Icon={Phone}
                            title="Phone"
                            value="+92 300 0000000"
                            href="tel:+923000000000"
                        />
                        <ContactInfoCard
                            Icon={MapPin}
                            title="Address"
                            value="123 Cinema Street, Lahore, Pakistan"
                        />
                        <ContactInfoCard
                            Icon={Clock}
                            title="Support Hours"
                            value="Mon – Sun, 10 AM – 11 PM"
                        />
                    </div>

                    {/* RIGHT — Form */}
                    <div className="card rounded-2xl border border-(--color-border-default) bg-(--color-surface) p-6 md:p-8">

                        {submitted ? (
                            <div className="flex flex-col items-center justify-center text-center gap-3 py-10">
                                <div
                                    className="
                                        w-14 h-14 rounded-full flex items-center justify-center
                                        bg-(--color-accent-dim) border border-(--color-border-accent)
                                    "
                                >
                                    <CheckCircle2 size={26} className="text-(--color-accent)" />
                                </div>
                                <h2 className="font-(family-name:--font-display) text-xl font-bold text-(--color-text-primary) m-0">
                                    Message sent
                                </h2>
                                <p className="text-(--color-text-muted) text-sm max-w-sm m-0">
                                    Thanks for reaching out. We typically reply within 24 hours.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setSubmitted(false)}
                                    className="btn btn-md link-button mt-2"
                                >
                                    Send another message
                                </button>
                            </div>
                        ) : (
                            <>
                                <p className="text-(--color-text-primary) font-semibold text-sm mb-6">
                                    Send us a message
                                </p>

                                {hasErrors && (
                                    <div className="mb-5">
                                        <ErrorBox
                                            error={errorPayload}
                                            title="Unable to send your message"
                                            onClose={() => { setFieldErrors({}); setServerError(""); }}
                                            onCloseItem={serverError ? undefined : dismissFieldError}
                                        />
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField
                                            label="Your name"
                                            name="name"
                                            id="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            placeholder="Ada Lovelace"
                                            Icon={User}
                                            required
                                            error={fieldErrors.name}
                                        />
                                        <FormField
                                            label="Email"
                                            name="email"
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            placeholder="ada@example.com"
                                            Icon={Mail}
                                            required
                                            error={fieldErrors.email}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="subject" className="label">
                                            Subject
                                            <span className="text-(--color-danger) ml-0.5" aria-hidden="true">*</span>
                                        </label>
                                        <select
                                            id="subject"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            aria-invalid={!!fieldErrors.subject}
                                            className={`field field-filled w-full ${fieldErrors.subject ? "field-error" : ""}`}
                                        >
                                            <option value="">Select a topic</option>
                                            <option value="booking">Booking issue</option>
                                            <option value="refund">Refund request</option>
                                            <option value="general">General inquiry</option>
                                            <option value="partnership">Partnership</option>
                                            <option value="other">Other</option>
                                        </select>
                                        {fieldErrors.subject && (
                                            <p className="field-error-msg flex items-center gap-1" role="alert">
                                                {fieldErrors.subject}
                                            </p>
                                        )}
                                    </div>

                                    <TextAreaField
                                        label="Message"
                                        name="message"
                                        id="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder="Tell us how we can help..."
                                        required
                                        error={fieldErrors.message}
                                    />

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="btn btn-primary btn-lg w-full mt-1 flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? (
                                            <Loader variant="dots" loaderColor="var(--color-text-primary)" inline text="Sending..." size="sm" />
                                        ) : (
                                            <>
                                                <Send size={15} />
                                                Send message
                                            </>
                                        )}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default ContactPage;
