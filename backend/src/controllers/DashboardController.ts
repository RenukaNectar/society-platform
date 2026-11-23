
import logger from "../utils/logger";
import { Response } from "express";
import { returnResponse } from "../utils/response";
import { getApplicationsDataByRole, testDatabaseConnection, getAvailableStatuses, getDistrictWiseSocietyGraphData } from "../services/DashboardService";
import { IAuthRequest } from "../types";


export const testDatabaseController = async (req: IAuthRequest, res: Response) => {
    try {
        logger.info('Testing database connection from controller');
        const result = await testDatabaseConnection();
        return returnResponse(res).ok('Database test successful', result);
    } catch (error) {
        logger.error('Database test error:', error);
        return returnResponse(res).error('Database test failed', null);
    }
};


// get status count for dashboard by role
export const getApplicationsDataByRoleController = async (req: IAuthRequest, res: Response) => {
    try {
        // Get role from authenticated user
        if (!req.user || !req.user.role) {
            return returnResponse(res).error('User role not found', null);
        }

        const role = req.user.role;

        // Get status filter from request body
        const statusFilter = req.body.status ?
            (Array.isArray(req.body.status) ? req.body.status as (string | number)[] : [req.body.status as string | number]) :
            undefined;

        logger.info(`Status filter requested: ${statusFilter ? statusFilter.join(', ') : 'none'}`);

        const applicationsData = await getApplicationsDataByRole(role, statusFilter, req.user.district_id, req.user.role);

        return returnResponse(res).ok('Applications data retrieved successfully', applicationsData);
    } catch (error: any) {
        logger.error('Get applications data error:', error);
        return returnResponse(res).error('Failed to get applications data', error.message);
    }
};

export const getAvailableStatusesController = async (req: IAuthRequest, res: Response) => {
    try {
        const statuses = await getAvailableStatuses();
        return returnResponse(res).ok('Available statuses retrieved successfully', statuses);
    } catch (error) {
        logger.error('Get available statuses error:', error);
        return returnResponse(res).error('Failed to get available statuses', null);
    }
};

export const getDistrictWiseSocietyGraphController = async (req: IAuthRequest, res: Response) => {
    try {
        // Get role from authenticated user
        if (!req.user || !req.user.role) {
            return returnResponse(res).error('User role not found', null);
        }

        const role = req.user.role;

        // Get year from query parameters (optional)
        const year = req.query.year ? parseInt(req.query.year as string) : undefined;

        logger.info(`District-wise society graph requested for role: ${role}, year: ${year || 'current'}, district: ${req.user.district_id || 'none'}`);

        const graphData = await getDistrictWiseSocietyGraphData(role, year, req.user.district_id, req.user.role);

        return returnResponse(res).ok('District-wise society graph data retrieved successfully', graphData);
    } catch (error) {
        logger.error('Get district-wise society graph error:', error);
        return returnResponse(res).error('Failed to get district-wise society graph data', null);
    }
};

