import { Router } from 'express';
import { validateRequest } from '../../middleware/auth';
import {
  getWaterBodyTypesController,
  getWaterBodyTypeByIdController,
  getStatesController,
  getStateByIdController,
  getStateByCodeController,
  getSectorOfOperationsController,
  getRegistrationAuthoritiesController,
  getDistrictsController,
  getDistrictsByStateCodeController,
  getCooperativeSocietyTypesController,
  getSocietyTypesController,
  getSocietyTypeByIdController,
  getBlocksController,
  getBlocksByStateCodeController,
  getBlocksByDistrictCodeController,
  getDistrictsBlocksGpVillagesController,
  getDistrictsByStateCodeController as getDistrictsByStateCodeFromGpController,
  getBlocksByDistrictCodeController as getBlocksByDistrictCodeFromGpController,
  getGramPanchayatsController,
  getGramPanchayatsByBlockCodeController,
  getVillagesByGramPanchayatCodeController,
  getDistrictsByStateController,
  getBlocksByDistrictController,
  getBanksController,
  getBanksByFiltersController,
  getFunctionalStatusesController,
  getLocationTypesController,
  getAreaOfOperationsController,
  getAreaOfOperationByIdController,
  getSectorOfOperationsTypesController,
  getUrbanLocalBodiesController,
  getUrbanLocalBodiesWardsController,
  getMisappropriationLevelsController,
  getMisappropriationLevelByIdController,
  getCostOfManagementTypesController,
  getCostOfManagementTypeByIdController,
  getArbitrationAuthoritiesController,
  getArbitrationAuthorityByIdController,
  getModulesController
} from '../../controllers/masterDataController';
import {
  masterDataQueryValidation,
  idValidation,
  uuidValidation,
  codeValidation,
  stateCodeValidation,
  districtCodeValidation,
  districtCodeParamValidation
} from '../../validations/masterData';

const router = Router();

// Water Body Types Routes
router.get('/water-body-types',
  masterDataQueryValidation,
  validateRequest,
  getWaterBodyTypesController
);

router.get('/water-body-types/:id',
  idValidation,
  validateRequest,
  getWaterBodyTypeByIdController
);

// States Routes
router.get('/states',
  masterDataQueryValidation,
  validateRequest,
  getStatesController
);

router.get('/states/:id',
  idValidation,
  validateRequest,
  getStateByIdController
);

router.get('/states/code/:code',
  codeValidation,
  validateRequest,
  getStateByCodeController
);

// Sector of Operations Routes
router.get('/sector-of-operations',
  masterDataQueryValidation,
  validateRequest,
  getSectorOfOperationsController
);

// Sector of Operations Types Routes
router.get('/sector-of-operations-types',
  masterDataQueryValidation,
  validateRequest,
  getSectorOfOperationsTypesController
);

// Registration Authorities Routes
router.get('/registration-authorities',
  masterDataQueryValidation,
  validateRequest,
  getRegistrationAuthoritiesController
);

// Districts Routes
router.get('/districts',
  masterDataQueryValidation,
  validateRequest,
  getDistrictsController
);

router.get('/districts/state/:stateCode',
  stateCodeValidation,
  validateRequest,
  getDistrictsByStateCodeController
);

// Get districts by state ID (for frontend compatibility)
router.get('/districts/by-state/:id',
  idValidation,
  validateRequest,
  getDistrictsByStateController
);

// Cooperative Society Types Routes
router.get('/cooperative-society-types',
  masterDataQueryValidation,
  validateRequest,
  getCooperativeSocietyTypesController
);

// Society Types Routes
router.get('/society-types',
  masterDataQueryValidation,
  validateRequest,
  getSocietyTypesController
);

router.get('/society-types/:id',
  uuidValidation,
  validateRequest,
  getSocietyTypeByIdController
);

// Blocks Routes
router.get('/blocks',
  masterDataQueryValidation,
  validateRequest,
  getBlocksController
);

router.get('/blocks/state/:stateCode',
  stateCodeValidation,
  validateRequest,
  getBlocksByStateCodeController
);

router.get('/blocks/district/:stateCode/:districtCode',
  districtCodeValidation,
  validateRequest,
  getBlocksByDistrictCodeController
);

// Blocks by district **code** in path (e.g. /by-district/787); legacy UUID still supported
router.get('/blocks/by-district/:districtCode',
  districtCodeParamValidation,
  validateRequest,
  getBlocksByDistrictController
);

router.get('/gram-panchayats',
  masterDataQueryValidation,
  validateRequest,
  getGramPanchayatsController
);

// Districts Blocks GP Villages Routes
router.get('/districts-blocks-gp-villages',
  masterDataQueryValidation,
  validateRequest,
  getDistrictsBlocksGpVillagesController
);

// New cascading location routes
router.get('/districts-blocks-gp-villages/districts/:stateCode',
  stateCodeValidation,
  validateRequest,
  getDistrictsByStateCodeFromGpController
);

router.get('/districts-blocks-gp-villages/blocks/:stateCode/:districtCode',
  stateCodeValidation,
  districtCodeValidation,
  validateRequest,
  getBlocksByDistrictCodeFromGpController
);

router.get('/districts-blocks-gp-villages/gram-panchayats/:stateCode/:districtCode/:blockCode',
  stateCodeValidation,
  districtCodeValidation,
  validateRequest,
  getGramPanchayatsByBlockCodeController
);

router.get('/districts-blocks-gp-villages/villages/:stateCode/:districtCode/:blockCode/:gramPanchayatCode',
  stateCodeValidation,
  districtCodeValidation,
  validateRequest,
  getVillagesByGramPanchayatCodeController
);

// Banks Routes
router.get('/banks',
  masterDataQueryValidation,
  validateRequest,
  getBanksController
);

router.get('/banks/filters',
  validateRequest,
  getBanksByFiltersController
);

router.get('/functional-statuses',
  masterDataQueryValidation,
  validateRequest,
  getFunctionalStatusesController
);

router.get('/location-types',
  masterDataQueryValidation,
  validateRequest,
  getLocationTypesController
);

router.get('/area-of-operations',
  masterDataQueryValidation,
  validateRequest,
  getAreaOfOperationsController
);

router.get('/area-of-operations/:id',
  uuidValidation,
  validateRequest,
  getAreaOfOperationByIdController
);

// Urban Local Bodies Routes
router.get('/urban-local-bodies',
  masterDataQueryValidation,
  validateRequest,
  getUrbanLocalBodiesController
);

// Urban Local Bodies Wards Routes
router.get('/urban-local-bodies-wards',
  masterDataQueryValidation,
  validateRequest,
  getUrbanLocalBodiesWardsController
);

// Misappropriation Levels Routes
router.get('/misappropriation-levels',
  masterDataQueryValidation,
  validateRequest,
  getMisappropriationLevelsController
);

router.get('/misappropriation-levels/:id',
  uuidValidation,
  validateRequest,
  getMisappropriationLevelByIdController
);

// Cost of Management Types Routes
router.get('/cost-of-management-types',
  masterDataQueryValidation,
  validateRequest,
  getCostOfManagementTypesController
);

router.get('/cost-of-management-types/:id',
  uuidValidation,
  validateRequest,
  getCostOfManagementTypeByIdController
);

// Arbitration Authorities Routes
router.get('/arbitration-authorities',
  masterDataQueryValidation,
  validateRequest,
  getArbitrationAuthoritiesController
);

router.get('/arbitration-authorities/:id',
  uuidValidation,
  validateRequest,
  getArbitrationAuthorityByIdController
);

// Modules Routes
router.get('/modules',
  masterDataQueryValidation,
  validateRequest,
  getModulesController
);

export default router; 