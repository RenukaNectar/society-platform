import { IApiResponse } from "../types";
import { Response } from "express";

export const returnResponse = (res: Response) => {
    const ok = (message: string, data: any) => {
        const response: IApiResponse<any> = {
            success: true,
            message: message,
            data: data,
            version: 'v1',
            timestamp: new Date().toISOString()
        }
        return res.status(200).json(response);
    }
    const error = (message: string, data: any) => {
        const response: IApiResponse<any> = {
            success: false,
            message: message,
            data: data,
            version: 'v1',
            timestamp: new Date().toISOString()
        }
        return res.status(400).json(response);
    }
    return {
        ok,
        error
    }
}