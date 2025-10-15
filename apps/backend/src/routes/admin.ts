import { Router } from 'express';
import { AdminController } from '@/controllers/admin.controller';
import { authenticateToken } from '@/middleware/auth.middleware';

const router = Router();

// Apply admin middleware to all routes
router.use(authenticateToken);
router.use(AdminController.requireAdmin);

// Dashboard
router.get('/dashboard', AdminController.getDashboardStats);

// Discovered airdrops management
router.get('/discovered-airdrops', AdminController.getDiscoveredAirdrops);
router.post('/approve-airdrop', AdminController.approveAirdrop);
router.post('/reject-airdrop', AdminController.rejectAirdrop);

// Vetting jobs management
router.get('/vetting-jobs', AdminController.getVettingJobs);

// Manual triggers
router.post('/trigger-scraping', AdminController.triggerScraping);

export default router;