import { Router } from 'express';
import { AirdropController } from '@/controllers/airdrop.controller';
import { authenticateToken } from '@/middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', AirdropController.getAirdrops);
router.get('/stats', AirdropController.getAirdropStats);
router.get('/:id', AirdropController.getAirdropById);

// Protected routes
router.post('/user/airdrop-status', authenticateToken, AirdropController.updateAirdropStatus);
router.get('/user/statuses', authenticateToken, AirdropController.getUserAirdropStatuses);

export default router;