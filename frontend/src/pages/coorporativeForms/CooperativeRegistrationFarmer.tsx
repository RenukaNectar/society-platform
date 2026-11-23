import React, { useState } from 'react';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { RadioGroup } from '../../components/ui/RadioGroup';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface FormData {
  // Office Building
  hasOfficeBuilding: string;
  officeBuildingType: string;

  // Land Details
  hasLand: string;
  landDetails: {
    ownedLand: string;
    leasedLand: string;
    govtAllottedLand: string;
    totalArea: string;
  };

  // Financial Details
  totalOutstandingLoan: string;
  lastFinancialYearRevenue: string;

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
  procurementQuantity: string;
  customHiringCentre: string;
  equipmentTypes: string;
  dryStorageInfrastructure: string;
  storageCapacity: string;
  grainStorageProject: string;
  proposedGodownCapacity: string;
  grainStorageRemarks: string;
  coldStorageFacilities: string;
  coldStorageCapacity: string;
  milkCollectionUnit: string;
  averageMilkCollection: string;
  fisheryActivities: string;
  fishCatchQuantity: string;
  foodProcessingFacilities: string;
  foodProcessingDetails: string;
  commonServiceCentres: string;
  cscRevenue: string;
  cscServices: string;
  fpoFunction: string;
  fpoDetails: string;
  lpgDealership: string;
  lpgDealershipDetails: string;
  bulkPetrolDiesel: string;
  bulkDealershipDetails: string;
  petrolDieselRetail: string;
  retailDealershipDetails: string;
  pmbjkOperational: string;
  pmbjkRevenue: string;
  pmKusumScheme: string;
  pmKusumBenefits: string;
  fairPriceShop: string;
  pdsQuantity: string;
  pdsRemarks: string;
  nalSeJalYojana: string;
  nalSeJalActivities: string;
  otherFacilities: string;
}

const CooperativeRegistrationFarmer = ({
  data,
  onCancel,
  onClose,
  onSubmit
}: {
  data: any,
  onCancel: () => void,
  onClose: () => void,
  onSubmit: (data: any) => void
}) => {

  const [formData, setFormData] = useState<FormData>({
    hasOfficeBuilding: data?.hasOfficeBuilding || '',
    officeBuildingType: data?.officeBuildingType || '',
    hasLand: data?.hasLand || '',
    landDetails: {
      ownedLand: data?.landDetails?.ownedLand || '',
      leasedLand: data?.landDetails?.leasedLand || '',
      govtAllottedLand: data?.landDetails?.govtAllottedLand || '',
      totalArea: data?.landDetails?.totalArea || ''
    },
    totalOutstandingLoan: data?.totalOutstandingLoan || '',
    lastFinancialYearRevenue: data?.lastFinancialYearRevenue || '',
    pesticideDistribution: data?.pesticideDistribution || '',
    pesticideQuantity: data?.pesticideQuantity || '',
    fertilizerDistribution: '',
    fertilizerQuantity: data?.fertilizerQuantity || '',
    fertilizerRemarks: data?.fertilizerRemarks || '',
    pmkskFunction: data?.pmkskFunction || '',
    pmkskDetails: data?.pmkskDetails || '',
    seedDistribution: data?.seedDistribution || '',
    seedQuantity: data?.seedQuantity || '',
    foodGrainProcurement: data?.foodGrainProcurement || '',
    procurementQuantity: data?.procurementQuantity || '',
    customHiringCentre: data?.customHiringCentre || '',
    equipmentTypes: data?.equipmentTypes || '',
    dryStorageInfrastructure: data?.dryStorageInfrastructure || '',
    storageCapacity: data?.storageCapacity || '',
    grainStorageProject: data?.grainStorageProject || '',
    proposedGodownCapacity: data?.proposedGodownCapacity || '',
    grainStorageRemarks: data?.grainStorageRemarks || '',
    coldStorageFacilities: data?.coldStorageFacilities || '',
    coldStorageCapacity: data?.coldStorageCapacity || '',
    milkCollectionUnit: data?.milkCollectionUnit || '',
    averageMilkCollection: data?.averageMilkCollection || '',
    fisheryActivities: data?.fisheryActivities || '',
    fishCatchQuantity: data?.fishCatchQuantity || '',
    foodProcessingFacilities: data?.foodProcessingFacilities || '',
    foodProcessingDetails: data?.foodProcessingDetails || '',
    commonServiceCentres: data?.commonServiceCentres || '',
    cscRevenue: data?.cscRevenue || '',
    cscServices: data?.cscServices || '',
    fpoFunction: data?.fpoFunction || '',
    fpoDetails: data?.fpoDetails || '',
    lpgDealership: data?.lpgDealership || '',
    lpgDealershipDetails: data?.lpgDealershipDetails || '',
    bulkPetrolDiesel: data?.bulkPetrolDiesel || '',
    bulkDealershipDetails: data?.bulkDealershipDetails || '',
    petrolDieselRetail: data?.petrolDieselRetail || '',
    retailDealershipDetails: data?.retailDealershipDetails || '',
    pmbjkOperational: data?.pmbjkOperational || '',
    pmbjkRevenue: data?.pmbjkRevenue || '',
    pmKusumScheme: data?.pmKusumScheme || '',
    pmKusumBenefits: data?.pmKusumBenefits || '',
    fairPriceShop: data?.fairPriceShop || '',
    pdsQuantity: data?.pdsQuantity || '',
    pdsRemarks: data?.pdsRemarks || '',
    nalSeJalYojana: data?.nalSeJalYojana || '',
    nalSeJalActivities: data?.nalSeJalActivities || '',
    otherFacilities: data?.otherFacilities || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const officeBuildingTypes = [
    { value: 'own', label: 'Own Building' },
    { value: 'rented', label: 'Rented Building' },
    { value: 'rent_free', label: 'Rent Free Building' },
    { value: 'leased', label: 'Leased Building' },
    { value: 'govt_provided', label: 'Building Provided by the Government' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLandDetailsChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      landDetails: { ...prev.landDetails, [field]: value }
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.hasOfficeBuilding) newErrors.hasOfficeBuilding = 'Please specify if society has office building';
    if (formData.hasOfficeBuilding === 'yes' && !formData.officeBuildingType) {
      newErrors.officeBuildingType = 'Office building type is required';
    }
    if (!formData.hasLand) newErrors.hasLand = 'Please specify if society has land';
    if (!formData.totalOutstandingLoan) newErrors.totalOutstandingLoan = 'Total outstanding loan is required';
    if (!formData.lastFinancialYearRevenue) newErrors.lastFinancialYearRevenue = 'Last financial year revenue is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Form submitted:', formData);
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Office Building Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">1. Office Building</h2>

        <div className="space-y-6">
          <RadioGroup
            label="1(a). Whether the co-operative society has an office building"
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' }
            ]}
            value={formData.hasOfficeBuilding}
            onChange={(value) => handleInputChange('hasOfficeBuilding', value)}
            name="hasOfficeBuilding"
            error={errors.hasOfficeBuilding}
          />

          {formData.hasOfficeBuilding === 'yes' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">1(b). Type of Office Building</h3>
              <RadioGroup
                options={officeBuildingTypes}
                value={formData.officeBuildingType}
                onChange={(value) => handleInputChange('officeBuildingType', value)}
                name="officeBuildingType"
                error={errors.officeBuildingType}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Land Details Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">2. Land Details</h2>

        <div className="space-y-6">
          <RadioGroup
            label="2(a). Whether the co-operative society has land"
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' }
            ]}
            value={formData.hasLand}
            onChange={(value) => handleInputChange('hasLand', value)}
            name="hasLand"
            error={errors.hasLand}
          />

          {formData.hasLand === 'yes' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">2(b). Land Available with the Cooperative</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Owned land (Area in Acre)"
                    type="number"
                    value={formData.landDetails.ownedLand}
                    onChange={(e) => handleLandDetailsChange('ownedLand', e.target.value)}
                    placeholder="Enter area in acres"
                  />

                  <Input
                    label="Leased land (Area in Acre)"
                    type="number"
                    value={formData.landDetails.leasedLand}
                    onChange={(e) => handleLandDetailsChange('leasedLand', e.target.value)}
                    placeholder="Enter area in acres"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Land allotted by the Government (Area in Acre)"
                    type="number"
                    value={formData.landDetails.govtAllottedLand}
                    onChange={(e) => handleLandDetailsChange('govtAllottedLand', e.target.value)}
                    placeholder="Enter area in acres"
                  />

                  <Input
                    label="Total (Area in Acre)"
                    type="number"
                    value={formData.landDetails.totalArea}
                    onChange={(e) => handleLandDetailsChange('totalArea', e.target.value)}
                    placeholder="Enter total area in acres"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Financial Details Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">3. Financial Details</h2>

        <div className="space-y-6">
          <Input
            label="3(a). Total Outstanding Loan extended to promoters in last financial year (in Rs.)"
            type="number"
            value={formData.totalOutstandingLoan}
            onChange={(e) => handleInputChange('totalOutstandingLoan', e.target.value)}
            placeholder="Enter total outstanding loan amount"
            error={errors.totalOutstandingLoan}
            required
          />

          <Input
            label="3(b). Last Financial Year Revenue (Other than interest) from Non-Credit Activities (in Rs.)"
            type="number"
            value={formData.lastFinancialYearRevenue}
            onChange={(e) => handleInputChange('lastFinancialYearRevenue', e.target.value)}
            placeholder="Enter revenue amount"
            error={errors.lastFinancialYearRevenue}
            required
          />
        </div>
      </Card>

      {/* PACS Activities Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">4. PACS Activities</h2>

        <div className="space-y-6">
          {/* Pesticide Distribution */}
          <div className="space-y-4">
            <RadioGroup
              label="4(a). Whether PACS is engaged in Pesticide Distribution?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.pesticideDistribution}
              onChange={(value) => handleInputChange('pesticideDistribution', value)}
              name="pesticideDistribution"
            />

            {formData.pesticideDistribution === 'yes' && (
              <Input
                label="If Yes, please specify the quantity of pesticide distributed in last financial year (In MT)"
                type="number"
                value={formData.pesticideQuantity}
                onChange={(e) => handleInputChange('pesticideQuantity', e.target.value)}
                placeholder="Enter quantity in MT"
              />
            )}
          </div>

          {/* Fertilizer Distribution */}
          <div className="space-y-4">
            <RadioGroup
              label="4(b). Does the PACS possess a Fertilizer Distribution Centre?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.fertilizerDistribution}
              onChange={(value) => handleInputChange('fertilizerDistribution', value)}
              name="fertilizerDistribution"
            />

            {formData.fertilizerDistribution === 'yes' && (
              <div className="space-y-4">
                <Input
                  label="(i). If Yes, please specify the quantity of fertilizer distributed in last financial year (In MT)"
                  type="number"
                  value={formData.fertilizerQuantity}
                  onChange={(e) => handleInputChange('fertilizerQuantity', e.target.value)}
                  placeholder="Enter quantity in MT"
                />

                <Textarea
                  label="(ii). Remarks (if any)"
                  value={formData.fertilizerRemarks}
                  onChange={(e) => handleInputChange('fertilizerRemarks', e.target.value)}
                  placeholder="Enter any remarks..."
                  rows={2}
                />
              </div>
            )}
          </div>

          {/* PMKSK */}
          <div className="space-y-4">
            <RadioGroup
              label="4(c). Does the PACS also function as Pradhan Mantri Kisan Samridhi Kendra (PMKSK)?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.pmkskFunction}
              onChange={(value) => handleInputChange('pmkskFunction', value)}
              name="pmkskFunction"
            />

            {formData.pmkskFunction === 'yes' && (
              <Textarea
                label="If Yes, please provide the details of Pradhan Mantri Kisan Samridhi Kendra (PMKSK)"
                value={formData.pmkskDetails}
                onChange={(e) => handleInputChange('pmkskDetails', e.target.value)}
                placeholder="Enter PMKSK details..."
                rows={3}
              />
            )}
          </div>

          {/* Seed Distribution */}
          <div className="space-y-4">
            <RadioGroup
              label="4(d). Whether PACS is engaged in Seed Distribution?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.seedDistribution}
              onChange={(value) => handleInputChange('seedDistribution', value)}
              name="seedDistribution"
            />

            {formData.seedDistribution === 'yes' && (
              <Input
                label="If Yes, please specify the quantity of seed distributed in last financial year (In MT)"
                type="number"
                value={formData.seedQuantity}
                onChange={(e) => handleInputChange('seedQuantity', e.target.value)}
                placeholder="Enter quantity in MT"
              />
            )}
          </div>

          {/* Food Grain Procurement */}
          <div className="space-y-4">
            <RadioGroup
              label="4(e). Whether PACS is engaged in Procurement of food grains?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.foodGrainProcurement}
              onChange={(value) => handleInputChange('foodGrainProcurement', value)}
              name="foodGrainProcurement"
            />

            {formData.foodGrainProcurement === 'yes' && (
              <Input
                label="If Yes, please specify the quantity of Procurement done in last financial year (In MT)"
                type="number"
                value={formData.procurementQuantity}
                onChange={(e) => handleInputChange('procurementQuantity', e.target.value)}
                placeholder="Enter quantity in MT"
              />
            )}
          </div>

          {/* Custom Hiring Centre */}
          <div className="space-y-4">
            <RadioGroup
              label="4(f). Does the PACS possess Custom Hiring Centre for hiring of agricultural equipments by the farmers?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.customHiringCentre}
              onChange={(value) => handleInputChange('customHiringCentre', value)}
              name="customHiringCentre"
            />

            {formData.customHiringCentre === 'yes' && (
              <Textarea
                label="If Yes, please write the type of equipment"
                value={formData.equipmentTypes}
                onChange={(e) => handleInputChange('equipmentTypes', e.target.value)}
                placeholder="Enter types of equipment..."
                rows={3}
              />
            )}
          </div>

          {/* Dry Storage Infrastructure */}
          <div className="space-y-4">
            <RadioGroup
              label="4(g). Does the PACS possess Dry Storage Infrastructure (Godown)?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.dryStorageInfrastructure}
              onChange={(value) => handleInputChange('dryStorageInfrastructure', value)}
              name="dryStorageInfrastructure"
            />

            {formData.dryStorageInfrastructure === 'yes' && (
              <Input
                label="If Yes, please specify the capacity of Dry Storage Infrastructure (Godown) (In MT)"
                type="number"
                value={formData.storageCapacity}
                onChange={(e) => handleInputChange('storageCapacity', e.target.value)}
                placeholder="Enter capacity in MT"
              />
            )}
          </div>

          {/* Grain Storage Project */}
          <div className="space-y-4">
            <RadioGroup
              label="4(h). Whether the PACS has participated in the 'World's largest Grain Storage Project?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.grainStorageProject}
              onChange={(value) => handleInputChange('grainStorageProject', value)}
              name="grainStorageProject"
            />

            {formData.grainStorageProject === 'yes' && (
              <div className="space-y-4">
                <Input
                  label="(i). If Yes, please specify the capacity of the proposed godown (In MT)"
                  type="number"
                  value={formData.proposedGodownCapacity}
                  onChange={(e) => handleInputChange('proposedGodownCapacity', e.target.value)}
                  placeholder="Enter capacity in MT"
                />

                <Textarea
                  label="(ii). Remarks (if any)"
                  value={formData.grainStorageRemarks}
                  onChange={(e) => handleInputChange('grainStorageRemarks', e.target.value)}
                  placeholder="Enter any remarks..."
                  rows={2}
                />
              </div>
            )}
          </div>

          {/* Cold Storage */}
          <div className="space-y-4">
            <RadioGroup
              label="4(i). Does the PACS possess any Cold Storage facilities?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.coldStorageFacilities}
              onChange={(value) => handleInputChange('coldStorageFacilities', value)}
              name="coldStorageFacilities"
            />

            {formData.coldStorageFacilities === 'yes' && (
              <Input
                label="If Yes, please specify the capacity of Cold Storage Infrastructure (In MT)"
                type="number"
                value={formData.coldStorageCapacity}
                onChange={(e) => handleInputChange('coldStorageCapacity', e.target.value)}
                placeholder="Enter capacity in MT"
              />
            )}
          </div>

          {/* Milk Collection Unit */}
          <div className="space-y-4">
            <RadioGroup
              label="4(j). Does the PACS have a Milk Collection Unit?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.milkCollectionUnit}
              onChange={(value) => handleInputChange('milkCollectionUnit', value)}
              name="milkCollectionUnit"
            />

            {formData.milkCollectionUnit === 'yes' && (
              <Input
                label="If Yes, please specify the average milk collection per day (In Litres)"
                type="number"
                value={formData.averageMilkCollection}
                onChange={(e) => handleInputChange('averageMilkCollection', e.target.value)}
                placeholder="Enter average collection in litres"
              />
            )}
          </div>

          {/* Fishery Activities */}
          <div className="space-y-4">
            <RadioGroup
              label="4(k). Whether PACS is engaged in Fishery activities?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.fisheryActivities}
              onChange={(value) => handleInputChange('fisheryActivities', value)}
              name="fisheryActivities"
            />

            {formData.fisheryActivities === 'yes' && (
              <Input
                label="If Yes, please specify total fish catch in last financial year (In MT)"
                type="number"
                value={formData.fishCatchQuantity}
                onChange={(e) => handleInputChange('fishCatchQuantity', e.target.value)}
                placeholder="Enter fish catch quantity in MT"
              />
            )}
          </div>

          {/* Food Processing */}
          <div className="space-y-4">
            <RadioGroup
              label="4(l). Does the PACS have Food Processing facilities?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.foodProcessingFacilities}
              onChange={(value) => handleInputChange('foodProcessingFacilities', value)}
              name="foodProcessingFacilities"
            />

            {formData.foodProcessingFacilities === 'yes' && (
              <Textarea
                label="If Yes, please provide the details of the type of Food Processing facilities"
                value={formData.foodProcessingDetails}
                onChange={(e) => handleInputChange('foodProcessingDetails', e.target.value)}
                placeholder="Enter food processing facility details..."
                rows={3}
              />
            )}
          </div>

          {/* Common Service Centres */}
          <div className="space-y-4">
            <RadioGroup
              label="4(m). Does the PACS have a Common Service Centres (CSC)?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.commonServiceCentres}
              onChange={(value) => handleInputChange('commonServiceCentres', value)}
              name="commonServiceCentres"
            />

            {formData.commonServiceCentres === 'yes' && (
              <div className="space-y-4">
                <Input
                  label="(i). Please provide the details on average revenue per month (in Rs.)"
                  type="number"
                  value={formData.cscRevenue}
                  onChange={(e) => handleInputChange('cscRevenue', e.target.value)}
                  placeholder="Enter average monthly revenue"
                />

                <Textarea
                  label="(ii). Services provided by CSC"
                  value={formData.cscServices}
                  onChange={(e) => handleInputChange('cscServices', e.target.value)}
                  placeholder="Enter services provided..."
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* FPO */}
          <div className="space-y-4">
            <RadioGroup
              label="4(n). Whether PACS is functioning as Farmer Producer Organization (FPO)?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.fpoFunction}
              onChange={(value) => handleInputChange('fpoFunction', value)}
              name="fpoFunction"
            />

            {formData.fpoFunction === 'yes' && (
              <Textarea
                label="If Yes, please specify the details of Farmer Producer Organization (FPO)"
                value={formData.fpoDetails}
                onChange={(e) => handleInputChange('fpoDetails', e.target.value)}
                placeholder="Enter FPO details..."
                rows={3}
              />
            )}
          </div>

          {/* LPG Dealership */}
          <div className="space-y-4">
            <RadioGroup
              label="4(o). Whether PACS is engaged in LPG Dealership?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.lpgDealership}
              onChange={(value) => handleInputChange('lpgDealership', value)}
              name="lpgDealership"
            />

            {formData.lpgDealership === 'yes' && (
              <Textarea
                label="If Yes, please specify the LPG Dealership details"
                value={formData.lpgDealershipDetails}
                onChange={(e) => handleInputChange('lpgDealershipDetails', e.target.value)}
                placeholder="Enter LPG dealership details..."
                rows={3}
              />
            )}
          </div>

          {/* Bulk Petrol/Diesel */}
          <div className="space-y-4">
            <RadioGroup
              label="4(p). Does the PACS have a bulk petrol/ diesel consumer pump?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.bulkPetrolDiesel}
              onChange={(value) => handleInputChange('bulkPetrolDiesel', value)}
              name="bulkPetrolDiesel"
            />

            {formData.bulkPetrolDiesel === 'yes' && (
              <Textarea
                label="If Yes, please specify the details of bulk dealership"
                value={formData.bulkDealershipDetails}
                onChange={(e) => handleInputChange('bulkDealershipDetails', e.target.value)}
                placeholder="Enter bulk dealership details..."
                rows={3}
              />
            )}
          </div>

          {/* Petrol/Diesel Retail */}
          <div className="space-y-4">
            <RadioGroup
              label="4(q). Whether PACS is engaged in petrol/diesel retail dealership?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.petrolDieselRetail}
              onChange={(value) => handleInputChange('petrolDieselRetail', value)}
              name="petrolDieselRetail"
            />

            {formData.petrolDieselRetail === 'yes' && (
              <Textarea
                label="If Yes, please specify the details of retail dealership"
                value={formData.retailDealershipDetails}
                onChange={(e) => handleInputChange('retailDealershipDetails', e.target.value)}
                placeholder="Enter retail dealership details..."
                rows={3}
              />
            )}
          </div>

          {/* PMBJK */}
          <div className="space-y-4">
            <RadioGroup
              label="4(r). Whether PACS is operational as Pradhan Mantri Bhartiya Jan Aushadhi Kendra (PMBJK)?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.pmbjkOperational}
              onChange={(value) => handleInputChange('pmbjkOperational', value)}
              name="pmbjkOperational"
            />

            {formData.pmbjkOperational === 'yes' && (
              <Input
                label="If Yes, please specify the average monthly revenue under PMBJK (in Rs.)"
                type="number"
                value={formData.pmbjkRevenue}
                onChange={(e) => handleInputChange('pmbjkRevenue', e.target.value)}
                placeholder="Enter average monthly revenue"
              />
            )}
          </div>

          {/* PM-KUSUM Scheme */}
          <div className="space-y-4">
            <RadioGroup
              label="4(s). Whether PACS has participated in PM-KUSUM Scheme?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.pmKusumScheme}
              onChange={(value) => handleInputChange('pmKusumScheme', value)}
              name="pmKusumScheme"
            />

            {formData.pmKusumScheme === 'yes' && (
              <Textarea
                label="If Yes, please specify the benefits availed under PM-KUSUM Scheme"
                value={formData.pmKusumBenefits}
                onChange={(e) => handleInputChange('pmKusumBenefits', e.target.value)}
                placeholder="Enter PM-KUSUM benefits..."
                rows={3}
              />
            )}
          </div>

          {/* Fair Price Shop/PDS */}
          <div className="space-y-4">
            <RadioGroup
              label="4(t). Does the PACS have Fair Price Shop/PDS License"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.fairPriceShop}
              onChange={(value) => handleInputChange('fairPriceShop', value)}
              name="fairPriceShop"
            />

            {formData.fairPriceShop === 'yes' && (
              <div className="space-y-4">
                <Input
                  label="(i). If Yes, please specify, Average monthly distribution quantity (in Kg)"
                  type="number"
                  value={formData.pdsQuantity}
                  onChange={(e) => handleInputChange('pdsQuantity', e.target.value)}
                  placeholder="Enter average monthly quantity in Kg"
                />

                <Textarea
                  label="(ii). Remarks (if any)"
                  value={formData.pdsRemarks}
                  onChange={(e) => handleInputChange('pdsRemarks', e.target.value)}
                  placeholder="Enter any remarks..."
                  rows={2}
                />
              </div>
            )}
          </div>

          {/* Nal-se-Jal Yojana */}
          <div className="space-y-4">
            <RadioGroup
              label="4(u). Does the PACS carry out Operation & Maintenance under 'Nal-se-Jal Yojana'?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.nalSeJalYojana}
              onChange={(value) => handleInputChange('nalSeJalYojana', value)}
              name="nalSeJalYojana"
            />

            {formData.nalSeJalYojana === 'yes' && (
              <Textarea
                label="If Yes. Please provide activities being carried out under 'Nal-se-Jal Yojana'"
                value={formData.nalSeJalActivities}
                onChange={(e) => handleInputChange('nalSeJalActivities', e.target.value)}
                placeholder="Enter Nal-se-Jal activities..."
                rows={3}
              />
            )}
          </div>

          {/* Other Facilities */}
          <div className="space-y-4">
            <Textarea
              label="4(v). Please specify any other facilities/ services/ businesses carried out by the PACS"
              value={formData.otherFacilities}
              onChange={(e) => handleInputChange('otherFacilities', e.target.value)}
              placeholder="Enter any other facilities, services, or businesses..."
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
        <Button type="submit">
          Submit Application
        </Button>
      </div>
    </form>
  );
};

export default CooperativeRegistrationFarmer;