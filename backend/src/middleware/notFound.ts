import { Request, Response } from 'express';
import { IApiResponse } from '../types';

export const notFound = (req: Request, res: Response): void => {
  const response: IApiResponse = {
    success: false,
    message: `Route ${req.originalUrl} not found`,
    errors: [`The requested endpoint ${req.method} ${req.originalUrl} does not exist`],
    version: 'v1',
    timestamp: new Date().toISOString()
  };

  res.status(404).json(response);
}; 