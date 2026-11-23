import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { returnResponse } from '../utils/response';
import { Request, Response } from 'express';
import { IAuthRequest } from '../types';
import {
  getAllModuleWorkflows,
  findModuleWorkflowById,
  createModuleWorkflow as createModuleWorkflowService,
  updateModuleWorkflow as updateModuleWorkflowService,
  deleteModuleWorkflow as deleteModuleWorkflowService,
  getWorkflowsByModuleId,
  toggleWorkflowStatus
} from '../services/ModuleWorkflowService';

// Get all module workflows
export const getModuleWorkflows = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const moduleId = req.query.module_id as string;
    const active = req.query.active !== undefined ? req.query.active === 'true' : undefined;
    const isHq = req.query.is_hq !== undefined ? req.query.is_hq === 'true' : undefined;

    const result = await getAllModuleWorkflows(page, limit, search, moduleId, active, isHq);

    returnResponse(res).ok('Module workflows retrieved successfully', {
      workflows: result.workflows,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.page < result.totalPages,
        hasPrev: result.page > 1
      }
    });
  } catch (error) {
    logger.error('Get module workflows error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to get module workflows', 500);
  }
};

// Get module workflow by ID
export const getModuleWorkflowById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const workflow = await findModuleWorkflowById(id);

    if (!workflow) {
      throw new AppError('Module workflow not found', 404);
    }

    returnResponse(res).ok('Module workflow retrieved successfully', workflow);
  } catch (error) {
    logger.error('Get module workflow error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to get module workflow', 500);
  }
};

// Get workflows by module ID
export const getWorkflowsByModule = async (req: Request, res: Response) => {
  try {
    const moduleId = req.params.module_id as string;
    const workflows = await getWorkflowsByModuleId(moduleId);

    returnResponse(res).ok('Module workflows retrieved successfully', { workflows });
  } catch (error) {
    logger.error('Get workflows by module error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to get workflows by module', 500);
  }
};

// Create module workflow
export const createModuleWorkflow = async (req: IAuthRequest, res: Response) => {
  try {
    const workflowData = req.body;
    const newWorkflow = await createModuleWorkflowService(workflowData, req);

    returnResponse(res).ok('Module workflow created successfully', newWorkflow);
  } catch (error) {
    logger.error('Create module workflow error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to create module workflow', 500);
  }
};

// Update module workflow
export const updateModuleWorkflow = async (req: IAuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const updateData = req.body;

    const updatedWorkflow = await updateModuleWorkflowService(id, updateData, req);

    if (!updatedWorkflow) {
      throw new AppError('Module workflow not found', 404);
    }

    returnResponse(res).ok('Module workflow updated successfully', updatedWorkflow);
  } catch (error) {
    logger.error('Update module workflow error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update module workflow', 500);
  }
};

// Delete module workflow
export const deleteModuleWorkflow = async (req: IAuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await deleteModuleWorkflowService(id, req);

    returnResponse(res).ok('Module workflow deleted successfully', null);
  } catch (error) {
    logger.error('Delete module workflow error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to delete module workflow', 500);
  }
};

// Toggle workflow status
export const toggleModuleWorkflowStatus = async (req: IAuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const active = req.body.active === true || req.body.active === 'true';

    const updatedWorkflow = await toggleWorkflowStatus(id, active, req);

    returnResponse(res).ok(
      `Module workflow ${active ? 'activated' : 'deactivated'} successfully`,
      updatedWorkflow
    );
  } catch (error) {
    logger.error('Toggle workflow status error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to toggle workflow status', 500);
  }
};
