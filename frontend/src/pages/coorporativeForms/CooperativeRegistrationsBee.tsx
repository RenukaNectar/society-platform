import React, { useState } from "react";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { RadioGroup } from "../../components/ui/RadioGroup";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

interface FormData {
  // Office Building
  hasOfficeBuilding: string;
  officeBuildingType: string;

  // Member Details
  individualMembers: string;
  institutionalMembers: string;

  // Share Capital
  authorizedShareCapital: string;
  paidUpShareCapital: {
    entityName: string;
    amount: string;
    type: string;
  }[];

  // Annual Turnover
  annualTurnover: string;

  // Beehive Operations
  hasCommonBeehiveYard: string;
  numberOfBeehives: string;
  beehiveTypes: string;
  membersDoRearing: string;
  providesGuidanceTraining: string;

  // Bee Farming Products
  beeFarmingProducts: string[];
  growsBeePlants: string;

  // Facilities
  hasCleaningProcessing: string;
  hasWasteManagement: string;
  hasOwnBrand: string;

  // Retail Operations
  operatesRetailShops: string;
  numberOfRetailShops: string;

  typeBee: string;
  paidUpShareDate: string;
  totalDeposit: string;
  packTotalOutstandingLoan: string;
  isProductSaleOut: string;
  facilities: string;
}

const CooperativeRegistrationsBee = ({
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
    typeBee: data?.typeBee || "",
    paidUpShareDate: data?.paidUpShareDate || "",
    totalDeposit: data?.totalDeposit || "",
    packTotalOutstandingLoan: data?.packTotalOutstandingLoan || "",
    isProductSaleOut: data?.isProductSaleOut || "",
    facilities: data?.facilities || "",
    hasOfficeBuilding: data?.hasOfficeBuilding || "",
    officeBuildingType: data?.officeBuildingType || "",
    individualMembers: data?.individualMembers || "",
    institutionalMembers: data?.institutionalMembers || "",
    authorizedShareCapital: data?.authorizedShareCapital || "",
    paidUpShareCapital: data?.paidUpShareCapital || [
      { entityName: "", amount: "", type: "" },
    ],
    annualTurnover: data?.annualTurnover || "",
    hasCommonBeehiveYard: data?.hasCommonBeehiveYard || "",
    numberOfBeehives: data?.numberOfBeehives || "",
    beehiveTypes: data?.beehiveTypes || "",
    membersDoRearing: data?.membersDoRearing || "",
    providesGuidanceTraining: data?.providesGuidanceTraining || "",
    beeFarmingProducts: data?.beeFarmingProducts || [],
    growsBeePlants: data?.growsBeePlants || "",
    hasCleaningProcessing: data?.hasCleaningProcessing || "",
    hasWasteManagement: data?.hasWasteManagement || "",
    hasOwnBrand: data?.hasOwnBrand || "",
    operatesRetailShops: data?.operatesRetailShops || "",
    numberOfRetailShops: data?.numberOfRetailShops || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const beeTypeOptions = [
    { value: "1", label: "Queen Bee" },
    { value: "2", label: "Drones Bee" },
    { value: "3", label: "Workers Bees" },
  ];

  const officeBuildingTypes = [
    { value: "1", label: "Own Building" },
    { value: "2", label: "Rented Building" },
    { value: "3", label: "Rent Free Building" },
    { value: "4", label: "Leased Building" },
    { value: "5", label: "Building Provided By Govt" },
  ];

  const beehiveTypeOptions = [
    { value: "4", label: "Langstroth" },
    { value: "5", label: "Warre" },
    { value: "6", label: "Top Bar" },
  ];

  const beeFarmingProductOptions = [
    { value: "40", label: "Honey" },
    { value: "41", label: "Bee Pollen" },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handlePaidUpShareCapitalChange = (
    index: number,
    field: string,
    value: string,
  ) => {
    const updated = [...formData.paidUpShareCapital];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, paidUpShareCapital: updated }));
  };

  const addPaidUpShareCapital = () => {
    setFormData((prev) => ({
      ...prev,
      paidUpShareCapital: [
        ...prev.paidUpShareCapital,
        { entityName: "", amount: "", type: "" },
      ],
    }));
  };

  const removePaidUpShareCapital = (index: number) => {
    if (formData.paidUpShareCapital.length > 1) {
      const updated = formData.paidUpShareCapital.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, paidUpShareCapital: updated }));
    }
  };

  const calculatePaidUpTotal = () => {
    return formData.paidUpShareCapital.reduce((sum, item) => {
      return sum + (Number(item.amount) || 0);
    }, 0);
  };

  const handleBeeFarmingProductChange = (value: string) => {
    setFormData((prev) => {
      const updated = prev.beeFarmingProducts.includes(value)
        ? prev.beeFarmingProducts.filter((v) => v !== value)
        : [...prev.beeFarmingProducts, value];

      if (errors.beeFarmingProducts) {
        setErrors((prevErr) => ({ ...prevErr, beeFarmingProducts: "" }));
      }

      return { ...prev, beeFarmingProducts: updated };
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.typeBee) newErrors.typeBee = "Please select any society type";
    if (!formData.hasOfficeBuilding)
      newErrors.hasOfficeBuilding =
        "Please specify if society has office building";
    if (formData?.hasOfficeBuilding === "yes" && !formData.officeBuildingType) {
      newErrors.officeBuildingType = "Office building type is required";
    }
    // if (!formData.individualMembers)
    //   newErrors.individualMembers = "Individual promoters count is required";
    // if (!formData.institutionalMembers)
    //   newErrors.institutionalMembers =
    //     "Institutional promoters count is required";
    // if (!formData.authorizedShareCapital)
    //   newErrors.authorizedShareCapital = "Authorized share capital is required";
    // if (!formData.annualTurnover)
    //   newErrors.annualTurnover = "Annual turnover is required";
    if (!formData.totalDeposit)
      newErrors.totalDeposit = "Please enter total deposit";
    if (!formData.hasCommonBeehiveYard)
      newErrors.hasCommonBeehiveYard =
        "Please specify if society has common beehive yard";
    if (
      formData?.hasCommonBeehiveYard === "yes" &&
      !formData.numberOfBeehives
    ) {
      newErrors.numberOfBeehives = "Number of beehives is required";
    }
    if (!formData.beehiveTypes) {
      newErrors.beehiveTypes = "Please select beehive type";
    }

    if (!formData.beeFarmingProducts.length) {
      newErrors.beeFarmingProducts =
        "Please select at least one bee farming product";
    }
    if (!formData.membersDoRearing)
      newErrors.membersDoRearing = "Please specify if promoters do bee rearing";
    if (
      formData?.membersDoRearing === "yes" &&
      !formData.providesGuidanceTraining
    ) {
      newErrors.providesGuidanceTraining =
        "Please specify if guidance/training is provided";
    }
    if (!formData.growsBeePlants)
      newErrors.growsBeePlants = "Please specify if society grows bee plants";
    if (!formData.hasCleaningProcessing)
      newErrors.hasCleaningProcessing =
        "Please specify if cleaning/processing facility is available";
    if (!formData.hasWasteManagement)
      newErrors.hasWasteManagement =
        "Please specify if waste management facility is available";
    if (!formData.hasOwnBrand)
      newErrors.hasOwnBrand = "Please specify if society has own brand";
    if (!formData.operatesRetailShops)
      newErrors.operatesRetailShops =
        "Please specify if society operates retail shops";
    if (!formData.isProductSaleOut)
      newErrors.isProductSaleOut = "Please specify the product sale ";
    if (
      formData?.operatesRetailShops === "yes" &&
      !formData.numberOfRetailShops
    ) {
      newErrors.numberOfRetailShops = "Number of retail shops is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const transformToApiPayload = () => {
    const paidUpMembers =
      formData.paidUpShareCapital.find((i) => i.type === "members")
        ?.entityName;

    const paidUpGovt =
      formData.paidUpShareCapital.find((i) => i.type == "government_bodies")
        ?.entityName;

    const totalPaidUp = Number(paidUpMembers) + Number(paidUpGovt);

    return {
      CooperativeRegistrationsBee: [
        {
          type_bee: Number(formData.typeBee) || null,

          has_building: formData.hasOfficeBuilding === "yes" ? 1 : 0,

          building_type:
            formData.hasOfficeBuilding === "yes"
              ? officeBuildingTypes.findIndex(
                  (o) => o.value === formData.officeBuildingType,
                ) + 1
              : 0,

          authorised_share: Number(formData.authorizedShareCapital) || null,

          paid_up_members: Number(paidUpMembers) || null,

          paid_up_government_bodies: Number(paidUpGovt) || null,

          paid_up_total: totalPaidUp || null,

          paid_up_share_date: formData.paidUpShareDate || null,

          total_deposit: Number(formData.totalDeposit),

          pack_total_outstanding_loan:
            Number(formData.packTotalOutstandingLoan) || null,

          annual_turn_over: Number(formData.annualTurnover) || null,

          common_yard: formData.hasCommonBeehiveYard === "yes" ? 1 : 0,

          no_of_behives:
            formData.hasCommonBeehiveYard === "yes"
              ? Number(formData.numberOfBeehives)
              : 0,

          type_behives: Number(formData.beehiveTypes) || null,

          rear_by_member: formData.membersDoRearing === "yes" ? 1 : 0,

          guidance_by_member:
            formData.membersDoRearing === "yes" &&
            formData.providesGuidanceTraining === "yes"
              ? 1
              : 0,

          type_product: formData.beeFarmingProducts.length
            ? formData.beeFarmingProducts.join(",")
            : null,

          is_bee_plant_grow: formData.growsBeePlants === "yes" ? 1 : 0,

          is_cleaning_process: formData.hasCleaningProcessing === "yes" ? 1 : 0,

          is_waste_facility: formData.hasWasteManagement === "yes" ? 1 : 0,

          own_brand_honey: formData.hasOwnBrand === "yes" ? 1 : 0,

          is_operate_retail: formData.operatesRetailShops === "yes" ? 1 : 0,

          no_of_retail:
            formData.operatesRetailShops === "yes"
              ? Number(formData.numberOfRetailShops)
              : 0,

          is_product_sale_out: formData.isProductSaleOut === "yes" ? 1 : 0,

          facilities: formData.facilities === "yes" ? 1 : 0,
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
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          1. Type of Bee
        </h2>

        <RadioGroup
          options={beeTypeOptions}
          value={formData.typeBee}
          onChange={(value) => handleInputChange("typeBee", value)}
          name="typeBee"
          required
          error={errors.typeBee}
        />
      </Card>
      {/* Office Building Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          2. Office Building
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="1(b). Whether the co-operative society has an office building"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.hasOfficeBuilding}
            onChange={(value) => handleInputChange("hasOfficeBuilding", value)}
            name="hasOfficeBuilding"
            required
            error={errors.hasOfficeBuilding}
          />

          {formData.hasOfficeBuilding === "yes" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                1(c). Type of Office Building
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

      {/* Member Details Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          3. Promoter Detail of Cooperative Society
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="2(a). Individual (No. of Promoters)"
            type="number"
            value={formData.individualMembers}
            onChange={(e) =>
              handleInputChange("individualMembers", e.target.value)
            }
            placeholder="Enter number of individual promoters"
            // error={errors.individualMembers}
            // required
          />

          <Input
            label="2(b). Institutional (No. of Promoters)"
            type="number"
            value={formData.institutionalMembers}
            onChange={(e) =>
              handleInputChange("institutionalMembers", e.target.value)
            }
            placeholder="Enter number of institutional promoters"
            // error={errors.institutionalMembers}
            // required
          />
        </div>
      </Card>

      {/* Share Capital Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          4. Share Capital
        </h2>

        <div className="space-y-6">
          <Input
            label="4(a). Authorised Share Capital (in Rs)"
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
              4(b). Paid up Share Capital by different Entity
            </h3>

            {formData.paidUpShareCapital.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 border border-gray-200 rounded-lg"
              >
                <Input
                  label="Name of entity"
                  value={item.entityName}
                  onChange={(e) =>
                    handlePaidUpShareCapitalChange(
                      index,
                      "entityName",
                      e.target.value,
                    )
                  }
                  placeholder="Promoters, Government, etc."
                />

                <Input
                  label="Amount (in Rs)"
                  type="number"
                  value={item.amount}
                  onChange={(e) =>
                    handlePaidUpShareCapitalChange(
                      index,
                      "amount",
                      e.target.value,
                    )
                  }
                  placeholder="Enter amount"
                />

                <Select
                  label="Type"
                  value={item.type}
                  onChange={(e) =>
                    handlePaidUpShareCapitalChange(
                      index,
                      "type",
                      e.target.value,
                    )
                  }
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

            {/* Paid Up Total + Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 mb-4">
              <Input
                label="Paid Up Total (in Rs)"
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

            {/* Deposit + Loan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <Input
                label="Total Deposit (in Rs)"
                type="number"
                value={formData.totalDeposit}
                onChange={(e) =>
                  handleInputChange("totalDeposit", e.target.value)
                }
                placeholder="Enter total deposit"
                error={errors.totalDeposit}
                required
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
          </div>
        </div>
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

      {/* Beehive Operations Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          6. Beehive Operations
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="6(a). Whether the Cooperative society has Common Beehive Yard?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.hasCommonBeehiveYard}
            onChange={(value) =>
              handleInputChange("hasCommonBeehiveYard", value)
            }
            name="hasCommonBeehiveYard"
            required
            error={errors.hasCommonBeehiveYard}
          />

          {formData.hasCommonBeehiveYard === "yes" && (
            <Input
              label="6(b). Number of behives operated by cooperative society"
              type="number"
              value={formData.numberOfBeehives}
              onChange={(e) =>
                handleInputChange("numberOfBeehives", e.target.value)
              }
              placeholder="Enter number of beehives"
              error={errors.numberOfBeehives}
              required
            />
          )}

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              6(c). Type of Beehives are used for rearing bee by cooperative
            </h3>

            <RadioGroup
              options={beehiveTypeOptions}
              value={formData.beehiveTypes}
              onChange={(value) => handleInputChange("beehiveTypes", value)}
              name="beehiveTypes"
              error={errors.beehiveTypes}
            />
          </div>

          <RadioGroup
            label="6(d). Whether the rearing of bees is done by promoter themselves?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.membersDoRearing}
            onChange={(value) => handleInputChange("membersDoRearing", value)}
            name="membersDoRearing"
            required
            error={errors.membersDoRearing}
          />

          {formData.membersDoRearing === "yes" && (
            <RadioGroup
              label="6(d)(1). Whether the regular guidance/training is provided by cooperative society to promoters?"
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              value={formData.providesGuidanceTraining}
              onChange={(value) =>
                handleInputChange("providesGuidanceTraining", value)
              }
              name="providesGuidanceTraining"
              required
              error={errors.providesGuidanceTraining}
            />
          )}
        </div>
      </Card>

      {/* Bee Farming Products Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          7. Bee Farming Products
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              7(a). Type of products of bee farming
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {beeFarmingProductOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    checked={formData.beeFarmingProducts.includes(option.value)}
                    onChange={() => handleBeeFarmingProductChange(option.value)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
            {errors.beeFarmingProducts && (
              <p className="text-sm text-red-500 mt-1">
                {errors.beeFarmingProducts}
              </p>
            )}
          </div>

          <RadioGroup
            label="7(b). Whether the Honey Bee Plants/Flowers are grown by cooperative society?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.growsBeePlants}
            onChange={(value) => handleInputChange("growsBeePlants", value)}
            name="growsBeePlants"
            required
            error={errors.growsBeePlants}
          />
        </div>
      </Card>

      {/* Facilities Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          8. Facilities
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="8(a). Whether the cleaning, processing & packaging facility is available with cooperative society"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.hasCleaningProcessing}
            onChange={(value) =>
              handleInputChange("hasCleaningProcessing", value)
            }
            name="hasCleaningProcessing"
            required
            error={errors.hasCleaningProcessing}
          />

          <RadioGroup
            label="8(b). Whether the waste management facility is available in the cooperative society?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.hasWasteManagement}
            onChange={(value) => handleInputChange("hasWasteManagement", value)}
            name="hasWasteManagement"
            required
            error={errors.hasWasteManagement}
          />

          <RadioGroup
            label="8(c). Whether the Cooperative society has its own Brand for Honey Products?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.hasOwnBrand}
            onChange={(value) => handleInputChange("hasOwnBrand", value)}
            name="hasOwnBrand"
            required
            error={errors.hasOwnBrand}
          />
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
            required
            error={errors.operatesRetailShops}
          />

          {formData.operatesRetailShops === "yes" && (
            <Input
              label="9(b). Number of retail shops/outlets operated by the cooperative society"
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
            label="9(c). Whether the product sale is outside the operational area?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.isProductSaleOut}
            onChange={(value) => handleInputChange("isProductSaleOut", value)}
            name="isProductSaleOut"
            required
            error={errors.isProductSaleOut}
          />

          <RadioGroup
            label="9(d). Do not have basic amenities"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.facilities}
            onChange={(value) => handleInputChange("facilities", value)}
            name="facilities"
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

export default CooperativeRegistrationsBee;
