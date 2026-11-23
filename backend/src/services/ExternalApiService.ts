import { AppError } from '../utils/errors';
import logger from '../utils/logger';

interface ExternalApiResponse {
  [key: string]: any;
}

interface ApiConfig {
  name: string;
  url: string;
  description: string;
}

const API_CONFIGS: ApiConfig[] = [
  {
    name: 'findStateLgCode',
    url: 'https://api.cooperatives.gov.in/Api/findStateLgCode',
    description: 'Find State Local Government Code'
  },
  {
    name: 'blocksData',
    url: 'https://api.cooperatives.gov.in/en/Api/apiforblocksdata?key=1&state=1',
    description: 'Blocks data for state'
  },
  {
    name: 'districtDetailsByState',
    url: 'https://api.cooperatives.gov.in/Api/districtdetailsbystate?key=1&state=1',
    description: 'District details by state'
  },
  {
    name: 'districtsBlocksGpVillagesData',
    url: 'https://api.cooperatives.gov.in/en/Api/apifordistrictsblocksgpvillagesdata?key=1&state=1',
    description: 'Districts, blocks, GP and villages data'
  },
  {
    name: 'ulbData',
    url: 'https://api.cooperatives.gov.in/en/Api/apiforulbdata?key=1&state=1',
    description: 'Urban Local Body data'
  },
  {
    name: 'ulbWardData',
    url: 'https://api.cooperatives.gov.in/en/Api/apiforulbwarddata?key=1&state=1',
    description: 'Urban Local Body Ward data'
  },
  {
    name: 'findNcdSectorCode',
    url: 'https://api.cooperatives.gov.in/en/Api/findNcdSectorCode',
    description: 'Find NCD Sector Code'
  },
  {
    name: 'miscellaneousData1',
    url: 'https://api.cooperatives.gov.in/en/Api/apimiscellanousdata?key=1&state=1&level=1',
    description: 'Miscellaneous data level 1'
  },
  {
    name: 'miscellaneousData2',
    url: 'https://api.cooperatives.gov.in/en/Api/apimiscellanousdata?key=1&state=1&level=1',
    description: 'Miscellaneous data level 1 (duplicate)'
  },
  {
    name: 'stateWiseBasicDetails',
    url: 'https://api.cooperatives.gov.in/MasterApi/stateWiseBasicDetails?key=1&state=36',
    description: 'State wise basic details'
  },
  {
    name: 'sectorChildTableDataStatewise',
    url: 'https://api.cooperatives.gov.in/en/Api/sectorchildtabledatastatewise?key=1&state=1&sector=1',
    description: 'Sector child table data state wise'
  },
  {
    name: 'sectorChildTableRawDataStatewise',
    url: 'https://api.cooperatives.gov.in/en/Api/sectorchildtablerawdatastatewise?key=1&state=1&sector=1',
    description: 'Sector child table raw data state wise'
  },
  {
    name: 'miscellaneousData3',
    url: 'https://api.cooperatives.gov.in/en/Api/apimiscellanousdata?key=1&state=1&level=1',
    description: 'Miscellaneous data level 1 (third instance)'
  }
];

/**
 * Makes a request to an external API
 */
const makeApiRequest = async (config: ApiConfig): Promise<ExternalApiResponse> => {
  try {
    logger.info(`Making request to ${config.name}: ${config.url}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

    const response = await fetch(config.url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Society-Backend/1.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      data,
      status: response.status,
      url: config.url,
      description: config.description
    };
  } catch (error) {
    logger.error(`Error calling ${config.name}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      url: config.url,
      description: config.description
    };
  }
};

/**
 * Calls all external APIs and returns consolidated response
 */
export const getAllExternalApiData = async (): Promise<ExternalApiResponse> => {
  try {
    logger.info('Starting to fetch data from all external APIs');
    
    const startTime = Date.now();
    
    // Call all APIs in parallel for better performance
    const promises = API_CONFIGS.map(config => makeApiRequest(config));
    const results = await Promise.allSettled(promises);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Process results
    const apiResults: { [key: string]: any } = {};
    const errors: string[] = [];
    let successCount = 0;
    let failureCount = 0;
    
    results.forEach((result, index) => {
      const config = API_CONFIGS[index];
      
      if (!config) {
        failureCount++;
        errors.push(`Unknown API at index ${index}`);
        return;
      }
      
      if (result.status === 'fulfilled') {
        apiResults[config.name] = result.value;
        if (result.value.success) {
          successCount++;
        } else {
          failureCount++;
          errors.push(`${config.name}: ${result.value.error}`);
        }
      } else {
        failureCount++;
        errors.push(`${config.name}: ${result.reason}`);
        apiResults[config.name] = {
          success: false,
          error: result.reason,
          url: config.url,
          description: config.description
        };
      }
    });
    
    const response = {
      summary: {
        totalApis: API_CONFIGS.length,
        successful: successCount,
        failed: failureCount,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      },
      errors: errors.length > 0 ? errors : undefined,
      data: apiResults
    };
    
    logger.info(`External API data fetch completed. Success: ${successCount}, Failed: ${failureCount}, Duration: ${duration}ms`);
    
    return response;
  } catch (error) {
    logger.error('Error in getAllExternalApiData:', error);
    throw new AppError('Failed to fetch external API data', 500);
  }
};

/**
 * Calls a specific external API by name
 */
export const getExternalApiDataByName = async (apiName: string): Promise<ExternalApiResponse> => {
  try {
    const config = API_CONFIGS.find(api => api.name === apiName);
    
    if (!config) {
      throw new AppError(`API with name '${apiName}' not found`, 404);
    }
    
    logger.info(`Fetching data for specific API: ${apiName}`);
    
    const result = await makeApiRequest(config);
    
    return {
      apiName,
      ...result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`Error in getExternalApiDataByName for ${apiName}:`, error);
    throw error;
  }
};

/**
 * Gets list of available APIs
 */
export const getAvailableApis = (): ApiConfig[] => {
  return API_CONFIGS.map(config => ({
    name: config.name,
    url: config.url,
    description: config.description
  }));
};
