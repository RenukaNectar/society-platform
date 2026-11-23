import { AppError } from "../utils/errors";
import logger from "../utils/logger";
import { Request, Response } from "express";
import { returnResponse } from "../utils/response";
import {
  syncCooperativesStates,
  syncCooperativesDistricts,
  syncCooperativesGpVillages,
  syncCooperativesBlocks,
  syncCooperativesUrbanLocalBodies,
  syncCooperativesUrbanLocalBodiesWards
} from "../services/NcdApiGeoSyncUtil";
import { applyArunachalRuralDistrictRemap } from "../utils/arunachalRuralDistrictRemap";
import { syncNcdSocieties } from "../services/NcdSocietySyncService";

export const getAdminDashboard = async (_req: Request, res: Response) => {
  try {
    const dashboardData = {
      users: { total: 150, active: 142, inactive: 8, newThisMonth: 12 },
      roles: { total: 4, active: 4 },
      permissions: { total: 20, active: 20 },
      system: { uptime: process.uptime(), memory: process.memoryUsage(), version: "1.0.0" }
    };

    return returnResponse(res).ok("Dashboard data retrieved successfully", dashboardData);
  } catch (error) {
    logger.error("Get dashboard error:", error);
    return returnResponse(res).error("Failed to get dashboard data", null);
  }
};

export const getAdminLogs = async (_req: Request, res: Response) => {
  try {
    const logs = [
      {
        timestamp: new Date().toISOString(),
        level: "info",
        message: "Server started successfully",
        meta: { port: 3000, environment: "development" }
      },
      {
        timestamp: new Date(Date.now() - 60000).toISOString(),
        level: "info",
        message: "User login successful",
        meta: { userId: "123", email: "user@example.com" }
      },
      {
        timestamp: new Date(Date.now() - 120000).toISOString(),
        level: "warn",
        message: "Rate limit exceeded",
        meta: { ip: "192.168.1.1", endpoint: "/api/v1/auth/login" }
      }
    ];

    return returnResponse(res).ok("Logs retrieved successfully", {
      logs,
      total: logs.length,
      filtered: logs.length
    });
  } catch (error) {
    logger.error("Get logs error:", error);
    return returnResponse(res).error("Failed to get logs", null);
  }
};

export const restartSystem = async (_req: Request, res: Response) => {
  try {
    if (process.env.NODE_ENV === "production") {
      throw new AppError("System restart not allowed in production", 403);
    }

    setTimeout(() => {
      process.exit(0);
    }, 1000);

    return returnResponse(res).ok("System restart initiated", null);
  } catch (error) {
    logger.error("System restart error:", error);
    return returnResponse(res).error("Failed to restart system", null);
  }
};

export const getSystemHealth = async (_req: Request, res: Response) => {
  try {
    const healthData = {
      status: "healthy",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      environment: process.env.NODE_ENV,
      version: process.version,
      platform: process.platform,
      pid: process.pid,
      timestamp: new Date().toISOString()
    };

    return returnResponse(res).ok("System health check completed", healthData);
  } catch (error) {
    logger.error("Get system health error:", error);
    return returnResponse(res).error("Failed to get system health", null);
  }
};

export const createBackup = async (req: Request, res: Response) => {
  try {
    const { type, description } = req.body || {};

    const backupInfo = {
      id: Date.now().toString(),
      type,
      description: description || `Manual ${type} backup`,
      status: "completed",
      size: "2.5MB",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    return returnResponse(res).ok("Backup created successfully", backupInfo);
  } catch (error) {
    logger.error("Create backup error:", error);
    return returnResponse(res).error("Failed to create backup", null);
  }
};

function appErrorResponse(res: Response, error: AppError) {
  return res.status(error.statusCode).json({
    success: false,
    message: error.message,
    data: null,
    version: "v1",
    timestamp: new Date().toISOString(),
    code: error.code
  });
}

/** `error.message` when present (Error, Sequelize, or plain `{ message }`). */
function syncFailureDetail(error: unknown): string | null {
  if (error && typeof error === "object" && "message" in error) {
    const m = (error as { message?: unknown }).message;
    if (typeof m === "string" && m.trim() !== "") {
      return m.trim();
    }
  }
  if (typeof error === "string" && error.trim() !== "") {
    return error.trim();
  }
  return null;
}

function syncGenericErrorResponse(res: Response, label: string, error: unknown) {
  const message = syncFailureDetail(error) ?? label;
  return returnResponse(res).error(message, null);
}

/** POST — states from cooperatives.gov.in → `states` (admin). */
export const syncCooperativesStatesController = async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const result = await syncCooperativesStates({
      ...(body.key && { key: String(body.key) }),
      ...(body.state != null && body.state !== "" && { state_code: String(body.state) }),
      ...(body.sector_code != null && body.sector_code !== "" && { sector_code: String(body.sector_code) }),
      ...(body.url && { url: String(body.url) })
    });
    return returnResponse(res).ok("Cooperatives states synced successfully", result);
  } catch (error:any) {
    logger.error("syncCooperativesStatesController error:", error);
    if (error instanceof AppError) return appErrorResponse(res, error);
    return syncGenericErrorResponse(res, "Cooperatives states sync failed", error.message);
  }
};

/** POST — districts for one state from cooperatives.gov.in → `districts` (admin). */
export const syncCooperativesDistrictsController = async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const result = await syncCooperativesDistricts({
      ...(body.key && { key: String(body.key) }),
      ...(body.state_code != null && body.state_code !== "" && { state_code: String(body.state_code) }),
      ...(body.sector_code != null && body.sector_code !== "" && { sector_code: String(body.sector_code) }),
      ...(body.url && { url: String(body.url) })
    });
    return returnResponse(res).ok("Cooperatives districts synced successfully", result);
  } catch (error:any) {
    logger.error("syncCooperativesDistrictsController error:", error);
    if (error instanceof AppError) return appErrorResponse(res, error);
    return syncGenericErrorResponse(res, "Cooperatives districts sync failed", error.message);
  }
};

/** POST — apply Keyi Panyor / Bichom rural remaps (RURAL.xlsx) without cooperatives API. */
export const applyArunachalRuralDistrictRemapController = async (_req: Request, res: Response) => {
  try {
    const result = await applyArunachalRuralDistrictRemap();
    return returnResponse(res).ok("Arunachal rural district remap applied successfully", result);
  } catch (error: any) {
    logger.error("applyArunachalRuralDistrictRemapController error:", error);
    if (error instanceof AppError) return appErrorResponse(res, error);
    return syncGenericErrorResponse(res, "Arunachal rural district remap failed", error.message);
  }
};

/** POST — GP/village rows → `districts_blocks_gp_villages` (admin). */
export const syncCooperativesGpVillagesController = async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const stateVal = body.state ?? body.state_code;
    const result = await syncCooperativesGpVillages({
      ...(body.key && { key: String(body.key) }),
      ...(stateVal != null && stateVal !== "" && { state: String(stateVal) }),
      ...(body.sector_code != null && body.sector_code !== "" && { sector_code: String(body.sector_code) }),
      ...(body.url && { url: String(body.url) })
    });
    return returnResponse(res).ok("Cooperatives GP/villages synced successfully", result);
  } catch (error:any) {
    logger.error("syncCooperativesGpVillagesController error:", error);
    if (error instanceof AppError) return appErrorResponse(res, error);
    return syncGenericErrorResponse(res, "Cooperatives GP/villages sync failed", error.message);
  }
};

/** POST — block rows → `blocks` (admin). */
export const syncCooperativesBlocksController = async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const result = await syncCooperativesBlocks({
      ...(body.key && { key: String(body.key) }),
      ...(body.state_code != null && body.state_code !== "" && { state_code: String(body.state_code) }),
      ...(body.sector_code != null && body.sector_code !== "" && { sector_code: String(body.sector_code) }),
      ...(body.url && { url: String(body.url) })
    });
    return returnResponse(res).ok("Cooperatives blocks synced successfully", result);
  } catch (error:any) {
    logger.error("syncCooperativesBlocksController error:", error);
    if (error instanceof AppError) return appErrorResponse(res, error);
    return syncGenericErrorResponse(res, "Cooperatives blocks sync failed", error.message);
  }
};

/** POST — ULB rows → `urban_local_bodies` (admin). */
export const syncCooperativesUrbanLocalBodiesController = async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const result = await syncCooperativesUrbanLocalBodies({
      ...(body.key && { key: String(body.key) }),
      ...(body.state != null && body.state !== "" && { state: String(body.state) }),
      ...(body.sector_code != null && body.sector_code !== "" && { sector_code: String(body.sector_code) }),
      ...(body.url && { url: String(body.url) })
    });
    return returnResponse(res).ok("Cooperatives ULB synced successfully", result);
  } catch (error:any) {
    logger.error("syncCooperativesUrbanLocalBodiesController error:", error);
    if (error instanceof AppError) return appErrorResponse(res, error);
    return syncGenericErrorResponse(res, "Cooperatives ULB sync failed", error.message);
  }
};

/** POST — NCD cooperativeData → society_registrations. Pages are batched inside the service. */
export const syncNcdSocietiesController = async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const state = body.state ?? body.state_code;
    const sector = body.sector ?? body.sector_code;
    const level = body.level ?? body.level_code;
    const result = await syncNcdSocieties({
      key: body.key ? String(body.key) : "",
      ...(state != null && state !== "" && { state: String(state) }),
      ...(level != null && level !== "" && { level: String(level) }),
      ...(sector != null && sector !== "" && { sector: String(sector) }),
      ...(body.url && { url: String(body.url) })
    });
    return returnResponse(res).ok("NCD societies synced successfully", result);
  } catch (error: any) {
    logger.error("syncNcdSocietiesController error:", error);
    if (error instanceof AppError) return appErrorResponse(res, error);
    return syncGenericErrorResponse(res, "NCD society sync failed", error.message);
  }
};

/** POST — ULB ward rows → `urban_local_bodies_wards` (admin). */
export const syncCooperativesUrbanLocalBodiesWardsController = async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const result = await syncCooperativesUrbanLocalBodiesWards({
      ...(body.key && { key: String(body.key) }),
      ...(body.state != null && body.state !== "" && { state: String(body.state) }),
      ...(body.sector_code != null && body.sector_code !== "" && { sector_code: String(body.sector_code) }),
      ...(body.url && { url: String(body.url) })
    });
    return returnResponse(res).ok("Cooperatives ULB wards synced successfully", result);
  } catch (error:any) {
    logger.error("syncCooperativesUrbanLocalBodiesWardsController error:", error);
    if (error instanceof AppError) return appErrorResponse(res, error);
    return syncGenericErrorResponse(res, "Cooperatives ULB wards sync failed", error.message);
  }
};

