import { Request, Response } from 'express';
import logger from '../utils/logger';
import { returnResponse } from '../utils/response';
import { getAuditors, createAuditorService, updateAuditorService, deleteAuditorService, getAuditorByIdService } from '../services/AuditorService';   

export const getAuditorsController = async (req: Request, res: Response) => {
    try {
        const auditors = await getAuditors();
        return returnResponse(res).ok('Auditors retrieved successfully', auditors);
    } catch (error: any) {
        logger.error('Get auditors error:', error);
        return returnResponse(res).error('Failed to get auditors', null);
    }
};

export const createAuditorController = async (req: Request, res: Response) => {
    try {
        const { name, address, mobile1, mobile2, email } = req.body;
        const auditor = await createAuditorService(name, address, mobile1, mobile2, email);
        return returnResponse(res).ok('Auditor created successfully', auditor);
    } catch (error: any) {
        logger.error('Create auditor error:', error);
       return returnResponse(res).error('Failed to create auditor', null);
    }
};

export const updateAuditorController = async (req: Request, res: Response) => {
    try {
        const { name, address, mobile1, mobile2, email } = req.body;
        const auditor = await updateAuditorService(req.params.id as string, name, address, mobile1, mobile2, email);
        return returnResponse(res).ok('Auditor updated successfully', auditor);
    } catch (error: any) {
        logger.error('Update auditor error:', error);
        return returnResponse(res).error('Failed to update auditor', null);
    }
};

export const deleteAuditorController = async (req: Request, res: Response) => {
    try {
        const auditor = await deleteAuditorService(req.params.id as string);
        return returnResponse(res).ok('Auditor deleted successfully', auditor);
    } catch (error: any) {
        logger.error('Delete auditor error:', error);
        return returnResponse(res).error('Failed to delete auditor', null);
    }
};

export const getAuditorByIdController = async (req: Request, res: Response) => {
    try {
        const auditor = await getAuditorByIdService(req.params.id as string);
        if (!auditor) {
            return returnResponse(res).error('Auditor not found', null);
        }
        return returnResponse(res).ok('Auditor retrieved successfully', auditor);
    } catch (error: any) {
        logger.error('Get auditor by id error:', error);
        return returnResponse(res).error('Failed to get auditor', null);
    }
};
