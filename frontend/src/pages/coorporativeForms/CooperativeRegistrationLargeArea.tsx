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
  ownedLand: string;
  leasedLand: string;
  governmentAllottedLand: string;
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
  proposedGodownCapacity: string;
  grainStorageRemarks: string;
  coldStorage: string;
  coldStorageCapacity: string;
  milkCollection: string;
  milkCollectionPerDay: string;
  fisheryActivities: string;
  fishCatchQuantity: string;
  foodProcessing: string;
  foodProcessingDetails: string;
  csc: string;
  cscRevenue: string;
  cscServices: string;
  fpo: string;
  fpoDetails: string;
  lpgDealership: string;
  lpgDetails: string;
  bulkFuelPump: string;
  bulkDealershipDetails: string;
  retailFuelDealership: string;
  retailDealershipDetails: string;
  pmbjk: string;
  pmbjkRevenue: string;
  pmKusum: string;
  pmKusumBenefits: string;
  fairPriceShop: string;
  pdsQuantity: string;
  pdsRemarks: string;
  nalSeJal: string;
  nalSeJalActivities: string;
  otherFacilities: string;
}

const CooperativeRegistrationLargeArea = ({
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
    ownedLand: data?.ownedLand || '',
    leasedLand: data?.leasedLand || '',
    governmentAllottedLand: data?.governmentAllottedLand || '',
    totalLand: data?.totalLand || '',
    outstandingLoan: data?.outstandingLoan || '',
    nonCreditRevenue: data?.nonCreditRevenue || '',
    pesticideDistribution: data?.pesticideDistribution || '',
    pesticideQuantity: data?.pesticideQuantity || '',
    fertilizerDistribution: data?.fertilizerDistribution || '',
    fertilizerQuantity: data?.fertilizerQuantity || '',
    fertilizerRemarks: data?.fertilizerRemarks || '',
    pmkskFunction: data?.pmkskFunction || '',
    pmkskDetails: data?.pmkskDetails || '',
    seedDistribution: data?.seedDistribution || '',
    seedQuantity: data?.seedQuantity || '',
    foodGrainProcurement: data?.foodGrainProcurement || '',
    foodGrainQuantity: data?.foodGrainQuantity || '',
    customHiring: data?.customHiring || '',
    equipmentType: data?.equipmentType || '',
    dryStorage: data?.dryStorage || '',
    dryStorageCapacity: data?.dryStorageCapacity || '',
    grainStorageProject: data?.grainStorageProject || '',
    proposedGodownCapacity: data?.proposedGodownCapacity || '',
    grainStorageRemarks: data?.grainStorageRemarks || '',
    coldStorage: data?.coldStorage || '',
    coldStorageCapacity: data?.coldStorageCapacity || '',
    milkCollection: data?.milkCollection || '',
    milkCollectionPerDay: data?.milkCollectionPerDay || '',
    fisheryActivities: data?.fisheryActivities || '',
    fishCatchQuantity: data?.fishCatchQuantity || '',
    foodProcessing: data?.foodProcessing || '',
    foodProcessingDetails: data?.foodProcessingDetails || '',
    csc: data?.csc || '',
    cscRevenue: data?.cscRevenue || '',
    cscServices: data?.cscServices || '',
    fpo: data?.fpo || '',
    fpoDetails: data?.fpoDetails || '',
    lpgDealership: data?.lpgDealership || '',
    lpgDetails: data?.lpgDetails || '',
    bulkFuelPump: data?.bulkFuelPump || '',
    bulkDealershipDetails: data?.bulkDealershipDetails || '',
    retailFuelDealership: data?.retailFuelDealership || '',
    retailDealershipDetails: data?.retailDealershipDetails || '',
    pmbjk: data?.pmbjk || '',
    pmbjkRevenue: data?.pmbjkRevenue || '',
    pmKusum: data?.pmKusum || '',
    pmKusumBenefits: data?.pmKusumBenefits || '',
    fairPriceShop: data?.fairPriceShop || '',
    pdsQuantity: data?.pdsQuantity || '',
    pdsRemarks: data?.pdsRemarks || '',
    nalSeJal: data?.nalSeJal || '',
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

  const calculateTotalLand = () => {
    const owned = parseFloat(formData.ownedLand) || 0;
    const leased = parseFloat(formData.leasedLand) || 0;
    const government = parseFloat(formData.governmentAllottedLand) || 0;
    const total = owned + leased + government;
    handleInputChange('totalLand', total.toFixed(2));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.hasOfficeBuilding) newErrors.hasOfficeBuilding = 'Please specify if society has office building';
    if (formData?.hasOfficeBuilding === 'yes' && !formData.officeBuildingType) {
      newErrors.officeBuildingType = 'Office building type is required';
    }
    if (!formData.hasLand) newErrors.hasLand = 'Please specify if society has land';
    if (formData?.hasLand === 'yes') {
      if (!formData.ownedLand && !formData.leasedLand && !formData.governmentAllottedLand) {
        newErrors.ownedLand = 'At least one land type must be specified';
      }
    }
    if (!formData.outstandingLoan) newErrors.outstandingLoan = 'Outstanding loan amount is required';
    if (!formData.nonCreditRevenue) newErrors.nonCreditRevenue = 'Non-credit revenue is required';

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

          {formData?.hasOfficeBuilding === 'yes' && (
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
            label="1(c). Whether the co-operative society has land"
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' }
            ]}
            value={formData.hasLand}
            onChange={(value) => handleInputChange('hasLand', value)}
            name="hasLand"
            error={errors.hasLand}
          />

          {formData?.hasLand === 'yes' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">1(d). Land Available with the Cooperative</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">Type of Possession</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Area in Acre</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">Owned land</td>
                      <td className="border border-gray-300 px-4 py-2">
                        <Input
                          type="number"
                          value={formData.ownedLand}
                          onChange={(e) => {
                            handleInputChange('ownedLand', e.target.value);
                            calculateTotalLand();
                          }}
                          placeholder="Enter area in acres"
                          step="0.01"
                          className="w-full"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">Leased land</td>
                      <td className="border border-gray-300 px-4 py-2">
                        <Input
                          type="number"
                          value={formData.leasedLand}
                          onChange={(e) => {
                            handleInputChange('leasedLand', e.target.value);
                            calculateTotalLand();
                          }}
                          placeholder="Enter area in acres"
                          step="0.01"
                          className="w-full"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">Land allotted by the Government</td>
                      <td className="border border-gray-300 px-4 py-2">
                        <Input
                          type="number"
                          value={formData.governmentAllottedLand}
                          onChange={(e) => {
                            handleInputChange('governmentAllottedLand', e.target.value);
                            calculateTotalLand();
                          }}
                          placeholder="Enter area in acres"
                          step="0.01"
                          className="w-full"
                        />
                      </td>
                    </tr>
                    <tr className="bg-gray-50 font-semibold">
                      <td className="border border-gray-300 px-4 py-2">Total</td>
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
        <h2 className="text-xl font-semibold text-gray-900 mb-6">3. Financial Information</h2>

        <div className="space-y-6">
          <Input
            label="1(a). Total Outstanding Loan extended to promoters in last financial year (in Rs.)"
            type="number"
            value={formData.outstandingLoan}
            onChange={(e) => handleInputChange('outstandingLoan', e.target.value)}
            placeholder="Enter outstanding loan amount"
            error={errors.outstandingLoan}
            required
          />

          <Input
            label="1(b). Last Financial Year Revenue (Other than interest) from Non-Credit Activities (in Rs.)"
            type="number"
            value={formData.nonCreditRevenue}
            onChange={(e) => handleInputChange('nonCreditRevenue', e.target.value)}
            placeholder="Enter non-credit revenue amount"
            error={errors.nonCreditRevenue}
            required
          />
        </div>
      </Card>

      {/* PACS Activities Section - Basic Structure */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">4. PACS Activities</h2>

        <div className="space-y-6">
          {/* Pesticide Distribution */}
          <div className="border-b border-gray-200 pb-4">
            <RadioGroup
              label="1(c). Whether PACS is engaged in Pesticide Distribution?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.pesticideDistribution}
              onChange={(value) => handleInputChange('pesticideDistribution', value)}
              name="pesticideDistribution"
            />
            {formData?.pesticideDistribution === 'yes' && (
              <div className="mt-4 ml-6">
                <Input
                  label="If Yes, please specify the quantity of pesticide distributed in last financial year (In MT)"
                  type="number"
                  value={formData.pesticideQuantity}
                  onChange={(e) => handleInputChange('pesticideQuantity', e.target.value)}
                  placeholder="Enter quantity in MT"
                  step="0.01"
                />
              </div>
            )}
          </div>

          {/* Fertilizer Distribution */}
          <div className="border-b border-gray-200 pb-4">
            <RadioGroup
              label="1(d). Does the PACS possess a Fertilizer Distribution Centre?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.fertilizerDistribution}
              onChange={(value) => handleInputChange('fertilizerDistribution', value)}
              name="fertilizerDistribution"
            />
            {formData?.fertilizerDistribution === 'yes' && (
              <div className="mt-4 ml-6 space-y-4">
                <Input
                  label="(i). If Yes, please specify the quantity of fertilizer distributed in last financial year (In MT)"
                  type="number"
                  value={formData.fertilizerQuantity}
                  onChange={(e) => handleInputChange('fertilizerQuantity', e.target.value)}
                  placeholder="Enter quantity in MT"
                  step="0.01"
                />
                <Textarea
                  label="(ii). Remarks (if any)"
                  value={formData.fertilizerRemarks}
                  onChange={(e) => handleInputChange('fertilizerRemarks', e.target.value)}
                  placeholder="Enter any remarks"
                  rows={2}
                />
              </div>
            )}
          </div>

          {/* PMKSK */}
          <div className="border-b border-gray-200 pb-4">
            <RadioGroup
              label="1(e). Does the PACS also function as Pradhan Mantri Kisan Samridhi Kendra (PMKSK)?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.pmkskFunction}
              onChange={(value) => handleInputChange('pmkskFunction', value)}
              name="pmkskFunction"
            />
            {formData?.pmkskFunction === 'yes' && (
              <div className="mt-4 ml-6">
                <Textarea
                  label="If Yes, please provide the details of Pradhan Mantri Kisan Samridhi Kendra (PMKSK)"
                  value={formData.pmkskDetails}
                  onChange={(e) => handleInputChange('pmkskDetails', e.target.value)}
                  placeholder="Enter PMKSK details"
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* Seed Distribution */}
          <div className="border-b border-gray-200 pb-4">
            <RadioGroup
              label="1(f). Whether PACS is engaged in Seed Distribution?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.seedDistribution}
              onChange={(value) => handleInputChange('seedDistribution', value)}
              name="seedDistribution"
            />
            {formData?.seedDistribution === 'yes' && (
              <div className="mt-4 ml-6">
                <Input
                  label="If Yes, please specify the quantity of seed distributed in last financial year (In MT)"
                  type="number"
                  value={formData.seedQuantity}
                  onChange={(e) => handleInputChange('seedQuantity', e.target.value)}
                  placeholder="Enter quantity in MT"
                  step="0.01"
                />
              </div>
            )}
          </div>

          {/* Food Grain Procurement */}
          <div className="border-b border-gray-200 pb-4">
            <RadioGroup
              label="1(g). Whether PACS is engaged in Procurement of food grains?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.foodGrainProcurement}
              onChange={(value) => handleInputChange('foodGrainProcurement', value)}
              name="foodGrainProcurement"
            />
            {formData?.foodGrainProcurement === 'yes' && (
              <div className="mt-4 ml-6">
                <Input
                  label="If Yes, please specify the quantity of Procurement done in last financial year (In MT)"
                  type="number"
                  value={formData.foodGrainQuantity}
                  onChange={(e) => handleInputChange('foodGrainQuantity', e.target.value)}
                  placeholder="Enter quantity in MT"
                  step="0.01"
                />
              </div>
            )}
          </div>

          {/* Custom Hiring */}
          <div className="border-b border-gray-200 pb-4">
            <RadioGroup
              label="1(h). Does the PACS possess Custom Hiring Centre for hiring of agricultural equipments by the farmers?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.customHiring}
              onChange={(value) => handleInputChange('customHiring', value)}
              name="customHiring"
            />
            {formData?.customHiring === 'yes' && (
              <div className="mt-4 ml-6">
                <Input
                  label="If Yes, please write the type of equipment"
                  value={formData.equipmentType}
                  onChange={(e) => handleInputChange('equipmentType', e.target.value)}
                  placeholder="Enter equipment types"
                />
              </div>
            )}
          </div>

          {/* Dry Storage */}
          <div className="border-b border-gray-200 pb-4">
            <RadioGroup
              label="1(i). Does the PACS possess Dry Storage Infrastructure (Godown)?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.dryStorage}
              onChange={(value) => handleInputChange('dryStorage', value)}
              name="dryStorage"
            />
            {formData?.dryStorage === 'yes' && (
              <div className="mt-4 ml-6">
                <Input
                  label="If Yes, please specify the capacity of Dry Storage Infrastructure (Godown) (In MT)"
                  type="number"
                  value={formData.dryStorageCapacity}
                  onChange={(e) => handleInputChange('dryStorageCapacity', e.target.value)}
                  placeholder="Enter capacity in MT"
                  step="0.01"
                />
              </div>
            )}
          </div>

          {/* Grain Storage Project */}
          <div className="border-b border-gray-200 pb-4">
            <RadioGroup
              label="1(j). Whether the PACS has participated in the 'World's largest Grain Storage Project?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.grainStorageProject}
              onChange={(value) => handleInputChange('grainStorageProject', value)}
              name="grainStorageProject"
            />
            {formData?.grainStorageProject === 'yes' && (
              <div className="mt-4 ml-6 space-y-4">
                <Input
                  label="(i). If Yes, please specify the capacity of the proposed godown (In MT)"
                  type="number"
                  value={formData.proposedGodownCapacity}
                  onChange={(e) => handleInputChange('proposedGodownCapacity', e.target.value)}
                  placeholder="Enter capacity in MT"
                  step="0.01"
                />
                <Textarea
                  label="(ii). Remarks (if any)"
                  value={formData.grainStorageRemarks}
                  onChange={(e) => handleInputChange('grainStorageRemarks', e.target.value)}
                  placeholder="Enter any remarks"
                  rows={2}
                />
              </div>
            )}
          </div>

          {/* Cold Storage */}
          <div className="border-b border-gray-200 pb-4">
            <RadioGroup
              label="1(k). Does the PACS possess any Cold Storage facilities?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.coldStorage}
              onChange={(value) => handleInputChange('coldStorage', value)}
              name="coldStorage"
            />
            {formData?.coldStorage === 'yes' && (
              <div className="mt-4 ml-6">
                <Input
                  label="If Yes, please specify the capacity of Cold Storage Infrastructure (In MT)"
                  type="number"
                  value={formData.coldStorageCapacity}
                  onChange={(e) => handleInputChange('coldStorageCapacity', e.target.value)}
                  placeholder="Enter capacity in MT"
                  step="0.01"
                />
              </div>
            )}
          </div>

          {/* Milk Collection */}
          <div className="border-b border-gray-200 pb-4">
            <RadioGroup
              label="1(l). Does the PACS have a Milk Collection Unit?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.milkCollection}
              onChange={(value) => handleInputChange('milkCollection', value)}
              name="milkCollection"
            />
            {formData?.milkCollection === 'yes' && (
              <div className="mt-4 ml-6">
                <Input
                  label="If Yes, please specify the average milk collection per day (In Litres)"
                  type="number"
                  value={formData.milkCollectionPerDay}
                  onChange={(e) => handleInputChange('milkCollectionPerDay', e.target.value)}
                  placeholder="Enter average collection per day in litres"
                  step="0.01"
                />
              </div>
            )}
          </div>

          {/* Fishery Activities */}
          <div className="border-b border-gray-200 pb-4">
            <RadioGroup
              label="1(m). Whether PACS is engaged in Fishery activities?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.fisheryActivities}
              onChange={(value) => handleInputChange('fisheryActivities', value)}
              name="fisheryActivities"
            />
            {formData?.fisheryActivities === 'yes' && (
              <div className="mt-4 ml-6">
                <Input
                  label="If Yes, please specify total fish catch in last financial year (In MT)"
                  type="number"
                  value={formData.fishCatchQuantity}
                  onChange={(e) => handleInputChange('fishCatchQuantity', e.target.value)}
                  placeholder="Enter fish catch quantity in MT"
                  step="0.01"
                />
              </div>
            )}
          </div>

          {/* Food Processing */}
          <div className="border-b border-gray-200 pb-4">
            <RadioGroup
              label="1(n). Does the PACS have Food Processing facilities?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.foodProcessing}
              onChange={(value) => handleInputChange('foodProcessing', value)}
              name="foodProcessing"
            />
            {formData?.foodProcessing === 'yes' && (
              <div className="mt-4 ml-6">
                <Textarea
                  label="If Yes, please provide the details of the type of Food Processing facilities"
                  value={formData.foodProcessingDetails}
                  onChange={(e) => handleInputChange('foodProcessingDetails', e.target.value)}
                  placeholder="Enter food processing facility details"
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* CSC */}
          <div className="border-b border-gray-200 pb-4">
            <RadioGroup
              label="1(o). Does the PACS have a Common Service Centres (CSC)?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.csc}
              onChange={(value) => handleInputChange('csc', value)}
              name="csc"
            />
            {formData?.csc === 'yes' && (
              <div className="mt-4 ml-6 space-y-4">
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
                  placeholder="Enter CSC services details"
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* FPO */}
          <div className="border-b border-gray-200 pb-4">
            <RadioGroup
              label="1(p). Whether PACS is functioning as Farmer Producer Organization (FPO)?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.fpo}
              onChange={(value) => handleInputChange('fpo', value)}
              name="fpo"
            />
            {formData?.fpo === 'yes' && (
              <div className="mt-4 ml-6">
                <Textarea
                  label="If Yes, please specify the details of Farmer Producer Organization (FPO)"
                  value={formData.fpoDetails}
                  onChange={(e) => handleInputChange('fpoDetails', e.target.value)}
                  placeholder="Enter FPO details"
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* LPG Dealership */}
          <div className="border-b border-gray-200 pb-4">
            <RadioGroup
              label="1(q). Whether PACS is engaged in LPG Dealership?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.lpgDealership}
              onChange={(value) => handleInputChange('lpgDealership', value)}
              name="lpgDealership"
            />
            {formData?.lpgDealership === 'yes' && (
              <div className="mt-4 ml-6">
                <Textarea
                  label="If Yes, please specify the LPG Dealership details"
                  value={formData.lpgDetails}
                  onChange={(e) => handleInputChange('lpgDetails', e.target.value)}
                  placeholder="Enter LPG dealership details"
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* Bulk Fuel Pump */}
          <div className="border-b border-gray-200 pb-4">
            <RadioGroup
              label="1(r). Does the PACS have a bulk petrol/ diesel consumer pump?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.bulkFuelPump}
              onChange={(value) => handleInputChange('bulkFuelPump', value)}
              name="bulkFuelPump"
            />
            {formData?.bulkFuelPump === 'yes' && (
              <div className="mt-4 ml-6">
                <Textarea
                  label="If Yes, please specify the details of bulk dealership"
                  value={formData.bulkDealershipDetails}
                  onChange={(e) => handleInputChange('bulkDealershipDetails', e.target.value)}
                  placeholder="Enter bulk dealership details"
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* Retail Fuel Dealership */}
          <div className="border-b border-gray-200 pb-4">
            <RadioGroup
              label="1(s). Whether PACS is engaged in petrol/diesel retail dealership?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.retailFuelDealership}
              onChange={(value) => handleInputChange('retailFuelDealership', value)}
              name="retailFuelDealership"
            />
            {formData?.retailFuelDealership === 'yes' && (
              <div className="mt-4 ml-6">
                <Textarea
                  label="If Yes, please specify the details of retail dealership"
                  value={formData.retailDealershipDetails}
                  onChange={(e) => handleInputChange('retailDealershipDetails', e.target.value)}
                  placeholder="Enter retail dealership details"
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* PMBJK */}
          <div className="border-b border-gray-200 pb-4">
            <RadioGroup
              label="1(t). Whether PACS is operational as Pradhan Mantri Bhartiya Jan Aushadhi Kendra (PMBJK)?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.pmbjk}
              onChange={(value) => handleInputChange('pmbjk', value)}
              name="pmbjk"
            />
            {formData?.pmbjk === 'yes' && (
              <div className="mt-4 ml-6">
                <Input
                  label="If Yes, please specify the average monthly revenue under PMBJK (in Rs.)"
                  type="number"
                  value={formData.pmbjkRevenue}
                  onChange={(e) => handleInputChange('pmbjkRevenue', e.target.value)}
                  placeholder="Enter average monthly revenue"
                />
              </div>
            )}
          </div>

          {/* PM-KUSUM */}
          <div className="border-b border-gray-200 pb-4">
            <RadioGroup
              label="1(u). Whether PACS has participated in PM-KUSUM Scheme?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.pmKusum}
              onChange={(value) => handleInputChange('pmKusum', value)}
              name="pmKusum"
            />
            {formData?.pmKusum === 'yes' && (
              <div className="mt-4 ml-6">
                <Textarea
                  label="If Yes, please specify the benefits availed under PM-KUSUM Scheme"
                  value={formData.pmKusumBenefits}
                  onChange={(e) => handleInputChange('pmKusumBenefits', e.target.value)}
                  placeholder="Enter PM-KUSUM benefits details"
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* Fair Price Shop */}
          <div className="border-b border-gray-200 pb-4">
            <RadioGroup
              label="1(v). Does the PACS have Fair Price Shop/PDS License"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.fairPriceShop}
              onChange={(value) => handleInputChange('fairPriceShop', value)}
              name="fairPriceShop"
            />
            {formData?.fairPriceShop === 'yes' && (
              <div className="mt-4 ml-6 space-y-4">
                <Input
                  label="(i). If Yes, please specify, Average monthly distribution quantity (in Kg)"
                  type="number"
                  value={formData.pdsQuantity}
                  onChange={(e) => handleInputChange('pdsQuantity', e.target.value)}
                  placeholder="Enter average monthly distribution quantity in Kg"
                  step="0.01"
                />
                <Textarea
                  label="(ii). Remarks (if any)"
                  value={formData.pdsRemarks}
                  onChange={(e) => handleInputChange('pdsRemarks', e.target.value)}
                  placeholder="Enter any remarks"
                  rows={2}
                />
              </div>
            )}
          </div>

          {/* Nal-se-Jal Yojana */}
          <div className="border-b border-gray-200 pb-4">
            <RadioGroup
              label="1(w). Does the PACS carry out Operation & Maintenance under 'Nal-se-Jal Yojana'?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={formData.nalSeJal}
              onChange={(value) => handleInputChange('nalSeJal', value)}
              name="nalSeJal"
            />
            {formData?.nalSeJal === 'yes' && (
              <div className="mt-4 ml-6">
                <Textarea
                  label="If Yes. Please provide activities being carried out under 'Nal-se-Jal Yojana'"
                  value={formData.nalSeJalActivities}
                  onChange={(e) => handleInputChange('nalSeJalActivities', e.target.value)}
                  placeholder="Enter Nal-se-Jal Yojana activities details"
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* Other Facilities */}
          <div>
            <Textarea
              label="1(x). Please specify any other facilities/ services/ businesses carried out by the PACS"
              value={formData.otherFacilities}
              onChange={(e) => handleInputChange('otherFacilities', e.target.value)}
              placeholder="Describe any other facilities, services, or businesses"
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

export default CooperativeRegistrationLargeArea;