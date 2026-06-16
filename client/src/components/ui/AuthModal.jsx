"use client";
import { useState } from "react";
import { X, Mail, User, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { ErrorBox } from "@/components/ui/ErrorBox";
import Loader from "@/components/ui/Loader";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

/* ─────────────────────────────────────────────
   Shared primitives
───────────────────────────────────────────── */

const ModalShell = ({ onClose, children }) => (
    <div
        className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
    >
        <div className="w-full max-w-md bg-(--color-bg-surface) border border-(--color-border-default) rounded-xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 text-(--color-text-muted) hover:text-(--color-text-primary) p-1 rounded-lg hover:bg-(--color-surface-hover) transition-all z-10"
            >
                <X className="w-4 h-4" />
            </button>
            {children}
        </div>
    </div>
);

const FormField = ({
    label, name, id, value, onChange, onBlur,
    placeholder, type = "text", required, maxLength,
    Icon, ActionIcon, onActionClick, error,
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
                onChange={onChange} onBlur={onBlur}
                placeholder={placeholder} required={required} maxLength={maxLength}
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

const PhoneField = ({ value, onChange, onBlur, error }) => (
    <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className="label">Phone number</label>
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
                    width: 100% !important; height: auto !important;
                    background-color: var(--color-surface) !important;
                    border: 1.5px solid var(--color-border-default) !important;
                    border-radius: 0 var(--radius-md) var(--radius-md) 0 !important;
                    color: var(--color-text-primary) !important;
                    font-family: var(--font-body) !important;
                    font-size: var(--text-base) !important;
                    padding: 0.625rem 0.875rem 0.625rem 3rem !important;
                    transition: border-color var(--transition-fast), box-shadow var(--transition-fast) !important;
                }
                .ticketify-phone .react-tel-input .form-control::placeholder { color: var(--color-text-muted) !important; }
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
                .ticketify-phone--error .react-tel-input .form-control { border-color: var(--color-danger) !important; }
                .ticketify-phone--error .react-tel-input .form-control:focus {
                    border-color: var(--color-danger) !important;
                    box-shadow: 0 0 0 3px rgba(242, 92, 92, 0.2) !important;
                }
                .ticketify-phone--error .react-tel-input .flag-dropdown { border-color: var(--color-danger) !important; }
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
                .ticketify-phone .react-tel-input .country-list .country.highlight { background-color: var(--color-surface-hover) !important; }
                .ticketify-phone .react-tel-input .country-list .country-name { color: var(--color-text-secondary) !important; }
                .ticketify-phone .react-tel-input .country-list .dial-code { color: var(--color-text-muted) !important; }
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
                country="pk" enableSearch searchPlaceholder="Search country..."
                value={value} onChange={onChange} onBlur={onBlur} placeholder="300 0000000"
            />
        </div>
        {error && (
            <p id="phone-error" className="field-error-msg flex items-center gap-1" role="alert">
                {error}
            </p>
        )}
    </div>
);

/* ─────────────────────────────────────────────
   Validation helpers
───────────────────────────────────────────── */

const validateLoginField = (name, value) => {
    if (name === "email") {
        if (!value.trim()) return "Email is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address.";
    }
    if (name === "password") {
        if (!value) return "Password is required.";
    }
    return "";
};

const validateRegisterField = (name, value, formData) => {
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

/* ─────────────────────────────────────────────
   LoginModal
───────────────────────────────────────────── */

export const LoginModal = ({ onClose, onSuccess, onSwitchToRegister, hint }) => {
    const { login, error: serverError, isLoading } = useAuthStore();

    const [formData, setFormData] = useState({ email: "", password: "" });
    const [fieldErrors, setFieldErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    const handleBlur = (e) => {
        const { name, value } = e.target;
        const msg = validateLoginField(name, value);
        setFieldErrors((prev) => ({ ...prev, [name]: msg }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const dismissFieldError = (index) => {
        const keys = Object.keys(fieldErrors).filter((k) => fieldErrors[k]);
        const key = keys[index];
        if (key) setFieldErrors((prev) => ({ ...prev, [key]: "" }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = {};
        ["email", "password"].forEach((f) => {
            const msg = validateLoginField(f, formData[f]);
            if (msg) errors[f] = msg;
        });
        if (Object.keys(errors).length) { setFieldErrors(errors); return; }

        const res = await login({ email: formData.email, password: formData.password });
        if (res) onSuccess?.();
    };

    const fieldErrorList = Object.values(fieldErrors).filter(Boolean);
    const hasErrors = fieldErrorList.length > 0 || !!serverError;
    const errorPayload = serverError ? [serverError, ...fieldErrorList] : fieldErrorList;

    return (
        <ModalShell onClose={onClose}>
            <div className="p-6 flex flex-col gap-5">
                {/* Header */}
                <div className="flex flex-col gap-1 pr-6">
                    <h3
                        className="text-xl font-bold text-(--color-text-primary) tracking-tight"
                        style={{ fontFamily: "var(--font-display)" }}
                    >
                        Sign in to continue
                    </h3>
                    {hint ? (
                        <p className="text-sm text-(--color-text-muted)">{hint}</p>
                    ) : (
                        <p className="text-sm text-(--color-text-muted)">
                            Enter your details to proceed with checkout.
                        </p>
                    )}
                </div>

                {/* Error box */}
                {hasErrors && (
                    <ErrorBox
                        error={errorPayload}
                        title="Unable to sign in"
                        onClose={() => setFieldErrors({})}
                        onCloseItem={serverError ? undefined : dismissFieldError}
                    />
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                    <FormField
                        label="Email" name="email" id="modal-email" type="email"
                        value={formData.email} onChange={handleChange} onBlur={handleBlur}
                        placeholder="ada@example.com" Icon={Mail} required error={fieldErrors.email}
                    />
                    <FormField
                        label="Password" name="password" id="modal-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="• • • • • •"
                        value={formData.password} onChange={handleChange} onBlur={handleBlur}
                        ActionIcon={showPassword ? EyeOff : Eye}
                        onActionClick={() => setShowPassword((v) => !v)}
                        required error={fieldErrors.password}
                    />

                    <button type="submit" disabled={isLoading} className="btn btn-primary btn-lg w-full mt-1">
                        {isLoading
                            ? <Loader variant="dots" loaderColor="var(--color-text-primary)" inline text="Signing in..." size="sm" />
                            : "Sign in"
                        }
                    </button>
                </form>

                {/* Footer */}
                <p className="text-xs text-(--color-text-muted) text-center">
                    Don't have an account?{" "}
                    <button
                        type="button"
                        onClick={onSwitchToRegister}
                        className="link-accent font-medium cursor-pointer"
                    >
                        Create one
                    </button>
                </p>
            </div>
        </ModalShell>
    );
};

/* ─────────────────────────────────────────────
   RegisterModal
───────────────────────────────────────────── */

export const RegisterModal = ({ onClose, onSuccess, onSwitchToLogin }) => {
    const { register, error: serverError, isLoading } = useAuthStore();

    const [formData, setFormData] = useState({
        firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "",
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleBlur = (e) => {
        const { name, value } = e.target;
        const msg = validateRegisterField(name, value, formData);
        setFieldErrors((prev) => ({ ...prev, [name]: msg }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handlePhoneChange = (phone) => {
        setFormData((prev) => ({ ...prev, phone }));
        if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: "" }));
    };

    const handlePhoneBlur = () => {
        const msg = validateRegisterField("phone", formData.phone, formData);
        setFieldErrors((prev) => ({ ...prev, phone: msg }));
    };

    const dismissFieldError = (index) => {
        const keys = Object.keys(fieldErrors).filter((k) => fieldErrors[k]);
        const key = keys[index];
        if (key) setFieldErrors((prev) => ({ ...prev, [key]: "" }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fields = ["firstName", "email", "phone", "password", "confirmPassword"];
        const errors = {};
        fields.forEach((f) => {
            const msg = validateRegisterField(f, formData[f], formData);
            if (msg) errors[f] = msg;
        });
        if (Object.keys(errors).length) { setFieldErrors(errors); return; }

        const res = await register({
            firstName: formData.firstName, lastName: formData.lastName,
            email: formData.email, phone: formData.phone, password: formData.password,
        })

        console.log("Registration result: ", res);

        if (res) {
            onSwitchToLogin?.();
        }
    };

    const fieldErrorList = Object.values(fieldErrors).filter(Boolean);
    const hasErrors = fieldErrorList.length > 0 || !!serverError;
    const errorPayload = serverError ? [serverError, ...fieldErrorList] : fieldErrorList;

    return (
        <ModalShell onClose={onClose}>
            {/* Scrollable inner so tall forms don't clip on small screens */}
            <div className="p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex flex-col gap-1 pr-6">
                    <h3
                        className="text-xl font-bold text-(--color-text-primary) tracking-tight"
                        style={{ fontFamily: "var(--font-display)" }}
                    >
                        Create an account
                    </h3>
                    <p className="text-sm text-(--color-text-muted)">
                        Quick setup — then straight back to checkout.
                    </p>
                </div>

                {/* Error box */}
                {hasErrors && (
                    <ErrorBox
                        error={errorPayload}
                        title="Unable to create account"
                        onClose={() => setFieldErrors({})}
                        onCloseItem={serverError ? undefined : dismissFieldError}
                    />
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3">
                        <FormField
                            label="First name" name="firstName" id="modal-firstName"
                            value={formData.firstName} onChange={handleChange} onBlur={handleBlur}
                            placeholder="Ada" Icon={User} required error={fieldErrors.firstName}
                        />
                        <FormField
                            label="Last name" name="lastName" id="modal-lastName"
                            value={formData.lastName} onChange={handleChange}
                            placeholder="Lovelace" Icon={User}
                        />
                    </div>

                    <FormField
                        label="Email" name="email" id="modal-reg-email" type="email"
                        value={formData.email} onChange={handleChange} onBlur={handleBlur}
                        placeholder="ada@example.com" Icon={Mail} required error={fieldErrors.email}
                    />

                    <PhoneField
                        value={formData.phone} onChange={handlePhoneChange}
                        onBlur={handlePhoneBlur} error={fieldErrors.phone}
                    />

                    <FormField
                        label="Password" name="password" id="modal-reg-password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password} onChange={handleChange} onBlur={handleBlur}
                        placeholder="Min. 8 characters with a number"
                        ActionIcon={showPassword ? EyeOff : Eye}
                        onActionClick={() => setShowPassword((v) => !v)}
                        required error={fieldErrors.password}
                    />

                    <FormField
                        label="Confirm password" name="confirmPassword" id="modal-confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur}
                        placeholder="Re-enter your password"
                        ActionIcon={showConfirmPassword ? EyeOff : Eye}
                        onActionClick={() => setShowConfirmPassword((v) => !v)}
                        required error={fieldErrors.confirmPassword}
                    />

                    <button type="submit" disabled={isLoading} className="btn btn-primary btn-lg w-full mt-1">
                        {isLoading
                            ? <Loader variant="dots" loaderColor="var(--color-text-primary)" inline text="Creating account..." size="sm" />
                            : "Create account"
                        }
                    </button>
                </form>

                {/* Footer */}
                <p className="text-xs text-(--color-text-muted) text-center">
                    Already have an account?{" "}
                    <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="link-accent font-medium cursor-pointer"
                    >
                        Sign in
                    </button>
                </p>

                <p className="text-xs text-(--color-text-muted) text-center -mt-2">
                    By continuing you agree to our{" "}
                    <a href="/terms" className="link-muted underline underline-offset-2">Terms</a>
                    {" "}and{" "}
                    <a href="/privacy" className="link-muted underline underline-offset-2">Privacy Policy</a>.
                </p>
            </div>
        </ModalShell>
    );
};

const HINT_MAP = {
    "unauthenticated": "Sign in to your account to complete your purchase.",
    "not-found": "We couldn't find an account with that email. Create one to continue.",
};

const INITIAL_VIEW_MAP = {
    "unauthenticated": "login",
    "not-found": "register",
};

export const AuthModalManager = ({ trigger, onSuccess, onClose }) => {
    const [view, setView] = useState(
        trigger ? (INITIAL_VIEW_MAP[trigger] ?? "login") : "login"
    );

    if (!trigger) return null;

    const hint = HINT_MAP[trigger];
    const [loginHint, setLoginHint] = useState(null);


    if (view === "login") {
        return (
            <LoginModal
                onClose={onClose}
                onSuccess={onSuccess}
                onSwitchToRegister={() => setView("register")}
                hint={hint}
            />
        );
    }

    return (
        <RegisterModal
            onClose={onClose}
            onSuccess={onSuccess}
            onSwitchToLogin={() => {
                setLoginHint(
                    "Account created successfully. Please sign in."
                );
                setView("login");
            }}
        />
    );
};
