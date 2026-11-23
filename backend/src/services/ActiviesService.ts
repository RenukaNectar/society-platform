import Activity from '../models/Activity';
import logger from '../utils/logger';


interface IActivityCreate {
    title: string;
    description: string;
    data: any;
    reference_id: string;
    created_by?: string | null;
}

/**
 * Create a new activity
 */
export const createActivity = async (data: IActivityCreate): Promise<Activity | null> => {
    try {
        const activity = await Activity.create({
            title: data.title,
            description: data.description,
            data: data.data,
            reference_id: data.reference_id,
            created_by: data.created_by,
        });
        logger.info(`Activity created successfully: ${activity.id}`);
        return activity;
    } catch (error) {
        logger.error(`Failed to create activity: ${error}`);
        return null;
    }
}

/**
 * Get activity by ID
 */
export const getActivityById = async (id: string): Promise<Activity | null> => {
    const activity = await Activity.findByPk(id);
    logger.info(`Activity fetched successfully: ${activity?.id}`);
    return activity;
}

/**
 * Get all activities
 */
export const getActivities = async (): Promise<Activity[] | null> => {
    const activities = await Activity.findAll();
    logger.info(`Activities fetched successfully: ${activities.length}`);
    return activities;
}