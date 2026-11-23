import { useState, useEffect } from "react";
import {
  getStates,
  getDistrictsByState,
  getBlocksByDistrictWithState,
  // getBlocks,
  getWaterBodyTypes,
  getSectorOfOperations,
  getSectorOfOperationsTypes,
  getRegistrationAuthorities,
  getCooperativeSocietyTypes,
  getBanks,
  getFunctionalStatuses,
  getLocationTypes,
  getAreaOfOperations,
  State,
  District,
  Block,
  WaterBodyType,
  SectorOfOperation,
  RegistrationAuthority,
  CooperativeSocietyType,
  Bank,
  FunctionalStatus,
  LocationType,
  AreaOfOperation,
  SectorOfOperationType,
  getGramPanchayats,
  getDistrictsBlocksGpVillages,
  DistrictsBlocksGpVillage,
  UrbanLocalBodiesWards,
  UrbanLocalBodies,
  getUrbanLocalBodies,
  getUrbanLocalBodiesWard,
  getCostOfManagementTypes,
  getArbitrationAuthorities,
  getMisappropriationLevels,
} from "../lib/data/master-data/api";

export interface MasterDataState {
  states: State[];
  districts: District[];
  blocks: Block[];
  urbanLocalBodies: UrbanLocalBodies[];
  urbanLocalBodiesWards: UrbanLocalBodiesWards[];
  gramPanchayats: DistrictsBlocksGpVillage[];
  villageRows: DistrictsBlocksGpVillage[];
  waterBodyTypes: WaterBodyType[];
  sectorOfOperations: SectorOfOperation[];
  sectorOfOperationsTypes: SectorOfOperationType[];
  registrationAuthorities: RegistrationAuthority[];
  cooperativeSocietyTypes: CooperativeSocietyType[];
  banks: Bank[];
  functionalStatuses: FunctionalStatus[];
  locationTypes: LocationType[];
  areaOfOperations: AreaOfOperation[];
  misappropriationLevels: any[];
  arbitrationAuthorities: any[];
  costOfManagementTypes: any[];
  loading: boolean;
  error: string | null;
}

export const useMasterData = () => {
  const [masterData, setMasterData] = useState<MasterDataState>({
    states: [],
    districts: [],
    blocks: [],
    urbanLocalBodies: [],
    urbanLocalBodiesWards: [],
    gramPanchayats: [],
    villageRows: [],
    waterBodyTypes: [],
    sectorOfOperations: [],
    sectorOfOperationsTypes: [],
    registrationAuthorities: [],
    cooperativeSocietyTypes: [],
    banks: [],
    functionalStatuses: [],
    locationTypes: [],
    areaOfOperations: [],
    misappropriationLevels: [],
    arbitrationAuthorities: [],
    costOfManagementTypes: [],
    loading: false,
    error: null,
  });

  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedBlock, setSelectedBlock] = useState<string>("");
  const [selectedGramPanchayat, setSelectedGramPanchayat] = useState<string>("");

  useEffect(() => {
    const loadInitialData = async () => {
      setMasterData((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const [
          states,
          // blocks,
          // gramPanchayats,
          waterBodyTypes,
          urbanLocalBodies,
          urbanLocalBodiesWards,
          sectorOfOperations,
          sectorOfOperationsTypes,
          registrationAuthorities,
          cooperativeSocietyTypes,
          banks,
          functionalStatuses,
          locationTypes,
          areaOfOperations,
          misappropriationLevels,
          arbitrationAuthorities,
          costOfManagementTypes,
        ] = await Promise.all([
          getStates(),
          // getBlocks(),
          // getDistrictsBlocksGpVillages(),
          getWaterBodyTypes(),
          getUrbanLocalBodies(),
          getUrbanLocalBodiesWard(),
          getSectorOfOperations(),
          getSectorOfOperationsTypes(),
          getRegistrationAuthorities(),
          getCooperativeSocietyTypes(),
          getBanks(),
          getFunctionalStatuses(),
          getLocationTypes(),
          getAreaOfOperations(),
          getMisappropriationLevels(),
          getArbitrationAuthorities(),
          getCostOfManagementTypes(),
        ]);

        setMasterData((prev) => ({
          ...prev,
          states,
          // blocks,
          waterBodyTypes,
          urbanLocalBodies,
          urbanLocalBodiesWards,
          sectorOfOperations,
          sectorOfOperationsTypes,
          registrationAuthorities,
          cooperativeSocietyTypes,
          // gramPanchayats,
          banks,
          functionalStatuses,
          locationTypes,
          areaOfOperations,
          misappropriationLevels,
          arbitrationAuthorities,
          costOfManagementTypes,
          loading: false,
        }));
      } catch (error) {
        console.error("Error loading master data:", error);
        setMasterData((prev) => ({
          ...prev,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to load master data",
        }));
      }
    };

    loadInitialData();
  }, []);

  // Load districts when state changes
  useEffect(() => {
    if (!selectedState) {
      setMasterData((prev) => ({ ...prev, districts: [] }));
      return;
    }

    const loadDistricts = async () => {
      try {
        const districts: any = await getDistrictsByState(selectedState);
        setMasterData((prev) => ({
          ...prev,
          districts: districts?.districts || [],
        }));
      } catch (error) {
        console.error("Error loading districts:", error);
        setMasterData((prev) => ({
          ...prev,
          districts: [],
          error:
            error instanceof Error ? error.message : "Failed to load districts",
        }));
      }
    };

    loadDistricts();
  }, [selectedState]);

  // Blocks: use /master-data/blocks/district/:stateCode/:districtCode (works on current prod).
  // Single-segment /blocks/by-district/:code needs backend route fix deployed server-side.
  useEffect(() => {
    if (!selectedDistrict || !selectedState) {
      setMasterData((prev) => ({ ...prev, blocks: [] }));
      return;
    }

    const loadBlocks = async () => {
      try {
        const blocks = await getBlocksByDistrictWithState(
          selectedState,
          selectedDistrict
        );
        setMasterData((prev) => ({
          ...prev,
          blocks: Array.isArray(blocks) ? blocks : [],
        }));
      } catch (error) {
        console.error("Error loading blocks:", error);
        setMasterData((prev) => ({
          ...prev,
          blocks: [],
          error:
            error instanceof Error ? error.message : "Failed to load blocks",
        }));
      }
    };

    loadBlocks();
  }, [selectedDistrict, selectedState]);

  // Load Gram Panchayat when block changes
  useEffect(() => {
    if (!selectedState || !selectedDistrict || !selectedBlock) {
      setMasterData((prev) => ({ ...prev, gramPanchayats: [], villageRows: [] }));
      return;
    }

    const loadGP = async () => {
      try {
        const gp = await getGramPanchayats(
          selectedState,
          selectedDistrict,
          selectedBlock,
        );

        setMasterData((prev) => ({
          ...prev,
          gramPanchayats: Array.isArray(gp) ? gp : [],
        }));
      } catch (error) {
        console.error("Error loading GP:", error);
        setMasterData((prev) => ({
          ...prev,
          gramPanchayats: [],
          villageRows: [],
        }));
      }
    };

    loadGP();
  }, [selectedState, selectedDistrict, selectedBlock]);

  // Load villages when gram panchayat is selected
  useEffect(() => {
    if (!selectedState || !selectedDistrict || !selectedBlock || !selectedGramPanchayat) {
      setMasterData((prev) => ({ ...prev, villageRows: [] }));
      return;
    }

    const loadVillages = async () => {
      try {
        const villageRows = await getDistrictsBlocksGpVillages(
          selectedState,
          selectedDistrict,
          selectedBlock,
          { gram_panchayat_code: selectedGramPanchayat },
        );

        setMasterData((prev) => ({
          ...prev,
          villageRows: Array.isArray(villageRows) ? villageRows : [],
        }));
      } catch (error) {
        console.error("Error loading villages:", error);
        setMasterData((prev) => ({
          ...prev,
          villageRows: [],
        }));
      }
    };

    loadVillages();
  }, [selectedState, selectedDistrict, selectedBlock, selectedGramPanchayat]);

  const handleStateChange = (stateCode: string) => {
    setSelectedState(stateCode);
    setSelectedDistrict("");
    setSelectedBlock("");
    setSelectedGramPanchayat("");
  };

  const handleDistrictChange = (districtCode: string) => {
    setSelectedDistrict(districtCode.trim());
    setSelectedBlock("");
    setSelectedGramPanchayat("");
  };

  const handleBlockChange = (blockCode: string) => {
    setSelectedBlock(blockCode);
    setSelectedGramPanchayat("");
  };

  const handleGramPanchayatChange = (gramPanchayatCode: string) => {
    setSelectedGramPanchayat(gramPanchayatCode);
  };

  return {
    masterData,
    selectedState,
    selectedDistrict,
    selectedBlock,
    selectedGramPanchayat,
    handleStateChange,
    handleDistrictChange,
    handleBlockChange,
    handleGramPanchayatChange,
  };
};
