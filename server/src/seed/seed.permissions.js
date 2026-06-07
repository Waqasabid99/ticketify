import prisma from "../config/prisma.js";
import { UserRole } from "../generated/prisma/enums.ts";

// ─────────────────────────────────────────────
// PERMISSION DEFINITIONS
// Naming convention: resource:action
// ─────────────────────────────────────────────

const permissions = [

    // ── USER ──────────────────────────────────
    { name: "user:list", description: "List all users" },
    { name: "user:read", description: "View a user's details" },
    { name: "user:create", description: "Create a new user" },
    { name: "user:update", description: "Update any user's profile" },
    { name: "user:delete", description: "Soft-delete a user" },
    { name: "user:block", description: "Block / unblock a user" },
    { name: "user:change-role", description: "Change a user's role" },
    { name: "user:read-self", description: "Read own profile" },
    { name: "user:update-self", description: "Update own profile" },
    { name: "user:change-status", description: "Change a user's status" },

    // ── AUTH ──────────────────────────────────
    { name: "auth:reset-any-password", description: "Reset another user's password (admin)" },

    // ── CINEMA ────────────────────────────────
    { name: "cinema:list", description: "List all cinemas" },
    { name: "cinema:read", description: "View cinema details" },
    { name: "cinema:create", description: "Create a new cinema" },
    { name: "cinema:update", description: "Update cinema details" },
    { name: "cinema:delete", description: "Soft-delete a cinema" },
    { name: "cinema:toggle-active", description: "Activate or deactivate a cinema" },

    // ── screen ──────────────────────────────────
    { name: "screen:list", description: "List screens in a cinema" },
    { name: "screen:read", description: "View screen details" },
    { name: "screen:create", description: "Create a new screen" },
    { name: "screen:update", description: "Update screen details" },
    { name: "screen:delete", description: "Soft-delete a screen" },
    { name: "screen:toggle-active", description: "Activate or deactivate a screen" },

    // ── SEAT ──────────────────────────────────
    { name: "seat:list", description: "List seats in a screen" },
    { name: "seat:read", description: "View seat details" },
    { name: "seat:create", description: "Add seats to a screen" },
    { name: "seat:update", description: "Update seat details / type" },
    { name: "seat:delete", description: "Remove a seat" },
    { name: "seat:set-maintenance", description: "Mark a seat as under maintenance" },

    // ── MOVIE ──────────────────────────────────
    { name: "movie:list", description: "List all movies" },
    { name: "movie:read", description: "View movie details" },
    { name: "movie:create", description: "Add a new movie" },
    { name: "movie:update", description: "Edit movie details" },
    { name: "movie:delete", description: "Soft-delete a movie" },
    { name: "movie:change-status", description: "Change movie status (COMING_SOON / NOW_SHOWING / ARCHIVED)" },

    // ── GENRE ──────────────────────────────────
    { name: "genre:list", description: "List all genres" },
    { name: "genre:create", description: "Create a genre" },
    { name: "genre:update", description: "Update a genre" },
    { name: "genre:delete", description: "Delete a genre" },

    // ── SHOW ───────────────────────────────────
    { name: "show:list", description: "List all shows" },
    { name: "show:read", description: "View show details and seat map" },
    { name: "show:create", description: "Schedule a new show" },
    { name: "show:update", description: "Update show details" },
    { name: "show:delete", description: "Soft-delete a show" },
    { name: "show:cancel", description: "Cancel a scheduled show" },
    { name: "show:manage-seats", description: "Block / unblock seats in a show" },

    // ── PRICING ────────────────────────────────
    { name: "pricing:list", description: "View pricing rules for a show" },
    { name: "pricing:create", description: "Create a pricing rule" },
    { name: "pricing:update", description: "Update a pricing rule" },
    { name: "pricing:delete", description: "Delete a pricing rule" },

    // ── BOOKING ────────────────────────────────
    { name: "booking:list", description: "List all bookings (any user)" },
    { name: "booking:read", description: "View any booking details" },
    { name: "booking:create", description: "Create a booking" },
    { name: "booking:cancel", description: "Cancel any booking" },
    { name: "booking:cancel-self", description: "Cancel own booking" },
    { name: "booking:confirm", description: "Manually confirm a pending booking" },
    { name: "booking:list-self", description: "List own bookings" },
    { name: "booking:read-self", description: "View own booking details" },

    // ── TICKET ─────────────────────────────────
    { name: "ticket:list", description: "List all tickets" },
    { name: "ticket:read", description: "View any ticket" },
    { name: "ticket:read-self", description: "View own tickets" },
    { name: "ticket:check-in", description: "Mark a ticket as used (scan QR)" },
    { name: "ticket:cancel", description: "Cancel a ticket" },

    // ── PAYMENT ────────────────────────────────
    { name: "payment:list", description: "List all payments" },
    { name: "payment:read", description: "View any payment" },
    { name: "payment:read-self", description: "View own payments" },

    // ── REFUND ─────────────────────────────────
    { name: "refund:list", description: "List all refund requests" },
    { name: "refund:read", description: "View a refund" },
    { name: "refund:request", description: "Request a refund for own booking" },
    { name: "refund:approve", description: "Approve a refund" },
    { name: "refund:reject", description: "Reject a refund" },

    // ── COUPON ─────────────────────────────────
    { name: "coupon:list", description: "List all coupons" },
    { name: "coupon:read", description: "View coupon details" },
    { name: "coupon:create", description: "Create a coupon" },
    { name: "coupon:update", description: "Update a coupon" },
    { name: "coupon:delete", description: "Soft-delete a coupon" },
    { name: "coupon:toggle-active", description: "Activate or deactivate a coupon" },
    { name: "coupon:apply", description: "Apply a coupon code during booking" },

    // ── NOTIFICATION ───────────────────────────
    { name: "notification:list", description: "List all notifications (admin)" },
    { name: "notification:send", description: "Send a manual notification" },
    { name: "notification:read-self", description: "Read own notifications" },

    // ── AUDIT LOG ──────────────────────────────
    { name: "audit:list", description: "View audit logs" },
    { name: "audit:read", description: "View a specific audit log entry" },

    // ── SETTINGS ───────────────────────────────
    { name: "setting:read", description: "View system settings" },
    { name: "setting:update", description: "Update system settings" },

    // ── REPORTS ────────────────────────────────
    { name: "report:revenue", description: "View revenue reports" },
    { name: "report:occupancy", description: "View seat occupancy reports" },
    { name: "report:bookings", description: "View booking summary reports" },
];

// ─────────────────────────────────────────────
// ROLE → PERMISSION MAPPING
// ─────────────────────────────────────────────

const rolePermissionMap = {

    // ── OWNER ──────────────────────────────────
    // Full access to everything
    [UserRole.OWNER]: [
        "user:list", "user:read", "user:create", "user:update", "user:delete",
        "user:block", "user:change-role", "user:read-self", "user:update-self", "user:change-status",

        "auth:reset-any-password",

        "cinema:list", "cinema:read", "cinema:create", "cinema:update",
        "cinema:delete", "cinema:toggle-active",

        "screen:list", "screen:read", "screen:create", "screen:update",
        "screen:delete", "screen:toggle-active",

        "seat:list", "seat:read", "seat:create", "seat:update",
        "seat:delete", "seat:set-maintenance",

        "movie:list", "movie:read", "movie:create", "movie:update",
        "movie:delete", "movie:change-status",

        "genre:list", "genre:create", "genre:update", "genre:delete",

        "show:list", "show:read", "show:create", "show:update",
        "show:delete", "show:cancel", "show:manage-seats",

        "pricing:list", "pricing:create", "pricing:update", "pricing:delete",

        "booking:list", "booking:read", "booking:create", "booking:cancel",
        "booking:cancel-self", "booking:confirm",
        "booking:list-self", "booking:read-self",

        "ticket:list", "ticket:read", "ticket:read-self",
        "ticket:check-in", "ticket:cancel",

        "payment:list", "payment:read", "payment:read-self",

        "refund:list", "refund:read", "refund:request",
        "refund:approve", "refund:reject",

        "coupon:list", "coupon:read", "coupon:create", "coupon:update",
        "coupon:delete", "coupon:toggle-active", "coupon:apply",

        "notification:list", "notification:send", "notification:read-self",

        "audit:list", "audit:read",

        "setting:read", "setting:update",

        "report:revenue", "report:occupancy", "report:bookings",
    ],

    // ── MANAGER ────────────────────────────────
    // Operational control — no destructive deletes, no system settings, no role management
    [UserRole.MANAGER]: [
        "user:list", "user:read", "user:update", "user:block",
        "user:read-self", "user:update-self", "user:change-status", "user:change-role",

        "cinema:list", "cinema:read", "cinema:update", "cinema:toggle-active",

        "screen:list", "screen:read", "screen:create", "screen:update", "screen:toggle-active",

        "seat:list", "seat:read", "seat:create", "seat:update", "seat:set-maintenance",

        "movie:list", "movie:read", "movie:create", "movie:update", "movie:change-status",

        "genre:list", "genre:create", "genre:update",

        "show:list", "show:read", "show:create", "show:update",
        "show:cancel", "show:manage-seats",

        "pricing:list", "pricing:create", "pricing:update", "pricing:delete",

        "booking:list", "booking:read", "booking:cancel", "booking:confirm",
        "booking:list-self", "booking:read-self", "booking:cancel-self",

        "ticket:list", "ticket:read", "ticket:read-self",
        "ticket:check-in", "ticket:cancel",

        "payment:list", "payment:read", "payment:read-self",

        "refund:list", "refund:read", "refund:request",
        "refund:approve", "refund:reject",

        "coupon:list", "coupon:read", "coupon:create", "coupon:update",
        "coupon:toggle-active", "coupon:apply",

        "notification:list", "notification:send", "notification:read-self",

        "audit:list", "audit:read",

        "setting:read",

        "report:revenue", "report:occupancy", "report:bookings",
    ],

    // ── STAFF ──────────────────────────────────
    // Front-desk / ticket scanning — read-heavy, limited writes
    [UserRole.STAFF]: [
        "user:read-self", "user:update-self",

        "cinema:list", "cinema:read",

        "screen:list", "screen:read",

        "seat:list", "seat:read",

        "movie:list", "movie:read",

        "genre:list",

        "show:list", "show:read",

        "pricing:list",

        "booking:list", "booking:read", "booking:confirm",
        "booking:list-self", "booking:read-self", "booking:cancel-self",

        "ticket:list", "ticket:read", "ticket:read-self", "ticket:check-in",

        "payment:read-self",

        "refund:read", "refund:request",

        "coupon:read", "coupon:apply",

        "notification:read-self",
    ],

    // ── CUSTOMER ───────────────────────────────
    // Self-service only — browse, book, manage own data
    [UserRole.CUSTOMER]: [
        "user:read-self", "user:update-self",

        "cinema:list", "cinema:read",

        "screen:list", "screen:read",

        "seat:list", "seat:read",

        "movie:list", "movie:read",

        "genre:list",

        "show:list", "show:read",

        "pricing:list",

        "booking:create", "booking:list-self",
        "booking:read-self", "booking:cancel-self",

        "ticket:read-self",

        "payment:read-self",

        "refund:request",

        "coupon:apply",

        "notification:read-self",
    ],
};

// ─────────────────────────────────────────────
// SEED FUNCTION
// ─────────────────────────────────────────────

async function seedPermissions() {
    console.log("🌱  Starting permission seed...\n");

    // 1. Upsert all permissions
    console.log(`  → Upserting ${permissions.length} permissions...`);

    await Promise.all(
        permissions.map((p) =>
            prisma.permission.upsert({
                where: { name: p.name },
                update: { description: p.description },
                create: { name: p.name, description: p.description },
            })
        )
    );

    console.log("  ✓ Permissions upserted\n");

    // 2. Fetch all permission records so we have their IDs
    const permissionRecords = await prisma.permission.findMany();

    const permissionMap = Object.fromEntries(
        permissionRecords.map((p) => [p.name, p.id])
    );

    // 3. Build RolePermission rows
    const rolePermissionRows = [];

    for (const [role, permNames] of Object.entries(rolePermissionMap)) {
        for (const name of permNames) {
            const permissionId = permissionMap[name];

            if (!permissionId) {
                console.warn(`  ⚠  Unknown permission "${name}" for role ${role} — skipping`);
                continue;
            }

            rolePermissionRows.push({ role, permissionId });
        }
    }

    // 4. Clear existing role-permission mappings and re-seed (idempotent)
    console.log("  → Clearing existing role-permission mappings...");
    await prisma.rolePermission.deleteMany();

    console.log(`  → Inserting ${rolePermissionRows.length} role-permission rows...`);
    await prisma.rolePermission.createMany({ data: rolePermissionRows });

    console.log("  ✓ Role-permission mappings inserted\n");

    // 5. Summary
    const summary = {};
    for (const [role, perms] of Object.entries(rolePermissionMap)) {
        summary[role] = perms.length;
    }

    console.log("📋  Permission counts per role:");
    for (const [role, count] of Object.entries(summary)) {
        console.log(`     ${role.padEnd(10)} → ${count} permissions`);
    }

    console.log("\n✅  Seed complete.");
}

seedPermissions()
    .catch((e) => {
        console.error("❌  Seed failed:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
