import { AppError } from "../utils/errors";
import logger from "../utils/logger";
import {
  getAllWaterBodyTypes,
  getWaterBodyTypeById,
} from "../services/WaterBodyTypeService";
import {
  getAllStates,
  getStateById,
  getStateByCode,
} from "../services/StateService";
import { getAllSectorOfOperations } from "../services/SectorOfOperationService";
import { getAllRegistrationAuthorities } from "../services/RegistrationAuthorityService";
import { getAllDistricts } from "../services/DistrictService";
import { getAllCooperativeSocietyTypes } from "../services/CooperativeSocietyTypeService";
import { getAllSocietyTypes, getSocietyTypeById } from "../services/SocietyTypeService";
import {
  getAllBlocks,
  getBlocksByStateCode,
  getBlocksByStateAndDistrictCode,
} from "../services/BlockService";
import {
  getAllDistrictsBlocksGpVillages,
  getAllGramPanchayats,
  getDistrictsByStateCode,
  getGramPanchayatsByBlockCode,
  getVillagesByGramPanchayatCode,
  getDistrictsByState,
  getBlocksByDistrict
} from "../services/DistrictsBlocksGpVillageService";
import { getAllBanks, getBanksByFilters } from "../services/BankService";
import { getAllFunctionalStatuses } from "../services/FunctionalStatusService";
import { getAllLocationTypes } from "../services/LocationTypeService";
import { returnResponse } from "../utils/response";
import { Request, Response } from "express";
import { getAllSectorOfOperationsTypes } from "../services/SectorOfOperationsTypeService";
import {
  getAllAreaOfOperationLevels,
  getAreaOfOperationLevelById,
} from '../services/AreaOfOperationLevelService';
import { getAllUrbanLocalBodies } from "../services/UrbanLocalBodyService";
import { getAllUrbanLocalBodiesWards } from "../services/UrbanLocalBodiesWardService";
import { getAllMisappropriationLevels, getMisappropriationLevelById } from "../services/MisappropriationLevelService";
import { getAllCostOfManagementTypes, getCostOfManagementTypeById } from "../services/CostOfManagementTypeService";
import { getAllArbitrationAuthorities, getArbitrationAuthorityById } from "../services/ArbitrationAuthorityService";
import { getAllModules } from "../services/ModuleService";

// Water Body Types
export const getWaterBodyTypesController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const result = await getAllWaterBodyTypes(page, limit, search);

    returnResponse(res).ok('Water body types retrieved successfully', {
      waterBodyTypes: result.waterBodyTypes,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Failed to get water body types:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const getWaterBodyTypeByIdController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const waterBodyType = await getWaterBodyTypeById(id);

    if (!waterBodyType) {
      throw new AppError('Water body type not found', 404);
    }

    returnResponse(res).ok('Water body type retrieved successfully', waterBodyType);
  } catch (error) {
    logger.error('Failed to get water body type:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

// States
export const getStatesController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const result = await getAllStates(page, limit, search);

    returnResponse(res).ok('States retrieved successfully', {
      states: result.states,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Failed to get states:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const getStateByIdController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const state = await getStateById(id);

    if (!state) {
      throw new AppError('State not found', 404);
    }

    returnResponse(res).ok('State retrieved successfully', state);
  } catch (error) {
    logger.error('Failed to get state:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const getStateByCodeController = async (req: Request, res: Response) => {
  try {
    const code = parseInt(req.params.code as string);
    const state = await getStateByCode(code);

    if (!state) {
      throw new AppError('State not found', 404);
    }

    returnResponse(res).ok('State retrieved successfully', state);
  } catch (error) {
    logger.error('Failed to get state by code:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

// Sector of Operations
export const getSectorOfOperationsController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;

    const result = await getAllSectorOfOperations(page, limit, search);

    returnResponse(res).ok('Sector of operations retrieved successfully', {
      sectorOfOperations: result.sectorOfOperations,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Failed to get sector of operations:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

// Registration Authorities
export const getRegistrationAuthoritiesController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const result = await getAllRegistrationAuthorities(page, limit, search);

    returnResponse(res).ok('Registration authorities retrieved successfully', {
      registrationAuthorities: result.registrationAuthorities,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Failed to get registration authorities:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

// Districts
export const getDistrictsController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const result = await getAllDistricts(page, limit, search);

    returnResponse(res).ok('Districts retrieved successfully', {
      districts: result.districts,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Failed to get districts:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const getDistrictsByStateCodeController = async (req: Request, res: Response) => {
  try {
    const stateCode = req.params.stateCode as string;
    console.log('Received state code:', stateCode, 'Type:', typeof stateCode);

    // Convert string state code to number for the service
    const stateCodeNumber = parseInt(stateCode);
    if (isNaN(stateCodeNumber)) {
      throw new AppError('Invalid state code format', 400);
    }

    const districts = await getDistrictsByStateCode(stateCodeNumber);
    console.log('Found districts:', districts.length);

    returnResponse(res).ok('Districts retrieved successfully', {
      districts
    });
  } catch (error) {
    logger.error('Failed to get districts by state code:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

// Cooperative Society Types
export const getCooperativeSocietyTypesController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const result = await getAllCooperativeSocietyTypes(page, limit, search);

    returnResponse(res).ok('Cooperative society types retrieved successfully', {
      cooperativeSocietyTypes: result.cooperativeSocietyTypes,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Failed to get cooperative society types:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

// Society Types
export const getSocietyTypesController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const result = await getAllSocietyTypes(page, limit, search);

    returnResponse(res).ok('Society types retrieved successfully', {
      societyTypes: result.societyTypes,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Failed to get society types:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const getSocietyTypeByIdController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const societyType = await getSocietyTypeById(id);

    if (!societyType) {
      throw new AppError('Society type not found', 404);
    }

    returnResponse(res).ok('Society type retrieved successfully', societyType);
  } catch (error) {
    logger.error('Failed to get society type:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

// Blocks
export const getBlocksController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const result = await getAllBlocks(page, limit, search);

    returnResponse(res).ok('Blocks retrieved successfully', {
      blocks: result.blocks,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Failed to get blocks:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const getBlocksByStateCodeController = async (req: Request, res: Response) => {
  try {
    const stateCode = parseInt(req.params.stateCode as string);
    const blocks = await getBlocksByStateCode(stateCode);

    returnResponse(res).ok('Blocks retrieved successfully', blocks);
  } catch (error) {
    logger.error('Failed to get blocks by state code:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const getBlocksByDistrictCodeController = async (req: Request, res: Response) => {
  try {
    const { stateCode, districtCode } = req.params;

    if (!stateCode || !districtCode) {
      throw new AppError('State code and district code are required', 400);
    }

    const blocks = await getBlocksByStateAndDistrictCode(
      parseInt(stateCode, 10),
      parseInt(districtCode, 10)
    );

    returnResponse(res).ok('Blocks retrieved successfully', {
      blocks
    });
  } catch (error) {
    logger.error('Failed to get blocks by district code:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

// Districts Blocks GP Villages
export const getDistrictsBlocksGpVillagesController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const state_code = Number(req.query.state_code);
    const district_code = Number(req.query.district_code);
    const block_code = Number(req.query.block_code);
    const gram_panchayat_code = Number(req.query.gram_panchayat_code);
    const village_code = Number(req.query.village_code);

    const result = await getAllDistrictsBlocksGpVillages(page, limit, search, state_code, district_code, block_code, gram_panchayat_code, village_code);

    returnResponse(res).ok('Districts blocks GP villages retrieved successfully', {
      districtsBlocksGpVillages: result.districtsBlocksGpVillages,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Failed to get districts blocks GP villages:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const getGramPanchayatsController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const state_code = Number(req.query.state_code);
    const district_code = Number(req.query.district_code);
    const block_code = Number(req.query.block_code);

    const result = await getAllGramPanchayats(page, limit, state_code, district_code, block_code);

    returnResponse(res).ok('Gram panchayats retrieved successfully', {
      gramPanchayats: result.gramPanchayats,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Failed to get gram panchayats:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

// Get gram panchayats by block code
export const getGramPanchayatsByBlockCodeController = async (req: Request, res: Response) => {
  try {
    const { stateCode, districtCode, blockCode } = req.params;

    if (!stateCode || !districtCode || !blockCode) {
      throw new AppError('State code, district code, and block code are required', 400);
    }

    const gramPanchayats = await getGramPanchayatsByBlockCode(
      parseInt(stateCode),
      parseInt(districtCode),
      parseInt(blockCode)
    );

    returnResponse(res).ok('Gram panchayats retrieved successfully', {
      gramPanchayats
    });
  } catch (error) {
    logger.error('Failed to get gram panchayats by block code:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

// Get villages by gram panchayat code
export const getVillagesByGramPanchayatCodeController = async (req: Request, res: Response) => {
  try {
    const { stateCode, districtCode, blockCode, gramPanchayatCode } = req.params;

    if (!stateCode || !districtCode || !blockCode || !gramPanchayatCode) {
      throw new AppError('State code, district code, block code, and gram panchayat code are required', 400);
    }

    const villages = await getVillagesByGramPanchayatCode(
      parseInt(stateCode),
      parseInt(districtCode),
      parseInt(blockCode),
      parseInt(gramPanchayatCode)
    );

    returnResponse(res).ok('Villages retrieved successfully', {
      villages
    });
  } catch (error) {
    logger.error('Failed to get villages by gram panchayat code:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

// Get districts by state (using state ID)
export const getDistrictsByStateController = async (req: Request, res: Response) => {
  try {
    const stateId = req.params.id as string;

    if (!stateId) {
      throw new AppError('State ID is required', 400);
    }

    const districts = await getDistrictsByState(stateId);

    returnResponse(res).ok('Districts retrieved successfully', {
      districts
    });
  } catch (error) {
    logger.error('Failed to get districts by state:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

// Get blocks by district — path param is district **code** (e.g. 787); UUID supported for legacy
export const getBlocksByDistrictController = async (req: Request, res: Response) => {
  try {
    const districtCodeParam = req.params.districtCode as string;

    if (!districtCodeParam) {
      throw new AppError('District code is required', 400);
    }

    const blocks = await getBlocksByDistrict(districtCodeParam);

    returnResponse(res).ok('Blocks retrieved successfully', {
      blocks
    });
  } catch (error) {
    logger.error('Failed to get blocks by district:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

// Banks
export const getBanksController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const result = await getAllBanks(page, limit, search);

    returnResponse(res).ok('Banks retrieved successfully', {
      banks: result.banks,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Failed to get banks:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const getBanksByFiltersController = async (req: Request, res: Response) => {
  try {
    const filters = req.query;
    const banks = await getBanksByFilters(filters);

    returnResponse(res).ok('Banks retrieved successfully', banks);
  } catch (error) {
    logger.error('Failed to get banks by filters:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

// Functional Statuses
export const getFunctionalStatusesController = async (req: Request, res: Response) => {
  try {
    const result = await getAllFunctionalStatuses();

    returnResponse(res).ok('Functional statuses retrieved successfully', {
      functionalStatuses: result.functionalStatuses,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Failed to get functional statuses:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

// Location Types
export const getLocationTypesController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const result = await getAllLocationTypes(page, limit, search);

    returnResponse(res).ok('Location types retrieved successfully', {
      locationTypes: result.locationTypes,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Failed to get location types:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

// Area of Operations
export const getAreaOfOperationsController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const result = await getAllAreaOfOperationLevels(page, limit, search);

    returnResponse(res).ok('Area of operations retrieved successfully', {
      areaOfOperations: result.areaOfOperationLevels,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Failed to get area of operations:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const getAreaOfOperationByIdController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const areaOfOperation = await getAreaOfOperationLevelById(id);

    if (!areaOfOperation) {
      throw new AppError('Area of operation level not found', 404);
    }

    returnResponse(res).ok('Area of operation retrieved successfully', areaOfOperation);
  } catch (error) {
    logger.error('Failed to get area of operation by id:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

// Sector of Operations Types
export const getSectorOfOperationsTypesController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const result = await getAllSectorOfOperationsTypes(page, limit, search);

    returnResponse(res).ok('Sector of operations types retrieved successfully', {
      sectorOfOperationsTypes: result.sectorOfOperationsTypes,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Failed to get sector of operations types:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

// Urban Local Bodies
export const getUrbanLocalBodiesController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const state_code = Number(req.query.state_code);
    const district_code = Number(req.query.district_code);

    const result = await getAllUrbanLocalBodies(page, limit, search, state_code, district_code);

    returnResponse(res).ok('Urban local bodies retrieved successfully', {
      urbanLocalBodies: result.urbanLocalBodies,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Failed to get urban local bodies:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

// Urban Local Bodies Wards
export const getUrbanLocalBodiesWardsController = async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string;
    const localBodyCodeRaw = req.query.localbody_code ?? req.query.local_body_code;
    const local_body_code = localBodyCodeRaw != null && String(localBodyCodeRaw).trim() !== ''
      ? Number(localBodyCodeRaw)
      : undefined;

    const result = await getAllUrbanLocalBodiesWards(search, local_body_code);

    returnResponse(res).ok('Urban local bodies wards retrieved successfully', {
      urbanLocalBodiesWards: result.urbanLocalBodiesWards
    });
  } catch (error) {
    logger.error('Failed to get urban local bodies wards:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

// Misappropriation Levels
export const getMisappropriationLevelsController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const result = await getAllMisappropriationLevels(page, limit, search);

    returnResponse(res).ok('Misappropriation levels retrieved successfully', {
      misappropriationLevels: result.misappropriationLevels,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Failed to get misappropriation levels:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const getMisappropriationLevelByIdController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id) {
      throw new AppError('ID parameter is required', 400);
    }
    const misappropriationLevel = await getMisappropriationLevelById(id);

    if (!misappropriationLevel) {
      throw new AppError('Misappropriation level not found', 404);
    }

    returnResponse(res).ok('Misappropriation level retrieved successfully', misappropriationLevel);
  } catch (error) {
    logger.error('Failed to get misappropriation level:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

// Cost of Management Types
export const getCostOfManagementTypesController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const result = await getAllCostOfManagementTypes(page, limit, search);

    returnResponse(res).ok('Cost of management types retrieved successfully', {
      costOfManagementTypes: result.costOfManagementTypes,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Failed to get cost of management types:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const getCostOfManagementTypeByIdController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id) {
      throw new AppError('ID parameter is required', 400);
    }
    const costOfManagementType = await getCostOfManagementTypeById(id);

    if (!costOfManagementType) {
      throw new AppError('Cost of management type not found', 404);
    }

    returnResponse(res).ok('Cost of management type retrieved successfully', costOfManagementType);
  } catch (error) {
    logger.error('Failed to get cost of management type:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

// Arbitration Authorities
export const getArbitrationAuthoritiesController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const result = await getAllArbitrationAuthorities(page, limit, search);

    returnResponse(res).ok('Arbitration authorities retrieved successfully', {
      arbitrationAuthorities: result.arbitrationAuthorities,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Failed to get arbitration authorities:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

export const getArbitrationAuthorityByIdController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id) {
      throw new AppError('ID parameter is required', 400);
    }
    const arbitrationAuthority = await getArbitrationAuthorityById(id);

    if (!arbitrationAuthority) {
      throw new AppError('Arbitration authority not found', 404);
    }

    returnResponse(res).ok('Arbitration authority retrieved successfully', arbitrationAuthority);
  } catch (error) {
    logger.error('Failed to get arbitration authority:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};

// Modules
export const getModulesController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const active = req.query.active !== undefined ? req.query.active === 'true' : undefined;

    const result = await getAllModules(page, limit, search, active);

    returnResponse(res).ok('Modules retrieved successfully', {
      modules: result.modules,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.page < result.totalPages,
        hasPrev: result.page > 1
      }
    });
  } catch (error) {
    logger.error('Failed to get modules:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Internal server error', 500);
  }
};