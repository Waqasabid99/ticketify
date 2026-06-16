"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import {
    User,
    Phone,
    MapPin,
    Lock,
    Eye,
    EyeOff,
    Loader2,
    Save,
    ShieldCheck,
} from "lucide-react";
import { updateUser } from "@/actions/user.action";
import { useAuthStore } from "@/store/authStore";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

// ─── Shared form primitives ────────────────────────────────────────────────────

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
    ActionIcon,
    onActionClick,
    error,
    hint,
}) => (
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
                aria-describedby={
                    error ? `${id}-error` : hint ? `${id}-hint` : undefined
                }
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

        {hint && !error && (
            <p id={`${id}-hint`} className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {hint}
            </p>
        )}
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

const PhoneField = ({ value, onChange, onBlur, error }) => (
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
                inputProps={{
                    id: "phone",
                    name: "phone",
                    "aria-invalid": !!error,
                    "aria-describedby": error ? "phone-error" : undefined,
                }}
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

// ─── Section card wrapper ──────────────────────────────────────────────────────

const SettingsSection = ({ icon: Icon, title, description, accent = false, children }) => (
    <div
        className="rounded-2xl overflow-hidden"
        style={{
            border: "1px solid var(--color-border-subtle)",
            background: "var(--color-surface)",
        }}
    >
        {/* Section header */}
        <div
            className="flex items-start gap-4 px-6 py-5"
            style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
        >
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                    background: accent
                        ? "var(--color-bg-danger)"
                        : "var(--color-accent-dim)",
                    border: `1px solid ${accent ? "var(--color-danger)" : "var(--color-border-accent)"}`,
                }}
            >
                <Icon
                    size={18}
                    color={accent ? "var(--color-danger)" : "var(--color-accent)"}
                />
            </div>
            <div>
                <h2
                    className="font-semibold"
                    style={{
                        color: "var(--color-text-primary)",
                        fontFamily: "var(--font-display)",
                        fontSize: "var(--text-base)",
                    }}
                >
                    {title}
                </h2>
                <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    {description}
                </p>
            </div>
        </div>

        {/* Section body */}
        <div className="px-6 py-6">{children}</div>
    </div>
);

// ─── Validation ────────────────────────────────────────────────────────────────

const validateProfileField = (name, value) => {
    switch (name) {
        case "firstName":
            if (!value.trim()) return "First name is required.";
            if (value.trim().length < 2) return "Must be at least 2 characters.";
            return "";
        case "phone":
            if (value && value.replace(/\D/g, "").length < 7)
                return "Enter a valid phone number.";
            return "";
        default:
            return "";
    }
};

const validatePasswordField = (name, value, formData) => {
    switch (name) {
        case "currentPassword":
            if (!value) return "Current password is required.";
            return "";
        case "newPassword":
            if (!value) return "New password is required.";
            if (value.length < 8) return "Must be at least 8 characters.";
            if (!/[0-9]/.test(value)) return "Must contain at least one number.";
            return "";
        case "confirmPassword":
            if (!value) return "Please confirm your new password.";
            if (value !== formData.newPassword) return "Passwords do not match.";
            return "";
        default:
            return "";
    }
};

// ─── Profile section ──────────────────────────────────────────────────────────

const ProfileSettings = ({ user }) => {
    const [form, setForm] = useState({
        firstName: user?.firstName ?? "",
        lastName: user?.lastName ?? "",
        phone: user?.phone ?? "",
        address: user?.address ?? "",
    });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handlePhoneChange = (phone) => {
        setForm((prev) => ({ ...prev, phone }));
        if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        const msg = validateProfileField(name, value);
        setErrors((prev) => ({ ...prev, [name]: msg }));
    };

    const handlePhoneBlur = () => {
        const msg = validateProfileField("phone", form.phone);
        setErrors((prev) => ({ ...prev, phone: msg }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        ["firstName", "phone"].forEach((field) => {
            const msg = validateProfileField(field, form[field]);
            if (msg) newErrors[field] = msg;
        });
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setSaving(true);
        try {
            await updateUser(user.id, {
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                phone: form.phone,
                address: form.address.trim(),
            });
            toast.success("Profile updated successfully.");
        } catch (err) {
            toast.error(err?.message ?? "Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <SettingsSection
            icon={User}
            title="Profile information"
            description="Update your name, phone number, and address."
        >
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                {/* Name row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        label="First name"
                        name="firstName"
                        id="firstName"
                        value={form.firstName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Ada"
                        Icon={User}
                        required
                        error={errors.firstName}
                    />
                    <FormField
                        label="Last name"
                        name="lastName"
                        id="lastName"
                        value={form.lastName}
                        onChange={handleChange}
                        placeholder="Lovelace"
                        Icon={User}
                    />
                </div>

                {/* Phone */}
                <PhoneField
                    value={form.phone}
                    onChange={handlePhoneChange}
                    onBlur={handlePhoneBlur}
                    error={errors.phone}
                />

                {/* Address */}
                <FormField
                    label="Address"
                    name="address"
                    id="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="123 Main St, City, Country"
                    Icon={MapPin}
                    hint="Used for billing and delivery preferences."
                />

                {/* Footer action */}
                <div
                    className="flex items-center justify-end pt-2"
                    style={{ borderTop: "1px solid var(--color-border-subtle)" }}
                >
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn btn-primary"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                Saving…
                            </>
                        ) : (
                            <>
                                <Save size={14} />
                                Save changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </SettingsSection>
    );
};

// ─── Password section ─────────────────────────────────────────────────────────

const PasswordSettings = ({ user }) => {
    const { changePassword } = useAuthStore();

    const [form, setForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState({});
    const [show, setShow] = useState({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
    });
    const [saving, setSaving] = useState(false);

    const toggleShow = (field) =>
        setShow((prev) => ({ ...prev, [field]: !prev[field] }));

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        const msg = validatePasswordField(name, value, form);
        setErrors((prev) => ({ ...prev, [name]: msg }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        ["currentPassword", "newPassword", "confirmPassword"].forEach((field) => {
            const msg = validatePasswordField(field, form[field], form);
            if (msg) newErrors[field] = msg;
        });
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setSaving(true);
        try {
            await updateUser(user.id, {
                currentPassword: form.currentPassword,
                password: form.newPassword,
            });
            toast.success("Password changed successfully.");
            setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            toast.error(err?.message ?? "Failed to change password.");
        } finally {
            setSaving(false);
        }
    };

    // Password strength indicator
    const strength = (() => {
        const p = form.newPassword;
        if (!p) return null;
        let score = 0;
        if (p.length >= 8) score++;
        if (p.length >= 12) score++;
        if (/[0-9]/.test(p)) score++;
        if (/[^a-zA-Z0-9]/.test(p)) score++;
        if (score <= 1) return { label: "Weak", color: "var(--color-danger)", width: "25%" };
        if (score === 2) return { label: "Fair", color: "var(--color-warning)", width: "50%" };
        if (score === 3) return { label: "Good", color: "var(--color-info)", width: "75%" };
        return { label: "Strong", color: "var(--color-success)", width: "100%" };
    })();

    return (
        <SettingsSection
            icon={Lock}
            title="Change password"
            description="Use a strong password you don't reuse on other sites."
            accent
        >
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                <FormField
                    label="Current password"
                    name="currentPassword"
                    id="currentPassword"
                    type={show.currentPassword ? "text" : "password"}
                    value={form.currentPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Your current password"
                    ActionIcon={show.currentPassword ? EyeOff : Eye}
                    onActionClick={() => toggleShow("currentPassword")}
                    required
                    error={errors.currentPassword}
                />

                <div className="flex flex-col gap-2">
                    <FormField
                        label="New password"
                        name="newPassword"
                        id="newPassword"
                        type={show.newPassword ? "text" : "password"}
                        value={form.newPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Min. 8 characters with a number"
                        ActionIcon={show.newPassword ? EyeOff : Eye}
                        onActionClick={() => toggleShow("newPassword")}
                        required
                        error={errors.newPassword}
                    />

                    {/* Strength bar */}
                    {strength && (
                        <div className="flex items-center gap-3">
                            <div
                                className="flex-1 rounded-full overflow-hidden"
                                style={{
                                    height: 4,
                                    background: "var(--color-border-subtle)",
                                }}
                            >
                                <div
                                    style={{
                                        height: "100%",
                                        width: strength.width,
                                        background: strength.color,
                                        borderRadius: "9999px",
                                        transition: "width 0.3s ease, background 0.3s ease",
                                    }}
                                />
                            </div>
                            <span
                                className="text-xs font-medium"
                                style={{ color: strength.color, minWidth: 40 }}
                            >
                                {strength.label}
                            </span>
                        </div>
                    )}
                </div>

                <FormField
                    label="Confirm new password"
                    name="confirmPassword"
                    id="confirmPassword"
                    type={show.confirmPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Re-enter your new password"
                    ActionIcon={show.confirmPassword ? EyeOff : Eye}
                    onActionClick={() => toggleShow("confirmPassword")}
                    required
                    error={errors.confirmPassword}
                />

                {/* Footer action */}
                <div
                    className="flex items-center justify-between pt-2"
                    style={{ borderTop: "1px solid var(--color-border-subtle)" }}
                >
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={13} style={{ color: "var(--color-text-muted)" }} />
                        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                            Encrypted end-to-end
                        </span>
                    </div>
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn btn-danger"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                Updating…
                            </>
                        ) : (
                            <>
                                <Lock size={14} />
                                Update password
                            </>
                        )}
                    </button>
                </div>
            </form>
        </SettingsSection>
    );
};

// ─── Avatar / identity banner ─────────────────────────────────────────────────

const ACCENT_CLASSES = [
    "var(--color-accent)",
    "var(--color-info)",
    "var(--color-warning)",
    "var(--color-success)",
];

const avatarColor = (name = "") =>
    ACCENT_CLASSES[name.charCodeAt(0) % ACCENT_CLASSES.length];

const initials = (firstName = "", lastName = "") =>
    `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "?";

const IdentityBanner = ({ user }) => (
    <div
        className="rounded-2xl px-6 py-5 flex items-center gap-5"
        style={{
            border: "1px solid var(--color-border-subtle)",
            background: "var(--color-surface)",
        }}
    >
        {/* Avatar */}
        <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold text-xl"
            style={{
                background: avatarColor(user?.firstName),
                color: "var(--color-accent-text)",
                fontFamily: "var(--font-display)",
            }}
        >
            {initials(user?.firstName, user?.lastName)}
        </div>

        <div className="flex-1 min-w-0">
            <p
                className="font-bold truncate"
                style={{
                    color: "var(--color-text-primary)",
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--text-lg)",
                }}
            >
                {user?.firstName} {user?.lastName}
            </p>
            <p className="text-sm truncate" style={{ color: "var(--color-text-muted)" }}>
                {user?.email}
            </p>
        </div>

        <span
            className="badge badge-success hidden sm:inline-flex"
            style={{ flexShrink: 0 }}
        >
            {user?.role?.charAt(0) + user?.role?.slice(1).toLowerCase() ?? "Member"}
        </span>
    </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────
const Settings = () => {
    const { user } = useAuthStore();
    return (
        <div
            className="min-h-screen"
            style={{ background: "var(--color-bg-page)", fontFamily: "var(--font-body)" }}
        >
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-6">

                {/* Page title */}
                <div>
                    <p className="eyebrow mb-1">Account</p>
                    <h1
                        className="text-3xl font-bold tracking-tight"
                        style={{
                            color: "var(--color-text-primary)",
                            fontFamily: "var(--font-display)",
                        }}
                    >
                        Settings
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
                        Manage your personal details and security preferences.
                    </p>
                </div>

                {/* Identity banner */}
                <IdentityBanner user={user} />

                {/* Profile */}
                <ProfileSettings user={user} />

                {/* Password */}
                <PasswordSettings user={user} />
            </div>
        </div>
    )
};

export default Settings;