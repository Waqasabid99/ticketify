import currency from "currency.js";
import prisma from "../config/prisma.js";
import { ApiError } from "../utils/error.js";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const PRIMARY_URL = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json";
const FALLBACK_URL = "https://latest.currency-api.pages.dev/v1/currencies/usd.json";

let memoryCache = { rate: null, fetchedAt: 0 };

async function fetchFromUrl(url) {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`Exchange rate API responded ${res.status}`);
    const data = await res.json();
    const rate = Number(data?.usd?.pkr);
    if (!rate || isNaN(rate)) throw new Error("Malformed exchange rate response");
    return rate;
}

async function fetchLiveRate() {
    try {
        return await fetchFromUrl(PRIMARY_URL);
    } catch {
        return await fetchFromUrl(FALLBACK_URL);
    }
}

// Returns: 1 USD = X PKR
export async function getUsdToPkrRate() {
    const now = Date.now();

    if (memoryCache.rate && now - memoryCache.fetchedAt < CACHE_TTL_MS) {
        return memoryCache.rate;
    }

    try {
        const liveRate = await fetchLiveRate();
        memoryCache = { rate: liveRate, fetchedAt: now };

        await prisma.exchangeRate.create({
            data: { base: "USD", target: "PKR", rate: liveRate },
        });

        return liveRate;
    } catch (err) {
        const lastKnown = await prisma.exchangeRate.findFirst({
            where: { base: "USD", target: "PKR" },
            orderBy: { fetchedAt: "desc" },
        });

        if (!lastKnown) {
            throw ApiError.badRequest("Unable to retrieve exchange rate, please try again");
        }

        memoryCache = { rate: Number(lastKnown.rate), fetchedAt: now };
        return Number(lastKnown.rate);
    }
}

export function pkrToUsd(pkrAmount, rate) {
    const highPrecisionUsd = currency(pkrAmount, { precision: 6 }).divide(rate).value;
    return currency(highPrecisionUsd, { precision: 2 }).value;
}
