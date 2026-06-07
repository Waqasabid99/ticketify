import { ApiError } from "./error.js";

/**
 * Generates Excel-style row labels for a given count.
 * 1  → A
 * 26 → Z
 * 27 → AA
 * 28 → AB ... 702 → ZZ
 */
export function generateRowLabels(count) {
    const labels = [];
    for (let i = 1; i <= count; i++) {
        labels.push(toExcelLabel(i));
    }
    return labels;
}

function toExcelLabel(n) {
    let label = "";
    while (n > 0) {
        n--;                             // make it 0-indexed
        label = String.fromCharCode(65 + (n % 26)) + label;
        n = Math.floor(n / 26);
    }
    return label;
}

/**
 * Normalizes the `rows` input from the request body into an array of
 * uppercase row labels, applying all validations.
 *
 * Accepts:
 *   - number / numeric string  → auto-generate Excel-style labels
 *   - string[]                 → validate and normalize each label
 *
 * Throws descriptive ApiError on any invalid input.
 */
export function normalizeRowLabels(rows) {
    // ── Case 1: numeric → auto-generate ──────────────────────────────
    if (typeof rows === "number" || (typeof rows === "string" && !isNaN(rows) && rows.trim() !== "")) {
        const count = Number(rows);

        if (!Number.isInteger(count) || count <= 0) {
            throw ApiError.badRequest("rows must be a positive integer when passed as a number");
        }
        if (count > 702) {
            throw ApiError.badRequest("rows cannot exceed 702 (ZZ)");
        }

        return generateRowLabels(count);
    }

    // ── Case 2: array of custom labels ───────────────────────────────
    if (Array.isArray(rows)) {
        if (rows.length === 0) {
            throw ApiError.badRequest("rows array cannot be empty");
        }
        if (rows.length > 702) {
            throw ApiError.badRequest("rows cannot exceed 702 labels");
        }

        const normalized = rows.map((label, idx) => {
            // Must be a string
            if (typeof label !== "string") {
                throw ApiError.badRequest(`Row at index ${idx} must be a string`);
            }

            const trimmed = label.trim().toUpperCase();

            // No empty strings after trim
            if (trimmed.length === 0) {
                throw ApiError.badRequest(`Row at index ${idx} is an empty string`);
            }

            // Only A-Z characters (pure alphabetic labels)
            if (!/^[A-Z]+$/.test(trimmed)) {
                throw ApiError.badRequest(
                    `Row label "${label}" at index ${idx} is invalid — only alphabetic characters are allowed`
                );
            }

            return trimmed;
        });

        // Duplicate check
        const seen = new Set();
        for (const label of normalized) {
            if (seen.has(label)) {
                throw ApiError.badRequest(`Duplicate row label "${label}" found in rows array`);
            }
            seen.add(label);
        }

        return normalized;
    }

    throw ApiError.badRequest("rows must be a positive integer or an array of row label strings");
}

/**
 * Builds the seat data array for prisma.seat.createMany().
 * Produces: A1, A2...AN, B1...BN
 */
export function buildSeatData(screenId, rowLabels, seatsPerRow, seatType) {
    return rowLabels.flatMap((rowLabel) =>
        Array.from({ length: seatsPerRow }, (_, i) => ({
            screenId,
            rowLabel,
            seatNumber: i + 1,
            seatType,
        }))
    );
}
