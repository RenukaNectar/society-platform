import React, { useState } from "react";
import { Input } from "../../components/ui/Input";
// import { Select } from "../../components/ui/Select";
import { RadioGroup } from "../../components/ui/RadioGroup";
// import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

interface FormData {
  // Office Building
  hasOfficeBuilding: string;
  officeBuildingType: string;

  // Share Capital
  authorizedShareCapital: string;
  totalDeposit: string;
  annualTurnover: string;
  membersShareCapital: string;
  governmentShareCapital: string;
  totalShareCapital: string;

  // Sugar Mill Operations
  numberOfSugarMills: string;
  buildUpArea: string;
  openLandArea: string;
  totalArea: string;

  // Crushing Capacity
  licensedCapacity: string;
  installedCapacity: string;
  crushingPeriodStart: string;
  crushingPeriodEnd: string;

  // Products and Retail
  productTypes: string[];
  operatesRetailShops: string;
  numberOfRetailShops: string;

  // Member Services
  providesInputs: string;
  providesLoans: string;

  // Waste Management
  hasWasteManagement: string;

  // Government Benefits
  centralGovernmentBenefits: string;
  stateGovernmentBenefits: string;
}

const CooperativeRegistrationsSugar = ({
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
      authorizedShareCapital: "",
      annualTurnover: "",
      totalDeposit: "",
      membersShareCapital: "",
      governmentShareCapital: "",
      totalShareCapital: "",
      numberOfSugarMills: "",
      buildUpArea: "",
      openLandArea: "",
      totalArea: "",
      licensedCapacity: "",
      installedCapacity: "",
      crushingPeriodStart: "",
      crushingPeriodEnd: "",
      productTypes: [],
      operatesRetailShops: "",
      numberOfRetailShops: "",
      providesInputs: "",
      providesLoans: "",
      hasWasteManagement: "",
      centralGovernmentBenefits: "",
      stateGovernmentBenefits: "",
    },
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const officeBuildingTypes = [
    { value: "1", label: "Own Building" },
    { value: "2", label: "Rented Building" },
    { value: "3", label: "Rent Free Building" },
    { value: "4", label: "Leased Building" },
    { value: "5", label: "Building Provided By Govt" },
  ];

  const productOptions = [
    { value: "1", label: "White Sugar" },
    { value: "2", label: "Raw Sugar (Brown)" },
    { value: "3", label: "Molasses" },
    { value: "4", label: "Bagasse" },
    { value: "5", label: "Pressmud" },
    { value: "6", label: "Ethanol" },
    { value: "7", label: "Biogas" },
    { value: "8", label: "Rectified Spirit" },
    { value: "9", label: "Extra Neutral Alcohol" },
    { value: "10", label: "Liquor" },
    { value: "11", label: "Compost" },
    { value: "12", label: "Cogeneration" },
    { value: "13", label: "Bio-CNG" },
    { value: "14", label: "Fertilizer" },
    { value: "15", label: "Particle Board" },
    { value: "16", label: "Paper" },
    { value: "17", label: "Acetic Acid" },
    { value: "18", label: "Fossil Oil" },
    { value: "19", label: "Other" },
  ];

  const handleProductChange = (value: string) => {
    setFormData((prev) => {
      const exists = prev.productTypes.includes(value);

      const updated = exists
        ? prev.productTypes.filter((v) => v !== value)
        : [...prev.productTypes, value];

      return { ...prev, productTypes: updated };
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const calculateTotalShareCapital = (
    membersValue: string,
    govtValue: string,
  ) => {
    const members = parseInt(membersValue) || 0;
    const government = parseInt(govtValue) || 0;
    const total = members + government;

    handleInputChange("totalShareCapital", total.toString());
  };

  const calculateTotalArea = (buildUpValue: string, openLandValue: string) => {
    const buildUp = parseFloat(buildUpValue) || 0;
    const openLand = parseFloat(openLandValue) || 0;

    const total = buildUp + openLand;

    handleInputChange("totalArea", total.toFixed(2));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.hasOfficeBuilding)
      newErrors.hasOfficeBuilding =
        "Please specify if society has office building";
    if (formData.hasOfficeBuilding === "yes" && !formData.officeBuildingType) {
      newErrors.officeBuildingType = "Office building type is required";
    }
    if (!formData.authorizedShareCapital)
      newErrors.authorizedShareCapital = "Authorized share capital is required";
    // if (!formData.membersShareCapital)
    //   newErrors.membersShareCapital = "Promoters share capital is required";
    // if (!formData.governmentShareCapital)
    //   newErrors.governmentShareCapital = "Government share capital is required";
    if (!formData.numberOfSugarMills)
      newErrors.numberOfSugarMills = "Number of sugar mills is required";
    if (!formData.buildUpArea)
      newErrors.buildUpArea = "Build-up area is required";
    if (!formData.openLandArea)
      newErrors.openLandArea = "Open land area is required";
    if (!formData.licensedCapacity)
      newErrors.licensedCapacity = "Licensed capacity is required";
    if (!formData.installedCapacity)
      newErrors.installedCapacity = "Installed capacity is required";
    if (!formData.crushingPeriodStart)
      newErrors.crushingPeriodStart = "Crushing period start date is required";
    if (!formData.crushingPeriodEnd)
      newErrors.crushingPeriodEnd = "Crushing period end date is required";
    if (!formData.totalDeposit)
      newErrors.totalDeposit = "Total deposit is required";
    if (!formData.productTypes || formData.productTypes.length === 0)
      newErrors.productTypes = "Please select at least one product";

    if (!formData.operatesRetailShops)
      newErrors.operatesRetailShops =
        "Please specify if retail shops are operated";

    if (formData.operatesRetailShops === "yes" && !formData.numberOfRetailShops)
      newErrors.numberOfRetailShops = "Number of retail shops is required";
    if (!formData.providesInputs)
      newErrors.providesInputs = "Sugar cultivation is required";
    if (!formData.providesLoans)
      newErrors.providesLoans = "Loans and Advances is required";
    if (!formData.hasWasteManagement)
      newErrors.hasWasteManagement = "Waste management facility is required";
    if (!formData.centralGovernmentBenefits)
      newErrors.centralGovernmentBenefits =
        "Central government benefits is required";
    if (!formData.stateGovernmentBenefits)
      newErrors.stateGovernmentBenefits =
        "State government benefits is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const transformToApiPayload = () => {
    const hasBuilding = formData.hasOfficeBuilding === "yes" ? 1 : 0;

    const buildingType =
      hasBuilding === 1
        ? officeBuildingTypes.findIndex(
            (b) => b.value === formData.officeBuildingType,
          ) + 1
        : null;

    const paidUpMembers = Number(formData.membersShareCapital);
    const paidUpGovt = Number(formData.governmentShareCapital);

    return {
      CooperativeRegistrationsSugar: [
        {
          has_building: hasBuilding || null,
          building_type: buildingType || null,

          authorised_share: Number(formData.authorizedShareCapital) || null,
          paid_up_members: paidUpMembers || null,
          paid_up_government_bodies: paidUpGovt || null,
          paid_up_total: paidUpMembers + paidUpGovt || null,

          total_deposit: Number(formData.totalDeposit) || null,

          annual_turn_over: Number(formData.annualTurnover) || null,

          suger_mills_no: Number(formData.numberOfSugarMills) || null,

          build_up_area: Number(formData.buildUpArea) || null,
          open_land_area: Number(formData.openLandArea) || null,
          total_area: Number(formData.totalArea) || null,

          liecensed_capicity: Number(formData.licensedCapacity) || null,
          installed_capicity: Number(formData.installedCapacity) || null,

          crushing_period_start: formData.crushingPeriodStart || null,
          crushing_period_end: formData.crushingPeriodEnd || null,

          product_produced:
            formData.productTypes.length > 0
              ? formData.productTypes.join(",")
              : null,

          retail_shops: formData.operatesRetailShops === "yes" ? 1 : 0,

          retail_shops_no:
            formData.operatesRetailShops === "yes"
              ? Number(formData.numberOfRetailShops)
              : 0,

          sugercane_input_provided: formData.providesInputs === "yes" ? 1 : 0,

          loan_facility: formData.providesLoans === "yes" ? 1 : 0,

          waste_management: formData.hasWasteManagement === "yes" ? 1 : 0,

          central_government_benefits:
            formData.centralGovernmentBenefits === "yes" ? 1 : 0,

          state_government_benefits:
            formData.stateGovernmentBenefits === "yes" ? 1 : 0,
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
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.hasOfficeBuilding}
            onChange={(value) => handleInputChange("hasOfficeBuilding", value)}
            name="hasOfficeBuilding"
            error={errors.hasOfficeBuilding}
            required
          />

          {formData.hasOfficeBuilding === "yes" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Type of Office Building
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

      {/* Share Capital Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          2. Share Capital
        </h2>

        <div className="space-y-6">
          <Input
            label="2(a). Authorised Share Capital (in Rs)"
            type="number"
            value={formData.authorizedShareCapital}
            onChange={(e) =>
              handleInputChange("authorizedShareCapital", e.target.value)
            }
            placeholder="Enter authorized share capital amount"
            error={errors.authorizedShareCapital}
            required
          />

          <Input
            label="2(b). Annual Turnover (in Rs)"
            type="number"
            value={formData.annualTurnover}
            onChange={(e) =>
              handleInputChange("annualTurnover", e.target.value)
            }
            placeholder="Enter annual turnover"
            // error={errors.annualTurnover}
            // required
          />

          <Input
            label="2(c). Total Deposit (in Rs)"
            type="number"
            value={formData.totalDeposit}
            onChange={(e) => handleInputChange("totalDeposit", e.target.value)}
            placeholder="Enter total deposit"
            error={errors.totalDeposit}
            required
          />

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              2(d). Paid up Share Capital by different Entity
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
                        onChange={(e) => {
                          handleInputChange(
                            "membersShareCapital",
                            e.target.value,
                          );
                          calculateTotalShareCapital(
                            e.target.value,
                            formData.governmentShareCapital,
                          );
                        }}
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
                        onChange={(e) => {
                          handleInputChange(
                            "governmentShareCapital",
                            e.target.value,
                          );
                          calculateTotalShareCapital(
                            formData.membersShareCapital,
                            e.target.value,
                          );
                        }}
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

      {/* Sugar Mill Operations Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          3. Sugar Mill Operations
        </h2>

        <div className="space-y-6">
          <Input
            label="3(a). Number of Sugar mills or Manufacturing Plant operated by cooperative society"
            type="number"
            value={formData.numberOfSugarMills}
            onChange={(e) =>
              handleInputChange("numberOfSugarMills", e.target.value)
            }
            placeholder="Enter number of sugar mills"
            error={errors.numberOfSugarMills}
            required
          />

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              3(b). Area of the Cooperative Sugar Mill(s)
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">
                      Name of Entity
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-left">
                      Area (in acre)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">
                      Build-up Area
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Input
                        type="number"
                        value={formData.buildUpArea}
                        onChange={(e) => {
                          handleInputChange("buildUpArea", e.target.value);
                          calculateTotalArea(
                            e.target.value,
                            formData.openLandArea,
                          );
                        }}
                        placeholder="Enter build-up area in acres"
                        error={errors.buildUpArea}
                        required
                        step="0.01"
                        className="w-full"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">
                      Open Land Area
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Input
                        type="number"
                        value={formData.openLandArea}
                        onChange={(e) => {
                          handleInputChange("openLandArea", e.target.value);
                          calculateTotalArea(
                            formData.buildUpArea,
                            e.target.value,
                          );
                        }}
                        placeholder="Enter open land area in acres"
                        error={errors.openLandArea}
                        required
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
                        value={formData.totalArea}
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

      {/* Crushing Capacity Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          4. Crushing Capacity
        </h2>

        <div className="space-y-6">
          <Input
            label="4(a). Licensed Capacity (in term of Tonne Crushing per Day (TCD))"
            type="number"
            value={formData.licensedCapacity}
            onChange={(e) =>
              handleInputChange("licensedCapacity", e.target.value)
            }
            placeholder="Enter licensed capacity in TCD"
            error={errors.licensedCapacity}
            required
            step="0.01"
          />

          <Input
            label="4(b). Installed Capacity (in term of Tonne Crushing per day (TCD))"
            type="number"
            value={formData.installedCapacity}
            onChange={(e) =>
              handleInputChange("installedCapacity", e.target.value)
            }
            placeholder="Enter installed capacity in TCD"
            error={errors.installedCapacity}
            required
            step="0.01"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="4(c). Crushing Period Start"
              type="date"
              value={formData.crushingPeriodStart}
              onChange={(e) =>
                handleInputChange("crushingPeriodStart", e.target.value)
              }
              error={errors.crushingPeriodStart}
              required
            />

            <Input
              label="4(d). Crushing Period End"
              type="date"
              value={formData.crushingPeriodEnd}
              onChange={(e) =>
                handleInputChange("crushingPeriodEnd", e.target.value)
              }
              error={errors.crushingPeriodEnd}
              required
            />
          </div>
        </div>
      </Card>

      {/* Products and Retail Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          5. Products and Retail
        </h2>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {productOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  value={option.value}
                  checked={formData.productTypes.includes(option.value)}
                  onChange={() => handleProductChange(option.value)}
                  className="h-4 w-4"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          {errors.productTypes && (
            <p className="text-red-500 text-sm mt-2">{errors.productTypes}</p>
          )}

          <RadioGroup
            label="5(b). Whether the cooperative society operate retail shops/outlet to sale products?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.operatesRetailShops}
            onChange={(value) =>
              handleInputChange("operatesRetailShops", value)
            }
            name="operatesRetailShops"
            error={errors.operatesRetailShops}
            required
          />

          {formData.operatesRetailShops === "yes" && (
            <Input
              label="5(c). Number of retail shops/outlets operated by the cooperative society"
              type="number"
              value={formData.numberOfRetailShops}
              onChange={(e) =>
                handleInputChange("numberOfRetailShops", e.target.value)
              }
              placeholder="Enter number of retail shops"
              error={errors.numberOfRetailShops}
              required
            />
          )}
        </div>
      </Card>

      {/* Member Services Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          6. Member Services
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="6(a). Whether inputs for sugarcane cultivation are provided to promoters?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.providesInputs}
            onChange={(value) => handleInputChange("providesInputs", value)}
            name="providesInputs"
            error={errors.providesInputs}
            required
          />

          <RadioGroup
            label="6(b). Whether the facilities of Loans and Advances are offered to the Promoters?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.providesLoans}
            onChange={(value) => handleInputChange("providesLoans", value)}
            name="providesLoans"
            error={errors.providesLoans}
            required
          />
        </div>
      </Card>

      {/* Waste Management Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          7. Waste Management
        </h2>

        <RadioGroup
          label="7(a). Whether the waste management facility is available in the Cooperative Mill?"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          value={formData.hasWasteManagement}
          onChange={(value) => handleInputChange("hasWasteManagement", value)}
          name="hasWasteManagement"
          error={errors.hasWasteManagement}
          required
        />
      </Card>

      {/* Government Benefits Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          8. Government Benefits
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="8(a). Whether any benefits (subsidy/scheme) received from Central Government?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.centralGovernmentBenefits}
            onChange={(value) =>
              handleInputChange("centralGovernmentBenefits", value)
            }
            name="centralGovernmentBenefits"
            error={errors.centralGovernmentBenefits}
            required
          />

          <RadioGroup
            label="8(b). Whether any benefits (subsidy/scheme) received from State Government?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.stateGovernmentBenefits}
            onChange={(value) =>
              handleInputChange("stateGovernmentBenefits", value)
            }
            name="stateGovernmentBenefits"
            error={errors.stateGovernmentBenefits}
            required
          />
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

export default CooperativeRegistrationsSugar;
