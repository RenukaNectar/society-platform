import { Op } from 'sequelize';
import Status from '../models/Status';
import { IStatus, IStatusCreate, IStatusUpdate } from '../types';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';


// Create status
export const createStatus = async (statusData: IStatusCreate): Promise<IStatus> => {
  try {
    const status = await Status.create(statusData);
    logger.info('Status created successfully', { statusId: status.id, key: status.key });
    

    
    return status.toJSON();
  } catch (error) {
    logger.error('Failed to create status:', error);
    throw new AppError('Failed to create status', 500);
  }
};

// Find status by ID
export const findStatusById = async (id: string): Promise<IStatus | null> => {
  try {
    const status = await Status.findByPk(id);
    return status ? status.toJSON() : null;
  } catch (error) {
    logger.error('Failed to find status by ID:', error);
    throw new AppError('Failed to find status', 500);
  }
};

// Find status by key
export const findStatusByKey = async (key: string): Promise<IStatus | null> => {
  try {
    const status = await Status.findOne({
      where: { key, is_active: true }
    });
    return status ? status.toJSON() : null;
  } catch (error) {
    logger.error('Failed to find status by key:', error);
    throw new AppError('Failed to find status', 500);
  }
};

// Get all statuses
export const getAllStatuses = async (
  page: number = 1,
  limit: number = 50,
  search?: string,
  isActive?: boolean
): Promise<{
  statuses: IStatus[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  try {
    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { key: { [Op.like]: `%${search}%` } },
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    if (isActive !== undefined) {
      whereClause.is_active = isActive;
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await Status.findAndCountAll({
      where: whereClause,
      order: [['key', 'ASC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);
    return {
      statuses: rows.map(row => row.toJSON()),
      total: count,
      page,
      limit,
      totalPages
    };
  } catch (error) {
    logger.error('Failed to get all statuses:', error);
    throw new AppError('Failed to get statuses', 500);
  }
};

// Get active statuses only
export const getActiveStatuses = async (): Promise<IStatus[]> => {
  try {
    const statuses = await Status.findAll({
      where: { is_active: true },
      order: [['key', 'ASC']]
    });
    return statuses.map(status => status.toJSON());
  } catch (error) {
    logger.error('Failed to get active statuses:', error);
    throw new AppError('Failed to get active statuses', 500);
  }
};

// Update status
export const updateStatus = async (id: string, updateData: IStatusUpdate): Promise<IStatus> => {
  try {
    const status = await Status.findByPk(id);
    if (!status) {
      throw new AppError('Status not found', 404);
    }

    await status.update(updateData);
    logger.info('Status updated successfully', { statusId: id, key: status.key });
    

    
    return status.toJSON();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('Failed to update status:', error);
    throw new AppError('Failed to update status', 500);
  }
};

// Toggle status active state
export const toggleStatusActive = async (id: string, isActive: boolean): Promise<IStatus> => {
  try {
    const status = await Status.findByPk(id);
    if (!status) {
      throw new AppError('Status not found', 404);
    }

    await status.update({ is_active: isActive });
    logger.info('Status active state toggled', { statusId: id, key: status.key, isActive });
    

    
    return status.toJSON();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('Failed to toggle status active state:', error);
    throw new AppError('Failed to toggle status active state', 500);
  }
};

// Delete status
export const deleteStatus = async (id: string): Promise<void> => {
  try {
    const status = await Status.findByPk(id);
    if (!status) {
      throw new AppError('Status not found', 404);
    }

    await status.destroy();
    logger.info('Status deleted successfully', { statusId: id, key: status.key });
    

  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('Failed to delete status:', error);
    throw new AppError('Failed to delete status', 500);
  }
};

// Create default statuses for society registration
export const createDefaultStatuses = async (createdBy: string): Promise<void> => {
  try {
    const defaultStatuses = [
      {
        key: 'pending',
        title: 'Pending',
        description: 'Application is pending review',
      },
      {
        key: 'requested',
        title: 'Requested',
        description: 'Application has been requested',
      },
      {
        key: 'approved',
        title: 'Approved',
        description: 'Application has been approved',
      },
      {
        key: 'rejected',
        title: 'Rejected',
        description: 'Application has been rejected',
      },
      {
        key: 'cancelled',
        title: 'Cancelled',
        description: 'Application has been cancelled',
      },
      {
        key: 'registrar_approved',
        title: 'Registrar Approved',
        description: 'Application has been approved by registrar',
      },
      {
        key: 'registrar_rejected',
        title: 'Registrar Rejected',
        description: 'Application has been rejected by registrar',
      },
      {
        key: 'hearing_required',
        title: 'Hearing Required',
        description: 'Application requires a hearing',
      },
      {
        key: 'hearing_resolved',
        title: 'Hearing Resolved',
        description: 'Hearing has been resolved',
      }
    ];

    for (const statusData of defaultStatuses) {
      const existingStatus = await Status.findOne({ where: { key: statusData.key } });
      if (!existingStatus) {
        await Status.create(statusData);
        logger.info('Default status created', { key: statusData.key });
      }
    }

    logger.info('Default statuses creation completed');
  } catch (error) {
    logger.error('Failed to create default statuses:', error);
    throw new AppError('Failed to create default statuses', 500);
  }
};

// Get status statistics
export const getStatusStats = async (): Promise<{
  total: number;
  active: number;
  inactive: number;
}> => {
  try {
    const [total, active, inactive] = await Promise.all([
      Status.count(),
      Status.count({ where: { is_active: true } }),
      Status.count({ where: { is_active: false } })
    ]);

    return {
      total,
      active,
      inactive
    };
  } catch (error) {
    logger.error('Failed to get status statistics:', error);
    throw new AppError('Failed to get status statistics', 500);
  }
}; 