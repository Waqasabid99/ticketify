"use client";

import React, { useState } from "react";
import DashboardBox from "@/components/ui/DashboardBox";
import Table from "@/components/ui/Table";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { createTheater, deleteTheater, updateTheater } from "@/actions/theater.action";
import { DeleteModal, EditModal, AddModal, FormField, inputClass } from "@/components/ui/Modals";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Country, State, City } from "country-state-city";

const emptyForm = {
    name: "",
    address: "",
    city: "",
    country: "",
    phone: "",
    email: "",
};

// ─── Location Selects ────────────────────────────────────────────────────────

const LocationFields = ({ form, setForm }) => {
    const countries = Country.getAllCountries();
    const states = form.country ? State.getStatesOfCountry(form.country) : [];
    const cities = form.country && form.state
        ? City.getCitiesOfState(form.country, form.state)
        : [];

    const handleCountryChange = (e) => {
        setForm((p) => ({ ...p, country: e.target.value, state: "", city: "" }));
    };

    const handleStateChange = (e) => {
        setForm((p) => ({ ...p, state: e.target.value, city: "" }));
    };

    const handleCityChange = (e) => {
        setForm((p) => ({ ...p, city: e.target.value }));
    };

    return (
        <>
            {/* Country */}
            <FormField label="Country">
                <select
                    className={inputClass}
                    value={form.country}
                    onChange={handleCountryChange}
                >
                    <option value="">Select country...</option>
                    {countries.map((c) => (
                        <option key={c.isoCode} value={c.isoCode}>
                            {c.flag} {c.name}
                        </option>
                    ))}
                </select>
            </FormField>

            {/* State + City side by side */}
            <div className="grid grid-cols-2 gap-3">
                <FormField label="State / Province">
                    <select
                        className={inputClass}
                        value={form.state ?? ""}
                        onChange={handleStateChange}
                        disabled={!form.country}
                    >
                        <option value="">
                            {form.country ? "Select state..." : "Select country first"}
                        </option>
                        {states.map((s) => (
                            <option key={s.isoCode} value={s.isoCode}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                </FormField>

                <FormField label="City">
                    <select
                        className={inputClass}
                        value={form.city}
                        onChange={handleCityChange}
                        disabled={!form.state}
                    >
                        <option value="">
                            {form.state ? "Select city..." : "Select state first"}
                        </option>
                        {cities.map((c) => (
                            <option key={c.name} value={c.name}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </FormField>
            </div>
        </>
    );
};

// ─── Phone Field ──────────────────────────────────────────────────────────────

const PhoneField = ({ value, onChange }) => (
    <FormField label="Phone">
        <PhoneInput
            country="pk"
            value={value}
            onChange={onChange}
            inputClass="!w-full"
            containerClass="phone-input-container"
            inputStyle={{
                width: "100%",
                background: "var(--color-surface-raised)",
                border: "1px solid var(--color-surface-raised)",
                borderRadius: "var(--radius-md)",
                color: "var(--color-text-primary)",
                fontSize: "0.875rem",
                height: "2.5rem",
                paddingLeft: "3rem",
            }}
            buttonStyle={{
                background: "var(--color-surface-raised)",
                border: "1px solid var(--color-surface-raised)",
                borderRight: "1px solid var(--color-surface-raised)",
                borderRadius: "var(--radius-md) 0 0 var(--radius-md)",
            }}
            dropdownStyle={{
                background: "var(--color-surface-raised)",
                border: "1px solid var(--color-surface-raised)",
                color: "var(--color-text-primary)",
                borderRadius: "var(--radius-md)",
            }}
            searchStyle={{
                background: "var(--color-surface-hover)",
                border: "1px solid var(--color-surface-raised)",
                color: "var(--color-text-primary)",
                borderRadius: "var(--radius-sm)",
                width: "100%",
            }}
            enableSearch
            disableSearchIcon
        />
    </FormField>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const emptyFormWithState = {
    ...emptyForm,
    state: "",
};

const Theaters = ({ theaters = [], pagination = {} }) => {
    console.log(pagination)
    const [activeEditTheater, setActiveEditTheater] = useState(null);
    const [activeDeleteTheater, setActiveDeleteTheater] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState(emptyFormWithState);
    const [editForm, setEditForm] = useState(emptyFormWithState);
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const columns = [
        {
            key: "name",
            label: "Name",
            sortable: true,
            render: (val) => (
                <span className="font-semibold text-(--color-text-primary)">{val}</span>
            ),
        },
        {
            key: "slug",
            label: "Slug",
            sortable: true,
            render: (val) => (
                <code className="text-xs bg-(--color-purple-dim) text-(--color-info) px-2 py-0.5 rounded font-mono tracking-wide">
                    {val}
                </code>
            ),
        },
        {
            key: "address",
            label: "Address",
            render: (val, row) => (
                <span className="text-(--color-text-secondary) line-clamp-1 max-w-xs">
                    {[val, row.city, row.country].filter(Boolean).join(", ") || (
                        <span className="text-(--color-text-muted) italic">No address</span>
                    )}
                </span>
            ),
        },
        {
            key: "phone",
            label: "Contact",
            render: (val, row) => (
                <div className="flex flex-col gap-0.5 text-xs text-(--color-text-secondary)">
                    {val ? <span>{val}</span> : null}
                    {row.email ? <span>{row.email}</span> : null}
                    {!val && !row.email && (
                        <span className="text-(--color-text-muted) italic">No contact</span>
                    )}
                </div>
            ),
        },
        {
            key: "isActive",
            label: "Status",
            render: (val) => (
                <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${val
                        ? "bg-(--color-success-dim) text-(--color-success)"
                        : "bg-(--color-error-dim) text-(--color-error)"
                        }`}
                >
                    {val ? "Active" : "Inactive"}
                </span>
            ),
        },
        {
            key: "createdAt",
            label: "Created At",
            sortable: true,
            render: (val) => {
                if (!val) return "-";
                return (
                    <span className="text-xs text-(--color-text-muted)">
                        {new Date(val).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                        })}
                    </span>
                );
            },
        },
    ];

    const handleOpenEdit = (item) => {
        // Derive isoCode from stored country name for the selects to work
        const matchedCountry = Country.getAllCountries().find(
            (c) => c.name === item.country || c.isoCode === item.country
        );
        const countryCode = matchedCountry?.isoCode ?? "";

        const matchedState = countryCode
            ? State.getStatesOfCountry(countryCode).find(
                (s) => s.name === item.city || s.isoCode === item.state
            )
            : null;
        const stateCode = matchedState?.isoCode ?? "";

        setEditForm({
            name: item.name ?? "",
            address: item.address ?? "",
            city: item.city ?? "",
            state: stateCode,
            country: countryCode,
            phone: item.phone ?? "",
            email: item.email ?? "",
        });
        setActiveEditTheater(item);
    };

    const buildPayload = (form) => ({
        name: form.name,
        address: form.address,
        city: form.city,
        // Send the human-readable country name to the backend, not ISO code
        country: Country.getCountryByCode(form.country)?.name ?? form.country,
        phone: form.phone,
        email: form.email,
    });

    const handleAddTheater = async () => {
        setIsAdding(true);
        try {
            const data = await createTheater(buildPayload(addForm));
            router.refresh();
            toast.success(data.message);
            setAddForm(emptyFormWithState);
            setShowAddModal(false);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsAdding(false);
        }
    };

    const handleSaveEdit = async () => {
        setIsEditing(true);
        try {
            const data = await updateTheater(activeEditTheater.id, buildPayload(editForm));
            router.refresh();
            toast.success(data.message);
            setActiveEditTheater(null);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsEditing(false);
        }
    };

    const handleDeleteTheater = async (id) => {
        setIsDeleting(true);
        try {
            const data = await deleteTheater(id);
            router.refresh();
            toast.success(data.message);
            setActiveDeleteTheater(null);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const handlePageChange = (page) => {
        router.push(`?page=${page}`);
    };

    const theaterFormFields = (form, setForm) => (
        <>
            <FormField label="Name">
                <input
                    className={inputClass}
                    placeholder="e.g. Cineplex Downtown"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
            </FormField>

            <FormField label="Address">
                <input
                    className={inputClass}
                    placeholder="e.g. 123 Main Street"
                    value={form.address}
                    onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                />
            </FormField>

            <LocationFields form={form} setForm={setForm} />

            <PhoneField
                value={form.phone}
                onChange={(phone) => setForm((p) => ({ ...p, phone }))}
            />

            <FormField label="Email">
                <input
                    className={inputClass}
                    type="email"
                    placeholder="e.g. info@cinema.com"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
            </FormField>
        </>
    );

    return (
        <div className="w-full space-y-6">
            <DashboardBox
                text="Theaters"
                subHeading="Manage theaters and auditoriums"
                button={
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-md"
                        >
                            <Plus className="w-4 h-4" /> Add Theater
                        </button>
                        <button
                            onClick={() => router.refresh()}
                            className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-md"
                        >
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </button>
                    </div>
                }
            />

            <Table
                columns={columns}
                data={theaters}
                pagination={pagination}
                onPageChange={handlePageChange}
                emptyMessage="No theaters found."
                searchPlaceholder="Search theaters by name, slug or phone..."
                onEdit={handleOpenEdit}
                onDelete={(item) => setActiveDeleteTheater(item)}
            />

            {showAddModal && (
                <AddModal
                    title="Theater"
                    onClose={() => { setShowAddModal(false); setAddForm(emptyFormWithState); }}
                    onSave={handleAddTheater}
                    isAdding={isAdding}
                >
                    {theaterFormFields(addForm, setAddForm)}
                </AddModal>
            )}

            {activeEditTheater && (
                <EditModal
                    title="Theater"
                    onClose={() => setActiveEditTheater(null)}
                    onSave={handleSaveEdit}
                    isEditing={isEditing}
                >
                    {theaterFormFields(editForm, setEditForm)}
                </EditModal>
            )}

            {activeDeleteTheater && (
                <DeleteModal
                    title="Theater"
                    item={activeDeleteTheater}
                    onClose={() => setActiveDeleteTheater(null)}
                    onConfirm={() => handleDeleteTheater(activeDeleteTheater.id)}
                    isDeleting={isDeleting}
                />
            )}
        </div>
    );
};

export default Theaters;
