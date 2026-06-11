"use client";

import { useAuthStore } from "@/store/authStore";
import { Eye, EyeOff, Ticket, Film, Star, Clock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ErrorBox } from "@/components/ui/ErrorBox";
import Loader from "@/components/ui/Loader";
import { useRouter } from "next/navigation";

const FormField = ({
    label, name, id, value, onChange, onBlur, placeholder,
    type = "text", required, Icon, ActionIcon, onActionClick, error,
}) => (
    <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="label">
            {label}
            {required && <span className="text-(--color-danger) ml-0.5" aria-hidden="true">*</span>}
        </label>

        <div className="relative flex items-center">
            {Icon && (
                <span className="absolute left-3 pointer-events-none text-(--color-text-muted)" aria-hidden="true">
                    <Icon size={15} />
                </span>
            )}
            <input
                id={id} name={name} type={type} value={value}
                onChange={onChange} onBlur={onBlur} placeholder={placeholder}
                required={required}
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-error` : undefined}
                className={`field field-filled w-full ${Icon ? "pl-9" : ""} ${ActionIcon ? "pr-10" : ""} ${error ? "field-error" : ""}`}
            />
            {ActionIcon && (
                <button
                    type="button" onClick={onActionClick} aria-label="Toggle visibility"
                    className="absolute right-3 text-(--color-text-muted) hover:text-(--color-text-secondary) transition-colors duration-(--transition-fast) cursor-pointer"
                >
                    <ActionIcon size={15} />
                </button>
            )}
        </div>

        {error && (
            <p id={`${id}-error`} className="field-error-msg flex items-center gap-1" role="alert">
                {error}
            </p>
        )}
    </div>
);

const LeftPanel = () => (
    <div className="hidden md:flex flex-col justify-between h-full px-12 py-14 bg-(--color-surface) border-r border-(--color-border-subtle) relative overflow-hidden">
        <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none" aria-hidden="true"
            style={{ backgroundImage: "radial-gradient(circle, var(--color-text-primary) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none opacity-10 border-2 border-(--color-accent)" aria-hidden="true" />
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none opacity-8 border border-(--color-accent)" aria-hidden="true" />

        <div className="relative z-10">
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-(--color-accent) flex items-center justify-center">
                    <Ticket size={16} className="text-(--color-accent-text)" strokeWidth={2.5} />
                </div>
                <span className="text-xl font-extrabold tracking-tight text-(--color-text-primary)" style={{ fontFamily: "var(--font-display)" }}>
                    Ticketify
                </span>
            </div>
        </div>

        <div className="relative z-10 flex flex-col gap-6">
            <div>
                <p className="eyebrow mb-3">Secure your account</p>
                <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-(--color-text-primary) mb-4" style={{ fontFamily: "var(--font-display)" }}>
                    New password,<br />
                    <span className="text-(--color-accent)">fresh start.</span>
                </h1>
                <p className="text-sm leading-relaxed text-(--color-text-muted) max-w-xs">
                    Choose a strong password to keep your account safe. You'll be back to booking in no time.
                </p>
            </div>

            <div className="flex flex-col gap-3">
                {[
                    { Icon: Film, text: "Thousands of shows daily" },
                    { Icon: Star, text: "Exclusive member perks & discounts" },
                    { Icon: Clock, text: "Instant booking confirmation" },
                ].map(({ Icon, text }) => (
                    <div key={text} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md shrink-0 bg-(--color-accent-dim) border border-(--color-border-accent) flex items-center justify-center">
                            <Icon size={14} className="text-(--color-accent)" />
                        </div>
                        <span className="text-sm text-(--color-text-secondary)">{text}</span>
                    </div>
                ))}
            </div>
        </div>

        <div className="relative z-10">
            <p className="text-xs text-(--color-text-muted)">
                Remember your password?{" "}
                <Link href="/login" className="link-accent font-medium">Back to login</Link>
            </p>
        </div>
    </div>
);

const validateField = (name, value, formData) => {
    switch (name) {
        case "newPassword":
            if (!value) return "Password is required.";
            if (value.length < 8) return "Password must be at least 8 characters.";
            return "";
        case "confirmNewPassword":
            if (!value) return "Please confirm your password.";
            if (value !== formData.newPassword) return "Passwords do not match.";
            return "";
        default:
            return "";
    }
};

const validateAll = (formData) => {
    const errors = {};
    ["newPassword", "confirmNewPassword"].forEach((field) => {
        const msg = validateField(field, formData[field], formData);
        if (msg) errors[field] = msg;
    });
    return errors;
};

const ResetPassword = ({ token }) => {
    const router = useRouter();
    const { verifyPasswordReset, error: serverError, isLoading } = useAuthStore();

    const [formData, setFormData] = useState({ newPassword: "", confirmNewPassword: "" });
    const [fieldErrors, setFieldErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    const handleBlur = (e) => {
        const { name, value } = e.target;
        const msg = validateField(name, value, formData);
        setFieldErrors((prev) => ({ ...prev, [name]: msg }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const dismissFieldError = (index) => {
        const errorKeys = Object.keys(fieldErrors).filter((k) => fieldErrors[k]);
        const keyToDismiss = errorKeys[index];
        if (keyToDismiss) setFieldErrors((prev) => ({ ...prev, [keyToDismiss]: "" }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = validateAll(formData);
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        // confirmNewPassword is client-side only — only send token + newPassword
        const success = await verifyPasswordReset({
            token,
            newPassword: formData.newPassword,
        });

        if (success) router.push("/login");
    };

    const fieldErrorList = Object.values(fieldErrors).filter(Boolean);
    const hasErrors = fieldErrorList.length > 0 || !!serverError;
    const errorPayload = serverError ? [serverError, ...fieldErrorList] : fieldErrorList;

    return (
        <main
            className="min-h-screen grid md:grid-cols-[1fr_1fr] lg:grid-cols-[5fr_7fr] bg-(--color-bg-page)"
            style={{ fontFamily: "var(--font-body)" }}
        >
            <LeftPanel />

            <section className="flex items-center justify-center px-6 py-12 md:py-0">
                <div className="w-full max-w-md flex flex-col gap-8">

                    {/* Mobile-only logo */}
                    <div className="flex md:hidden items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-(--color-accent) flex items-center justify-center">
                            <Ticket size={14} className="text-(--color-accent-text)" strokeWidth={2.5} />
                        </div>
                        <span className="text-lg font-extrabold tracking-tight text-(--color-text-primary)" style={{ fontFamily: "var(--font-display)" }}>
                            Ticketify
                        </span>
                    </div>

                    {/* Heading */}
                    <div className="flex flex-col gap-1.5">
                        <h2 className="text-3xl font-bold text-(--color-text-primary) tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                            Reset your password
                        </h2>
                        <p className="text-sm text-(--color-text-muted)">
                            Remember your password?{" "}
                            <Link href="/login" className="link-accent font-medium">Back to login</Link>
                        </p>
                    </div>

                    {hasErrors && (
                        <ErrorBox
                            error={errorPayload}
                            title="Unable to reset your password"
                            onClose={() => setFieldErrors({})}
                            onCloseItem={serverError ? undefined : dismissFieldError}
                        />
                    )}

                    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                        <FormField
                            label="New Password"
                            name="newPassword"
                            id="newPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="• • • • • •"
                            value={formData.newPassword}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            ActionIcon={showPassword ? EyeOff : Eye}
                            onActionClick={() => setShowPassword((v) => !v)}
                            required
                            error={fieldErrors.newPassword}
                        />

                        <FormField
                            label="Confirm New Password"
                            name="confirmNewPassword"
                            id="confirmNewPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="• • • • • •"
                            value={formData.confirmNewPassword}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            ActionIcon={showPassword ? EyeOff : Eye}
                            onActionClick={() => setShowPassword((v) => !v)}
                            required
                            error={fieldErrors.confirmNewPassword}
                        />

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary btn-lg w-full mt-1"
                        >
                            {isLoading
                                ? <Loader variant="dots" loaderColor="var(--color-text-primary)" inline text="Resetting..." size="sm" />
                                : "Reset Password"
                            }
                        </button>
                    </form>

                </div>
            </section>
        </main>
    );
};

export default ResetPassword;
