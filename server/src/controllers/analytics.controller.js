import prisma from "../config/prisma.js";
import { apiResponse, asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";
import { UserRole } from "../generated/prisma/enums.ts";

/**
 * GET /api/v1/analytics/dashboard
 * Fetch dashboard analytics tailored to the user's role.
 */
export const getDashboardAnalytics = asyncHandler(async (req, res) => {
    const { role, id: userId } = req.user;
    const { startDate, endDate, cinemaId } = req.query;

    // Validate date inputs if provided
    if (startDate && isNaN(new Date(startDate).getTime())) {
        throw ApiError.badRequest("Invalid start date format.");
    }
    if (endDate && isNaN(new Date(endDate).getTime())) {
        throw ApiError.badRequest("Invalid end date format.");
    }

    if (role === UserRole.OWNER || role === UserRole.MANAGER) {
        // ─────────────────────────────────────────────────────────────
        // OWNER / MANAGER ANALYTICS
        // ─────────────────────────────────────────────────────────────

        // Default to last 30 days if dates are not provided
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        if (endDate) {
            end.setHours(23, 59, 59, 999);
        }

        // 1. Where filters
        const bookingWhere = {
            status: "CONFIRMED",
            createdAt: { gte: start, lte: end },
        };

        const showWhere = {
            startTime: { gte: start, lte: end },
            status: { in: ["SCHEDULED", "COMPLETED"] },
            deletedAt: null,
        };

        if (cinemaId) {
            bookingWhere.show = {
                screen: { cinemaId },
            };
            showWhere.screen = { cinemaId };
        }

        // 2. Fetch KPIs
        const [
            revenueAgg,
            totalBookings,
            ticketsSold,
            totalShowSeats,
            bookedShowSeats,
            activeMovies,
            totalCustomers,
        ] = await Promise.all([
            prisma.booking.aggregate({
                _sum: { finalAmount: true },
                where: bookingWhere,
            }),
            prisma.booking.count({
                where: bookingWhere,
            }),
            prisma.bookingSeat.count({
                where: { booking: bookingWhere },
            }),
            prisma.showSeat.count({
                where: { show: showWhere },
            }),
            prisma.showSeat.count({
                where: { show: showWhere, status: "BOOKED" },
            }),
            prisma.movie.count({
                where: { status: "NOW_SHOWING", deletedAt: null },
            }),
            prisma.user.count({
                where: { role: UserRole.CUSTOMER, deletedAt: null },
            }),
        ]);

        const totalRevenue = Number(revenueAgg._sum.finalAmount || 0);
        const occupancyRate = totalShowSeats > 0 ? (bookedShowSeats / totalShowSeats) * 100 : 0;

        // 3. ReCharts: Revenue & Bookings Trends (Daily breakdown)
        const bookings = await prisma.booking.findMany({
            where: bookingWhere,
            select: {
                createdAt: true,
                finalAmount: true,
            },
            orderBy: { createdAt: "asc" },
        });

        const dailyMap = new Map();
        let current = new Date(start);
        while (current <= end) {
            const dateStr = current.toISOString().split("T")[0];
            dailyMap.set(dateStr, { date: dateStr, revenue: 0, bookings: 0 });
            current.setDate(current.getDate() + 1);
        }

        for (const b of bookings) {
            const dateStr = b.createdAt.toISOString().split("T")[0];
            if (dailyMap.has(dateStr)) {
                const dayData = dailyMap.get(dateStr);
                dayData.revenue = Number((dayData.revenue + Number(b.finalAmount)).toFixed(2));
                dayData.bookings += 1;
            } else {
                dailyMap.set(dateStr, {
                    date: dateStr,
                    revenue: Number(Number(b.finalAmount).toFixed(2)),
                    bookings: 1,
                });
            }
        }
        const revenueTrends = Array.from(dailyMap.values());

        // 4. ReCharts: Booking Sources
        const sourceGroup = await prisma.booking.groupBy({
            by: ["source"],
            where: bookingWhere,
            _count: { id: true },
            _sum: { finalAmount: true },
        });
        const bookingSources = sourceGroup.map((g) => ({
            name: g.source,
            value: g._count.id,
            revenue: Number((g._sum.finalAmount || 0).toFixed(2)),
        }));

        // 5. ReCharts: Movie Performance (Top 10)
        const moviePerformanceGroup = await prisma.booking.groupBy({
            by: ["movieTitle"],
            where: bookingWhere,
            _count: { id: true },
            _sum: { finalAmount: true },
        });
        const moviePerformance = await Promise.all(
            moviePerformanceGroup.map(async (g) => {
                const ticketsCount = await prisma.bookingSeat.count({
                    where: {
                        booking: {
                            ...bookingWhere,
                            movieTitle: g.movieTitle,
                        },
                    },
                });
                return {
                    movieTitle: g.movieTitle,
                    revenue: Number((g._sum.finalAmount || 0).toFixed(2)),
                    bookingsCount: g._count.id,
                    ticketsSold: ticketsCount,
                };
            })
        );
        moviePerformance.sort((a, b) => b.revenue - a.revenue);
        const topMoviePerformance = moviePerformance.slice(0, 10);

        // 6. ReCharts: Cinema Performance
        const cinemaPerformanceGroup = await prisma.booking.groupBy({
            by: ["cinemaName"],
            where: bookingWhere,
            _count: { id: true },
            _sum: { finalAmount: true },
        });
        const cinemaPerformance = await Promise.all(
            cinemaPerformanceGroup.map(async (g) => {
                const ticketsCount = await prisma.bookingSeat.count({
                    where: {
                        booking: {
                            ...bookingWhere,
                            cinemaName: g.cinemaName,
                        },
                    },
                });
                return {
                    cinemaName: g.cinemaName,
                    revenue: Number((g._sum.finalAmount || 0).toFixed(2)),
                    bookingsCount: g._count.id,
                    ticketsSold: ticketsCount,
                };
            })
        );
        cinemaPerformance.sort((a, b) => b.revenue - a.revenue);

        // 7. ReCharts: Screen Occupancy
        const screens = await prisma.screen.findMany({
            where: {
                deletedAt: null,
                ...(cinemaId && { cinemaId }),
            },
            include: {
                cinema: { select: { name: true } },
            },
        });
        const screenOccupancy = await Promise.all(
            screens.map(async (s) => {
                const screenShowWhere = {
                    screenId: s.id,
                    startTime: { gte: start, lte: end },
                    status: { in: ["SCHEDULED", "COMPLETED"] },
                    deletedAt: null,
                };
                const [totalSeats, bookedSeats] = await Promise.all([
                    prisma.showSeat.count({
                        where: { show: screenShowWhere },
                    }),
                    prisma.showSeat.count({
                        where: { show: screenShowWhere, status: "BOOKED" },
                    }),
                ]);
                const rate = totalSeats > 0 ? (bookedSeats / totalSeats) * 100 : 0;
                return {
                    screenName: `${s.name} (${s.cinema.name})`,
                    capacity: s.capacity,
                    occupancyRate: Number(rate.toFixed(2)),
                    totalSeats,
                    bookedSeats,
                };
            })
        );
        screenOccupancy.sort((a, b) => b.occupancyRate - a.occupancyRate);

        return apiResponse(res, 200, true, "Dashboard analytics fetched successfully.", {
            kpis: {
                totalRevenue,
                totalBookings,
                ticketsSold,
                occupancyRate: Number(occupancyRate.toFixed(2)),
                activeMovies,
                totalCustomers,
            },
            charts: {
                revenueTrends,
                bookingSources,
                moviePerformance: topMoviePerformance,
                cinemaPerformance,
                screenOccupancy,
            },
        });
    } else if (role === UserRole.STAFF) {
        // ─────────────────────────────────────────────────────────────
        // STAFF ANALYTICS (Today's Operations)
        // ─────────────────────────────────────────────────────────────
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Fetch tickets checked in today
        const ticketsCheckedIn = await prisma.ticket.count({
            where: {
                status: "USED",
                checkedInAt: { gte: todayStart, lte: todayEnd },
                booking: {
                    ...(cinemaId && {
                        show: {
                            screen: { cinemaId },
                        },
                    }),
                },
            },
        });

        // Today's counter bookings count
        const counterBookings = await prisma.booking.count({
            where: {
                source: "COUNTER",
                status: "CONFIRMED",
                createdAt: { gte: todayStart, lte: todayEnd },
                ...(cinemaId && {
                    show: {
                        screen: { cinemaId },
                    },
                }),
            },
        });

        // Today's counter bookings revenue
        const counterRevenueAgg = await prisma.booking.aggregate({
            _sum: { finalAmount: true },
            where: {
                source: "COUNTER",
                status: "CONFIRMED",
                createdAt: { gte: todayStart, lte: todayEnd },
                ...(cinemaId && {
                    show: {
                        screen: { cinemaId },
                    },
                }),
            },
        });
        const counterRevenue = Number(counterRevenueAgg._sum.finalAmount || 0);

        // Active shows scheduled for today
        const activeShowsToday = await prisma.show.count({
            where: {
                startTime: { gte: todayStart, lte: todayEnd },
                status: "SCHEDULED",
                deletedAt: null,
                ...(cinemaId && {
                    screen: { cinemaId },
                }),
            },
        });

        // ReCharts: Hourly Check-in Trends (Today)
        const ticketsToday = await prisma.ticket.findMany({
            where: {
                checkedInAt: { gte: todayStart, lte: todayEnd },
                booking: {
                    ...(cinemaId && {
                        show: {
                            screen: { cinemaId },
                        },
                    }),
                },
            },
            select: { checkedInAt: true },
        });

        const hourlyMap = new Map();
        for (let i = 9; i <= 23; i++) {
            const hourStr = `${String(i).padStart(2, "0")}:00`;
            hourlyMap.set(i, { hour: hourStr, count: 0 });
        }

        for (const t of ticketsToday) {
            if (t.checkedInAt) {
                const hr = new Date(t.checkedInAt).getHours();
                if (hourlyMap.has(hr)) {
                    hourlyMap.get(hr).count += 1;
                } else {
                    const hourStr = `${String(hr).padStart(2, "0")}:00`;
                    hourlyMap.set(hr, { hour: hourStr, count: 1 });
                }
            }
        }
        const hourlyCheckIns = Array.from(hourlyMap.values()).sort((a, b) => {
            const aHour = parseInt(a.hour.split(":")[0]);
            const bHour = parseInt(b.hour.split(":")[0]);
            return aHour - bHour;
        });

        // ReCharts: Ticket status for today's shows
        const todayShowsTickets = await prisma.ticket.count({
            where: {
                booking: {
                    show: {
                        startTime: { gte: todayStart, lte: todayEnd },
                        deletedAt: null,
                        ...(cinemaId && { screen: { cinemaId } }),
                    },
                },
            },
        });

        const todayShowsCheckedIn = await prisma.ticket.count({
            where: {
                status: "USED",
                booking: {
                    show: {
                        startTime: { gte: todayStart, lte: todayEnd },
                        deletedAt: null,
                        ...(cinemaId && { screen: { cinemaId } }),
                    },
                },
            },
        });

        const ticketsCheckedInByStatus = [
            { name: "Checked In", value: todayShowsCheckedIn },
            { name: "Pending Check In", value: Math.max(0, todayShowsTickets - todayShowsCheckedIn) },
        ];

        return apiResponse(res, 200, true, "Staff operations analytics fetched successfully.", {
            kpis: {
                ticketsCheckedInToday: ticketsCheckedIn,
                counterBookingsToday: counterBookings,
                counterRevenueToday: Number(counterRevenue.toFixed(2)),
                activeShowsToday,
            },
            charts: {
                hourlyCheckIns,
                ticketsCheckedInByStatus,
            },
        });
    } else if (role === UserRole.CUSTOMER) {
        // ─────────────────────────────────────────────────────────────
        // CUSTOMER ANALYTICS
        // ─────────────────────────────────────────────────────────────

        // Fetch customer specific KPIs
        const [totalBookings, totalSpentAgg, ticketsBought, moviesWatchedGroup] = await Promise.all([
            prisma.booking.count({
                where: { userId },
            }),
            prisma.booking.aggregate({
                _sum: { finalAmount: true },
                where: {
                    userId,
                    status: "CONFIRMED",
                },
            }),
            prisma.ticket.count({
                where: {
                    booking: { userId },
                },
            }),
            prisma.booking.groupBy({
                by: ["movieTitle"],
                where: {
                    userId,
                    status: "CONFIRMED",
                },
            }),
        ]);

        const totalSpent = Number(totalSpentAgg._sum.finalAmount || 0);
        const moviesWatched = moviesWatchedGroup.length;

        // ReCharts: Monthly spending trend (Last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const customerBookings = await prisma.booking.findMany({
            where: {
                userId,
                status: "CONFIRMED",
                createdAt: { gte: sixMonthsAgo },
            },
            select: {
                createdAt: true,
                finalAmount: true,
            },
        });

        const monthlyMap = new Map();
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        for (let i = 0; i < 6; i++) {
            const d = new Date();
            d.setMonth(d.getMonth() - (5 - i));
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            monthlyMap.set(key, { month: monthNames[d.getMonth()], amount: 0 });
        }

        for (const b of customerBookings) {
            const d = new Date(b.createdAt);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            if (monthlyMap.has(key)) {
                monthlyMap.get(key).amount = Number((monthlyMap.get(key).amount + Number(b.finalAmount)).toFixed(2));
            }
        }
        const monthlySpent = Array.from(monthlyMap.values());

        // ReCharts: Bookings distribution by status
        const bookingsStatusGroup = await prisma.booking.groupBy({
            by: ["status"],
            where: { userId },
            _count: { id: true },
        });
        const bookingsByStatus = bookingsStatusGroup.map((g) => ({
            name: g.status.charAt(0) + g.status.slice(1).toLowerCase(),
            value: g._count.id,
        }));

        return apiResponse(res, 200, true, "Customer analytics fetched successfully.", {
            kpis: {
                totalBookings,
                totalSpent: Number(totalSpent.toFixed(2)),
                ticketsBought,
                moviesWatched,
            },
            charts: {
                monthlySpent,
                bookingsByStatus,
            },
        });
    } else {
        throw ApiError.forbidden("Access denied.");
    }
});
