import React, { useEffect, useState } from "react";
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

  // Member Details
  individualMembers: string;
  institutionalMembers: string;
  totalMembers: string;

  // Share Capital
  authorizedShareCapital: string;
  membersShareCapital: string;
  governmentShareCapital: string;
  totalShareCapital: string;
  paidUpShareDate: string;

  // Financial Details
  totalDeposit: string;
  totalLoanOutstanding: string;

  // Annual Turnover
  annualTurnover: string;

  // Raw Materials and Products
  rawMaterialTypes: string[];
  productTypes: string[];

  // Manufacturing Units
  hasCommonWorkingPlace: string;
  numberOfWorkPlaces: string;

  // Work and Training
  membersDoWork: string;
  providesGuidanceTraining: string;

  // Raw Material and Products
  providesRawMaterial: string;
  rawMaterialAvailable: string;

  // Waste Management
  generatesWaste: string;
  wasteManagementAvailable: string;

  // Retail Operations
  operatesRetailShops: string;
  numberOfRetailShops: string;
  sellsOutsideArea: string;

  facilities: string[];
}

const CooperativeRegistrationsHandicraft = ({
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
    paidUpShareDate: data?.paidUpShareDate || "",
    totalDeposit: data?.totalDeposit || "",
    totalLoanOutstanding: data?.totalLoanOutstanding || "",
    annualTurnover: data?.annualTurnover || "",
    rawMaterialTypes: data?.rawMaterialTypes || [],
    productTypes: data?.productTypes || [],
    hasCommonWorkingPlace: data?.hasCommonWorkingPlace || "",
    numberOfWorkPlaces: data?.numberOfWorkPlaces || "",
    membersDoWork: data?.membersDoWork || "",
    providesGuidanceTraining: data?.providesGuidanceTraining || "",
    providesRawMaterial: data?.providesRawMaterial || "",
    rawMaterialAvailable: data?.rawMaterialAvailable || "",
    generatesWaste: data?.generatesWaste || "",
    wasteManagementAvailable: data?.wasteManagementAvailable || "",
    operatesRetailShops: data?.operatesRetailShops || "",
    numberOfRetailShops: data?.numberOfRetailShops || "",
    sellsOutsideArea: data?.sellsOutsideArea || "",
    facilities: data?.facilities || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const calculateTotalMembers = (
    individualValue: string,
    institutionalValue: string,
  ) => {
    const individual = parseInt(individualValue) || 0;
    const institutional = parseInt(institutionalValue) || 0;

    const total = individual + institutional;

    setFormData((prev) => ({
      ...prev,
      individualMembers: individualValue,
      institutionalMembers: institutionalValue,
      totalMembers: total.toString(),
    }));
  };

  const calculateTotalShareCapital = (
    membersValue: string,
    governmentValue: string,
  ) => {
    const members = parseInt(membersValue) || 0;
    const government = parseInt(governmentValue) || 0;

    const total = members + government;

    setFormData((prev) => ({
      ...prev,
      membersShareCapital: membersValue,
      governmentShareCapital: governmentValue,
      totalShareCapital: total.toString(),
    }));
  };

  const officeBuildingTypes = [
    { value: "1", label: "Own Building" },
    { value: "2", label: "Rented Building" },
    { value: "3", label: "Rent Free Building" },
    { value: "4", label: "Leased Building" },
    { value: "5", label: "Building Provided by the Government" },
  ];

  const rawMaterialOptions = [
    { value: "1", label: "Textiles or Leather material" },
    { value: "2", label: "Wood, metal, clay, bone, horn, glass or stone" },
    { value: "3", label: "Paper or canvas" },
    { value: "4", label: "Plants (bamboo etc.) other than wood" },
    { value: "5", label: "Other" },
  ];

  const facilitiesOptions = [
    { value: "1", label: "Do not have basic amenities" },
    { value: "38", label: "Business Correspondence" },
  ];

  const toggleRawMaterial = (value: string) => {
    setFormData((prev) => {
      const exists = prev.rawMaterialTypes.includes(value);

      return {
        ...prev,
        rawMaterialTypes: exists
          ? prev.rawMaterialTypes.filter((v) => v !== value)
          : [...prev.rawMaterialTypes, value],
      };
    });
  };

  const toggleFacility = (value: string) => {
    setFormData((prev) => {
      const exists = prev.facilities.includes(value);

      return {
        ...prev,
        facilities: exists
          ? prev.facilities.filter((v) => v !== value)
          : [...prev.facilities, value],
      };
    });
  };

  const toggleProduct = (value: string) => {
    setFormData((prev) => {
      const exists = prev.productTypes.includes(value);

      return {
        ...prev,
        productTypes: exists
          ? prev.productTypes.filter((v) => v !== value)
          : [...prev.productTypes, value],
      };
    });
  };

  // const calculateTotalShareCapital = () => {
  //   const members = parseInt(formData.membersShareCapital) || 0;
  //   const government = parseInt(formData.governmentShareCapital) || 0;
  //   const total = members + government;
  //   handleInputChange('totalShareCapital', total.toString());
  // };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.hasOfficeBuilding)
      newErrors.hasOfficeBuilding =
        "Please specify if society has office building";
    if (!formData.individualMembers)
      newErrors.individualMembers = "Individual promoters count is required";
    if (!formData.institutionalMembers)
      newErrors.institutionalMembers =
        "Institutional promoters count is required";
    if (!formData.authorizedShareCapital)
      newErrors.authorizedShareCapital = "Authorized share capital is required";
    // if (!formData.membersShareCapital)
    //   newErrors.membersShareCapital = "Promoters share capital is required";
    // if (!formData.governmentShareCapital)
    // newErrors.governmentShareCapital = "Government share capital is required";
    // if (!formData.annualTurnover)
    //   newErrors.annualTurnover = "Annual turnover is required";
    if (!formData.totalDeposit)
      newErrors.totalDeposit = "Total deposit is required";
    if (formData.rawMaterialTypes.length === 0)
      newErrors.rawMaterialTypes = "Raw material types are required";
    if (formData.productTypes.length === 0)
      newErrors.productTypes = "Product types are required";
    if (!formData.hasCommonWorkingPlace)
      newErrors.hasCommonWorkingPlace =
        "Please specify if society has common working place";
    if (
      formData.hasCommonWorkingPlace === "yes" &&
      !formData.numberOfWorkPlaces
    ) {
      newErrors.numberOfWorkPlaces = "Number of work places is required";
    }
    if (!formData.membersDoWork)
      newErrors.membersDoWork =
        "Please specify if promoters do handicraft work";
    if (
      formData.membersDoWork === "yes" &&
      !formData.providesGuidanceTraining
    ) {
      newErrors.providesGuidanceTraining =
        "Please specify if guidance/training is provided";
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

  const transformToApiPayload = () => ({
    CooperativeRegistrationsHandicraft: [
      {
        has_building: formData.hasOfficeBuilding === "yes" ? 1 : 0,
        building_type:
          formData.hasOfficeBuilding === "yes"
            ? Number(formData.officeBuildingType)
            : null,

        individual_member: Number(formData.individualMembers) || null,
        institutional_member: Number(formData.institutionalMembers) || null,

        authorised_share: Number(formData.authorizedShareCapital) || null,

        paid_up_members: Number(formData.membersShareCapital) || null,
        paid_up_government_bodies:
          Number(formData.governmentShareCapital) || null,

        paid_up_total:
          (Number(formData.membersShareCapital)) +
          (Number(formData.governmentShareCapital)) || null,

        paid_up_share_date: formData.paidUpShareDate || null,

        total_deposit: Number(formData.totalDeposit) || null,

        pack_total_outstanding_loan:
          Number(formData.totalLoanOutstanding) || null,

        type_raw: formData.rawMaterialTypes.join(",") || null,
        type_produce: formData.productTypes.join(",") || null,

        common_work_place: formData.hasCommonWorkingPlace === "yes" ? 1 : 0,

        workplace_operate:
          formData.hasCommonWorkingPlace === "yes"
            ? Number(formData.numberOfWorkPlaces)
            : 0,

        is_work_by_member: formData.membersDoWork === "yes" ? 1 : 0,
        is_training_provide:
          formData.providesGuidanceTraining === "yes" ? 1 : 0,

        is_raw_provide: formData.providesRawMaterial === "yes" ? 1 : 0,
        is_raw_easy_avail: formData.rawMaterialAvailable === "yes" ? 1 : 0,

        is_waste_generate: formData.generatesWaste === "yes" ? 1 : 0,
        is_waste_facility: formData.wasteManagementAvailable === "yes" ? 1 : 0,

        is_operate_retail: formData.operatesRetailShops === "yes" ? 1 : 0,

        no_of_retail:
          formData.operatesRetailShops === "yes"
            ? Number(formData.numberOfRetailShops)
            : 0,

        is_product_sale_out: formData.sellsOutsideArea === "yes" ? 1 : 0,

        facilities: formData.facilities.join(",") || null,
      },
    ],
  });

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

        <div className="mb-6">
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
        </div>

        {formData.hasOfficeBuilding === "yes" && (
          <RadioGroup
            label="1(b). Type of Office Building"
            options={officeBuildingTypes}
            value={formData.officeBuildingType}
            onChange={(value) => handleInputChange("officeBuildingType", value)}
            name="officeBuildingType"
            error={errors.officeBuildingType}
            required
          />
        )}
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
              onChange={(e) =>
                calculateTotalMembers(
                  e.target.value,
                  formData.institutionalMembers,
                )
              }
              placeholder="Enter number of individual promoters"
              error={errors.individualMembers}
              required
            />

            <Input
              label="Institutional"
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
            <div className="text-sm font-small text-gray-900 mb-4">
              3(b). Paid up Share Capital by different Entity
            </div>
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
                // error={errors.membersShareCapital}
                // required
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
                // error={errors.governmentShareCapital}
                // required
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
          <Input
            label="3(c). Paid Up Share Date"
            type="date"
            value={formData.paidUpShareDate}
            onChange={(e) =>
              handleInputChange("paidUpShareDate", e.target.value)
            }
          />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          4. Financial Details
        </h2>

        <div className="mb-4">
          <Input
            label="4(a). Total Deposit (in Rs)"
            placeholder="Enter total deposit"
            type="number"
            value={formData.totalDeposit}
            onChange={(e) => handleInputChange("totalDeposit", e.target.value)}
            error={errors.totalDeposit}
            required
          />
        </div>

        <Input
          label="4(b). Total Loan Outstanding (in Rs)"
          placeholder="Enter total loan"
          type="number"
          value={formData.totalLoanOutstanding}
          onChange={(e) =>
            handleInputChange("totalLoanOutstanding", e.target.value)
          }
        />
      </Card>

      {/* Annual Turnover Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          5. Annual Turn Over
        </h2>

        <Input
          label="5(a). Annual Turn Over of the Cooperative Society (in Rs)"
          type="number"
          value={formData.annualTurnover}
          onChange={(e) => handleInputChange("annualTurnover", e.target.value)}
          placeholder="Enter annual turnover amount"
          // error={errors.annualTurnover}
          // required
        />
      </Card>

      {/* Raw Materials and Products Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          6. Raw Materials and Products
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rawMaterialOptions.map((option) => (
            <label key={option.value} className="flex gap-3">
              <input
                type="checkbox"
                checked={formData.rawMaterialTypes.includes(option.value)}
                onChange={() => toggleRawMaterial(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
        <div className="mt-6">
          <div className="text-m font-medium text-gray-900 mb-4">
            6(a). Type of product produced by cooperative society
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { value: "1", label: "Textiles & related products" },
              { value: "2", label: "Pottery & related products" },
            ].map((option) => (
              <label key={option.value} className="flex gap-3">
                <input
                  type="checkbox"
                  checked={formData.productTypes.includes(option.value)}
                  onChange={() => toggleProduct(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>
      </Card>

      {/* Manufacturing Units Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          7. Manufacturing Units
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="7(a). Whether the cooperative society has common working place or manufacturing unit?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.hasCommonWorkingPlace}
            onChange={(value) =>
              handleInputChange("hasCommonWorkingPlace", value)
            }
            name="hasCommonWorkingPlace"
            error={errors.hasCommonWorkingPlace}
            required
          />

          {formData.hasCommonWorkingPlace === "yes" && (
            <Input
              label="7(a)(i). Number of work places or manufacturing units operated by cooperative society?"
              type="number"
              value={formData.numberOfWorkPlaces}
              onChange={(e) =>
                handleInputChange("numberOfWorkPlaces", e.target.value)
              }
              placeholder="Enter number of work places"
              error={errors.numberOfWorkPlaces}
              required
            />
          )}
        </div>
      </Card>

      {/* Work and Training Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          8. Work and Training
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="8(a). Whether the processing or handicraft work is done by promoters themself?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.membersDoWork}
            onChange={(value) => handleInputChange("membersDoWork", value)}
            name="membersDoWork"
            error={errors.membersDoWork}
            required
          />

          {formData.membersDoWork === "yes" && (
            <RadioGroup
              label="8(a)(i). Whether the regular guidance/training is provided by cooperative society to promoters?"
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              value={formData.providesGuidanceTraining}
              onChange={(value) =>
                handleInputChange("providesGuidanceTraining", value)
              }
              name="providesGuidanceTraining"
              error={errors.providesGuidanceTraining}
              required
            />
          )}
        </div>
      </Card>

      {/* Raw Material and Products Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          9. Raw Material and Products
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="9(a). Whether the cooperative society provide raw material to promoters & finished products taken after processing?"
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
            label="9(b). Whether the raw material easily available to cooperative society?"
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
          10. Waste Management
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="10(a). Whether the waste are generated in handicraft process?"
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
              label="10(a)(i). Whether the waste management facility is available in the society?"
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
          11. Retail Operations
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="11(a). Whether the cooperative society operate retail shops/outlet to sale products?"
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
              label="11(a)(i). Number of retail shops/outlets operated by cooperative society?"
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
            label="11(b). Whether the products are sale out of the area of operation of the cooperative society?"
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

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          12. Facilities
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {facilitiesOptions.map((option) => (
            <label key={option.value} className="flex gap-3">
              <input
                type="checkbox"
                checked={formData.facilities.includes(option.value)}
                onChange={() => toggleFacility(option.value)}
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
        <Button type="submit">Submit Application</Button>
      </div>
    </form>
  );
};

export default CooperativeRegistrationsHandicraft;
