import { Router } from 'express';
import { authenticateToken, validateRequest } from '../../middleware/auth';
import { uploadSingle, uploadMultiple, handleMulterError } from '../../middleware/upload';
import { 
  getSocieties,
  getSocietyById
} from '../../controllers/societyController';
import { 
  societyIdValidation,
  societyQueryValidation
} from '../../validations/society';
import { uploadMediaController, uploadSocietyMediaController } from '../../controllers/mediaController';
import { getAllHistoryRecords } from '../../controllers/historyController';
import { submitDraftController } from '../../controllers/societyController';

const router = Router();

router.get('/', societyQueryValidation, validateRequest, getSocieties);
router.get('/:id', societyIdValidation, validateRequest, getSocietyById);
router.post('/:id/media', authenticateToken, uploadMultiple, handleMulterError, uploadSocietyMediaController);
router.put('/:id/submit-draft', authenticateToken, submitDraftController);
router.post('/media', authenticateToken, uploadSingle, handleMulterError, uploadMediaController);
router.get('/:id/history', societyIdValidation, validateRequest, getAllHistoryRecords);

export default router;