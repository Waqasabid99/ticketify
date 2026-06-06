import prisma from "../config/prisma.js";
import { ApiError } from "../utils/error.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ─────────────────────────────────────────────────────────────
// Permission cache (per-process, invalidated after TTL)
// Avoids hitting the DB on every request for static role data.
// ─────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const cache = {
    data: null,       // Map<UserRole, Set<string>>
    expiresAt: 0,
};

async function getRolePermissionsMap() {
    if (cache.data && Date.now() < cache.expiresAt) {
        return cache.data;
    }

    const rows = await prisma.rolePermission.findMany({
        include: { permission: { select: { name: true } } },
    });

    const map = new Map();

    for (const row of rows) {
        if (!map.has(row.role)) map.set(row.role, new Set());
        map.get(row.role).add(row.permission.name);
    }

    cache.data = map;
    cache.expiresAt = Date.now() + CACHE_TTL_MS;

    return map;
}

/** Call this whenever update permissions at runtime (e.g. in a settings endpoint). */
export function invalidatePermissionCache() {
    cache.data = null;
    cache.expiresAt = 0;
}

// ─────────────────────────────────────────────────────────────
// requirePermissions(...perms)
//
// Checks that the authenticated user's role has ALL of the
// listed permissions.
//
// Usage:
//   router.delete("/users/:id", verifyUser, requirePermissions("user:delete"), handler);
//   router.post("/shows",       verifyUser, requirePermissions("show:create", "pricing:create"), handler);
// ─────────────────────────────────────────────────────────────

export const requirePermissions = (...requiredPermissions) =>
    asyncHandler(async (req, _res, next) => {
        const user = req.user;
        if (!user) throw ApiError.unauthorized("Authentication required");

        const roleMap = await getRolePermissionsMap();
        const userPerms = roleMap.get(user?.role?.toUpperCase()) ?? new Set();

        const missing = requiredPermissions.filter((p) => !userPerms.has(p));

        if (missing.length > 0) {
            throw ApiError.forbidden(
                `You don't have permission to perform this action`
            );
        }

        // Attach the full permission set to req for downstream use
        req.permissions = userPerms;

        next();
    });

// ─────────────────────────────────────────────────────────────
// requireAnyPermission(...perms)
//
// Passes if the user has AT LEAST ONE of the listed permissions.
//
// Usage:
//   router.get("/reports", verifyUser, requireAnyPermission("report:revenue", "report:occupancy"), handler);
// ─────────────────────────────────────────────────────────────

export const requireAnyPermission = (...requiredPermissions) =>
    asyncHandler(async (req, _res, next) => {
        const user = req.user;

        if (!user) throw ApiError.unauthorized("Authentication required");

        const roleMap = await getRolePermissionsMap();
        const userPerms = roleMap.get(user.role) ?? new Set();

        const hasAny = requiredPermissions.some((p) => userPerms.has(p));

        if (!hasAny) {
            throw ApiError.forbidden("You don't have permission to perform this action");
        }

        req.permissions = userPerms;

        next();
    });

// ─────────────────────────────────────────────────────────────
// requireRole(...roles)
//
// Coarse-grained role guard — use when don't need granular
// permission checks (e.g. owner-only admin panels).
//
// Usage:
//   router.get("/audit-logs", verifyUser, requireRole("OWNER", "MANAGER"), handler);
// ─────────────────────────────────────────────────────────────

export const requireRole = (...allowedRoles) =>
    asyncHandler(async (req, _res, next) => {
        const user = req.user;

        if (!user) throw ApiError.unauthorized("Authentication required");

        if (!allowedRoles.includes(user.role)) {
            throw ApiError.forbidden("You don't have permission to perform this action");
        }

        next();
    });

// ─────────────────────────────────────────────────────────────
// requireOwnershipOrPermission(permission, getResourceUserId)
//
// Passes if:
//   (a) the user has the given admin permission (e.g. "booking:cancel"), OR
//   (b) the resource belongs to the requesting user
//
// `getResourceUserId` is an async function that receives req and
// returns the userId of the resource owner.
//
// Usage:
//   router.delete(
//     "/bookings/:id",
//     verifyUser,
//     requireOwnershipOrPermission(
//       "booking:cancel",
//       async (req) => {
//         const b = await prisma.booking.findUnique({ where: { id: req.params.id } });
//         return b?.userId;
//       }
//     ),
//     handler
//   );
// ─────────────────────────────────────────────────────────────

export const requireOwnershipOrPermission = (permission, getResourceUserId) =>
    asyncHandler(async (req, _res, next) => {
        const user = req.user;

        if (!user) throw ApiError.unauthorized("Authentication required");

        const roleMap = await getRolePermissionsMap();
        const userPerms = roleMap.get(user.role) ?? new Set();

        // Admin path — has the broad permission
        if (userPerms.has(permission)) {
            req.permissions = userPerms;
            return next();
        }

        // Ownership path — resource belongs to this user
        const resourceUserId = await getResourceUserId(req);

        if (!resourceUserId) throw ApiError.notFound("Resource not found");

        if (resourceUserId !== user.id) {
            throw ApiError.forbidden("You do not have access to this resource");
        }

        req.permissions = userPerms;
        next();
    });

// ─────────────────────────────────────────────────────────────
// hasPermission(req, permission) — inline helper
//
// Used inside route handlers when conditional logic depends on
// what the user can do (e.g. filter results based on role).
//
// Usage:
//   if (hasPermission(req, "booking:list")) {
//     // return all bookings
//   } else {
//     // return only own bookings
//   }
// ─────────────────────────────────────────────────────────────

export function hasPermission(req, permission) {
    return req.permissions?.has(permission) ?? false;
}
