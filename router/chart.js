const router = require('express').Router();
const ChartController = require('../controller/ChartController');
const { isAuthenticated } = require('../middleware/auth');

router.get('/admin/reports/chart/monthly/violations', isAuthenticated, ChartController.getMonthlyViolationsByStatus);
router.get('/admin/reports/chart/top-reporter', isAuthenticated, ChartController.getTopReporters);
router.get('/admin/reports/chart/time-of-day', isAuthenticated, ChartController.getReportsByTimeOfDay);
router.get('/admin/reports/chart/report-types', isAuthenticated, ChartController.getReportTypes);

module.exports = router;