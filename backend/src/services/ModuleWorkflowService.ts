import { Op } from 'sequelize';
import ModuleWorkflow from '../models/ModuleWorkflow';
import { IModuleWorkflow, IModuleWorkflowCreate, IModuleWorkflowUpdate } from '../types';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { IAuthRequest } from '../types';

// Create module workflow
export const createModuleWorkflow = async (
  workflowData: IModuleWorkflowCreate,
  req?: IAuthRequest
): Promise<IModuleWorkflow> => {
  try {
    // Set created_by if not provided
    if (!workflowData.created_by && req?.user?.userId) {
      workflowData.created_by = req.user.userId;
    }

    // Set defaults
    if (workflowData.is_hq === undefined) {
      workflowData.is_hq = false;
    }
    if (workflowData.active === undefined) {
      workflowData.active = true;
    }

    const workflow = await ModuleWorkflow.create(workflowData as any);
    logger.info('Module workflow created successfully', { workflowId: workflow.id });

    const createdWorkflow = await ModuleWorkflow.findByPk(workflow.id, {
      include: [
        { association: 'module', attributes: ['id', 'name', 'key'] },
        { association: 'allowedRole', attributes: ['id', 'name'] },
        { association: 'rejectRole', attributes: ['id', 'name'], required: false },
        { association: 'assignedToRole', attributes: ['id', 'name'], required: false },
        { association: 'approvalStatus', attributes: ['id', 'title', 'key'], required: false },
        { association: 'rejectStatus', attributes: ['id', 'title', 'key'], required: false },
        { association: 'approvalNotificationTemplate', attributes: ['id', 'key', 'title'], required: false },
        { association: 'rejectNotificationTemplate', attributes: ['id', 'key', 'title'], required: false }
      ]
    });

    return createdWorkflow!.toJSON();
  } catch (error: any) {
    logger.error('Failed to create module workflow:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new AppError('A workflow with this sequence already exists for this module', 400);
    }
    throw new AppError('Failed to create module workflow', 500);
  }
};

// Find module workflow by ID
export const findModuleWorkflowById = async (id: string): Promise<IModuleWorkflow | null> => {
  try {
    const workflow = await ModuleWorkflow.findByPk(id, {
      include: [
        { association: 'module', attributes: ['id', 'name', 'key'] },
        { association: 'allowedRole', attributes: ['id', 'name'] },
        { association: 'rejectRole', attributes: ['id', 'name'], required: false },
        { association: 'assignedToRole', attributes: ['id', 'name'], required: false },
        { association: 'approvalStatus', attributes: ['id', 'title', 'key'], required: false },
        { association: 'rejectStatus', attributes: ['id', 'title', 'key'], required: false },
        { association: 'approvalNotificationTemplate', attributes: ['id', 'key', 'title'], required: false },
        { association: 'rejectNotificationTemplate', attributes: ['id', 'key', 'title'], required: false }
      ]
    });
    return workflow ? workflow.toJSON() : null;
  } catch (error) {
    logger.error('Failed to find module workflow by ID:', error);
    throw new AppError('Failed to find module workflow', 500);
  }
};

// Get all module workflows with pagination and filters
export const getAllModuleWorkflows = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
  moduleId?: string,
  active?: boolean,
  isHq?: boolean
): Promise<{
  workflows: IModuleWorkflow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  try {
    const whereConditions: any = {};

    if (moduleId) {
      whereConditions.module_id = moduleId;
    }

    if (active !== undefined) {
      whereConditions.active = active;
    }

    if (isHq !== undefined) {
      whereConditions.is_hq = isHq;
    }

    // Note: Search would need to be implemented through joins if searching in related tables
    // For now, we'll skip search or implement it later

    const { count, rows } = await ModuleWorkflow.findAndCountAll({
      where: whereConditions,
      include: [
        { association: 'module', attributes: ['id', 'name', 'key'] },
        { association: 'allowedRole', attributes: ['id', 'name'] },
        { association: 'rejectRole', attributes: ['id', 'name'], required: false },
        { association: 'assignedToRole', attributes: ['id', 'name'], required: false },
        { association: 'approvalStatus', attributes: ['id', 'title', 'key'], required: false },
        { association: 'rejectStatus', attributes: ['id', 'title', 'key'], required: false }
      ],
      order: [['module_id', 'ASC'], ['sequence', 'ASC']],
      limit,
      offset: (page - 1) * limit
    });

    return {
      workflows: rows.map(workflow => workflow.toJSON()),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  } catch (error) {
    logger.error('Failed to get module workflows:', error);
    throw new AppError('Failed to get module workflows', 500);
  }
};

// Get workflows by module ID
export const getWorkflowsByModuleId = async (moduleId: string): Promise<IModuleWorkflow[]> => {
  try {
    const workflows = await ModuleWorkflow.findAll({
      where: { module_id: moduleId, active: true },
      include: [
        { association: 'module', attributes: ['id', 'name', 'key'] },
        { association: 'allowedRole', attributes: ['id', 'name'] },
        { association: 'rejectRole', attributes: ['id', 'name'], required: false },
        { association: 'assignedToRole', attributes: ['id', 'name'], required: false },
        { association: 'approvalStatus', attributes: ['id', 'title', 'key'], required: false },
        { association: 'rejectStatus', attributes: ['id', 'title', 'key'], required: false },
        { association: 'approvalNotificationTemplate', attributes: ['id', 'key', 'title'], required: false },
        { association: 'rejectNotificationTemplate', attributes: ['id', 'key', 'title'], required: false }
      ],
      order: [['sequence', 'ASC']]
    });

    return workflows.map(workflow => workflow.toJSON());
  } catch (error: any) {
    logger.error('Failed to get workflows by module ID:', error);
    const errorMessage = error?.message || 'Failed to get workflows by module ID';
    throw new AppError(errorMessage, 500);
  }
};

// Update module workflow
export const updateModuleWorkflow = async (
  id: string,
  updateData: Partial<IModuleWorkflowUpdate>,
  req?: IAuthRequest
): Promise<IModuleWorkflow> => {
  try {
    const workflow = await ModuleWorkflow.findByPk(id);
    if (!workflow) {
      throw new AppError('Module workflow not found', 404);
    }

    // Set updated_by if not provided
    if (!updateData.updated_by && req?.user?.userId) {
      updateData.updated_by = req.user.userId;
    }

    await workflow.update(updateData);

    const updatedWorkflow = await ModuleWorkflow.findByPk(id, {
      include: [
        { association: 'module', attributes: ['id', 'name', 'key'] },
        { association: 'allowedRole', attributes: ['id', 'name'] },
        { association: 'rejectRole', attributes: ['id', 'name'], required: false },
        { association: 'assignedToRole', attributes: ['id', 'name'], required: false },
        { association: 'approvalStatus', attributes: ['id', 'title', 'key'], required: false },
        { association: 'rejectStatus', attributes: ['id', 'title', 'key'], required: false },
        { association: 'approvalNotificationTemplate', attributes: ['id', 'key', 'title'], required: false },
        { association: 'rejectNotificationTemplate', attributes: ['id', 'key', 'title'], required: false }
      ]
    });

    logger.info('Module workflow updated successfully', { workflowId: id });
    return updatedWorkflow!.toJSON();
  } catch (error: any) {
    logger.error('Failed to update module workflow:', error);
    if (error instanceof AppError) {
      throw error;
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new AppError('A workflow with this sequence already exists for this module', 400);
    }
    throw new AppError('Failed to update module workflow', 500);
  }
};

// Delete module workflow
export const deleteModuleWorkflow = async (id: string, req?: IAuthRequest): Promise<void> => {
  try {
    const workflow = await ModuleWorkflow.findByPk(id);
    if (!workflow) {
      throw new AppError('Module workflow not found', 404);
    }

    await workflow.destroy();
    logger.info('Module workflow deleted successfully', { workflowId: id });
  } catch (error) {
    logger.error('Failed to delete module workflow:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to delete module workflow', 500);
  }
};

// Toggle workflow active status
export const toggleWorkflowStatus = async (
  id: string,
  active: boolean,
  req?: IAuthRequest
): Promise<IModuleWorkflow> => {
  try {
    const workflow = await ModuleWorkflow.findByPk(id);
    if (!workflow) {
      throw new AppError('Module workflow not found', 404);
    }

    const updateData: any = {
      active,
      updated_by: req?.user?.userId || null
    };

    await workflow.update(updateData);

    const updatedWorkflow = await ModuleWorkflow.findByPk(id, {
      include: [
        { association: 'module', attributes: ['id', 'name', 'key'] },
        { association: 'allowedRole', attributes: ['id', 'name'] }
      ]
    });

    logger.info(`Module workflow ${active ? 'activated' : 'deactivated'} successfully`, { workflowId: id });
    return updatedWorkflow!.toJSON();
  } catch (error) {
    logger.error('Failed to toggle workflow status:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to toggle workflow status', 500);
  }
};
