import { Request, Response, NextFunction } from 'express';
import SocietyRegistration from '../models/SocietyRegistration';
import logger from '../utils/logger';
import Status from '../models/Status';


/**
 * Simple middleware to check if a society is approved
 * @param societyId - The society ID to check
 * @returns Promise<{isApproved: boolean, message: string}>
 */
export const checkSocietyApprovalStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check for society_id in request body first
    const societyId = req.body.society_id;
    
    if (!societyId) {
      res.status(400).json({
        success: false,
        message: 'Society ID is required in request body',
        data: null
      });
      return;
    }
    
    // Get the society registration
    const society = await SocietyRegistration.findOne({
      where: { id: societyId }
    });

    if (!society) {
      res.status(404).json({
        success: false,
        message: 'Society not found',
        data: null
      });
      return;
    }

    // Check if society has a status
    if (!society.status) {
      res.status(403).json({
        success: false,
        message: 'Society has no status assigned. Please contact the administrator.',
        data: null
      });
      return;
    }
    
    // Get the status by ID and check if it's approved
    const status = await Status.findOne({
      where: { id: society.status }
    });

    if (!status) {
      res.status(404).json({
        success: false,
        message: 'Status not found',
        data: null
      });
      return;
    }

    const isApproved = status.key === 'certificate_issued';

    if (!isApproved) {
      res.status(403).json({
        success: false,
        message: `Society is not approved. Please contact the administrator to approve the society.`,
        data: null
      });
      return;
    }

    logger.info('Society approval check passed', {
      society_id: societyId,
      user_id: (req as any).user?.userId,
      path: req.path
    });

    next();
  } catch (error: any) {
    logger.error('Error checking society approval status', {
      society_id: req.body.society_id,
      error: error instanceof Error ? error.message : String(error)
    });
    res.status(500).json({
      success: false,
      message: 'Error checking society approval status',
      data: null
    });
    return;
  }
};

