import React, { useState } from 'react';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { RadioGroup } from '../../components/ui/RadioGroup';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface FormData {
  // Tourism Type
  tourismType: string;

  // Office Building
  hasOfficeBuilding: string;
  officeBuildingType: string;

  // Member Details
  individualMembers: string;
  institutionalMembers: string;
  totalMembers: string;

  // Share Capital
  authorizedShareCapital: string;
  totalDeposit: string;
  membersShareCapital: string;
  governmentShareCapital: string;
  totalShareCapital: string;

  // Annual Turnover
  annualTurnover: string;

  // Pooled Resources
  hasPooledResources: string;

  // Government Resources
  hasGovernmentResources: string;

  // Resource Rights
  membersCanTakeBackResources: string;

  // Facilities
  facilities: string[];
}

const CooperativeRegistrationsTourism = ({
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
  const [formData, setFormData] = useState<FormData>(() => {
    const base = data || {
      tourismType: "",
      hasOfficeBuilding: "",
      officeBuildingType: "",
      individualMembers: "",
      institutionalMembers: "",
      totalMembers: "",
      authorizedShareCapital: "",
      totalDeposit: "",
      membersShareCapital: "",
      governmentShareCapital: "",
      totalShareCapital: "",
      annualTurnover: "",
      hasPooledResources: "",
      hasGovernmentResources: "",
      membersCanTakeBackResources: "",
      facilities: [],
    };

    const facilities = Array.isArray(base.facilities)
      ? base.facilities
      : typeof base.facilities === "string" && base.facilities
        ? base.facilities.split(",")
        : [];

    return { ...base, facilities };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const tourismTypes = [
    { value: "1", label: "Tourist Transport Cooperative Society" },
    { value: "2", label: "Tourist Boarding & Loding Cooperative Society" },
    { value: "3", label: "Tourist Guides/Information Cooperative Society" },
    {
      value: "4",
      label: "Cultural, Amusement & recreation Cooperative Society",
    },
    {
      value: "5",
      label: "Sales of local products (handicrafts etc.) Cooperative Society",
    },
    { value: "6", label: "Any Others" },
  ];

  const facilitiesOptions = [
    { value: "1", label: "Do not have basic amenities" },
    {
      value: "35",
      label: "Consumer Store/Outlet/information desk/currency change",
    },
    { value: "36", label: "Health centre/Medical check-up camp" },
    { value: "37", label: "Business Correspondence" },
  ];

  const officeBuildingTypes = [
    { value: "1", label: "Own Building" },
    { value: "2", label: "Rented Building" },
    { value: "3", label: "Rent Free Building" },
    { value: "4", label: "Leased Building" },
    { value: "5", label: "Building Provided By Govt" },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFacilitiesChange = (value: string) => {
    setFormData((prev) => {
      const current = Array.isArray(prev.facilities) ? prev.facilities : [];
      const exists = current.includes(value);

      const updated = exists
        ? current.filter((v) => v !== value)
        : [...current, value];

      return { ...prev, facilities: updated };
    });
  };

  const calculateTotalMembers = (
    individualValue: string,
    institutionalValue: string,
  ) => {
    const individual = Number(individualValue) || 0;
    const institutional = Number(institutionalValue) || 0;

    setFormData((prev) => ({
      ...prev,
      individualMembers: individualValue,
      institutionalMembers: institutionalValue,
      totalMembers: (individual + institutional).toString(),
    }));
  };

  const calculateTotalShareCapital = (
    membersValue: string,
    govtValue: string,
  ) => {
    const members = Number(membersValue) || 0;
    const govt = Number(govtValue) || 0;

    setFormData((prev) => ({
      ...prev,
      membersShareCapital: membersValue,
      governmentShareCapital: govtValue,
      totalShareCapital: (members + govt).toString(),
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.tourismType) newErrors.tourismType = 'Tourism type is required';
    if (!formData.hasOfficeBuilding) newErrors.hasOfficeBuilding = 'Please specify if society has office building';
    if (formData.hasOfficeBuilding === 'yes' && !formData.officeBuildingType) {
      newErrors.officeBuildingType = 'Office building type is required';
    }
    if (!formData.individualMembers)
      newErrors.individualMembers =
        "Number of individual promoters is required";
    if (!formData.institutionalMembers)
      newErrors.institutionalMembers =
        "Number of institutional promoters is required";
    if (!formData.authorizedShareCapital)
      newErrors.authorizedShareCapital = "Authorized share capital is required";
    // if (!formData.membersShareCapital)
    //   newErrors.membersShareCapital = "Promoters share capital is required";
    // if (!formData.governmentShareCapital)
    //   newErrors.governmentShareCapital = "Government share capital is required";
    // if (!formData.annualTurnover)
    // newErrors.annualTurnover = "Annual turnover is required";
    if (!formData.totalDeposit)
      newErrors.totalDeposit = "Total deposit is required";
    if (!formData.hasPooledResources)
      newErrors.hasPooledResources = "Pooled resources is required";
    if (!formData.membersCanTakeBackResources)
      newErrors.membersCanTakeBackResources = "Shared resources is required";
    if (!formData.hasGovernmentResources)
      newErrors.hasGovernmentResources = "Resources is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const transformToApiPayload = () => {
    return {
      CooperativeRegistrationsTourism: [
        {
          type_society: Number(formData.tourismType) || null,

          has_building: formData.hasOfficeBuilding === "yes" ? 1 : 0,

          building_type:
            formData.hasOfficeBuilding === "yes"
              ? formData.officeBuildingType
              : 0,

          individual_member: Number(formData.individualMembers) || null,

          institutional_member: Number(formData.institutionalMembers) || null,

          authorised_share: Number(formData.authorizedShareCapital) || null,
          total_deposit: Number(formData.totalDeposit) || null,

          paid_up_members: Number(formData.membersShareCapital) || null,

          paid_up_government_bodies:
            Number(formData.governmentShareCapital) || null,

          paid_up_total: Number(formData.totalShareCapital) || null,

          annual_turn_over: Number(formData.annualTurnover) || null,

          pool_resource: formData.hasPooledResources === "yes" ? 1 : 0,

          any_resource_taken: formData.hasGovernmentResources === "yes" ? 1 : 0,

          is_right_vested:
            formData.membersCanTakeBackResources === "yes" ? 1 : 0,

          facilities:
            Array.isArray(formData.facilities) && formData.facilities.length > 0
              ? formData.facilities.join(",")
              : null,
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
      {/* Tourism Type Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">1. Tourism Type</h2>

        <Select
          label="10(a). Type of Tourism Cooperative Society"
          value={formData.tourismType}
          onChange={(e) => handleInputChange('tourismType', e.target.value)}
          placeholder="Select tourism type"
          error={errors.tourismType}
          required
        >
          {tourismTypes.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Card>

      {/* Office Building Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">2. Office Building</h2>

        <div className="space-y-6">
          <RadioGroup
            label="10(b). Whether the co-operative society has an office building"
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">10(c). Type of Office Building</h3>
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

      {/* Member Details Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">3. Promoter Details</h2>

        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Promoter Detail of Cooperative Society - type of promoter (Individual/Institutional)</h3>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Type of Promoter</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Number of Promoters</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Individual Promoters</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <Input
                      type="number"
                      value={formData.individualMembers}
                      onChange={(e) =>
                        calculateTotalMembers(
                          e.target.value,
                          formData.institutionalMembers,
                        )
                      }
                      placeholder="Enter number of individual promoters"
                      error={errors.individualMembers}
                      required
                      className="w-full"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Institutional</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <Input
                      type="number"
                      value={formData.institutionalMembers}
                      onChange={(e) =>
                        calculateTotalMembers(
                          formData.individualMembers,
                          e.target.value,
                        )
                      }
                      placeholder="Enter number of institutional promoters"
                      error={errors.institutionalMembers}
                      required
                      className="w-full"
                    />
                  </td>
                </tr>
                <tr className="bg-gray-50 font-semibold">
                  <td className="border border-gray-300 px-4 py-2">Total</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <Input
                      type="number"
                      value={formData.totalMembers}
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
      </Card>

      {/* Share Capital Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">4. Share Capital</h2>

        <div className="space-y-6">
          <Input
            label="Authorised Share Capital (in Rs)"
            type="number"
            value={formData.authorizedShareCapital}
            onChange={(e) => handleInputChange('authorizedShareCapital', e.target.value)}
            placeholder="Enter authorized share capital amount"
            error={errors.authorizedShareCapital}
            required
          />

          <Input
            label="5(c). Total Deposit (in Rs)"
            type="number"
            value={formData.totalDeposit}
            onChange={(e) => handleInputChange("totalDeposit", e.target.value)}
            placeholder="Enter total deposit amount"
            error={errors.totalDeposit}
            required
          />

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">12(a). Paid up Share Capital by different Entity - Name of entity (Promoters, Government or Government bodies)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Name of Entity</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Amount (in Rs)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Promoters</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Input
                        type="number"
                        value={formData.membersShareCapital}
                        onChange={(e) =>
                          calculateTotalShareCapital(
                            e.target.value,
                            formData.governmentShareCapital,
                          )
                        }
                        placeholder="Enter promoters share capital amount"
                        // error={errors.membersShareCapital}
                        // required
                        className="w-full"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Government or Government Bodies</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Input
                        type="number"
                        value={formData.governmentShareCapital}
                        onChange={(e) =>
                          calculateTotalShareCapital(
                            formData.membersShareCapital,
                            e.target.value,
                          )
                        }
                        placeholder="Enter government share capital amount"
                        // error={errors.governmentShareCapital}
                        // required
                        className="w-full"
                      />
                    </td>
                  </tr>
                  <tr className="bg-gray-50 font-semibold">
                    <td className="border border-gray-300 px-4 py-2">Total</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Input
                        type="number"
                        value={formData.totalShareCapital}
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
        </div>
      </Card>

      {/* Annual Turnover Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">5. Annual Turnover</h2>

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

      {/* Pooled Resources Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">6. Pooled Resources</h2>

        <RadioGroup
          label="13(a). Do the promoters themselves have pooled resources (vehicles, accommodation, land etc.) for the cooperative society?"
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' }
          ]}
          value={formData.hasPooledResources}
          onChange={(value) => handleInputChange('hasPooledResources', value)}
          name="hasPooledResources"
          error={errors.hasPooledResources}
          required
        />
      </Card>

      {/* Government Resources Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">7. Government Resources</h2>

        <RadioGroup
          label="13(b). Apart from the pooled/common resources of individuals, has the society taken any resources from the government or non-members?"
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' }
          ]}
          value={formData.hasGovernmentResources}
          onChange={(value) => handleInputChange('hasGovernmentResources', value)}
          name="hasGovernmentResources"
          error={errors.hasGovernmentResources}
          required
        />
      </Card>

      {/* Resource Rights Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">8. Resource Rights</h2>

        <RadioGroup
          label="13(c). Is the right vested with the promoters to take back the shared resources from the society?"
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' }
          ]}
          value={formData.membersCanTakeBackResources}
          onChange={(value) => handleInputChange('membersCanTakeBackResources', value)}
          name="membersCanTakeBackResources"
          error={errors.membersCanTakeBackResources}
          required
        />
      </Card>

      {/* Facilities Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">9. Facilities</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {facilitiesOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={(formData.facilities ?? []).includes(option.value)}
                onChange={() => handleFacilitiesChange(option.value)}
              />
              {option.label}
            </label>
          ))}
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

export default CooperativeRegistrationsTourism;