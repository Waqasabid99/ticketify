"use client";

import { useAuthStore } from "@/store/authStore";
import { Eye, EyeOff, Mail, User, Ticket, Film, Star, Clock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ErrorBox } from "@/components/ui/ErrorBox";
import Loader from "@/components/ui/Loader";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

const FormField = ({
    label,
    name,
    id,
    value,
    onChange,
    placeholder,
    type = "text",
    required,
    maxLength,
    Icon,
    ActionIcon,
    onActionClick,
    error,
}) => {
    return (
        <div className="flex flex-col gap-1.5">
            <label
                htmlFor={id}
                className="label"
            >
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
                    placeholder={placeholder}
                    required={required}
                    maxLength={maxLength}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${id}-error` : undefined}
                    className={`
                        field field-filled w-full
                        ${Icon ? "pl-9" : ""}
                        ${ActionIcon ? "pr-10" : ""}
                        ${error ? "field-error" : ""}
                    `}
                />
                {ActionIcon && (
                    <button
                        type="button"
                        onClick={onActionClick}
                        aria-label="Toggle visibility"
                        className="
                            absolute right-3
                            text-(--color-text-muted) hover:text-(--color-text-secondary)
                            transition-colors duration-(--transition-fast) cursor-pointer
                        "
                    >
                        <ActionIcon size={15} />
                    </button>
                )}
            </div>

            {error && (
                <p
                    id={`${id}-error`}
                    className="field-error-msg flex items-center gap-1"
                    role="alert"
                >
                    {error}
                </p>
            )}
        </div>
    );
};

const PhoneField = ({ value, onChange, onBlur, error }) => {
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="label">
                Phone number
            </label>

            <div className={`ticketify-phone${error ? " ticketify-phone--error" : ""}`}>
                <style>{`
                    .ticketify-phone .react-tel-input .flag-dropdown,
                    .ticketify-phone .react-tel-input .selected-flag {
                        background-color: var(--color-surface-raised) !important;
                        border-color: var(--color-border-default) !important;
                        border-right: none !important;
                        border-radius: var(--radius-md) 0 0 var(--radius-md) !important;
                    }
                    .ticketify-phone .react-tel-input .selected-flag:hover,
                    .ticketify-phone .react-tel-input .selected-flag:focus,
                    .ticketify-phone .react-tel-input .open .selected-flag {
                        background-color: var(--color-surface-hover) !important;
                    }
                    .ticketify-phone .react-tel-input .form-control {
                        width: 100% !important;
                        height: auto !important;
                        background-color: var(--color-surface) !important;
                        border: 1.5px solid var(--color-border-default) !important;
                        border-radius: 0 var(--radius-md) var(--radius-md) 0 !important;
                        color: var(--color-text-primary) !important;
                        font-family: var(--font-body) !important;
                        font-size: var(--text-base) !important;
                        padding: 0.625rem 0.875rem 0.625rem 3rem !important;
                        transition: border-color var(--transition-fast), box-shadow var(--transition-fast) !important;
                    }
                    .ticketify-phone .react-tel-input .form-control::placeholder {
                        color: var(--color-text-muted) !important;
                    }
                    .ticketify-phone .react-tel-input .form-control:hover:not(:focus) {
                        background-color: var(--color-surface-hover) !important;
                        border-color: var(--color-border-strong) !important;
                    }
                    .ticketify-phone .react-tel-input .form-control:focus {
                        background-color: var(--color-surface-raised) !important;
                        border-color: var(--color-info) !important;
                        box-shadow: 0 0 0 3px rgba(55, 198, 243, 0.2) !important;
                        outline: none !important;
                    }
                    .ticketify-phone--error .react-tel-input .form-control {
                        border-color: var(--color-danger) !important;
                    }
                    .ticketify-phone--error .react-tel-input .form-control:focus {
                        border-color: var(--color-danger) !important;
                        box-shadow: 0 0 0 3px rgba(242, 92, 92, 0.2) !important;
                    }
                    .ticketify-phone--error .react-tel-input .flag-dropdown {
                        border-color: var(--color-danger) !important;
                    }
                    /* Dropdown panel */
                    .ticketify-phone .react-tel-input .country-list {
                        background-color: var(--color-surface-raised) !important;
                        border: 1px solid var(--color-border-default) !important;
                        border-radius: var(--radius-md) !important;
                        box-shadow: var(--shadow-lg) !important;
                        color: var(--color-text-secondary) !important;
                        font-family: var(--font-body) !important;
                        font-size: var(--text-sm) !important;
                        margin-top: 4px !important;
                    }
                    .ticketify-phone .react-tel-input .country-list .country:hover,
                    .ticketify-phone .react-tel-input .country-list .country.highlight {
                        background-color: var(--color-surface-hover) !important;
                    }
                    .ticketify-phone .react-tel-input .country-list .country-name {
                        color: var(--color-text-secondary) !important;
                    }
                    .ticketify-phone .react-tel-input .country-list .dial-code {
                        color: var(--color-text-muted) !important;
                    }
                    .ticketify-phone .react-tel-input .country-list .search {
                        background-color: var(--color-surface-raised) !important;
                        padding: 8px !important;
                    }
                    .ticketify-phone .react-tel-input .country-list .search-box {
                        background-color: var(--color-surface) !important;
                        border: 1.5px solid var(--color-border-default) !important;
                        border-radius: var(--radius-sm) !important;
                        color: var(--color-text-primary) !important;
                        font-family: var(--font-body) !important;
                        width: 100% !important;
                        padding: 6px 10px !important;
                    }
                    .ticketify-phone .react-tel-input .country-list .search-box:focus {
                        border-color: var(--color-info) !important;
                        outline: none !important;
                    }
                `}</style>

                <PhoneInput
                    inputProps={{ id: "phone", name: "phone", "aria-invalid": !!error, "aria-describedby": error ? "phone-error" : undefined }}
                    country="pk"
                    enableSearch
                    searchPlaceholder="Search country..."
                    value={value}
                    onChange={(phone) => onChange(phone)}
                    onBlur={onBlur}
                    placeholder="300 0000000"
                />
            </div>

            {error && (
                <p id="phone-error" className="field-error-msg flex items-center gap-1" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
};

const LeftPanel = () => (
    <div
        className="
            hidden md:flex flex-col justify-between
            h-full px-12 py-14
            bg-(--color-surface) border-r border-(--color-border-subtle)
            relative overflow-hidden
        "
    >
        {/* Decorative grid of faint dots */}
        <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            aria-hidden="true"
            style={{
                backgroundImage: "radial-gradient(circle, var(--color-text-primary) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
            }}
        />

        {/* Decorative accent ring top-right */}
        <div
            className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none opacity-10 border-2 border-(--color-accent)"
            aria-hidden="true"
        />
        <div
            className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none opacity-8 border border-(--color-accent)"
            aria-hidden="true"
        />

        {/* Logo */}
        <div className="relative z-10">
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-(--color-accent) flex items-center justify-center">
                    <Ticket size={16} className="text-(--color-accent-text)" strokeWidth={2.5} />
                </div>
                <span
                    className="text-xl font-extrabold tracking-tight text-(--color-text-primary)"
                    style={{ fontFamily: "var(--font-display)" }}
                >
                    Ticketify
                </span>
            </div>
        </div>

        {/* Main copy */}
        <div className="relative z-10 flex flex-col gap-6">
            <div>
                <p className="eyebrow mb-3">Join the experience</p>
                <h1
                    className="text-4xl font-extrabold leading-tight tracking-tight text-(--color-text-primary) mb-4"
                    style={{ fontFamily: "var(--font-display)" }}
                >
                    Your seat is<br />
                    <span className="text-(--color-accent)">waiting for you.</span>
                </h1>
                <p className="text-sm leading-relaxed text-(--color-text-muted) max-w-xs">
                    Book cinema tickets in seconds. Pick your seats, grab your snacks,
                    and enjoy the show — all from one place.
                </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-col gap-3">
                {[
                    { Icon: Film, text: "Thousands of shows daily" },
                    { Icon: Star, text: "Exclusive member perks & discounts" },
                    { Icon: Clock, text: "Instant booking confirmation" },
                ].map(({ Icon, text }) => (
                    <div key={text} className="flex items-center gap-3">
                        <div
                            className="
                                w-8 h-8 rounded-md shrink-0
                                bg-(--color-accent-dim) border border-(--color-border-accent)
                                flex items-center justify-center
                            "
                        >
                            <Icon size={14} className="text-(--color-accent)" />
                        </div>
                        <span className="text-sm text-(--color-text-secondary)">{text}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10">
            <p className="text-xs text-(--color-text-muted)">
                Already have an account?{" "}
                <Link href="/login" className="link-accent font-medium">
                    Sign in
                </Link>
            </p>
        </div>
    </div>
);

const validateField = (name, value, formData) => {
    switch (name) {
        case "firstName":
            if (!value.trim()) return "First name is required.";
            if (value.trim().length < 2) return "Must be at least 2 characters.";
            return "";
        case "email":
            if (!value.trim()) return "Email is required.";
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address.";
            return "";
        case "phone":
            if (value && value.replace(/\D/g, "").length < 7) return "Enter a valid phone number.";
            return "";
        case "password":
            if (!value) return "Password is required.";
            if (value.length < 8) return "Must be at least 8 characters.";
            if (!/[0-9]/.test(value)) return "Must contain at least one number.";
            return "";
        case "confirmPassword":
            if (!value) return "Please confirm your password.";
            if (value !== formData.password) return "Passwords do not match.";
            return "";
        default:
            return "";
    }
};

const validateAll = (formData) => {
    const fields = ["firstName", "email", "phone", "password", "confirmPassword"];
    const errors = {};
    fields.forEach((field) => {
        const msg = validateField(field, formData[field], formData);
        if (msg) errors[field] = msg;
    });
    return errors;
};

const Register = () => {
    const { register, error: serverError, isLoading } = useAuthStore();

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });

    const [fieldErrors, setFieldErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    /* Live per-field validation on blur */
    const handleBlur = (e) => {
        const { name, value } = e.target;
        const msg = validateField(name, value, formData);
        setFieldErrors((prev) => ({ ...prev, [name]: msg }));
    };

    /* PhoneInput gives us the raw digit string, not a native event */
    const handlePhoneChange = (phone) => {
        setFormData((prev) => ({ ...prev, phone }));
        if (fieldErrors.phone) {
            setFieldErrors((prev) => ({ ...prev, phone: "" }));
        }
    };

    const handlePhoneBlur = () => {
        const msg = validateField("phone", formData.phone, formData);
        setFieldErrors((prev) => ({ ...prev, phone: msg }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        /* Clear the error for this field as soon as they start correcting it */
        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    /* Dismiss a single field error from the ErrorBox */
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

        await register({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
        });
    };

    /* Flatten field errors into string array for ErrorBox */
    const fieldErrorList = Object.values(fieldErrors).filter(Boolean);
    const hasErrors = fieldErrorList.length > 0 || !!serverError;
    const errorPayload = serverError
        ? [serverError, ...fieldErrorList]
        : fieldErrorList;

    return (
        <main
            className="min-h-screen grid md:grid-cols-[1fr_1fr] lg:grid-cols-[5fr_7fr] bg-(--color-bg-page)"
            style={{ fontFamily: "var(--font-body)" }}
        >
            {/* ── Left: brand panel ── */}
            <LeftPanel />

            {/* ── Right: form ── */}
            <section className="flex items-center justify-center px-6 py-12 md:py-0">
                <div className="w-full max-w-md flex flex-col gap-8">

                    {/* Mobile-only logo */}
                    <div className="flex md:hidden items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-(--color-accent) flex items-center justify-center">
                            <Ticket size={14} className="text-(--color-accent-text)" strokeWidth={2.5} />
                        </div>
                        <span
                            className="text-lg font-extrabold tracking-tight text-(--color-text-primary)"
                            style={{ fontFamily: "var(--font-display)" }}
                        >
                            Ticketify
                        </span>
                    </div>

                    {/* Heading */}
                    <div className="flex flex-col gap-1.5">
                        <h2
                            className="text-3xl font-bold text-(--color-text-primary) tracking-tight"
                            style={{ fontFamily: "var(--font-display)" }}
                        >
                            Create account
                        </h2>
                        <p className="text-sm text-(--color-text-muted)">
                            Already have one?{" "}
                            <Link href="/login" className="link-accent font-medium">
                                Sign in instead
                            </Link>
                        </p>
                    </div>

                    {/* Error summary */}
                    {hasErrors && (
                        <ErrorBox
                            error={errorPayload}
                            title={"Unable to create account"}
                            onClose={() => setFieldErrors({})}
                            onCloseItem={serverError ? undefined : dismissFieldError}
                        />
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

                        {/* Name row */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                label="First name"
                                name="firstName"
                                id="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="Ada"
                                Icon={User}
                                required
                                error={fieldErrors.firstName}
                            />
                            <FormField
                                label="Last name"
                                name="lastName"
                                id="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Lovelace"
                                Icon={User}
                            />
                        </div>

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

                        <PhoneField
                            value={formData.phone}
                            onChange={handlePhoneChange}
                            onBlur={handlePhoneBlur}
                            error={fieldErrors.phone}
                        />

                        <FormField
                            label="Password"
                            name="password"
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="Min. 8 characters with a number"
                            ActionIcon={showPassword ? EyeOff : Eye}
                            onActionClick={() => setShowPassword((v) => !v)}
                            required
                            error={fieldErrors.password}
                        />

                        <FormField
                            label="Confirm password"
                            name="confirmPassword"
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="Re-enter your password"
                            ActionIcon={showConfirmPassword ? EyeOff : Eye}
                            onActionClick={() => setShowConfirmPassword((v) => !v)}
                            required
                            error={fieldErrors.confirmPassword}
                        />

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary btn-lg w-full mt-1"
                        >
                            {isLoading
                                ? <Loader variant="dots" loaderColor="var(--color-text-primary)" inline text="Creating..." size="sm" />
                                : "Create account"
                            }
                        </button>
                    </form>

                    <p className="text-xs text-(--color-text-muted) text-center">
                        By creating an account you agree to our{" "}
                        <Link href="/terms" className="link-muted underline underline-offset-2">Terms of Service</Link>
                        {" "}and{" "}
                        <Link href="/privacy" className="link-muted underline underline-offset-2">Privacy Policy</Link>.
                    </p>
                </div>
            </section>
        </main>
    );
};

export default Register;
