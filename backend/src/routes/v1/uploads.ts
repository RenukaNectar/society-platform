import { Router } from 'express';
import { serveImage } from '../../controllers/mediaController';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

// Serve uploaded files with authentication
router.get('/:filename', authenticateToken, serveImage);

export default router; 