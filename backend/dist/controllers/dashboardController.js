"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const db_1 = __importDefault(require("../config/db"));
const errorHandler_1 = require("../middlewares/errorHandler");
const getDashboardStats = async (req, res, next) => {
    try {
        if (!req.user)
            return next(new errorHandler_1.AppError('Unauthorized', 401));
        if (req.user.role === 'CUSTOMER')
            return next(new errorHandler_1.AppError('Forbidden', 403));
        // 1. Total count, and counts by status
        const totalRequests = await db_1.default.returnRequest.count();
        const statusCountsGroup = await db_1.default.returnRequest.groupBy({
            by: ['status'],
            _count: { id: true },
        });
        const stats = {
            PENDING: 0,
            UNDER_REVIEW: 0,
            APPROVED: 0,
            REJECTED: 0,
            REPLACEMENT_INITIATED: 0,
            REPLACEMENT_SHIPPED: 0,
            REFUND_INITIATED: 0,
            REFUND_COMPLETED: 0,
            CLOSED: 0,
        };
        statusCountsGroup.forEach((item) => {
            if (item.status in stats) {
                stats[item.status] = item._count.id;
            }
        });
        // 2. Today's requests
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todayRequests = await db_1.default.returnRequest.count({
            where: {
                createdAt: {
                    gte: startOfToday,
                },
            },
        });
        // 3. Issue type distribution (for Pie Chart)
        const issueCountsGroup = await db_1.default.returnRequest.groupBy({
            by: ['issueType'],
            _count: { id: true },
        });
        const issueTypeDistribution = issueCountsGroup.map((item) => ({
            name: item.issueType.replace('_', ' '),
            count: item._count.id,
        }));
        // 4. Resolution breakdown
        const resolutionCounts = await db_1.default.returnRequest.groupBy({
            by: ['preferredResolution'],
            _count: { id: true },
        });
        const resolutions = resolutionCounts.map((item) => ({
            name: item.preferredResolution,
            count: item._count.id,
        }));
        // 5. Trend: Requests created in the last 7 days (for Line/Bar Chart)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        const recentRequests = await db_1.default.returnRequest.findMany({
            where: {
                createdAt: {
                    gte: sevenDaysAgo,
                },
            },
            select: {
                createdAt: true,
            },
        });
        // Bucket requests by day
        const trendMap = {};
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            trendMap[dateStr] = 0;
        }
        recentRequests.forEach((req) => {
            const dateStr = req.createdAt.toISOString().split('T')[0];
            if (dateStr in trendMap) {
                trendMap[dateStr]++;
            }
        });
        const dailyTrend = Object.keys(trendMap)
            .map((date) => ({
            date,
            count: trendMap[date],
        }))
            .reverse(); // Chronological order
        // 6. Recent Activity
        const recentActivity = await db_1.default.statusHistory.findMany({
            take: 8,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                createdBy: {
                    select: {
                        name: true,
                        role: { select: { name: true } },
                    },
                },
                returnRequest: {
                    select: {
                        id: true,
                        customerName: true,
                        order: {
                            select: { orderNumber: true },
                        },
                    },
                },
            },
        });
        const activityList = recentActivity.map((activity) => ({
            id: activity.id,
            requestId: activity.returnRequestId,
            customerName: activity.returnRequest?.customerName,
            orderNumber: activity.returnRequest?.order?.orderNumber,
            status: activity.status,
            note: activity.note,
            updatedBy: activity.createdBy.name,
            role: activity.createdBy.role.name,
            createdAt: activity.createdAt,
        }));
        res.status(200).json({
            status: 'success',
            data: {
                summary: {
                    total: totalRequests,
                    pending: stats.PENDING,
                    approved: stats.APPROVED,
                    rejected: stats.REJECTED,
                    underReview: stats.UNDER_REVIEW,
                    today: todayRequests,
                },
                statusDistribution: Object.keys(stats).map((key) => ({
                    name: key.replace('_', ' '),
                    count: stats[key],
                })),
                issueTypeDistribution,
                resolutions,
                dailyTrend,
                recentActivity: activityList,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboardStats = getDashboardStats;
