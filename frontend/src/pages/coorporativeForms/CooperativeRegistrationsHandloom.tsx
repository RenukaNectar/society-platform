import React, { useState } from "react";
import { Input } from "../../components/ui/Input";
// import { Select } from '../../components/ui/Select';
import { RadioGroup } from "../../components/ui/RadioGroup";
// import { Textarea } from '../../components/ui/Textarea';
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

interface FormData {
  // Office Building
  hasOfficeBuilding: string;
  officeBuildingType: string;

  // Member Details
  individualMembers: string;
  institutionalMembers: string;
  totalMembers: string;

  // Share Capital
  authorizedShareCapital: string;
  membersShareCapital: string;
  governmentShareCapital: string;
  totalShareCapital: string;

  // Annual Turnover
  annualTurnover: string;

  // Financial
  totalDeposit: string;

  // Machine Types
  powerLooms: string;
  handlooms: string;

  // Loom Operations
  loomsOperatedByMembers: string;
  workDividedBySkill: string;
  numberOfLooms: string;

  // Raw Materials and Products
  providesRawMaterial: string;
  rawMaterialAvailable: string;

  // Waste Management
  generatesWaste: string;
  wasteManagementAvailable: string;

  // Retail Operations
  operatesRetailShops: string;
  numberOfRetailShops: string;
  sellsOutsideArea: string;
}

const CooperativeRegistrationsHandloom = ({
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
  const [formData, setFormData] = useState<FormData>({
    hasOfficeBuilding: data?.hasOfficeBuilding || "",
    officeBuildingType: data?.officeBuildingType || "",
    individualMembers: data?.individualMembers || "",
    institutionalMembers: data?.institutionalMembers || "",
    totalMembers: data?.totalMembers || "",
    authorizedShareCapital: data?.authorizedShareCapital || "",
    membersShareCapital: data?.membersShareCapital || "",
    governmentShareCapital: data?.governmentShareCapital || "",
    totalShareCapital: data?.totalShareCapital || "",
    annualTurnover: data?.annualTurnover || "",
    totalDeposit: data?.totalDeposit || "",
    powerLooms: data?.powerLooms || "",
    handlooms: data?.handlooms || "",
    loomsOperatedByMembers: data?.loomsOperatedByMembers || "",
    workDividedBySkill: data?.workDividedBySkill || "",
    numberOfLooms: data?.numberOfLooms || "",
    providesRawMaterial: data?.providesRawMaterial || "",
    rawMaterialAvailable: data?.rawMaterialAvailable || "",
    generatesWaste: data?.generatesWaste || "",
    wasteManagementAvailable: data?.wasteManagementAvailable || "",
    operatesRetailShops: data?.operatesRetailShops || "",
    numberOfRetailShops: data?.numberOfRetailShops || "",
    sellsOutsideArea: data?.sellsOutsideArea || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const officeBuildingTypes = [
    { value: "1", label: "Own Building" },
    { value: "2", label: "Rented Building" },
    { value: "3", label: "Rent Free Building" },
    { value: "4", label: "Leased Building" },
    { value: "5", label: "Building Provided By Govt" },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === "loomsOperatedByMembers" && value === "no") {
        updated.numberOfLooms = "";
        updated.workDividedBySkill = "";
      }

      if (field === "operatesRetailShops" && value === "no") {
        updated.numberOfRetailShops = "";
      }

      return updated;
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const calculateTotalMembers = (
    individualVal: string,
    institutionalVal: string,
  ) => {
    const individual = parseInt(individualVal) || 0;
    const institutional = parseInt(institutionalVal) || 0;

    const total = individual + institutional;

    setFormData((prev) => ({
      ...prev,
      individualMembers: individualVal,
      institutionalMembers: institutionalVal,
      totalMembers: total.toString(),
    }));
  };
  // const calculateTotalShareCapital = (memberVal: string, govtVal: string) => {
  //   const members = parseInt(memberVal) || 0;
  //   const government = parseInt(govtVal) || 0;
  //   const total = members + government;
  //   handleInputChange("totalShareCapital", total.toString());
  // };

  const calculateTotalShareCapital = (membersVal: string, govtVal: string) => {
    const members = parseInt(membersVal) || 0;
    const government = parseInt(govtVal) || 0;

    const total = members + government;

    setFormData((prev) => ({
      ...prev,
      membersShareCapital: membersVal,
      governmentShareCapital: govtVal,
      totalShareCapital: total.toString(),
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.hasOfficeBuilding)
      newErrors.hasOfficeBuilding =
        "Please specify if society has office building";
    if (formData.hasOfficeBuilding === "yes" && !formData.officeBuildingType) {
      newErrors.officeBuildingType = "Office building type is required";
    }
    if (!formData.individualMembers)
      newErrors.individualMembers = "Individual promoters count is required";
    if (!formData.institutionalMembers)
      newErrors.institutionalMembers =
        "Institutional promoters count is required";
    if (!formData.authorizedShareCapital)
      newErrors.authorizedShareCapital = "Authorized share capital is required";
    if (!formData.membersShareCapital)
      newErrors.membersShareCapital = "Promoters share capital is required";
    if (!formData.governmentShareCapital)
      newErrors.governmentShareCapital = "Government share capital is required";
    if (!formData.annualTurnover)
      newErrors.annualTurnover = "Annual turnover is required";
    if (formData.totalDeposit === "")
      newErrors.totalDeposit = "Total deposit is required";
    if (!formData.powerLooms)
      newErrors.powerLooms = "Power looms count is required";
    if (!formData.handlooms)
      newErrors.handlooms = "Handlooms count is required";
    if (!formData.loomsOperatedByMembers)
      newErrors.loomsOperatedByMembers =
        "Please specify if looms are operated by promoters";
    if (
      formData.loomsOperatedByMembers === "yes" &&
      !formData.workDividedBySkill
    ) {
      newErrors.workDividedBySkill =
        "Please specify if work is divided by skill";
    }
    if (formData.loomsOperatedByMembers === "yes" && !formData.numberOfLooms) {
      newErrors.numberOfLooms = "Number of looms is required";
    }
    if (!formData.providesRawMaterial)
      newErrors.providesRawMaterial =
        "Please specify if society provides raw material";
    if (!formData.rawMaterialAvailable)
      newErrors.rawMaterialAvailable =
        "Please specify if raw material is available";
    if (!formData.generatesWaste)
      newErrors.generatesWaste = "Please specify if waste is generated";
    if (
      formData.generatesWaste === "yes" &&
      !formData.wasteManagementAvailable
    ) {
      newErrors.wasteManagementAvailable =
        "Please specify if waste management is available";
    }
    if (!formData.operatesRetailShops)
      newErrors.operatesRetailShops =
        "Please specify if society operates retail shops";
    if (
      formData.operatesRetailShops === "yes" &&
      !formData.numberOfRetailShops
    ) {
      newErrors.numberOfRetailShops = "Number of retail shops is required";
    }
    if (!formData.sellsOutsideArea)
      newErrors.sellsOutsideArea =
        "Please specify if products are sold outside area";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const transformToApiPayload = () => {
    const hasBuilding = formData.hasOfficeBuilding === "yes" ? 1 : 0;

    const buildingType =
      hasBuilding === 1 ? Number(formData.officeBuildingType) : null;

    const individual = Number(formData.individualMembers);
    const institutional = Number(formData.institutionalMembers);

    const paidUpMembers = Number(formData.membersShareCapital);
    const paidUpGovt = Number(formData.governmentShareCapital);

    return {
      CooperativeRegistrationsHandloom: [
        {
          has_building: hasBuilding || null,
          building_type: buildingType || null,

          individual_member: individual || null,
          institutional_member: institutional || null,
          total_members: individual + institutional || null,

          authorised_share: Number(formData.authorizedShareCapital) || null,

          paid_up_members: paidUpMembers || null,
          paid_up_government_bodies: paidUpGovt || null,
          paid_up_total: paidUpMembers + paidUpGovt || null,

          annual_turn_over: Number(formData.annualTurnover) || null,
          total_deposit: Number(formData.totalDeposit) || null,

          power_loom_type: formData.powerLooms || null,
          hand_loom_type: formData.handlooms || null,

          operated_member_themself:
            formData.loomsOperatedByMembers === "yes" ? 1 : 0,

          is_user_work_divide: formData.workDividedBySkill === "yes" ? 1 : 0,

          no_of_loom:
            formData.loomsOperatedByMembers === "yes"
              ? Number(formData.numberOfLooms)
              : 0,

          raw_product_taken: formData.providesRawMaterial === "yes" ? 1 : 0,

          raw_material_available:
            formData.rawMaterialAvailable === "yes" ? 1 : 0,

          waste_generate: formData.generatesWaste === "yes" ? 1 : 0,

          waste_available: formData.wasteManagementAvailable === "yes" ? 1 : 0,

          operate_retail: formData.operatesRetailShops === "yes" ? 1 : 0,

          no_of_retail:
            formData.operatesRetailShops === "yes"
              ? Number(formData.numberOfRetailShops)
              : 0,

          product_sale_out: formData.sellsOutsideArea === "yes" ? 1 : 0,
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
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
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

      {/* Member Details Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          2. Promoter Detail of Cooperative Society
        </h2>

        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Type of Promoter | No. of Promoter
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="Individual"
              type="number"
              value={formData.individualMembers}
              onChange={(e) => {
                handleInputChange("individualMembers", e.target.value);
                calculateTotalMembers(
                  e.target.value,
                  formData.institutionalMembers,
                );
              }}
              placeholder="Enter number of individual promoters"
              error={errors.individualMembers}
              required
            />

            <Input
              label="Institutional"
              type="number"
              value={formData.institutionalMembers}
              onChange={(e) => {
                handleInputChange("institutionalMembers", e.target.value);
                calculateTotalMembers(
                  formData.individualMembers,
                  e.target.value,
                );
              }}
              placeholder="Enter number of institutional promoters"
              error={errors.institutionalMembers}
              required
            />

            <Input
              label="Total"
              type="number"
              value={formData.totalMembers}
              placeholder="Auto-calculated"
              disabled
            />
          </div>
        </div>
      </Card>

      {/* Share Capital Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          3. Share Capital
        </h2>

        <div className="space-y-6">
          <Input
            label="3(a). Authorised Share Capital (in Rs)"
            type="number"
            value={formData.authorizedShareCapital}
            onChange={(e) =>
              handleInputChange("authorizedShareCapital", e.target.value)
            }
            placeholder="Enter authorized share capital amount"
            error={errors.authorizedShareCapital}
            required
          />

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              3(b). Paid up Share Capital by different Entity
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="Promoters"
                type="number"
                value={formData.membersShareCapital}
                onChange={(e) =>
                  calculateTotalShareCapital(
                    e.target.value,
                    formData.governmentShareCapital,
                  )
                }
                placeholder="Enter promoters share capital"
                error={errors.membersShareCapital}
                required
              />

              <Input
                label="Government or Government Bodies"
                type="number"
                value={formData.governmentShareCapital}
                onChange={(e) =>
                  calculateTotalShareCapital(
                    formData.membersShareCapital,
                    e.target.value,
                  )
                }
                placeholder="Enter government share capital"
                error={errors.governmentShareCapital}
                required
              />

              <Input
                label="Total"
                type="number"
                value={formData.totalShareCapital}
                placeholder="Auto-calculated"
                disabled
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Annual Turnover Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          4. Annual Turn Over
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="4(a). Annual Turn Over of the Cooperative Society (in Rs)"
            type="number"
            value={formData.annualTurnover}
            onChange={(e) =>
              handleInputChange("annualTurnover", e.target.value)
            }
            placeholder="Enter annual turnover amount"
            error={errors.annualTurnover}
            required
          />

          <Input
            label="4(b). Total Deposit (in Rs)"
            type="number"
            value={formData.totalDeposit}
            onChange={(e) => handleInputChange("totalDeposit", e.target.value)}
            placeholder="Enter total deposit"
            error={errors.totalDeposit}
            required
          />
        </div>
      </Card>

      {/* Machine Types Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          5. Type of Machine Used
        </h2>

        <div className="space-y-6">
          <Input
            label="5(a). Power Looms"
            type="number"
            value={formData.powerLooms}
            onChange={(e) => handleInputChange("powerLooms", e.target.value)}
            placeholder="Enter number of power looms"
            error={errors.powerLooms}
            required
          />

          <Input
            label="5(b). Handlooms"
            type="number"
            value={formData.handlooms}
            onChange={(e) => handleInputChange("handlooms", e.target.value)}
            placeholder="Enter number of handlooms"
            error={errors.handlooms}
            required
          />
        </div>
      </Card>

      {/* Loom Operations Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          6. Loom Operations
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="6(a). Whether the looms are operated by promoters themself?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.loomsOperatedByMembers}
            onChange={(value) =>
              handleInputChange("loomsOperatedByMembers", value)
            }
            name="loomsOperatedByMembers"
            error={errors.loomsOperatedByMembers}
            required
          />

          {formData.loomsOperatedByMembers === "yes" && (
            <RadioGroup
              label="6(a)(i). Whether the work is divided among the promoters as per their skill?"
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              value={formData.workDividedBySkill}
              onChange={(value) =>
                handleInputChange("workDividedBySkill", value)
              }
              name="workDividedBySkill"
              error={errors.workDividedBySkill}
              required
            />
          )}

          <Input
            label="6(b). Number of looms operated by cooperative society"
            type="number"
            value={formData.numberOfLooms}
            onChange={(e) => handleInputChange("numberOfLooms", e.target.value)}
            placeholder="Enter total number of looms operated"
            error={errors.numberOfLooms}
            required
          />
        </div>
      </Card>

      {/* Raw Materials and Products Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          7. Raw Materials and Products
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="7(a). Whether the cooperative society provide raw material to promoters & produced product taken after processing?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.providesRawMaterial}
            onChange={(value) =>
              handleInputChange("providesRawMaterial", value)
            }
            name="providesRawMaterial"
            error={errors.providesRawMaterial}
            required
          />

          <RadioGroup
            label="7(b). Whether the raw material easily available to cooperative society?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.rawMaterialAvailable}
            onChange={(value) =>
              handleInputChange("rawMaterialAvailable", value)
            }
            name="rawMaterialAvailable"
            error={errors.rawMaterialAvailable}
            required
          />
        </div>
      </Card>

      {/* Waste Management Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          8. Waste Management
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="8(a). Whether the wastes are generated in production process?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.generatesWaste}
            onChange={(value) => handleInputChange("generatesWaste", value)}
            name="generatesWaste"
            error={errors.generatesWaste}
            required
          />

          {formData.generatesWaste === "yes" && (
            <RadioGroup
              label="8(b). Whether the waste management facility is available in the society?"
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              value={formData.wasteManagementAvailable}
              onChange={(value) =>
                handleInputChange("wasteManagementAvailable", value)
              }
              name="wasteManagementAvailable"
              error={errors.wasteManagementAvailable}
              required
            />
          )}
        </div>
      </Card>

      {/* Retail Operations Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          9. Retail Operations
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="9(a). Whether the cooperative society operate retail shops/outlet to sale products?"
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
              label="9(a)(i). Number of retail shops/outlets operated by cooperative society"
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

          <RadioGroup
            label="9(b). Whether the products are sale out of area of operation of the cooperative society?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.sellsOutsideArea}
            onChange={(value) => handleInputChange("sellsOutsideArea", value)}
            name="sellsOutsideArea"
            error={errors.sellsOutsideArea}
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

export default CooperativeRegistrationsHandloom;
