import { Router, Request, Response, NextFunction } from 'express';
import { param } from 'express-validator';
import { authenticateToken, validateRequest } from '../../middleware/auth';
import { getEntityProcessingHistory } from '../../controllers/historyController';

export const entityHistoryIdValidation = [
  param('id').isUUID().withMessage('Valid resource ID is required'),
];

export interface EntityHistoryRouteOptions {
  /** Module keys stored in `history.resource` (e.g. AGM, BOD). */
  historyResources: string[];
}

/**
 * Registers GET /:id/history — same contract as GET /societies/:id/history.
 */
export const registerEntityHistoryRoute = (
  router: Router,
  options: EntityHistoryRouteOptions,
): void => {
  router.get(
    '/:id/history',
    authenticateToken,
    entityHistoryIdValidation,
    validateRequest,
    (req: Request, _res: Response, next: NextFunction) => {
      (req as any).historyResources = options.historyResources;
      next();
    },
    getEntityProcessingHistory,
  );
};
