import { api, PaginationParams } from '../../api';

// Master Data Types
export interface WaterBodyType {
  id: number;
  name: string;
  water_body_types_hindi: string;
  created_at: string;
  updated_at: string;
}

export interface State {
  id: number;
  name: string;
  state_code: string;
  state_ut: string;
  state_ut_hindi: string;
  created_at: string;
  updated_at: string;
}

export interface SectorOfOperation {
  id: number;
  name: string;
  description?: string;
  respective_table?: string;
  created_at: string;
  updated_at: string;
}

export interface RegistrationAuthority {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface District {
  id: number;
  name: string;
  district_code: string;
  state_code: string;
  created_at: string;
  updated_at: string;
}

export interface CooperativeSocietyType {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Block {
  id: number;
  name: string;
  block_code: string;
  block_name: string;
  state_code: string;
  district_code: string;
  block_hindi: string;
  block_local: string;
  created_at: string;
  updated_at: string;
}

export interface UrbanLocalBodies {
  id: number;
  state_name: string;
  state_code: string;
  district_name: string;
  district_code: string;
  localbody_type_code: string;
  localbody_type_name: string;
  localbody_type_name_hindi: string;
  localbody_code: string;
  local_body_name: string;
  local_body_name_hindi: string;
  created_at: string;
  updated_at: string;
}

export interface UrbanLocalBodiesWards {
  id: number;
  state_name: string;
  state_code: string;
  local_body_code: string;
  local_body_name: string;
  local_body_name_hindi: string;
  ward_code: string;
  ward_name: string;
  ward_name_hindi: string;
  created_at: string;
  updated_at: string;
}

export interface DistrictsBlocksGpVillage {
  id: number;
  state_name: string;
  state_code: string;
  district_name: string;
  district_code: string;
  block_name: string;
  block_code: string;
  gram_panchayat_name: string;
  gram_panchayat_code: string;
  village_name: string;
  village_code: string;
  created_at: string;
  updated_at: string;
}

export interface Bank {
  id: string;
  name: string;
  code: string;
  type: string;
  ifsc_code: string;
  micr_code: string;
  branch_name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FunctionalStatus {
  id: number;
  name: string;
  is_active: boolean;
}

export interface LocationType {
  id: number;
  name: string;
  is_active: boolean;
}

export interface AreaOfOperation {
  id: number;
  name: string;
  is_active: boolean;
}

export interface SectorOfOperationType {
  id: number;
  name: string;
  key: string;
  created_at: string;
  updated_at: string;
}

// API Response Types
export interface MasterDataResponse<T> {
  success: boolean;
  message: string;
  data: Record<string, T[]>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  version: string;
  timestamp: string;
}

// urban local bodies
export const getUrbanLocalBodies = (params: PaginationParams = {}): Promise<UrbanLocalBodies[]> => {
  return api.get<MasterDataResponse<UrbanLocalBodies>>('/master-data/urban-local-bodies', params)
    .then((response: any) => {
      if (response.success) {
        return response.data.urbanLocalBodies;
      } else {
        throw new Error('Invalid response format');
      }
    });
};

// urban local bodies ward
export const getUrbanLocalBodiesWard = (params: PaginationParams = {}): Promise<UrbanLocalBodiesWards[]> => {
  return api.get<MasterDataResponse<UrbanLocalBodiesWards>>('/master-data/urban-local-bodies-wards', params)
    .then((response: any) => {
      if (response.success) {
        return response.data.urbanLocalBodiesWards;
      } else {
        throw new Error('Invalid response format');
      }
    });
};

// Water Body Types
export const getWaterBodyTypes = (params: PaginationParams = {}): Promise<WaterBodyType[]> => {
  return api.get<MasterDataResponse<WaterBodyType>>('/master-data/water-body-types', params)
    .then((response: any) => {
      if (response.success) {
        return response.data.waterBodyTypes;
      } else {
        throw new Error('Invalid response format');
      }
    });
};

export const getWaterBodyTypeById = (id: number): Promise<WaterBodyType> => {
  return api.get<MasterDataResponse<WaterBodyType>>(`/master-data/water-body-types/${id}`)
    .then((response: any) => {
      if (response.success) {
        return response.data.waterBodyTypes;
      } else {
        throw new Error('Invalid response format');
      }
    });
};

// States
export const getStates = (params: PaginationParams = {}): Promise<State[]> => {
  return api.get<MasterDataResponse<State>>('/master-data/states', { page: 1, limit: 100, params })
    .then((response: any) => {
      if (response.success) {
        return response.data.states;
      } else {
        throw new Error('Invalid response format');
      }
    });
};

export const getStateById = (id: string): Promise<State> => {
  return api.get<MasterDataResponse<State>>(`/master-data/states/${id}`)
    .then((response: any) => {
      if (response.success) {
        return response.data;
      } else {
        throw new Error('Invalid response format');
      }
    });
};

export const getStateByCode = (stateCode: string): Promise<State> => {
  return api.get<MasterDataResponse<State>>(`/master-data/states/code/${stateCode}`)
    .then((response: any) => {
      if (response.success) {
        return response.data;
      } else {
        throw new Error('Invalid response format');
      }
    });
};

// Sector of Operations
export const getSectorOfOperations = (params: PaginationParams = {}): Promise<SectorOfOperation[]> => {
  return api.get<MasterDataResponse<SectorOfOperation>>('/master-data/sector-of-operations', params)
    .then((response: any) => {
      if (response.success) {
        return response.data.sectorOfOperations;
      } else {
        throw new Error('Invalid response format');
      }
    });
};

// Registration Authorities
export const getRegistrationAuthorities = (params: PaginationParams = {}): Promise<RegistrationAuthority[]> => {
  return api.get<MasterDataResponse<RegistrationAuthority>>('/master-data/registration-authorities', params)
    .then((response: any) => {
      if (response.success) {
        return response.data.registrationAuthorities;
      } else {
        throw new Error('Invalid response format');
      }
    });
};

// Districts
export const getDistricts = (params: PaginationParams = {}): Promise<District[]> => {
  return api.get<MasterDataResponse<District>>('/master-data/districts', params)
    .then((response: any) => {
      if (response.success) {
        return response.data.districts;
      } else {
        throw new Error('Invalid response format');
      }
    });
};

export const getDistrictsByState = (id: string): Promise<District[]> => {
  return api.get(`/master-data/districts/state/${id}`)
    .then((response: any) => {
      if (response.success) {
        return response.data;
      } else {
        throw new Error('Invalid response format');
      }
    });
};

// Misappropriation Levels
export const getMisappropriationLevels = (params: PaginationParams = {}): Promise<any> => {
  return api.get<MasterDataResponse<any>>('/master-data/misappropriation-levels', params)
    .then((response: any) => {
      if (response.success) {
        return response.data.misappropriationLevels;
      } else {
        throw new Error('Invalid response format');
      }
    });
};

// Arbitration Authorities
export const getArbitrationAuthorities = (params: PaginationParams = {}): Promise<any> => {
  return api.get<MasterDataResponse<any>>('/master-data/arbitration-authorities', params)
    .then((response: any) => {
      if (response.success) {
        return response.data.arbitrationAuthorities;
      } else {
        throw new Error('Invalid response format');
      }
    });
};

// Cost of Management Types
export const getCostOfManagementTypes = (params: PaginationParams = {}): Promise<any> => {
  return api.get<MasterDataResponse<any>>('/master-data/cost-of-management-types', params)
    .then((response: any) => {
      if (response.success) {
        return response.data.costOfManagementTypes;
      } else {
        throw new Error('Invalid response format');
      }
    });
};

// Cooperative Society Types
export const getCooperativeSocietyTypes = (params: PaginationParams = {}): Promise<CooperativeSocietyType[]> => {
  return api.get<MasterDataResponse<CooperativeSocietyType>>('/master-data/cooperative-society-types', params)
    .then((response: any) => {
      if (response.success) {
        return response.data.cooperativeSocietyTypes;
      } else {
        throw new Error('Invalid response format');
      }
    });
};

export const getSocietyTypes = (params: PaginationParams = {}): Promise<any[]> => {
  return api.get<MasterDataResponse<any>>('/master-data/society-types', params)
    .then((response: any) => {
      if (response.success) {
        return response.data.societyTypes;
      } else {
        throw new Error('Invalid response format');
      }
    });
};

// Blocks
export const getBlocks = (params: PaginationParams = {}): Promise<Block[]> => {
  return api.get<MasterDataResponse<Block>>('/master-data/blocks', params)
    .then((response: any) => {
      if (response.success) {
        return response.data.blocks;
      } else {
        throw new Error('Invalid response format');
      }
    });
};

export const getBlocksByState = (stateCode: string): Promise<Block[]> => {
  return api.get<MasterDataResponse<Block>>(`/master-data/blocks/state/${stateCode}`)
    .then((response: any) => {
      if (response.success) {
        return response.data;
      } else {
        throw new Error('Invalid response format');
      }
    });
};

/** Blocks for a district; path param is master **district_code** (numeric string). */
export const getBlocksByDistrict = (districtCode: string | number): Promise<Block[]> => {
  const segment = encodeURIComponent(String(districtCode));
  return api.get<MasterDataResponse<Block>>(`/master-data/blocks/by-district/${segment}`)
    .then((response: any) => {
      if (response.success) {
        return response.data.blocks || response.data;
      } else {
        throw new Error('Invalid response format');
      }
    });
};

/** Legacy: state + district codes in path (kept if any screen still needs it). */
export const getBlocksByDistrictWithState = (
  stateCode: string,
  districtCode: string
): Promise<Block[]> => {
  return api.get<MasterDataResponse<Block>>(
    `/master-data/blocks/district/${stateCode}/${districtCode}`
  )
    .then((response: any) => {
      if (response.success) {
        return response.data.blocks || response.data;
      } else {
        throw new Error('Invalid response format');
      }
    });
};

// Districts Blocks GP Villages
export const getDistrictsBlocksGpVillages = (stateCode: string, districtCode: string, blockCode: string, params: PaginationParams = {}): Promise<DistrictsBlocksGpVillage[]> => {
   return api.get<MasterDataResponse<DistrictsBlocksGpVillage>>(`/master-data/districts-blocks-gp-villages`, {
    state_code: stateCode,
    district_code: districtCode,
    block_code: blockCode,
    gram_panchayat_code: params.gram_panchayat_code,
    limit: 100,
    ...params
  }
  )
    .then((response: any) => {
      if (response.success) {
        return response.data.districtsBlocksGpVillages || [];
      } else {
        throw new Error('Invalid response format');
      }
    });
};

// Banks
export const getBanks = (params: PaginationParams = {}): Promise<Bank[]> => {
  return api.get<MasterDataResponse<Bank>>('/master-data/banks', params)
    .then((response: any) => {
      if (response.success) {
        return response.data.banks;
      } else {
        throw new Error('Invalid response format');
      }
    });
};

export const getBanksByFilters = (params: {
  state?: string;
  type?: string;
}): Promise<Bank[]> => {
  return api.get<MasterDataResponse<Bank>>('/master-data/banks/filters', params)
    .then((response: any) => {
      if (response.success) {
        return Array.isArray(response.data) ? response.data : response.data.banks ?? [];
      } else {
        throw new Error('Invalid response format');
      }
    });
};

// Functional Statuses
export const getFunctionalStatuses = (): Promise<FunctionalStatus[]> => {
  return api.get<MasterDataResponse<FunctionalStatus>>('/master-data/functional-statuses')
    .then((response: any) => {
      if (response.success) {
        return response.data.functionalStatuses;
      } else {
        throw new Error('Invalid response format');
      }
    });
};

// Location Types
export const getLocationTypes = (): Promise<LocationType[]> => {
  return api.get<MasterDataResponse<LocationType>>('/master-data/location-types')
    .then((response: any) => {
      if (response.success) {
        return response.data.locationTypes;
      } else {
        throw new Error('Invalid response format');
      }
    });
};

// Area of Operations
export const getAreaOfOperations = (): Promise<AreaOfOperation[]> => {
  return api.get<MasterDataResponse<AreaOfOperation>>('/master-data/area-of-operations')
    .then((response: any) => {
      if (response.success) {
        return response.data.areaOfOperations;
      } else {
        throw new Error('Invalid response format');
      }
    });
};

// Sector of Operations Types
export const getSectorOfOperationsTypes = (): Promise<SectorOfOperationType[]> => {
  return api.get<MasterDataResponse<SectorOfOperationType>>('/master-data/sector-of-operations-types')
    .then((response: any) => {
      if (response.success) {
        return response.data.sectorOfOperationsTypes;
      } else {
        throw new Error('Invalid response format');
      }
    });
};

export const getGramPanchayats = (
  stateCode: string,
  districtCode: string,
  blockCode: string,
): Promise<DistrictsBlocksGpVillage[]> => {
  return api
    .get(`/master-data/gram-panchayats`, {
      state_code: stateCode,
      district_code: districtCode,
      block_code: blockCode,
    })
    .then((response: any) => {
      if (response.success) {
        const data =
          response.data?.gramPanchayats ||
          response.data?.gram_panchayats ||
          response.data;
        return Array.isArray(data) ? data : [];
      }
      throw new Error("Invalid response format");
    });
};