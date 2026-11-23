import React, { useState } from "react";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { RadioGroup } from "../../components/ui/RadioGroup";
import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

interface FormData {
  // Social Welfare Type
  socialWelfareType: string;

  // Office Building
  hasOfficeBuilding: string;
  officeBuildingType: string;

  // Social & Cultural Activities
  socialCulturalActivities: string;

  // Share Capital
  authorizedShareCapital: string;
  membersShareCapital: string;
  governmentShareCapital: string;

  // Annual Turnover
  annualTurnover: string;

  // Common Resources
  hasCommonResources: string;

  // Member Activities and Training
  membersCarryActivities: string;
  providesGuidance: string;

  // Facilities
  facilities: string[];

  totalDeposit: string;

  // Utility Vehicles
  operatesUtilityVehicles: string;
  numberOfVehicles: string;
}

const CooperativeRegistrationsSocial = ({
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
      socialWelfareType: "",
      hasOfficeBuilding: "",
      officeBuildingType: "",
      socialCulturalActivities: "",
      authorizedShareCapital: "",
      membersShareCapital: "",
      governmentShareCapital: "",
      annualTurnover: "",
      totalDeposit: "",
      hasCommonResources: "",
      membersCarryActivities: "",
      providesGuidance: "",
      facilities: [],
      operatesUtilityVehicles: "",
      numberOfVehicles: "",
    },
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const socialWelfareTypes = [
    { value: "1", label: "Social welfare & Cultural Cooperative Society" },
    { value: "2", label: "Forest Welfare & Cultural Cooperative Society" },
    { value: "3", label: "Any Other" },
  ];

  const officeBuildingTypes = [
    { value: "1", label: "Own Building" },
    { value: "2", label: "Rented Building" },
    { value: "3", label: "Rent Free Building" },
    { value: "4", label: "Leased Building" },
    { value: "5", label: "Building Provided By Govt" },
  ];

  const socialCulturalActivityTypes = [
    { value: "1", label: "Women Welfare" },
    { value: "2", label: "Child Welfare" },
    { value: "3", label: "Employee Welfare" },
    { value: "4", label: "Health & Medical related" },
    { value: "5", label: "Cremation related" },
    { value: "6", label: "Drinking Water" },
    { value: "7", label: "Hygiene & Sanitation" },
    { value: "8", label: "Weaker Section Welfare (SC/ST)" },
    { value: "9", label: "Welfare of specific section (Caste/Religion etc.)" },
    { value: "10", label: "Minority Welfare" },
    { value: "11", label: "Cultural activities" },
    { value: "12", label: "Educational activities" },
    { value: "13", label: "Animal & Bird Protection" },
    { value: "14", label: "Religious activities" },
    { value: "15", label: "Other" },
  ];

  const facilityOptions = [
    { value: "1", label: "Do not have basic amenities" },
    { value: "57", label: "Health centre / Medical check-up camps" },
    { value: "58", label: "Business Correspondence" },
    { value: "59", label: "Consumer Store / Outlet" },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleFacilityChange = (value: string) => {
    setFormData((prev) => {
      const exists = prev.facilities.includes(value);

      const updated = exists
        ? prev.facilities.filter((v) => v !== value)
        : [...prev.facilities, value];

      return { ...prev, facilities: updated };
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.socialWelfareType)
      newErrors.socialWelfareType = "Social welfare type is required";
    if (!formData.hasOfficeBuilding)
      newErrors.hasOfficeBuilding =
        "Please specify if society has office building";
    if (formData.hasOfficeBuilding === "yes" && !formData.officeBuildingType) {
      newErrors.officeBuildingType = "Office building type is required";
    }
    if (!formData.socialCulturalActivities)
      newErrors.socialCulturalActivities =
        "Social & cultural activities are required";
    // if (!formData.authorizedShareCapital)
    //   newErrors.authorizedShareCapital = "Authorized share capital is required";
    // if (!formData.membersShareCapital)
    //   newErrors.membersShareCapital = "Promoters share capital is required";
    // if (!formData.governmentShareCapital)
    //   newErrors.governmentShareCapital = "Government share capital is required";
    // if (!formData.annualTurnover)
    //   newErrors.annualTurnover = "Annual turnover is required";
    if (!formData.totalDeposit)
      newErrors.totalDeposit = "Total deposit is required";
    if (!formData.hasCommonResources)
      newErrors.hasCommonResources = "Common resources is required";
    if (!formData.membersCarryActivities)
      newErrors.membersCarryActivities = "Promoters activities is required";
    if (!formData.providesGuidance)
      newErrors.providesGuidance = "Guidance/Training is required";
    if (!formData.operatesUtilityVehicles)
      newErrors.operatesUtilityVehicles =
        "Operating utility vehicle is required";
    if (!formData.numberOfVehicles)
      newErrors.numberOfVehicles = "Numbers of vehicles is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const transformToApiPayload = () => {
    return {
      CooperativeRegistrationsSocial: [
        {
          type_society: Number(formData.socialWelfareType) || null,

          has_building: formData.hasOfficeBuilding === "yes" ? 1 : 0,

          building_type:
            formData.hasOfficeBuilding === "yes"
              ? formData.officeBuildingType
              : 0,

          type_social_culture_activity:
            formData.socialCulturalActivities || null,

          authorised_share: Number(formData.authorizedShareCapital) || null,

          paid_up_members: Number(formData.membersShareCapital) || null,

          paid_up_government_bodies:
            Number(formData.governmentShareCapital) || null,

          paid_up_total:
            Number(formData.membersShareCapital) +
            Number(formData.governmentShareCapital) || null,

          annual_turn_over: Number(formData.annualTurnover) || null,

          total_deposit: Number(formData.totalDeposit) || null,

          has_common: formData.hasCommonResources === "yes" ? 1 : 0,

          is_operate_by_member:
            formData.membersCarryActivities === "yes" ? 1 : 0,

          guidance_by_member: formData.providesGuidance === "yes" ? 1 : 0,

          facilities:
            formData.facilities.length > 0
              ? formData.facilities.join(",")
              : null,

          is_operate_vehicle:
            formData.operatesUtilityVehicles === "yes" ? 1 : 0,

          no_of_vehicle:
            formData.operatesUtilityVehicles === "yes"
              ? Number(formData.numberOfVehicles)
              : 0,
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
      {/* Social Welfare Type Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          1. Social Welfare Type
        </h2>

        <Select
          label="11(a). Type of Social Welfare & Cultural Cooperatives"
          value={formData.socialWelfareType}
          onChange={(e) =>
            handleInputChange("socialWelfareType", e.target.value)
          }
          placeholder="Select social welfare type"
          error={errors.socialWelfareType}
          required
        >
          {socialWelfareTypes.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Card>

      {/* Office Building Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          2. Office Building
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="11(b). Whether the co-operative society has an office building"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.hasOfficeBuilding}
            onChange={(value) => handleInputChange("hasOfficeBuilding", value)}
            name="hasOfficeBuilding"
            error={errors.hasOfficeBuilding}
          />

          {formData.hasOfficeBuilding === "yes" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                11(a)(i). Type of Office Building
              </h3>
              <RadioGroup
                options={officeBuildingTypes}
                value={formData.officeBuildingType}
                onChange={(value) =>
                  handleInputChange("officeBuildingType", value)
                }
                name="officeBuildingType"
                error={errors.officeBuildingType}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Social & Cultural Activities Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          3. Social & Cultural Activities
        </h2>

        <Select
          label="11(c). Type of Social & Cultural activities carried out by Cooperative"
          value={formData.socialCulturalActivities}
          onChange={(e) =>
            handleInputChange("socialCulturalActivities", e.target.value)
          }
          placeholder="Select activity type"
          error={errors.socialCulturalActivities}
          required
        >
          {socialCulturalActivityTypes.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Card>

      {/* Share Capital Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          4. Share Capital
        </h2>

        <div className="space-y-6">
          <Input
            label="12(a). Authorised Share Capital (in Rs)"
            type="number"
            value={formData.authorizedShareCapital}
            onChange={(e) =>
              handleInputChange("authorizedShareCapital", e.target.value)
            }
            placeholder="Enter authorized share capital amount"
            // error={errors.authorizedShareCapital}
            // required
          />

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              12(b). Paid up Share Capital by different Entity
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">
                      Name of Entity
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-left">
                      Amount (in Rs)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">
                      Promoters
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Input
                        type="number"
                        value={formData.membersShareCapital}
                        onChange={(e) =>
                          handleInputChange(
                            "membersShareCapital",
                            e.target.value,
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
                    <td className="border border-gray-300 px-4 py-2">
                      Government or Government Bodies
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Input
                        type="number"
                        value={formData.governmentShareCapital}
                        onChange={(e) =>
                          handleInputChange(
                            "governmentShareCapital",
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
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>

      {/* Annual Turnover Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          5. Annual Turnover
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="13(a). Annual Turn Over of the Cooperative Society (in Rs)"
            type="number"
            value={formData.annualTurnover}
            onChange={(e) =>
              handleInputChange("annualTurnover", e.target.value)
            }
            placeholder="Enter annual turnover amount"
            // error={errors.annualTurnover}
            // required
          />

          <Input
            label="13(b). Total Deposit (in Rs)"
            type="number"
            value={formData.totalDeposit}
            onChange={(e) => handleInputChange("totalDeposit", e.target.value)}
            placeholder="Enter total deposit"
            error={errors.totalDeposit}
            required
          />
        </div>
      </Card>

      {/* Common Resources Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          6. Common Resources
        </h2>

        <RadioGroup
          label="13(b). Whether the Cooperative society has common/pooled resource for its social & cultural activities?"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          value={formData.hasCommonResources}
          onChange={(value) => handleInputChange("hasCommonResources", value)}
          name="hasCommonResources"
          error={errors.hasCommonResources}
          required
        />
      </Card>

      {/* Member Activities and Training Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          7. Member Activities and Training
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="13(c). Whether the social & cultural activities are carried by promoter themself?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.membersCarryActivities}
            onChange={(value) =>
              handleInputChange("membersCarryActivities", value)
            }
            name="membersCarryActivities"
            error={errors.membersCarryActivities}
            required
          />

          {formData.membersCarryActivities === "yes" && (
            <RadioGroup
              label="13(c)(i). Whether the proper guidance/training is provided by cooperative society to promoters?"
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              value={formData.providesGuidance}
              onChange={(value) => handleInputChange("providesGuidance", value)}
              name="providesGuidance"
              error={errors.providesGuidance}
              required
            />
          )}
        </div>
      </Card>

      {/* Facilities Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          8. Facilities
        </h2>

        <div className="space-y-3">
          {facilityOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-3">
              <input
                type="checkbox"
                value={option.value}
                checked={formData.facilities.includes(option.value)}
                onChange={() => handleFacilityChange(option.value)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <span className="text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Utility Vehicles Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          9. Utility Vehicles
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="13(e). Whether the society is operating utility Vehicle(like ambulance,van,bus,goods container etc)?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.operatesUtilityVehicles}
            onChange={(value) =>
              handleInputChange("operatesUtilityVehicles", value)
            }
            name="operatesUtilityVehicles"
            error={errors.operatesUtilityVehicles}
            required
          />

          {formData.operatesUtilityVehicles === "yes" && (
            <Input
              label="13(e)(i). Number of vehicles operated by the cooperative society"
              type="number"
              value={formData.numberOfVehicles}
              onChange={(e) =>
                handleInputChange("numberOfVehicles", e.target.value)
              }
              placeholder="Enter number of vehicles"
              error={errors.numberOfVehicles}
              required
            />
          )}
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

export default CooperativeRegistrationsSocial;
