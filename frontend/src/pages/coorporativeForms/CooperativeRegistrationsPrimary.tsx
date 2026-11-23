import React, { useState } from "react";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { RadioGroup } from "../../components/ui/RadioGroup";
import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

interface FormData {
  // Office Building
  hasOfficeBuilding: string;
  officeBuildingType: string;
  consumerBusiness: string;
  consumerBusinessDetails: string;

  tourism: string;
  tourismDetails: string;

  cashKendraFacilities: string;
  cashKendraFacilitiesDetails: string;
  // Land Details
  hasLand: string;
  ownedLand: string;
  leasedLand: string;
  govtAllottedLand: string;
  totalLand: string;

  // Financial Information
  outstandingLoan: string;
  nonCreditRevenue: string;

  // PACS Activities
  pesticideDistribution: string;
  pesticideQuantity: string;
  fertilizerDistribution: string;
  fertilizerQuantity: string;
  fertilizerRemarks: string;
  pmkskFunction: string;
  pmkskDetails: string;
  seedDistribution: string;
  seedQuantity: string;
  foodGrainProcurement: string;
  foodGrainQuantity: string;
  customHiring: string;
  equipmentType: string;
  dryStorage: string;
  dryStorageCapacity: string;
  grainStorageProject: string;
  grainStorageCapacity: string;
  grainStorageRemarks: string;
  coldStorage: string;
  coldStorageCapacity: string;
  milkCollection: string;
  milkCollectionQuantity: string;
  fisheryActivities: string;
  fishCatchQuantity: string;
  foodProcessing: string;
  foodProcessingDetails: string;
  cscFacility: string;
  cscRevenue: string;
  cscServices: string;
  fpoFunction: string;
  fpoDetails: string;
  lpgDealership: string;
  lpgDetails: string;
  bulkFuelPump: string;
  bulkFuelDetails: string;
  retailFuelDealership: string;
  retailFuelDetails: string;
  pmbjk: string;
  pmbjkRevenue: string;
  pmKusum: string;
  pmKusumBenefits: string;
  fairPriceShop: string;
  fairPriceQuantity: string;
  fairPriceRemarks: string;
  nalSeJal: string;
  nalSeJalActivities: string;
  otherFacilities: string;
}

const CooperativeRegistrationsPrimary = ({
  data,
  onCancel,
  onClose,
  onSubmit,
}: {
  data: any;
  onCancel: () => void;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) => {
  const [formData, setFormData] = useState<FormData>(
    data || {
      hasOfficeBuilding: "",
      officeBuildingType: "",
      hasLand: "",
      ownedLand: "",
      leasedLand: "",
      govtAllottedLand: "",
      totalLand: "",
      outstandingLoan: "",
      nonCreditRevenue: "",
      pesticideDistribution: "",
      pesticideQuantity: "",
      fertilizerDistribution: "",
      fertilizerQuantity: "",
      fertilizerRemarks: "",
      pmkskFunction: "",
      pmkskDetails: "",
      seedDistribution: "",
      seedQuantity: "",
      foodGrainProcurement: "",
      foodGrainQuantity: "",
      customHiring: "",
      equipmentType: "",
      dryStorage: "",
      dryStorageCapacity: "",
      grainStorageProject: "",
      grainStorageCapacity: "",
      grainStorageRemarks: "",
      coldStorage: "",
      coldStorageCapacity: "",
      milkCollection: "",
      milkCollectionQuantity: "",
      fisheryActivities: "",
      fishCatchQuantity: "",
      foodProcessing: "",
      foodProcessingDetails: "",
      cscFacility: "",
      cscRevenue: "",
      cscServices: "",
      fpoFunction: "",
      fpoDetails: "",
      lpgDealership: "",
      lpgDetails: "",
      bulkFuelPump: "",
      bulkFuelDetails: "",
      retailFuelDealership: "",
      retailFuelDetails: "",
      pmbjk: "",
      pmbjkRevenue: "",
      pmKusum: "",
      pmKusumBenefits: "",
      fairPriceShop: "",
      fairPriceQuantity: "",
      fairPriceRemarks: "",
      nalSeJal: "",
      nalSeJalActivities: "",
      otherFacilities: "",
    },
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const officeBuildingTypes = [
    { value: "1", label: "Own Building" },
    { value: "2", label: "Rented Building" },
    { value: "3", label: "Rent Free Building" },
    { value: "4", label: "Leased Building" },
    { value: "5", label: "Building Provided by the Government" },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const calculateTotalLand = (
    ownedVal: string,
    leasedVal: string,
    govtVal: string,
  ) => {
    const owned = Number(ownedVal) || 0;
    const leased = Number(leasedVal) || 0;
    const govt = Number(govtVal) || 0;

    const total = owned + leased + govt;

    handleInputChange("totalLand", total.toFixed(2));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.hasOfficeBuilding)
      newErrors.hasOfficeBuilding =
        "Please specify if society has office building";
    if (formData.hasOfficeBuilding === "1" && !formData.officeBuildingType) {
      newErrors.officeBuildingType = "Office building type is required";
    }
    if (!formData.hasLand)
      newErrors.hasLand = "Please specify if society has land";
    if (
      formData.hasLand === "1" &&
      !formData.ownedLand &&
      !formData.leasedLand &&
      !formData.govtAllottedLand
    ) {
      newErrors.ownedLand = "At least one land type is required";
    }
    if (!formData.outstandingLoan)
      newErrors.outstandingLoan = "Outstanding loan is required";

    // PACS Activities Validation

    if (!formData.pesticideDistribution)
      newErrors.pesticideDistribution = "Please select pesticide distribution";
    if (formData.pesticideDistribution === "1" && !formData.pesticideQuantity)
      newErrors.pesticideQuantity = "Pesticide quantity is required";

    if (!formData.fertilizerDistribution)
      newErrors.fertilizerDistribution =
        "Please select fertilizer distribution";
    if (formData.fertilizerDistribution === "1" && !formData.fertilizerQuantity)
      newErrors.fertilizerQuantity = "Fertilizer quantity is required";

    if (!formData.pmkskFunction)
      newErrors.pmkskFunction = "Please select PMKSK option";
    if (formData.pmkskFunction === "1" && !formData.pmkskDetails)
      newErrors.pmkskDetails = "PMKSK details are required";

    if (!formData.seedDistribution)
      newErrors.seedDistribution = "Please select seed distribution";
    if (formData.seedDistribution === "1" && !formData.seedQuantity)
      newErrors.seedQuantity = "Seed quantity is required";

    if (!formData.foodGrainProcurement)
      newErrors.foodGrainProcurement = "Please select food grain procurement";
    if (formData.foodGrainProcurement === "1" && !formData.foodGrainQuantity)
      newErrors.foodGrainQuantity = "Food grain quantity is required";

    if (!formData.customHiring)
      newErrors.customHiring = "Please select custom hiring";
    if (formData.customHiring === "1" && !formData.equipmentType)
      newErrors.equipmentType = "Equipment type is required";

    if (!formData.dryStorage)
      newErrors.dryStorage = "Please select dry storage option";
    if (formData.dryStorage === "1" && !formData.dryStorageCapacity)
      newErrors.dryStorageCapacity = "Dry storage capacity is required";

    if (!formData.grainStorageProject)
      newErrors.grainStorageProject = "Please select grain storage project";
    if (formData.grainStorageProject === "1" && !formData.grainStorageCapacity)
      newErrors.grainStorageCapacity = "Grain storage capacity is required";

    if (!formData.coldStorage)
      newErrors.coldStorage = "Please select cold storage";
    if (formData.coldStorage === "1" && !formData.coldStorageCapacity)
      newErrors.coldStorageCapacity = "Cold storage capacity is required";

    if (!formData.milkCollection)
      newErrors.milkCollection = "Please select milk collection";
    if (formData.milkCollection === "1" && !formData.milkCollectionQuantity)
      newErrors.milkCollectionQuantity = "Milk collection quantity is required";

    if (!formData.fisheryActivities)
      newErrors.fisheryActivities = "Please select fishery activities";
    if (formData.fisheryActivities === "1" && !formData.fishCatchQuantity)
      newErrors.fishCatchQuantity = "Fish catch quantity is required";

    if (!formData.foodProcessing)
      newErrors.foodProcessing = "Please select food processing";
    if (formData.foodProcessing === "1" && !formData.foodProcessingDetails)
      newErrors.foodProcessingDetails = "Food processing details required";

    if (!formData.cscFacility)
      newErrors.cscFacility = "Please select CSC facility";
    if (formData.cscFacility === "1" && !formData.cscRevenue)
      newErrors.cscRevenue = "CSC revenue is required";
    if (formData.cscFacility === "1" && !formData.cscServices)
      newErrors.cscServices = "CSC service is required";

    if (!formData.fpoFunction)
      newErrors.fpoFunction = "Please select FPO option";
    if (formData.fpoFunction === "1" && !formData.fpoDetails)
      newErrors.fpoDetails = "FPO details are required";

    if (!formData.lpgDealership)
      newErrors.lpgDealership = "Please select LPG dealership";
    if (formData.lpgDealership === "1" && !formData.lpgDetails)
      newErrors.lpgDetails = "LPG details required";

    if (!formData.bulkFuelPump)
      newErrors.bulkFuelPump = "Please select bulk fuel pump";
    if (formData.bulkFuelPump === "1" && !formData.bulkFuelDetails)
      newErrors.bulkFuelDetails = "Bulk fuel details required";

    if (!formData.retailFuelDealership)
      newErrors.retailFuelDealership = "Please select retail fuel dealership";
    if (formData.retailFuelDealership === "1" && !formData.retailFuelDetails)
      newErrors.retailFuelDetails = "Retail fuel details required";

    if (!formData.pmbjk) newErrors.pmbjk = "Please select PMBJK option";
    if (formData.pmbjk === "1" && !formData.pmbjkRevenue)
      newErrors.pmbjkRevenue = "PMBJK revenue required";

    if (!formData.pmKusum) newErrors.pmKusum = "Please select PM-KUSUM option";
    if (formData.pmKusum === "1" && !formData.pmKusumBenefits)
      newErrors.pmKusumBenefits = "PM-KUSUM benefits required";

    if (!formData.fairPriceShop)
      newErrors.fairPriceShop = "Please select fair price shop";
    if (formData.fairPriceShop === "1" && !formData.fairPriceQuantity)
      newErrors.fairPriceQuantity = "Fair price quantity required";

    if (!formData.nalSeJal)
      newErrors.nalSeJal = "Please select Nal-se-Jal option";
    if (formData.nalSeJal === "1" && !formData.nalSeJalActivities)
      newErrors.nalSeJalActivities = "Nal-se-Jal activities required";

    if (!formData.consumerBusiness)
      newErrors.consumerBusiness = "Please select consumer business";
    if (formData.consumerBusiness === "1" && !formData.consumerBusinessDetails)
      newErrors.consumerBusinessDetails = "Consumer business details required";

    if (!formData.tourism)
      newErrors.tourism = "Please select tourism activities";
    if (formData.tourism === "1" && !formData.tourismDetails)
      newErrors.tourismDetails = "Tourism details required";

    if (!formData.cashKendraFacilities)
      newErrors.cashKendraFacilities = "Please select cash kendra facilities";
    if (
      formData.cashKendraFacilities === "1" &&
      !formData.cashKendraFacilitiesDetails
    )
      newErrors.cashKendraFacilitiesDetails = "Cash kendra details required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const transformToApiPayload = () => {
    const hasBuilding = Number(formData.hasOfficeBuilding);

    const buildingType =
      hasBuilding === 1
        ? officeBuildingTypes.findIndex(
            (b) => b.value === formData.officeBuildingType,
          ) + 1
        : null;

    return {
      CooperativeRegistrationsPrimary: [
        {
          has_building: hasBuilding || null,
          building_type: buildingType || null,

          is_socitey_has_land: Number(formData.hasLand) || null,

          pack_total_outstanding_loan: Number(formData.outstandingLoan) || null,

          pack_revenue_non_credit: Number(formData.nonCreditRevenue) || null,

          pesticide_distribution:
            Number(formData.pesticideDistribution) || null,

          pesticide_distribution_qty:
            formData.pesticideDistribution === "1"
              ? Number(formData.pesticideQuantity)
              : 0,

          fertilizer_distribution:
            Number(formData.fertilizerDistribution) || null,

          fertilizer_distribution_qty:
            formData.fertilizerDistribution === "1"
              ? Number(formData.fertilizerQuantity)
              : 0,

          fertilizer_distribution_details:
            formData.fertilizerDistribution === "1"
              ? formData.fertilizerRemarks
              : 0,

          is_pmksk: Number(formData.pmkskFunction) || null,

          pmksk_details:
            formData.pmkskFunction === "1" ? formData.pmkskDetails : 0,

          seed_distribution: Number(formData.seedDistribution) || null,

          seed_distribution_qty:
            formData.seedDistribution === "1"
              ? Number(formData.seedQuantity)
              : 0,

          is_foodgrains: Number(formData.foodGrainProcurement) || null,

          foodgrains_qty:
            formData.foodGrainProcurement === "1"
              ? Number(formData.foodGrainQuantity)
              : 0,

          agricultural_implements: Number(formData.customHiring) || null,

          agricultural_implements_text:
            formData.customHiring === "1" ? formData.equipmentType : 0,

          dry_storage: Number(formData.dryStorage) || null,

          dry_storage_capicity:
            formData.dryStorage === "1" ? formData.dryStorageCapacity : 0,

          is_lgs_program: Number(formData.grainStorageProject) || null,

          lgs_capacity:
            formData.grainStorageProject === "1"
              ? formData.grainStorageCapacity
              : 0,

          lgs_program_details:
            formData.grainStorageProject === "1"
              ? formData.grainStorageRemarks
              : 0,

          cold_storage: Number(formData.coldStorage) || null,

          cold_storage_capicity:
            formData.coldStorage === "1" ? formData.coldStorageCapacity : 0,

          milk_unit: Number(formData.milkCollection) || null,

          milk_capicity_unit:
            formData.milkCollection === "1"
              ? Number(formData.milkCollectionQuantity)
              : 0,

          pack_involved_fish_catch: Number(formData.fisheryActivities) || null,

          pack_annual_fish_catch:
            formData.fisheryActivities === "1" ? formData.fishCatchQuantity : 0,

          food_processing: Number(formData.foodProcessing) || null,

          food_processing_type:
            formData.foodProcessing === "1"
              ? formData.foodProcessingDetails
              : 0,

          is_csc: Number(formData.cscFacility) || null,

          csc_revenue:
            formData.cscFacility === "1" ? Number(formData.cscRevenue) : 0,

          csc_details: formData.cscFacility === "1" ? formData.cscServices : 0,

          is_fpo: Number(formData.fpoFunction) || null,

          fpo_details: formData.fpoFunction === "1" ? formData.fpoDetails : 0,

          is_lpg_distributership: Number(formData.lpgDealership) || null,

          lpg_distributership_details:
            formData.lpgDealership === "1" ? formData.lpgDetails : 0,

          is_bcp_pump: Number(formData.bulkFuelPump) || null,

          bcp_pump_details:
            formData.bulkFuelPump === "1" ? formData.bulkFuelDetails : 0,

          is_dpp_diesel: Number(formData.retailFuelDealership) || null,

          dpp_diesel_details:
            formData.retailFuelDealership === "1"
              ? formData.retailFuelDetails
              : 0,

          is_jak: Number(formData.pmbjk) || null,

          jak_qty: formData.pmbjk === "1" ? Number(formData.pmbjkRevenue) : 0,

          is_pm_kusum_scheme: Number(formData.pmKusum) || null,

          pm_kusum_scheme_details:
            formData.pmKusum === "1" ? formData.pmKusumBenefits : 0,

          fair_price: Number(formData.fairPriceShop) || null,

          fair_price_qty:
            formData.fairPriceShop === "1"
              ? Number(formData.fairPriceQuantity)
              : 0,

          fair_price_details:
            formData.fairPriceShop === "1" ? formData.fairPriceRemarks : 0,

          is_paani_samity: Number(formData.nalSeJal) || null,

          paani_samity_details:
            formData.nalSeJal === "1" ? formData.nalSeJalActivities : 0,

          is_consumer_business: Number(formData.consumerBusiness) || null,

          consumer_business_details:
            formData.consumerBusiness === "1"
              ? formData.consumerBusinessDetails
              : 0,

          is_tourism: Number(formData.tourism) || null,

          tourism_details:
            formData.tourism === "1" ? formData.tourismDetails : 0,

          is_cash_kendra_facilities:
            Number(formData.cashKendraFacilities) || null,

          cash_kendra_facilities_details:
            formData.cashKendraFacilities === "1"
              ? formData.cashKendraFacilitiesDetails
              : 0,

          other_facility: formData.otherFacilities || null,
        },
      ],
    };
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      const payload = transformToApiPayload();

      onSubmit(payload);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Office Building Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          1. Office Building
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="1(a). Whether the co-operative society has an office building"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            value={formData.hasOfficeBuilding}
            onChange={(value) => handleInputChange("hasOfficeBuilding", value)}
            name="hasOfficeBuilding"
            error={errors.hasOfficeBuilding}
            required
          />

          {formData.hasOfficeBuilding === "1" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                1(b). Type of Office Building
              </h3>
              <RadioGroup
                options={officeBuildingTypes}
                value={formData.officeBuildingType}
                onChange={(value) =>
                  handleInputChange("officeBuildingType", value)
                }
                name="officeBuildingType"
                error={errors.officeBuildingType}
                required
              />
            </div>
          )}
        </div>
      </Card>

      {/* Land Details Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          2. Land Details
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="2(a). Whether the co-operative society has land"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            value={formData.hasLand}
            onChange={(value) => handleInputChange("hasLand", value)}
            name="hasLand"
            error={errors.hasLand}
            required
          />

          {formData.hasLand === "1" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                2(b). Land Available with the Cooperative
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">
                        Type of Possession
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-left">
                        Area in Acre
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">
                        Owned land
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <Input
                          type="number"
                          value={formData.ownedLand}
                          onChange={(e) => {
                            const value = e.target.value;
                            handleInputChange("ownedLand", value);
                            calculateTotalLand(
                              value,
                              formData.leasedLand,
                              formData.govtAllottedLand,
                            );
                          }}
                          placeholder="Enter area in acres"
                          step="0.01"
                          className="w-full"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">
                        Leased land
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <Input
                          type="number"
                          value={formData.leasedLand}
                          onChange={(e) => {
                            const value = e.target.value;
                            handleInputChange("leasedLand", value);
                            calculateTotalLand(
                              formData.ownedLand,
                              value,
                              formData.govtAllottedLand,
                            );
                          }}
                          placeholder="Enter area in acres"
                          step="0.01"
                          className="w-full"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">
                        Land allotted by the Government
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <Input
                          type="number"
                          value={formData.govtAllottedLand}
                          onChange={(e) => {
                            const value = e.target.value;
                            handleInputChange("govtAllottedLand", value);
                            calculateTotalLand(
                              formData.ownedLand,
                              formData.leasedLand,
                              value,
                            );
                          }}
                          placeholder="Enter area in acres"
                          step="0.01"
                          className="w-full"
                        />
                      </td>
                    </tr>
                    <tr className="bg-gray-50 font-semibold">
                      <td className="border border-gray-300 px-4 py-2">
                        Total
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <Input
                          type="number"
                          value={formData.totalLand}
                          placeholder="Auto-calculated"
                          disabled
                          className="w-full bg-gray-100"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Financial Information Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          3. Financial Information
        </h2>

        <div className="space-y-6">
          <Input
            label="3(a). Total Outstanding Loan extended to promoters in last financial year (in Rs.)"
            type="number"
            value={formData.outstandingLoan}
            onChange={(e) =>
              handleInputChange("outstandingLoan", e.target.value)
            }
            placeholder="Enter outstanding loan amount"
            error={errors.outstandingLoan}
            required
          />

          <Input
            label="3(b). Last Financial Year Revenue (Other than interest) from Non-Credit Activities (in Rs.)"
            type="number"
            value={formData.nonCreditRevenue}
            onChange={(e) =>
              handleInputChange("nonCreditRevenue", e.target.value)
            }
            placeholder="Enter non-credit revenue amount"
          />
        </div>
      </Card>

      {/* PACS Activities Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          4. PACS Activities
        </h2>

        <div className="space-y-6">
          {/* Pesticide Distribution */}
          <div className="space-y-4">
            <RadioGroup
              label="4(a). Whether PACS is engaged in Pesticide Distribution?"
              options={[
                { value: "1", label: "Yes" },
                { value: "0", label: "No" },
              ]}
              value={formData.pesticideDistribution}
              onChange={(value) =>
                handleInputChange("pesticideDistribution", value)
              }
              name="pesticideDistribution"
              error={errors.pesticideDistribution}
              required
            />

            {formData.pesticideDistribution === "1" && (
              <Input
                label="If Yes, please specify the quantity of pesticide distributed in last financial year (In MT)"
                type="number"
                value={formData.pesticideQuantity}
                onChange={(e) =>
                  handleInputChange("pesticideQuantity", e.target.value)
                }
                placeholder="Enter quantity in MT"
                error={errors.pesticideQuantity}
                required
                step="0.01"
              />
            )}
          </div>

          {/* Fertilizer Distribution */}
          <div className="space-y-4">
            <RadioGroup
              label="4(b). Does the PACS possess a Fertilizer Distribution Centre?"
              options={[
                { value: "1", label: "Yes" },
                { value: "0", label: "No" },
              ]}
              value={formData.fertilizerDistribution}
              onChange={(value) =>
                handleInputChange("fertilizerDistribution", value)
              }
              name="fertilizerDistribution"
              error={errors.fertilizerDistribution}
              required
            />

            {formData.fertilizerDistribution === "1" && (
              <div className="space-y-4 ml-6">
                <Input
                  label="(i). If Yes, please specify the quantity of fertilizer distributed in last financial year (In MT)"
                  type="number"
                  value={formData.fertilizerQuantity}
                  onChange={(e) =>
                    handleInputChange("fertilizerQuantity", e.target.value)
                  }
                  placeholder="Enter quantity in MT"
                  error={errors.fertilizerQuantity}
                  required
                  step="0.01"
                />
                <Input
                  label="(ii). Remarks (if any)"
                  value={formData.fertilizerRemarks}
                  onChange={(e) =>
                    handleInputChange("fertilizerRemarks", e.target.value)
                  }
                  placeholder="Enter remarks"
                />
              </div>
            )}
          </div>

          {/* PMKSK */}
          <div className="space-y-4">
            <RadioGroup
              label="4(c). Does the PACS also function as Pradhan Mantri Kisan Samridhi Kendra (PMKSK)?"
              options={[
                { value: "1", label: "Yes" },
                { value: "0", label: "No" },
              ]}
              value={formData.pmkskFunction}
              onChange={(value) => handleInputChange("pmkskFunction", value)}
              name="pmkskFunction"
              error={errors.pmkskFunction}
              required
            />

            {formData.pmkskFunction === "1" && (
              <Input
                label="If Yes, please provide the details of Pradhan Mantri Kisan Samridhi Kendra (PMKSK)"
                value={formData.pmkskDetails}
                onChange={(e) =>
                  handleInputChange("pmkskDetails", e.target.value)
                }
                placeholder="Enter PMKSK details"
                error={errors.pmkskDetails}
                required
              />
            )}
          </div>

          {/* Seed Distribution */}
          <div className="space-y-4">
            <RadioGroup
              label="4(d). Whether PACS is engaged in Seed Distribution?"
              options={[
                { value: "1", label: "Yes" },
                { value: "0", label: "No" },
              ]}
              value={formData.seedDistribution}
              onChange={(value) => handleInputChange("seedDistribution", value)}
              name="seedDistribution"
              error={errors.seedDistribution}
              required
            />

            {formData.seedDistribution === "1" && (
              <Input
                label="If Yes, please specify the quantity of seed distributed in last financial year (In MT)"
                type="number"
                value={formData.seedQuantity}
                onChange={(e) =>
                  handleInputChange("seedQuantity", e.target.value)
                }
                placeholder="Enter quantity in MT"
                step="0.01"
                error={errors.seedQuantity}
                required
              />
            )}
          </div>

          {/* Food Grain Procurement */}
          <div className="space-y-4">
            <RadioGroup
              label="4(e). Whether PACS is engaged in Procurement of food grains?"
              options={[
                { value: "1", label: "Yes" },
                { value: "0", label: "No" },
              ]}
              value={formData.foodGrainProcurement}
              onChange={(value) =>
                handleInputChange("foodGrainProcurement", value)
              }
              name="foodGrainProcurement"
              error={errors.foodGrainProcurement}
              required
            />

            {formData.foodGrainProcurement === "1" && (
              <Input
                label="If Yes, please specify the quantity of Procurement done in last financial year (In MT)"
                type="number"
                value={formData.foodGrainQuantity}
                onChange={(e) =>
                  handleInputChange("foodGrainQuantity", e.target.value)
                }
                placeholder="Enter quantity in MT"
                step="0.01"
                error={errors.foodGrainQuantity}
                required
              />
            )}
          </div>

          {/* Custom Hiring */}
          <div className="space-y-4">
            <RadioGroup
              label="4(f). Does the PACS possess Custom Hiring Centre for hiring of agricultural equipments by the farmers?"
              options={[
                { value: "1", label: "Yes" },
                { value: "0", label: "No" },
              ]}
              value={formData.customHiring}
              onChange={(value) => handleInputChange("customHiring", value)}
              name="customHiring"
              error={errors.customHiring}
              required
            />

            {formData.customHiring === "1" && (
              <Input
                label="If Yes, please write the type of equipment"
                value={formData.equipmentType}
                onChange={(e) =>
                  handleInputChange("equipmentType", e.target.value)
                }
                placeholder="Enter equipment type"
                error={errors.equipmentType}
                required
              />
            )}
          </div>

          {/* Dry Storage */}
          <div className="space-y-4">
            <RadioGroup
              label="4(g). Does the PACS possess Dry Storage Infrastructure (Godown)?"
              options={[
                { value: "1", label: "Yes" },
                { value: "0", label: "No" },
              ]}
              value={formData.dryStorage}
              onChange={(value) => handleInputChange("dryStorage", value)}
              name="dryStorage"
              error={errors.dryStorage}
              required
            />

            {formData.dryStorage === "1" && (
              <Input
                label="If Yes, please specify the capacity of Dry Storage Infrastructure (Godown) (In MT)"
                type="number"
                value={formData.dryStorageCapacity}
                onChange={(e) =>
                  handleInputChange("dryStorageCapacity", e.target.value)
                }
                placeholder="Enter capacity in MT"
                error={errors.dryStorageCapacity}
                required
                step="0.01"
              />
            )}
          </div>

          {/* Grain Storage Project */}
          <div className="space-y-4">
            <RadioGroup
              label="4(h). Whether the PACS has participated in the 'World's largest Grain Storage Project?"
              options={[
                { value: "1", label: "Yes" },
                { value: "0", label: "No" },
              ]}
              value={formData.grainStorageProject}
              onChange={(value) =>
                handleInputChange("grainStorageProject", value)
              }
              name="grainStorageProject"
              error={errors.grainStorageProject}
              required
            />

            {formData.grainStorageProject === "1" && (
              <div className="space-y-4 ml-6">
                <Input
                  label="(i). If Yes, please specify the capacity of the proposed godown (In MT)"
                  type="number"
                  value={formData.grainStorageCapacity}
                  onChange={(e) =>
                    handleInputChange("grainStorageCapacity", e.target.value)
                  }
                  placeholder="Enter capacity in MT"
                  error={errors.grainStorageCapacity}
                  required
                  step="0.01"
                />
                <Input
                  label="(ii). Remarks (if any)"
                  value={formData.grainStorageRemarks}
                  onChange={(e) =>
                    handleInputChange("grainStorageRemarks", e.target.value)
                  }
                  placeholder="Enter remarks"
                />
              </div>
            )}
          </div>

          {/* Cold Storage */}
          <div className="space-y-4">
            <RadioGroup
              label="4(i). Does the PACS possess any Cold Storage facilities?"
              options={[
                { value: "1", label: "Yes" },
                { value: "0", label: "No" },
              ]}
              value={formData.coldStorage}
              onChange={(value) => handleInputChange("coldStorage", value)}
              name="coldStorage"
              error={errors.coldStorage}
              required
            />

            {formData.coldStorage === "1" && (
              <Input
                label="If Yes, please specify the capacity of Cold Storage Infrastructure (In MT)"
                type="number"
                value={formData.coldStorageCapacity}
                onChange={(e) =>
                  handleInputChange("coldStorageCapacity", e.target.value)
                }
                placeholder="Enter capacity in MT"
                error={errors.coldStorageCapacity}
                required
                step="0.01"
              />
            )}
          </div>

          {/* Milk Collection */}
          <div className="space-y-4">
            <RadioGroup
              label="4(j). Does the PACS have a Milk Collection Unit?"
              options={[
                { value: "1", label: "Yes" },
                { value: "0", label: "No" },
              ]}
              value={formData.milkCollection}
              onChange={(value) => handleInputChange("milkCollection", value)}
              name="milkCollection"
              error={errors.milkCollection}
              required
            />

            {formData.milkCollection === "1" && (
              <Input
                label="If Yes, please specify the average milk collection per day (In Litres)"
                type="number"
                value={formData.milkCollectionQuantity}
                onChange={(e) =>
                  handleInputChange("milkCollectionQuantity", e.target.value)
                }
                placeholder="Enter quantity in litres"
                error={errors.milkCollectionQuantity}
                required
                step="0.01"
              />
            )}
          </div>

          {/* Fishery Activities */}
          <div className="space-y-4">
            <RadioGroup
              label="4(k). Whether PACS is engaged in Fishery activities?"
              options={[
                { value: "1", label: "Yes" },
                { value: "0", label: "No" },
              ]}
              value={formData.fisheryActivities}
              onChange={(value) =>
                handleInputChange("fisheryActivities", value)
              }
              name="fisheryActivities"
              error={errors.fisheryActivities}
              required
            />

            {formData.fisheryActivities === "1" && (
              <Input
                label="If Yes, please specify total fish catch in last financial year (In MT)"
                type="number"
                value={formData.fishCatchQuantity}
                onChange={(e) =>
                  handleInputChange("fishCatchQuantity", e.target.value)
                }
                placeholder="Enter quantity in MT"
                error={errors.fishCatchQuantity}
                required
                step="0.01"
              />
            )}
          </div>

          {/* Food Processing */}
          <div className="space-y-4">
            <RadioGroup
              label="4(l). Does the PACS have Food Processing facilities?"
              options={[
                { value: "1", label: "Yes" },
                { value: "0", label: "No" },
              ]}
              value={formData.foodProcessing}
              onChange={(value) => handleInputChange("foodProcessing", value)}
              name="foodProcessing"
              error={errors.foodProcessing}
              required
            />

            {formData.foodProcessing === "1" && (
              <Input
                label="If Yes, please provide the details of the type of Food Processing facilities"
                value={formData.foodProcessingDetails}
                onChange={(e) =>
                  handleInputChange("foodProcessingDetails", e.target.value)
                }
                placeholder="Enter food processing details"
                error={errors.foodProcessingDetails}
                required
              />
            )}
          </div>

          {/* CSC */}
          <div className="space-y-4">
            <RadioGroup
              label="4(m). Does the PACS have a Common Service Centres (CSC)?"
              options={[
                { value: "1", label: "Yes" },
                { value: "0", label: "No" },
              ]}
              value={formData.cscFacility}
              onChange={(value) => handleInputChange("cscFacility", value)}
              name="cscFacility"
              error={errors.cscFacility}
              required
            />

            {formData.cscFacility === "1" && (
              <div className="space-y-4 ml-6">
                <Input
                  label="(i). Please provide the details on average revenue per month (in Rs.)"
                  type="number"
                  value={formData.cscRevenue}
                  onChange={(e) =>
                    handleInputChange("cscRevenue", e.target.value)
                  }
                  placeholder="Enter monthly revenue"
                  error={errors.cscRevenue}
                  required
                />
                <Input
                  label="(ii). Services provided by CSC"
                  value={formData.cscServices}
                  onChange={(e) =>
                    handleInputChange("cscServices", e.target.value)
                  }
                  placeholder="Enter CSC services"
                  error={errors.cscServices}
                  required
                />
              </div>
            )}
          </div>

          {/* FPO */}
          <div className="space-y-4">
            <RadioGroup
              label="4(n). Whether PACS is functioning as Farmer Producer Organization (FPO)?"
              options={[
                { value: "1", label: "Yes" },
                { value: "0", label: "No" },
              ]}
              value={formData.fpoFunction}
              onChange={(value) => handleInputChange("fpoFunction", value)}
              name="fpoFunction"
              error={errors.fpoFunction}
              required
            />

            {formData.fpoFunction === "1" && (
              <Input
                label="If Yes, please specify the details of Farmer Producer Organization (FPO)"
                value={formData.fpoDetails}
                onChange={(e) =>
                  handleInputChange("fpoDetails", e.target.value)
                }
                placeholder="Enter FPO details"
                error={errors.fpoDetails}
                required
              />
            )}
          </div>

          {/* LPG Dealership */}
          <div className="space-y-4">
            <RadioGroup
              label="4(o). Whether PACS is engaged in LPG Dealership?"
              options={[
                { value: "1", label: "Yes" },
                { value: "0", label: "No" },
              ]}
              value={formData.lpgDealership}
              onChange={(value) => handleInputChange("lpgDealership", value)}
              name="lpgDealership"
              error={errors.lpgDealership}
              required
            />

            {formData.lpgDealership === "1" && (
              <Input
                label="If Yes, please specify the LPG Dealership details"
                value={formData.lpgDetails}
                onChange={(e) =>
                  handleInputChange("lpgDetails", e.target.value)
                }
                placeholder="Enter LPG dealership details"
                error={errors.lpgDetails}
                required
              />
            )}
          </div>

          {/* Bulk Fuel Pump */}
          <div className="space-y-4">
            <RadioGroup
              label="4(q). Does the PACS have a bulk petrol/ diesel consumer pump?"
              options={[
                { value: "1", label: "Yes" },
                { value: "0", label: "No" },
              ]}
              value={formData.bulkFuelPump}
              onChange={(value) => handleInputChange("bulkFuelPump", value)}
              name="bulkFuelPump"
              error={errors.bulkFuelPump}
              required
            />

            {formData.bulkFuelPump === "1" && (
              <Input
                label="If Yes, please specify the details of bulk dealership"
                value={formData.bulkFuelDetails}
                onChange={(e) =>
                  handleInputChange("bulkFuelDetails", e.target.value)
                }
                placeholder="Enter bulk fuel details"
                error={errors.bulkFuelDetails}
                required
              />
            )}
          </div>

          {/* Retail Fuel Dealership */}
          <div className="space-y-4">
            <RadioGroup
              label="4(r). Whether PACS is engaged in petrol/diesel retail dealership?"
              options={[
                { value: "1", label: "Yes" },
                { value: "0", label: "No" },
              ]}
              value={formData.retailFuelDealership}
              onChange={(value) =>
                handleInputChange("retailFuelDealership", value)
              }
              name="retailFuelDealership"
              error={errors.retailFuelDealership}
              required
            />

            {formData.retailFuelDealership === "1" && (
              <Input
                label="If Yes, please specify the details of retail dealership"
                value={formData.retailFuelDetails}
                onChange={(e) =>
                  handleInputChange("retailFuelDetails", e.target.value)
                }
                placeholder="Enter retail fuel details"
                error={errors.retailFuelDetails}
                required
              />
            )}
          </div>

          {/* PMBJK */}
          <div className="space-y-4">
            <RadioGroup
              label="4(s). Whether PACS is operational as Pradhan Mantri Bhartiya Jan Aushadhi Kendra (PMBJK)?"
              options={[
                { value: "1", label: "Yes" },
                { value: "0", label: "No" },
              ]}
              value={formData.pmbjk}
              onChange={(value) => handleInputChange("pmbjk", value)}
              name="pmbjk"
              error={errors.pmbjk}
              required
            />

            {formData.pmbjk === "1" && (
              <Input
                label="If Yes, please specify the average monthly revenue under PMBJK (in Rs.)"
                type="number"
                value={formData.pmbjkRevenue}
                onChange={(e) =>
                  handleInputChange("pmbjkRevenue", e.target.value)
                }
                placeholder="Enter monthly revenue"
                error={errors.pmbjkRevenue}
                required
              />
            )}
          </div>

          {/* PM-KUSUM */}
          <div className="space-y-4">
            <RadioGroup
              label="4(t). Whether PACS has participated in PM-KUSUM Scheme?"
              options={[
                { value: "1", label: "Yes" },
                { value: "0", label: "No" },
              ]}
              value={formData.pmKusum}
              onChange={(value) => handleInputChange("pmKusum", value)}
              name="pmKusum"
              error={errors.pmKusum}
              required
            />

            {formData.pmKusum === "1" && (
              <Input
                label="If Yes, please specify the benefits availed under PM-KUSUM Scheme"
                value={formData.pmKusumBenefits}
                onChange={(e) =>
                  handleInputChange("pmKusumBenefits", e.target.value)
                }
                placeholder="Enter PM-KUSUM benefits"
                error={errors.pmKusumBenefits}
                required
              />
            )}
          </div>

          {/* Fair Price Shop */}
          <div className="space-y-4">
            <RadioGroup
              label="4(u). Does the PACS have Fair Price Shop/PDS License"
              options={[
                { value: "1", label: "Yes" },
                { value: "0", label: "No" },
              ]}
              value={formData.fairPriceShop}
              onChange={(value) => handleInputChange("fairPriceShop", value)}
              name="fairPriceShop"
              error={errors.fairPriceShop}
              required
            />

            {formData.fairPriceShop === "1" && (
              <div className="space-y-4 ml-6">
                <Input
                  label="(i). If Yes, please specify, Average monthly distribution quantity (in Kg)"
                  type="number"
                  value={formData.fairPriceQuantity}
                  onChange={(e) =>
                    handleInputChange("fairPriceQuantity", e.target.value)
                  }
                  placeholder="Enter monthly quantity in Kg"
                  error={errors.fairPriceQuantity}
                  required
                  step="0.01"
                />
                <Input
                  label="(ii). Remarks (if any)"
                  value={formData.fairPriceRemarks}
                  onChange={(e) =>
                    handleInputChange("fairPriceRemarks", e.target.value)
                  }
                  placeholder="Enter remarks"
                />
              </div>
            )}
          </div>

          {/* Nal-se-Jal */}
          <div className="space-y-4">
            <RadioGroup
              label="4(v). Does the PACS carry out Operation & Maintenance under 'Nal-se-Jal Yojana'?"
              options={[
                { value: "1", label: "Yes" },
                { value: "0", label: "No" },
              ]}
              value={formData.nalSeJal}
              onChange={(value) => handleInputChange("nalSeJal", value)}
              name="nalSeJal"
              error={errors.nalSeJal}
              required
            />

            {formData.nalSeJal === "1" && (
              <Input
                label="If Yes. Please provide activities being carried out under 'Nal-se-Jal Yojana'"
                value={formData.nalSeJalActivities}
                onChange={(e) =>
                  handleInputChange("nalSeJalActivities", e.target.value)
                }
                placeholder="Enter Nal-se-Jal activities"
                error={errors.nalSeJalActivities}
                required
              />
            )}
          </div>
          {/* Consumer Business */}
          <div className="space-y-4">
            <RadioGroup
              label="4(w). Whether PACS is engaged in Consumer Business?"
              options={[
                { value: "1", label: "Yes" },
                { value: "0", label: "No" },
              ]}
              value={formData.consumerBusiness}
              onChange={(value) => handleInputChange("consumerBusiness", value)}
              name="consumerBusiness"
              error={errors.consumerBusiness}
              required
            />

            {formData.consumerBusiness === "1" && (
              <Input
                label="If Yes, please specify the details of Consumer Business"
                value={formData.consumerBusinessDetails}
                onChange={(e) =>
                  handleInputChange("consumerBusinessDetails", e.target.value)
                }
                placeholder="Enter consumer business details"
                error={errors.consumerBusinessDetails}
                required
              />
            )}
          </div>

          {/* Tourism */}
          <div className="space-y-4">
            <RadioGroup
              label="4(x). Whether PACS is engaged in Tourism Activities?"
              options={[
                { value: "1", label: "Yes" },
                { value: "0", label: "No" },
              ]}
              value={formData.tourism}
              onChange={(value) => handleInputChange("tourism", value)}
              name="tourism"
              error={errors.tourism}
              required
            />

            {formData.tourism === "1" && (
              <Input
                label="If Yes, please specify Tourism Activities"
                value={formData.tourismDetails}
                onChange={(e) =>
                  handleInputChange("tourismDetails", e.target.value)
                }
                placeholder="Enter tourism activity details"
                error={errors.tourismDetails}
                required
              />
            )}
          </div>

          {/* Cash Kendra Facilities */}
          <div className="space-y-4">
            <RadioGroup
              label="4(y). Whether PACS has Cash Kendra Facilities?"
              options={[
                { value: "1", label: "Yes" },
                { value: "0", label: "No" },
              ]}
              value={formData.cashKendraFacilities}
              onChange={(value) =>
                handleInputChange("cashKendraFacilities", value)
              }
              name="cashKendraFacilities"
              error={errors.cashKendraFacilities}
              required
            />

            {formData.cashKendraFacilities === "1" && (
              <Input
                label="If Yes, please specify Cash Kendra Facilities details"
                value={formData.cashKendraFacilitiesDetails}
                onChange={(e) =>
                  handleInputChange(
                    "cashKendraFacilitiesDetails",
                    e.target.value,
                  )
                }
                placeholder="Enter cash kendra facility details"
                error={errors.cashKendraFacilitiesDetails}
                required
              />
            )}
          </div>
          {/* Other Facilities */}
          <div className="space-y-4">
            <Textarea
              label="4(z). Please specify any other facilities/ services/ businesses carried out by the PACS"
              value={formData.otherFacilities}
              onChange={(e) =>
                handleInputChange("otherFacilities", e.target.value)
              }
              placeholder="Describe other facilities, services, or businesses"
              rows={4}
            />
          </div>
        </div>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Submit Application</Button>
      </div>
    </form>
  );
};

export default CooperativeRegistrationsPrimary;
