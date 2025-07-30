const router = require('express').Router();
const ChartController = require('../controller/ChartController');
const { isAuthenticated } = require('../middleware/auth');

router.get('/admin/reports/chart/monthly/violations', isAuthenticated, ChartController.getMonthlyViolationsByStatus);
router.get('/admin/reports/chart/top-reporter', isAuthenticated, ChartController.getTopReporters);
router.get('/admin/reports/chart/time-of-day', isAuthenticated, ChartController.getReportsByTimeOfDay);
router.get('/admin/reports/chart/report-types', isAuthenticated, ChartController.getReportTypes);
// router.get('/admin/reports/chart/annual-violations', isAuthenticated, ChartController.getAnnualViolations);
router.get("/admin/reports/chart/yearly-violations", isAuthenticated, ChartController.getYearlyViolations);
router.get('/admin/reports/chart/all-violations', isAuthenticated, ChartController.getAllViolations);
router.get('/admin/reports/chart/years', isAuthenticated, ChartController.getAvailableYears);
router.get('/admin/reports/chart/quarterly-violations', isAuthenticated, ChartController.getQuarterlyViolations);

module.exports = router;