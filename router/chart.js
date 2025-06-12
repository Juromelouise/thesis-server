const router = require('express').Router();
const ChartController = require('../controller/ChartController');
const { isAuthenticated } = require('../middleware/auth');

router.get('/admin/reports/violations', isAuthenticated, ChartController.getReportsByStatus);
router.get('/admin/reports/violations/:id', isAuthenticated, ChartController.getObstructionsPerMonth);
router.get('/admin/reports/violations/plate/:plateNumber', isAuthenticated, ChartController.getTopPlateViolations);

module.exports = router;