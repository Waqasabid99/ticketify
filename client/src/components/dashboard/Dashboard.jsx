"use client";

import React, { useEffect, useState } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend,
    LineChart,
    Line,
} from "recharts";
import {
    TrendingUp,
    Ticket,
    Users,
    Film,
    DollarSign,
    BarChart2,
    Percent,
    Clock,
    ShoppingBag,
    Star,
    Activity,
    RefreshCw,
    AlertCircle,
    Loader2,
    MonitorPlay,
    CalendarCheck,
} from "lucide-react";

// ─── Mock getAnalyticsData (replace with your server action import) ────────────────
// import { getAnalyticsData } from "@/actions/analytics.action";

// ─── Color Palette (using CSS vars from Void & Volt design system) ─────────────
const CHART_COLORS = ["#FEE505", "#7C3AED", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = {
    currency: (n) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        }).format(n ?? 0),
    number: (n) => new Intl.NumberFormat("en-US").format(n ?? 0),
    percent: (n) => `${Number(n ?? 0).toFixed(1)}%`,
};

// ─── Sub-components ────────────────────────────────────────────────────────────

/** KPI Card */
const KpiCard = ({ icon: Icon, label, value, sub, accent }) => (
    <div className="card rounded-xl p-5 flex flex-col gap-3 border border-(--color-border) hover:border-(--color-border-strong) transition-colors">
        <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-(--color-text-muted)">
                {label}
            </span>
            <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                    background: accent ? "rgba(254,229,5,0.12)" : "var(--color-purple-dim)",
                }}
            >
                <Icon
                    className="w-4 h-4"
                    style={{ color: accent ? "var(--color-accent)" : "var(--color-info)" }}
                />
            </div>
        </div>
        <div>
            <p className="text-2xl font-bold font-display text-(--color-text-primary) leading-none tracking-tight">
                {value}
            </p>
            {sub && (
                <p className="text-xs text-(--color-text-muted) mt-1">{sub}</p>
            )}
        </div>
    </div>
);

/** Section header */
const SectionTitle = ({ children }) => (
    <h2 className="text-sm font-semibold uppercase tracking-widest text-(--color-text-muted) mb-3">
        {children}
    </h2>
);

/** Chart Card wrapper */
const ChartCard = ({ title, sub, children, className = "" }) => (
    <div className={`card rounded-xl p-5 border border-(--color-border) ${className}`}>
        <div className="mb-4">
            <p className="font-semibold text-(--color-text-primary) text-sm">{title}</p>
            {sub && <p className="text-xs text-(--color-text-muted) mt-0.5">{sub}</p>}
        </div>
        {children}
    </div>
);

/** Custom Tooltip */
const CustomTooltip = ({ active, payload, label, prefix = "", suffix = "" }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border border-(--color-border) bg-(--color-bg-card) shadow-xl px-3 py-2 text-xs">
            <p className="font-semibold text-(--color-text-secondary) mb-1">{label}</p>
            {payload.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-(--color-text-muted)">{p.name}:</span>
                    <span className="font-semibold text-(--color-text-primary)">
                        {prefix}{typeof p.value === "number" ? p.value.toLocaleString() : p.value}{suffix}
                    </span>
                </div>
            ))}
        </div>
    );
};

// ─── OWNER / MANAGER DASHBOARD ─────────────────────────────────────────────────

const OwnerDashboard = ({ data }) => {
    const { kpis, charts } = data;

    return (
        <div className="space-y-8">
            {/* KPIs */}
            <section>
                <SectionTitle>Overview</SectionTitle>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    <KpiCard icon={DollarSign} label="Revenue" value={fmt.currency(kpis.totalRevenue)} accent />
                    <KpiCard icon={Ticket} label="Bookings" value={fmt.number(kpis.totalBookings)} />
                    <KpiCard icon={ShoppingBag} label="Tickets Sold" value={fmt.number(kpis.ticketsSold)} />
                    <KpiCard icon={Percent} label="Occupancy" value={fmt.percent(kpis.occupancyRate)} />
                    <KpiCard icon={Film} label="Now Showing" value={fmt.number(kpis.activeMovies)} />
                    <KpiCard icon={Users} label="Customers" value={fmt.number(kpis.totalCustomers)} />
                </div>
            </section>

            {/* Revenue & Bookings Trends */}
            <section>
                <SectionTitle>Revenue & Booking Trends</SectionTitle>
                <ChartCard title="Daily Revenue & Bookings" sub="Based on confirmed bookings in the selected period">
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={charts.revenueTrends} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#FEE505" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#FEE505" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradBookings" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v) => {
                                    const d = new Date(v);
                                    return `${d.getMonth() + 1}/${d.getDate()}`;
                                }}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                yAxisId="revenue"
                                orientation="left"
                                tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                                width={48}
                            />
                            <YAxis
                                yAxisId="bookings"
                                orientation="right"
                                tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                                tickLine={false}
                                axisLine={false}
                                width={36}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                wrapperStyle={{ fontSize: 12, color: "var(--color-text-muted)", paddingTop: 12 }}
                            />
                            <Area
                                yAxisId="revenue"
                                type="monotone"
                                dataKey="revenue"
                                name="Revenue ($)"
                                stroke="#FEE505"
                                strokeWidth={2}
                                fill="url(#gradRevenue)"
                                dot={false}
                                activeDot={{ r: 4, fill: "#FEE505" }}
                            />
                            <Area
                                yAxisId="bookings"
                                type="monotone"
                                dataKey="bookings"
                                name="Bookings"
                                stroke="#7C3AED"
                                strokeWidth={2}
                                fill="url(#gradBookings)"
                                dot={false}
                                activeDot={{ r: 4, fill: "#7C3AED" }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>
            </section>

            {/* Movie Performance + Booking Sources */}
            <section>
                <SectionTitle>Performance Breakdown</SectionTitle>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* Movie Performance — takes 2 cols */}
                    <ChartCard
                        title="Top Movies by Revenue"
                        sub="Top 10 movies ranked by confirmed bookings"
                        className="lg:col-span-2"
                    >
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart
                                data={charts.moviePerformance}
                                layout="vertical"
                                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" strokeOpacity={0.5} />
                                <XAxis
                                    type="number"
                                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="movieTitle"
                                    width={120}
                                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) => v.length > 16 ? `${v.slice(0, 16)}…` : v}
                                />
                                <Tooltip
                                    content={<CustomTooltip prefix="$" />}
                                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                                />
                                <Bar
                                    dataKey="revenue"
                                    name="Revenue"
                                    fill="#FEE505"
                                    radius={[0, 4, 4, 0]}
                                    maxBarSize={18}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Booking Sources */}
                    <ChartCard title="Booking Sources" sub="By channel distribution">
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={charts.bookingSources}
                                    cx="50%"
                                    cy="44%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={3}
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    {charts.bookingSources.map((_, i) => (
                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(v, n) => [v, n]}
                                    contentStyle={{
                                        background: "var(--color-bg-card)",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: 8,
                                        fontSize: 12,
                                    }}
                                />
                                <Legend
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{ fontSize: 12, color: "var(--color-text-muted)", paddingTop: 8 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            </section>

            {/* Cinema Performance + Screen Occupancy */}
            <section>
                <SectionTitle>Venues</SectionTitle>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* Cinema Performance */}
                    <ChartCard title="Cinema Revenue" sub="Revenue per cinema location">
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={charts.cinemaPerformance} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" strokeOpacity={0.5} />
                                <XAxis
                                    dataKey="cinemaName"
                                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) => v.length > 12 ? `${v.slice(0, 12)}…` : v}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                                    width={48}
                                />
                                <Tooltip content={<CustomTooltip prefix="$" />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                                <Bar dataKey="revenue" name="Revenue" fill="#7C3AED" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Screen Occupancy */}
                    <ChartCard title="Screen Occupancy" sub="Percentage of seats filled per screen">
                        <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                            {charts.screenOccupancy.length === 0 && (
                                <p className="text-sm text-(--color-text-muted) italic text-center py-8">No screen data available.</p>
                            )}
                            {charts.screenOccupancy.map((s, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-(--color-text-secondary) truncate max-w-[200px]">{s.screenName}</span>
                                        <span className="font-semibold text-(--color-text-primary) ml-2">{fmt.percent(s.occupancyRate)}</span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full bg-(--color-bg-surface)">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: `${Math.min(s.occupancyRate, 100)}%`,
                                                background: s.occupancyRate >= 75
                                                    ? "var(--color-success, #10B981)"
                                                    : s.occupancyRate >= 40
                                                        ? "#FEE505"
                                                        : "#EF4444",
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ChartCard>
                </div>
            </section>
        </div>
    );
};

// ─── STAFF DASHBOARD ────────────────────────────────────────────────────────────

const StaffDashboard = ({ data }) => {
    const { kpis, charts } = data;

    const checkInRate =
        charts.ticketsCheckedInByStatus.reduce((sum, i) => sum + i.value, 0) > 0
            ? (charts.ticketsCheckedInByStatus.find((i) => i.name === "Checked In")?.value /
                charts.ticketsCheckedInByStatus.reduce((sum, i) => sum + i.value, 0)) *
            100
            : 0;

    return (
        <div className="space-y-8">
            {/* KPIs */}
            <section>
                <SectionTitle>Today's Operations</SectionTitle>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <KpiCard icon={Ticket} label="Check-ins Today" value={fmt.number(kpis.ticketsCheckedInToday)} accent />
                    <KpiCard icon={ShoppingBag} label="Counter Bookings" value={fmt.number(kpis.counterBookingsToday)} />
                    <KpiCard icon={DollarSign} label="Counter Revenue" value={fmt.currency(kpis.counterRevenueToday)} />
                    <KpiCard icon={MonitorPlay} label="Active Shows" value={fmt.number(kpis.activeShowsToday)} />
                </div>
            </section>

            <section>
                <SectionTitle>Live Activity</SectionTitle>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* Hourly Check-ins */}
                    <ChartCard
                        title="Hourly Check-ins"
                        sub="Ticket validations by hour today"
                        className="lg:col-span-2"
                    >
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={charts.hourlyCheckIns} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" strokeOpacity={0.5} />
                                <XAxis
                                    dataKey="hour"
                                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                                    tickLine={false}
                                    axisLine={false}
                                    width={32}
                                    allowDecimals={false}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                                <Bar dataKey="count" name="Check-ins" fill="#FEE505" radius={[4, 4, 0, 0]} maxBarSize={36} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Check-in status donut */}
                    <ChartCard title="Check-in Status" sub={`${fmt.percent(checkInRate)} checked in`}>
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie
                                    data={charts.ticketsCheckedInByStatus}
                                    cx="50%"
                                    cy="44%"
                                    innerRadius={65}
                                    outerRadius={90}
                                    paddingAngle={3}
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    <Cell fill="#10B981" />
                                    <Cell fill="var(--color-bg-surface, #1a1a2e)" stroke="var(--color-border)" />
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: "var(--color-bg-card)",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: 8,
                                        fontSize: 12,
                                    }}
                                />
                                <Legend
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{ fontSize: 12, color: "var(--color-text-muted)", paddingTop: 8 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            </section>
        </div>
    );
};

// ─── CUSTOMER DASHBOARD ─────────────────────────────────────────────────────────

const CustomerDashboard = ({ data }) => {
    const { kpis, charts } = data;

    return (
        <div className="space-y-8">
            {/* KPIs */}
            <section>
                <SectionTitle>Your Activity</SectionTitle>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <KpiCard icon={Ticket} label="Bookings" value={fmt.number(kpis.totalBookings)} />
                    <KpiCard icon={DollarSign} label="Total Spent" value={fmt.currency(kpis.totalSpent)} accent />
                    <KpiCard icon={ShoppingBag} label="Tickets Bought" value={fmt.number(kpis.ticketsBought)} />
                    <KpiCard icon={Film} label="Movies Watched" value={fmt.number(kpis.moviesWatched)} />
                </div>
            </section>

            <section>
                <SectionTitle>Spending History</SectionTitle>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* Monthly spend */}
                    <ChartCard
                        title="Monthly Spending"
                        sub="Your spending over the last 6 months"
                        className="lg:col-span-2"
                    >
                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={charts.monthlySpent} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FEE505" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#FEE505" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
                                <XAxis
                                    dataKey="month"
                                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) => `$${v}`}
                                    width={48}
                                />
                                <Tooltip content={<CustomTooltip prefix="$" />} />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    name="Spent"
                                    stroke="#FEE505"
                                    strokeWidth={2}
                                    fill="url(#gradSpend)"
                                    dot={{ fill: "#FEE505", r: 4 }}
                                    activeDot={{ r: 5 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Booking status breakdown */}
                    <ChartCard title="Booking Status" sub="All-time breakdown">
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie
                                    data={charts.bookingsByStatus}
                                    cx="50%"
                                    cy="44%"
                                    innerRadius={60}
                                    outerRadius={88}
                                    paddingAngle={3}
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    {charts.bookingsByStatus.map((_, i) => (
                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: "var(--color-bg-card)",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: 8,
                                        fontSize: 12,
                                    }}
                                />
                                <Legend
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{ fontSize: 12, color: "var(--color-text-muted)", paddingTop: 8 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            </section>
        </div>
    );
};

// ─── PAGE HEADER ───────────────────────────────────────────────────────────────

const roleLabels = {
    OWNER: { greeting: "Owner Dashboard", sub: "Full operational overview across all cinemas." },
    MANAGER: { greeting: "Manager Dashboard", sub: "Cinema performance and booking analytics." },
    STAFF: { greeting: "Staff Operations", sub: "Today's check-ins, counter sales, and live shows." },
    CUSTOMER: { greeting: "My Activity", sub: "Your personal booking history and spending." },
};

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

/**
 * DashboardPage
 *
 * Usage (Server Component parent passes analytics down):
 *   const data = await getAnalyticsData();
 *   <DashboardPage analyticsData={data} role={session.user.role} />
 *
 * Or as a Client-only page (for demo / if you want refresh button):
 *   <DashboardPage fetchFn={getAnalyticsData} role={...} />
 */
const DashboardPage = ({ analyticsData: initialData = null, role = "OWNER", fetchFn = null }) => {
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(!initialData);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const load = async (isRefresh = false) => {
        if (!fetchFn) return;
        isRefresh ? setRefreshing(true) : setLoading(true);
        setError(null);
        try {
            const result = await fetchFn();
            setData(result);
        } catch (err) {
            setError(err.message ?? "Failed to load analytics.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (!initialData && fetchFn) load();
    }, []);

    const meta = roleLabels[role] ?? roleLabels["OWNER"];

    return (
        <div className="w-full space-y-6">
            {/* Page header */}
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-(--color-accent-dim) border border-(--color-border-accent) flex items-center justify-center">
                        <Activity className="w-5 h-5 text-(--color-accent)" />
                    </div>
                    <div>
                        <h1 className="font-display text-2xl font-bold text-(--color-text-primary) tracking-tight leading-none">
                            {meta.greeting}
                        </h1>
                        <p className="text-sm text-(--color-text-muted) mt-0.5">{meta.sub}</p>
                    </div>
                </div>
                {fetchFn && (
                    <button
                        onClick={() => load(true)}
                        disabled={refreshing}
                        className="btn btn-sm btn-ghost flex items-center gap-1.5"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                )}
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <Loader2 className="w-8 h-8 text-(--color-accent) animate-spin" />
                    <p className="text-sm text-(--color-text-muted)">Loading analytics…</p>
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <div className="card rounded-xl p-6 border border-(--color-error)/40 bg-(--color-error)/5 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-(--color-error) shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-(--color-error)">Failed to load analytics</p>
                        <p className="text-xs text-(--color-text-muted) mt-1">{error}</p>
                        {fetchFn && (
                            <button
                                onClick={() => load()}
                                className="btn btn-xs btn-ghost mt-2 text-(--color-error) border border-(--color-error)/30 hover:bg-(--color-error)/10"
                            >
                                Try again
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Content */}
            {!loading && !error && data && (
                <>
                    {(role === "OWNER" || role === "MANAGER") && <OwnerDashboard data={data} />}
                    {role === "STAFF" && <StaffDashboard data={data} />}
                    {role === "CUSTOMER" && <CustomerDashboard data={data} />}
                </>
            )}
        </div>
    );
};

export default DashboardPage;
