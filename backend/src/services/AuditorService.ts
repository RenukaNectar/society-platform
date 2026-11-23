import Auditor from '../models/Auditor';
import logger from '../utils/logger';
import { AppError } from '../utils/errors';
import { returnResponse } from '../utils/response';

export const getAuditors = async () => {
    try {
        
        const auditors = await Auditor.findAll({ order: [['created_at', 'DESC']] });
        return auditors;
    } catch (error: any) {
        logger.error('Get auditors error:', error);
        return returnResponse(error.message).error('Failed to get auditors', null);
    }
};  

export const createAuditorService = async (name: string, address: string, mobile1: string, mobile2: string, email: string[]) => {
    try {
        const auditor = await Auditor.create({ name, address, mobile1, mobile2, email });
        return auditor;
    } catch (error: any) {
        logger.error('Create auditor error:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return returnResponse(error.message).error('An auditor with this information already exists', null);
        }
        return returnResponse(error.message).error('Failed to create auditor', null);
    }
};

export const updateAuditorService = async (id: string, name: string, address: string, mobile1: string, mobile2: string, email: string[]) => {
    try {
        const existingAuditor = await Auditor.findByPk(id);
        if (!existingAuditor) {
            throw new AppError('Auditor not found', 404);
        }
        
        const auditor = await Auditor.update({ name, address, mobile1, mobile2, email }, { where: { id } });
        return auditor;
    } catch (error: any) {
        logger.error('Update auditor error:', error);
       
        if (error.name === 'SequelizeUniqueConstraintError') {
            throw new AppError('An auditor with this information already exists', 400);
        }
        throw new AppError('Failed to update auditor', 500);
    }
};

export const deleteAuditorService = async (id: string) => {
    try {
        const existingAuditor = await Auditor.findByPk(id);
        if (!existingAuditor) {
           throw new AppError('Auditor not found', 404);
        }
        
        const auditor = await Auditor.destroy({ where: { id } });
        return auditor;
    } catch (error: any) {
        logger.error('Delete auditor error:', error);
        return returnResponse(error.message).error('Failed to delete auditor', null);
    }
};

export const getAuditorByIdService = async (id: string) => {    
    try {
        const auditor = await Auditor.findByPk(id);
        return auditor;
    } catch (error: any) {
        logger.error('Get auditor by id error:', error);
        return returnResponse(error.message).error('Failed to get auditor by id', null);
    }
};