import { getAllStatuses } from "../services/StatusService";
import { IAuthRequest } from "../types";
import { returnResponse } from "../utils/response";
import { Response } from "express";

export const getStatusesController = async (req: IAuthRequest, res: Response) => {
    const statuses = await getAllStatuses()
    returnResponse(res).ok('All Statuses fetched successfully', statuses)
}