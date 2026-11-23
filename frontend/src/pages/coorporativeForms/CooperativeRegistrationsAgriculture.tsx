import React, { useState } from 'react';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { RadioGroup } from '../../components/ui/RadioGroup';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface FormData {
  //society Details
  type_society: string;

  //Building Details
  hasBuilding: string;
  buildingType: string;

  // Member Details
  individualMembers: string;
  institutionalMembers: string;

  paidUpShareDate: string;
  totalDeposit: string;
  packTotalOutstandingLoan: string;

  // Share Capital
  authorizedShareCapital: string;
  paidUpShareCapital: {
    entityName: string;
    amount: string;
    type: string;
  }[];

  // Annual Turnover
  annualTurnover: string;

  // Land and Resources
  pooledLand: string;
  governmentLand: string;
  landTakebackRights: string;
  membersWorkOnLand: string;
  commonPoolResources: string;
  fullyUtilizeResources: string;
  rainwaterHarvesting: string;

  // Farming Mechanisms
  farmingMechanisms: string[];
  irrigationMeans: string[];
}

const CooperativeRegistrationsAgriculture = ({
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
    type_society: data?.type_society || '',
    hasBuilding: data?.hasBuilding || '',
    buildingType: data?.buildingType || '',
    individualMembers: data?.individualMembers || '',
    institutionalMembers: data?.institutionalMembers || '',
    paidUpShareDate: data?.paidUpShareDate || '',
    totalDeposit: data?.totalDeposit || '',
    packTotalOutstandingLoan: data?.packTotalOutstandingLoan || '',
    authorizedShareCapital: data?.authorizedShareCapital || '',
    paidUpShareCapital: data?.paidUpShareCapital || [{ entityName: '', amount: '', type: '' }],
    annualTurnover: data?.annualTurnover || '',
    pooledLand: data?.pooledLand || '',
    governmentLand: data?.governmentLand || '',
    landTakebackRights: data?.landTakebackRights || '',
    membersWorkOnLand: data?.membersWorkOnLand || '',
    commonPoolResources: data?.commonPoolResources || '',
    fullyUtilizeResources: data?.fullyUtilizeResources || '',
    rainwaterHarvesting: data?.rainwaterHarvesting || '',
    farmingMechanisms: data?.farmingMechanisms || [],
    irrigationMeans: data?.irrigationMeans || []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const buildingTypeOptions = [
  { value: "1", label: "Own Building" },
  { value: "2", label: "Rented Building" },
  { value: "3", label: "Rent Free Building" },
  { value: "4", label: "Leased Building" },
  { value: "5", label: "Building Provided by the Government" }
];

  const societyTypeOptions = [
  { value: "1", label: "Agriculture Cooperatives (Food Grain Growing)" },
  { value: "2", label: "Horticulture Cooperatives" },
  { value: "3", label: "Plantation" },
  { value: "4", label: "Agriculture Cooperatives (Fruits and Vegetable Growing)" },
  { value: "5", label: "Lift Irrigation" },
  { value: "6", label: "Sugar Cane Growers Cooperative" },
  { value: "7", label: "Forest Produce" },
  { value: "8", label: "Seed Society (production/distribution)" },
  { value: "9", label: "Credit" },
  { value: "10", label: "Fertilizer distribution" }
];

  const farmingMechanismOptions = [
    { value: '1', label: 'Modern Farming Equipments' },
    { value: '2', label: 'Combined Harvester' },
    { value: '3', label: 'Improved Seed' },
    { value: '4', label: 'Compost' },
    { value: '5', label: 'Fertilizers' },
    { value: '6', label: 'Crop Rotation' },
    { value: '7', label: 'Best Farming Practices' },
  ];

  const irrigationMeansOptions = [
    { value: '1', label: 'Rain Water' },
    { value: '2', label: 'ground Water' },
    { value: '3', label: 'Canal Water' },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePaidUpShareCapitalChange = (index: number, field: string, value: string) => {
    const updated = [...formData.paidUpShareCapital];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, paidUpShareCapital: updated }));
  };

  const addPaidUpShareCapital = () => {
    setFormData(prev => ({
      ...prev,
      paidUpShareCapital: [...prev.paidUpShareCapital, { entityName: '', amount: '', type: '' }]
    }));
  };

  const removePaidUpShareCapital = (index: number) => {
    if (formData.paidUpShareCapital.length > 1) {
      const updated = formData.paidUpShareCapital.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, paidUpShareCapital: updated }));
    }
  };

  const handleFarmingMechanismChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      farmingMechanisms: prev.farmingMechanisms.includes(value)
        ? prev.farmingMechanisms.filter(v => v !== value)
        : [...prev.farmingMechanisms, value]
    }));
  };

  const handleIrrigationMeansChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      irrigationMeans: prev.irrigationMeans.includes(value)
        ? prev.irrigationMeans.filter(v => v !== value)
        : [...prev.irrigationMeans, value]
    }));
  };

  const calculatePaidUpTotal = () => {
  return formData.paidUpShareCapital.reduce((total, item) => {
    return total + (Number(item.amount) || 0);
  }, 0);
};

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.type_society) newErrors.type_society = 'Society type is required';
    if (!formData.hasBuilding) newErrors.hasBuilding = "Please specify building availability";
    if (formData.hasBuilding === "yes" && !formData.buildingType) newErrors.buildingType = "Building type is required";
    if (!formData.individualMembers) newErrors.individualMembers = 'Individual members count is required';
    if (!formData.institutionalMembers) newErrors.institutionalMembers = 'Institutional members count is required';
    // if (!formData.authorizedShareCapital) newErrors.authorizedShareCapital = 'Authorized share capital is required';
    if(!formData.totalDeposit) newErrors.totaldeposit= 'Total Deposit is required';
    // if (!formData.annualTurnover) newErrors.annualTurnover = 'Annual turnover is required';
    if (!formData.pooledLand) newErrors.pooledLand = 'Please specify if members have pooled land';
    if (!formData.governmentLand) newErrors.governmentLand = 'Please specify if society has taken government land';
    if (!formData.landTakebackRights) newErrors.landTakebackRights = 'Please specify land takeback rights';
    if (!formData.membersWorkOnLand) newErrors.membersWorkOnLand = 'Please specify if members work on pooled land';
    if (!formData.commonPoolResources) newErrors.commonPoolResources = 'Please specify if society has common pool resources';
    if (!formData.fullyUtilizeResources) newErrors.fullyUtilizeResources = 'Please specify if society fully utilizes resources';
    if (!formData.rainwaterHarvesting) newErrors.rainwaterHarvesting = 'Please specify if society has rainwater harvesting';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const transformToApiPayload = () => {
    const paidUpMembers =
      formData.paidUpShareCapital.find(i => i.type === "members")?.entityName;

    const paidUpGovt =
      formData.paidUpShareCapital.find(i => i.type == "government_bodies")?.entityName;

    const totalPaidUp = calculatePaidUpTotal();

    return {
      CooperativeRegistrationsAgriculture: [
        {
          type_society: Number(formData.type_society) || null,
          has_building: formData.hasBuilding === 'yes'? 1 : 0, 

          building_type: formData.hasBuilding === 'yes'
            ? Number(formData.buildingType)
            : 0 ,

          individual_member: Number(formData.individualMembers) || null,

          institutional_member: Number(formData.institutionalMembers) || null,

          authorised_share: Number(formData.authorizedShareCapital) || null,

          paid_up_members: Number(paidUpMembers) || null,

          paid_up_government_bodies: Number(paidUpGovt) || null,

          paid_up_total: totalPaidUp || null,

          paid_up_share_date: formData.paidUpShareDate || null,

          total_deposit: Number(formData.totalDeposit) || null,

          pack_total_outstanding_loan: Number(formData.packTotalOutstandingLoan) || null,

          annual_turn_over: Number(formData.annualTurnover) || null,

          has_pool_land: formData.pooledLand === "yes" ? 1 : 0,

          has_gov_land: formData.governmentLand === "yes" ? 1 : 0,

          member_vested_right: formData.landTakebackRights === "yes" ? 1 : 0,

          is_member_work: formData.membersWorkOnLand === "yes" ? 1 : 0,

          society_common_pool: formData.commonPoolResources === "yes" ? 1 : 0,

          is_utilize_pool: formData.fullyUtilizeResources === "yes" ? 1 : 0,

          farming_mech: formData.farmingMechanisms.length
            ? formData.farmingMechanisms.join(",")
            : null,

          harvesting: formData.rainwaterHarvesting === "yes" ? 1 : 0,

          irrigation_means: formData.irrigationMeans.length
            ? formData.irrigationMeans.join(",")
            : null
        }
      ]
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
      {/* Society Type Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          1. Type of Cooperative Society
        </h2>

        <Select
          label="Select Society Type"
          value={formData.type_society}
          onChange={(e) => handleInputChange("type_society", e.target.value)}
          placeholder="Select society type"
          error={errors.type_society}
          required
        >

          {societyTypeOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}

        </Select>
      </Card>

      {/* Building Details Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          2. Building Details
        </h2>

        <RadioGroup
          label="Whether the co-operative society has an office building?"
          className='mb-6'
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" }
          ]}
          value={formData.hasBuilding}
          onChange={(value) => handleInputChange("hasBuilding", value)}
          name="hasBuilding"
          error={errors.hasBuilding}
          required
        />

        {formData.hasBuilding === "yes" && (
          <RadioGroup
            label="Building Type"
            options={buildingTypeOptions}
            value={formData.buildingType}
            onChange={(value) => handleInputChange("buildingType", value)}
            name="buildingType"
            error={errors.buildingType}
          />
        )}
      </Card>

      {/* Member Details Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">3. Promoter Detail of Cooperative Society</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Individual (No. of Promoters)"
            type="number"
            value={formData.individualMembers}
            onChange={(e) => handleInputChange('individualMembers', e.target.value)}
            placeholder="Enter number of individual promoters"
            error={errors.individualMembers}
            required
          />

          <Input
            label="Institutional (No. of Promoters)"
            type="number"
            value={formData.institutionalMembers}
            onChange={(e) => handleInputChange('institutionalMembers', e.target.value)}
            placeholder="Enter number of institutional promoters"
            error={errors.institutionalMembers}
            required
          />
        </div>
      </Card>

      {/* Share Capital Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">4. Authorized Share Capital</h2>

        <Input
          label="Authorized Share Capital (in Rs)"
          type="number"
          value={formData.authorizedShareCapital}
          onChange={(e) => handleInputChange('authorizedShareCapital', e.target.value)}
          placeholder="Enter authorized share capital amount"
          // error={errors.authorizedShareCapital}
          // required
        />

        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">4(a). Paid up Share Capital by different Entity</h3>

          {formData?.paidUpShareCapital?.map((item, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
              <Input
                label="Name of entity"
                value={item.entityName}
                onChange={(e) => handlePaidUpShareCapitalChange(index, 'entityName', e.target.value)}
                placeholder="Promoters, Government, etc."
              />

              <Input
                label="Amount (in Rs)"
                type="number"
                value={item.amount}
                onChange={(e) => handlePaidUpShareCapitalChange(index, 'amount', e.target.value)}
                placeholder="Enter amount"
              />

              <Select
                label="Type"
                value={item.type}
                onChange={(e) => handlePaidUpShareCapitalChange(index, 'type', e.target.value)}
                placeholder="Select type"
              >
                <option value="members">Promoters</option>
                <option value="government_bodies">Government Bodies</option>
              </Select>

              {formData.paidUpShareCapital.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePaidUpShareCapital(index)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              label="Total Paid Up Share Capital (in Rs)"
              type="number"
              value={calculatePaidUpTotal()}
              disabled
            />

            <Input
              label="Paid Up Share Date"
              type="date"
              value={formData.paidUpShareDate}
              onChange={(e) =>
                handleInputChange("paidUpShareDate", e.target.value)
              }
            />
          </div>

          <Button
            type="button"
            onClick={addPaidUpShareCapital}
            className="mt-2"
            variant="outline"
          >
            + Add Entity
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Input
            label="Total Deposit (in Rs)"
            type="number"
            value={formData.totalDeposit}
            onChange={(e) =>
              handleInputChange("totalDeposit", e.target.value)
            }
            placeholder="Enter total deposit"
            required
            error={errors.totaldeposit}
          />

          <Input
            label="PACK Total Outstanding Loan (in Rs)"
            type="number"
            value={formData.packTotalOutstandingLoan}
            onChange={(e) =>
              handleInputChange("packTotalOutstandingLoan", e.target.value)
            }
            placeholder="Enter total outstanding loan"
          />
        </div>
      </Card>

      {/* Annual Turnover Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">5. Annual Turn Over</h2>

        <Input
          label="Annual Turn Over of the Cooperative Society (in Rs)"
          type="number"
          value={formData.annualTurnover}
          onChange={(e) => handleInputChange('annualTurnover', e.target.value)}
          placeholder="Enter annual turnover amount"
          // error={errors.annualTurnover}
          // required
        />
      </Card>

      {/* Land and Resources Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">6. Land and Resources</h2>

        <div className="space-y-6">
          <RadioGroup
            label="6(a). Do the promoters themselves have pooled land for the cooperative society?"
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' }
            ]}
            value={formData.pooledLand}
            onChange={(value) => handleInputChange('pooledLand', value)}
            name="pooledLand"
            error={errors.pooledLand}
            required
          />

          <RadioGroup
            label="6(b). Apart from the pooled/common land of individuals, has the society taken any land from the government?"
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' }
            ]}
            value={formData.governmentLand}
            onChange={(value) => handleInputChange('governmentLand', value)}
            name="governmentLand"
            error={errors.governmentLand}
            required
          />

          <RadioGroup
            label="6(c). Is the right vested with the promoters to take back the land from the society?"
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' }
            ]}
            value={formData.landTakebackRights}
            onChange={(value) => handleInputChange('landTakebackRights', value)}
            name="landTakebackRights"
            error={errors.landTakebackRights}
            required
          />

          <RadioGroup
            label="6(d). Do the promoters themselves work on pooled/common land of the cooperative society?"
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' }
            ]}
            value={formData.membersWorkOnLand}
            onChange={(value) => handleInputChange('membersWorkOnLand', value)}
            name="membersWorkOnLand"
            error={errors.membersWorkOnLand}
            required
          />

          <RadioGroup
              label="6(e). Do the society have common pool of bullocks, machinery, equipments, etc.?"
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' }
            ]}
            value={formData.commonPoolResources}
            onChange={(value) => handleInputChange('commonPoolResources', value)}
            name="commonPoolResources"
            error={errors.commonPoolResources}
            required
          />

          <RadioGroup
            label="6(f). Do the society fully utilize common pool resource?"
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' }
            ]}
            value={formData.fullyUtilizeResources}
            onChange={(value) => handleInputChange('fullyUtilizeResources', value)}
            name="fullyUtilizeResources"
            error={errors.fullyUtilizeResources}
            required
          />

          <RadioGroup
            label="6(g). Does the society have the provision of rain water harvesting?"
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' }
            ]}
            value={formData.rainwaterHarvesting}
            onChange={(value) => handleInputChange('rainwaterHarvesting', value)}
            name="rainwaterHarvesting"
            error={errors.rainwaterHarvesting}
            required
          />
        </div>
      </Card>

      {/* Farming Mechanisms Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">6(h). Farming Mechanisms</h2>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Which of the following farming mechanisms adopted by the cooperative society?
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {farmingMechanismOptions.map((option) => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.farmingMechanisms.includes(option.value)}
                  onChange={() => handleFarmingMechanismChange(option.value)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </Card>

      {/* Irrigation Means Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">6(i). Irrigation Means</h2>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            The means of irrigation available with the society?
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {irrigationMeansOptions.map((option) => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.irrigationMeans.includes(option.value)}
                  onChange={() => handleIrrigationMeansChange(option.value)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
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

export default CooperativeRegistrationsAgriculture;