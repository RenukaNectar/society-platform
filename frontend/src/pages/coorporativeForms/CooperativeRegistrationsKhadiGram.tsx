import React, { useState, useEffect } from "react";
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
  totalDeposit: string;
  packTotalOutstandingLoan: string;
  // Activities

  paidUpShareDate: string;
  // Products
  wantsToEnterProducts: string;
  products: Array<{
    itemName: string;
    numberOfProducts: string;
    unit: string;
    valueInRs: string;
    total: string;
  }>;

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

  // Machinery
  powerLooms: string;
  handlooms: string;
  otherMachines: string;

  // Operations
  membersOperateLooms: string;
  workDividedBySkill: string;
  numberOfLooms: string;
  providesRawMaterial: string;
  rawMaterialAvailable: string;
  wasteGenerated: string;
  wasteManagementAvailable: string;
  numberOfRetailShops: string;
  operatesRetailShops: string;
  productsSoldOutsideArea: string;
  type_of_activities_khadi_gram: string;
}

const CooperativeRegistrationsKhadiGram = ({
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

    type_of_activities_khadi_gram: data?.type_of_activities_khadi_gram || "",
    officeBuildingType: data?.officeBuildingType || "",
    totalDeposit: data?.totalDeposit || "",
    packTotalOutstandingLoan: data?.packTotalOutstandingLoan || "",

    wantsToEnterProducts: data?.wantsToEnterProducts || "",
    products: data?.products || [
      {
        itemName: "",
        numberOfProducts: "",
        unit: "",
        valueInRs: "",
        total: "",
      },
    ],
    individualMembers: data?.individualMembers || "",
    paidUpShareDate: data?.paidUpShareDate || "",
    institutionalMembers: data?.institutionalMembers || "",
    totalMembers: data?.totalMembers || "",
    authorizedShareCapital: data?.authorizedShareCapital || "",
    membersShareCapital: data?.membersShareCapital || "",
    governmentShareCapital: data?.governmentShareCapital || "",
    totalShareCapital: data?.totalShareCapital || "",
    annualTurnover: data?.annualTurnover || "",
    powerLooms: data?.powerLooms || "",
    handlooms: data?.handlooms || "",
    otherMachines: data?.otherMachines || "",
    membersOperateLooms: data?.membersOperateLooms || "",
    workDividedBySkill: data?.workDividedBySkill || "",
    numberOfLooms: data?.numberOfLooms || "",
    providesRawMaterial: data?.providesRawMaterial || "",
    rawMaterialAvailable: data?.rawMaterialAvailable || "",
    wasteGenerated: data?.wasteGenerated || "",
    wasteManagementAvailable: data?.wasteManagementAvailable || "",
    numberOfRetailShops: data?.numberOfRetailShops || "",
    operatesRetailShops: data?.operatesRetailShops || "",
    productsSoldOutsideArea: data?.productsSoldOutsideArea || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const officeBuildingTypes = [
    { value: "1", label: "Own Building" },
    { value: "2", label: "Rented Building" },
    { value: "3", label: "Rent Free Building" },
    { value: "4", label: "Leased Building" },
    { value: "5", label: "Building Provided By Govt" },
  ];

  const units = [
    { value: "pieces", label: "Pieces" },
    { value: "kg", label: "Kilograms (KG)" },
    { value: "meters", label: "Meters" },
    { value: "sq_meters", label: "Square Meters" },
    { value: "liters", label: "Liters" },
    { value: "pairs", label: "Pairs" },
    { value: "sets", label: "Sets" },
    { value: "bundles", label: "Bundles" },
    { value: "other", label: "Other" },
  ];

  const khadiActivityOptions = [
    { value: "1", label: "Khadi yarn" },
    { value: "2", label: "Khadi cloth" },
    { value: "3", label: "Khadi tools" },
    { value: "4", label: "Village industries for khadi" },
    { value: "5", label: "Other" },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleProductChange = (index: number, field: string, value: string) => {
    const newProducts = [...formData.products];
    newProducts[index] = { ...newProducts[index], [field]: value };

    // Calculate total for this product
    if (field === "numberOfProducts" || field === "valueInRs") {
      const numberOfProducts =
        parseInt(newProducts[index].numberOfProducts) || 0;
      const valueInRs = parseInt(newProducts[index].valueInRs) || 0;
      newProducts[index].total = (numberOfProducts * valueInRs).toString();
    }

    setFormData((prev) => ({ ...prev, products: newProducts }));
  };

  const addProduct = () => {
    setFormData((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        {
          itemName: "",
          numberOfProducts: "",
          unit: "",
          valueInRs: "",
          total: "",
        },
      ],
    }));
  };

  const removeProduct = (index: number) => {
    if (formData.products.length > 1) {
      const newProducts = formData.products.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, products: newProducts }));
    }
  };

  const toTwoDecimal = (value: string) => {
    const n = Number(value);
    if (isNaN(n) || n < 0) return 0;
    return Math.round(n * 100) / 100;
  };

  useEffect(() => {
    const members = toTwoDecimal(formData.membersShareCapital);
    const govt = toTwoDecimal(formData.governmentShareCapital);

    const total = members + govt;

    let formattedTotal = "";

    if (total > 0) {
      // show decimals ONLY if they exist
      formattedTotal = Number.isInteger(total)
        ? total.toString()
        : total.toFixed(2).replace(/\.?0+$/, "");
    }

    setFormData((prev) => ({
      ...prev,
      totalShareCapital: formattedTotal,
    }));
  }, [formData.membersShareCapital, formData.governmentShareCapital]);

  useEffect(() => {
    const individual = parseInt(formData.individualMembers, 10) || 0;
    const institutional = parseInt(formData.institutionalMembers, 10) || 0;

    const total = individual + institutional;

    setFormData((prev) => ({
      ...prev,
      totalMembers: total === 0 ? "" : total.toString(),
    }));
  }, [formData.individualMembers, formData.institutionalMembers]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.hasOfficeBuilding)
      newErrors.hasOfficeBuilding =
        "Please specify if society has office building";
    if (formData.hasOfficeBuilding === "1" && !formData.officeBuildingType) {
      newErrors.officeBuildingType = "Office building type is required";
    }

    if (!formData.wantsToEnterProducts)
      newErrors.wantsToEnterProducts =
        "Please specify if you want to enter products";
    if (formData.wantsToEnterProducts === "1") {
      formData.products.forEach((product, index) => {
        if (!product.itemName)
          newErrors[`product${index}ItemName`] =
            `Product ${index + 1} item name is required`;
        if (!product.numberOfProducts)
          newErrors[`product${index}NumberOfProducts`] =
            `Product ${index + 1} number is required`;
        if (!product.unit)
          newErrors[`product${index}Unit`] =
            `Product ${index + 1} unit is required`;
        if (!product.valueInRs)
          newErrors[`product${index}ValueInRs`] =
            `Product ${index + 1} value is required`;
      });
    }
    if (!formData.individualMembers)
      newErrors.individualMembers =
        "Number of individual promoters is required";
    if (!formData.institutionalMembers)
      newErrors.institutionalMembers =
        "Number of institutional promoters is required";
    // if (!formData.authorizedShareCapital)
    //   newErrors.authorizedShareCapital = "Authorized share capital is required";
    if (!formData.totalDeposit)
      newErrors.totalDeposit = "Total deposit is required";
    // if (!formData.membersShareCapital)
    //   newErrors.membersShareCapital = "Promoters share capital is required";
    // if (!formData.governmentShareCapital)
    //   newErrors.governmentShareCapital = "Government share capital is required";
    // if (!formData.annualTurnover)
    //   newErrors.annualTurnover = "Annual turnover is required";
    if (!formData.powerLooms) newErrors.powerLooms = "Powerlooms is required";
    if (!formData.handlooms) newErrors.handlooms = " Handlooms is required";
    if (!formData.otherMachines)
      newErrors.otherMachines = "Other machines is required";
    if (!formData.membersOperateLooms)
      newErrors.membersOperateLooms =
        "Please specify if promoters operate looms";
    if (formData.membersOperateLooms === "1") {
      if (!formData.workDividedBySkill)
        newErrors.workDividedBySkill =
          "Please specify if work is divided by skill";
      if (!formData.numberOfLooms)
        newErrors.numberOfLooms = "Number of looms is required";
    }
    if (!formData.providesRawMaterial)
      newErrors.providesRawMaterial =
        "Please specify if society provides raw material";
    if (!formData.rawMaterialAvailable)
      newErrors.rawMaterialAvailable =
        "Please specify if raw material is available";
    if (!formData.wasteGenerated)
      newErrors.wasteGenerated = "Please specify if waste is generated";
    if (formData.wasteGenerated === "1" && !formData.wasteManagementAvailable) {
      newErrors.wasteManagementAvailable =
        "Please specify if waste management is available";
    }
    if (!formData.operatesRetailShops)
      newErrors.operatesRetailShops =
        "Please specify if society operates retail shops";
    if (formData.operatesRetailShops === "1" && !formData.numberOfRetailShops) {
      newErrors.numberOfRetailShops = "Number of retail shops is required";
    }
    if (!formData.productsSoldOutsideArea)
      newErrors.productsSoldOutsideArea =
        "Please specify if products are sold outside area";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const transformToApiPayload = () => {
    const individualMember = Number(formData.individualMembers);
    const institutionalMember = Number(formData.institutionalMembers);
    const paidupMember = Number(formData.membersShareCapital);
    const paideupGovt = Number(formData.governmentShareCapital);

    return {
      CooperativeRegistrationsKhadiGram: [
        {
          total_deposit: Number(formData.totalDeposit) || null,

          pack_total_outstanding_loan:
            Number(formData.packTotalOutstandingLoan) || null,

          type_of_activities_khadi_gram:
            formData.type_of_activities_khadi_gram || null,

          has_building: Number(formData.hasOfficeBuilding) || null,

          building_type:
            formData.hasOfficeBuilding === "1"
              ? Number(formData.officeBuildingType)
              : null,

          do_you_want_to_enter_type_products_produced:
            Number(formData.wantsToEnterProducts) || null,

          individual_member: individualMember || null,
          institutional_member: institutionalMember || null,

          total_member: individualMember + institutionalMember || null,

          authorised_share: Number(formData.authorizedShareCapital) || null,
          paid_up_share_date: formData.paidUpShareDate || null,

          paid_up_members: paidupMember || null,
          paid_up_government_bodies: paideupGovt || null,

          paid_up_total: Number(formData.totalShareCapital) || null,

          annual_turn_over: Number(formData.annualTurnover) || null,

          power_loom_type: formData.powerLooms || null,
          hand_loom_type: formData.handlooms || null,
          hand_loom_other_type: formData.otherMachines || null,

          operated_member_themself:
            Number(formData.membersOperateLooms) || null,

          is_user_work_divide: Number(formData.workDividedBySkill) || null,

          no_of_loom: Number(formData.numberOfLooms) || null,

          raw_product_taken: Number(formData.providesRawMaterial) || null,

          raw_material_available: Number(formData.rawMaterialAvailable) || null,

          waste_generate: Number(formData.wasteGenerated) || null,

          waste_available: Number(formData.wasteManagementAvailable) || null,

          operate_retail: Number(formData.operatesRetailShops) || null,

          no_of_retail:
            formData.operatesRetailShops === "1"
              ? Number(formData.numberOfRetailShops)
              : null,

          product_sale_out: Number(formData.productsSoldOutsideArea) || null,
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
                10(b). Type of Office Building
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

      {/* Activities Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          2. Activities
        </h2>

        {/* <Textarea
          label="10(C). Type of activities by Khadi & Gram Udyog Society"
          value={formData.khadiGramActivities}
          onChange={(e) =>
            handleInputChange("khadiGramActivities", e.target.value)
          }
          placeholder="Describe the activities carried out by the Khadi & Gram Udyog Society"
          rows={4}
          error={errors.khadiGramActivities}
          required
        /> */}
        <Select
          label="2(a). Type of activities by Khadi & Gram Udyog Society"
          value={formData.type_of_activities_khadi_gram}
          onChange={(e) =>
            handleInputChange("type_of_activities_khadi_gram", e.target.value)
          }
        >
          <option value="">Select an activity</option>
          {khadiActivityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Card>

      {/* Products Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          3. Products
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="3(a). Do you want to Enter type of products Produced by the Society"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            value={formData.wantsToEnterProducts}
            onChange={(value) =>
              handleInputChange("wantsToEnterProducts", value)
            }
            name="wantsToEnterProducts"
            error={errors.wantsToEnterProducts}
          />

          {formData.wantsToEnterProducts === "1" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Product Details
              </h3>

              {formData.products.map((product, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="text-md font-medium text-gray-900">
                      Product {index + 1}
                    </h4>
                    {formData.products.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeProduct(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Item Name"
                      type="text"
                      value={product.itemName}
                      onChange={(e) =>
                        handleProductChange(index, "itemName", e.target.value)
                      }
                      placeholder="Enter item name"
                      error={errors[`product${index}ItemName`]}
                      required
                    />

                    <Input
                      label="Number of Product (annual)"
                      type="number"
                      value={product.numberOfProducts}
                      onChange={(e) =>
                        handleProductChange(
                          index,
                          "numberOfProducts",
                          e.target.value,
                        )
                      }
                      placeholder="Enter number of products"
                      error={errors[`product${index}NumberOfProducts`]}
                      required
                    />

                    <Select
                      label="Unit"
                      value={product.unit}
                      onChange={(e) =>
                        handleProductChange(index, "unit", e.target.value)
                      }
                      placeholder="Select unit"
                      error={errors[`product${index}Unit`]}
                      required
                    >
                      {units.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>

                    <Input
                      label="Value in Rs. (annual)"
                      type="number"
                      value={product.valueInRs}
                      onChange={(e) =>
                        handleProductChange(index, "valueInRs", e.target.value)
                      }
                      placeholder="Enter value in Rs"
                      error={errors[`product${index}ValueInRs`]}
                      required
                    />
                  </div>

                  <Input
                    label="Total"
                    type="number"
                    value={product.total}
                    placeholder="Auto-calculated"
                    disabled
                    className="bg-gray-100"
                  />
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addProduct}
                className="w-full"
              >
                + Add Another Product
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Member Details Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          4. Promoter Details
        </h2>

        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            4(a). Promoter Detail of Cooperative Society
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">
                    Type of Promoter
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left">
                    No. of Promoter
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">
                    Individual
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <Input
                      type="number"
                      inputMode="numeric"
                      step="1"
                      min="0"
                      value={formData.individualMembers}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        handleInputChange("individualMembers", value);
                      }}
                      placeholder="Enter number of individual promoters"
                      error={errors.individualMembers}
                      required
                      className="w-full"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">
                    Institutional
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <Input
                      type="number"
                      inputMode="numeric"
                      step="1"
                      min="0"
                      value={formData.institutionalMembers}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        handleInputChange("institutionalMembers", value);
                      }}
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
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          5. Share Capital
        </h2>

        <div className="space-y-6">
          <Input
            label="5(a) I. Authorised Share Capital (in Rs)"
            type="number"
            value={formData.authorizedShareCapital}
            onChange={(e) =>
              handleInputChange("authorizedShareCapital", e.target.value)
            }
            placeholder="Enter authorized share capital amount"
            // error={errors.authorizedShareCapital}
            // required
          />
          <Input
            label="5(a) II. Total Deposit (in Rs)"
            type="number"
            value={formData.totalDeposit}
            onChange={(e) => handleInputChange("totalDeposit", e.target.value)}
            placeholder="Enter total deposit"
            error={errors.totalDeposit}
            required
          />

          <Input
            label="5(a) III. Pack Total Outstanding Loan (in Rs)"
            type="number"
            value={formData.packTotalOutstandingLoan}
            onChange={(e) =>
              handleInputChange("packTotalOutstandingLoan", e.target.value)
            }
            placeholder="Enter outstanding loan"
          />
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              5(b). Paid up Share Capital by different Entity
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
                  <tr className="bg-gray-50 font-semibold">
                    <td className="border border-gray-300 px-4 py-2">
                      Date: Paid up share date
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Input
                        type="date"
                        value={formData.paidUpShareDate}
                        onChange={(e) =>
                          handleInputChange("paidUpShareDate", e.target.value)
                        }
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
          6. Annual Turnover
        </h2>

        <Input
          label="6(a). Annual Turn Over of the Cooperative Society (in Rs)"
          type="number"
          value={formData.annualTurnover}
          onChange={(e) => handleInputChange("annualTurnover", e.target.value)}
          placeholder="Enter annual turnover amount"
          // error={errors.annualTurnover}
          // required
        />
      </Card>

      {/* Machinery Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          7. Machinery
        </h2>

        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            7(a). Type of machine used by cooperative society:
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="Power Looms"
              type="text"
              value={formData.powerLooms}
              onChange={(e) => handleInputChange("powerLooms", e.target.value)}
              placeholder="Enter power looms"
              error={errors.powerLooms}
              required
            />

            <Input
              label="Handlooms"
              type="text"
              value={formData.handlooms}
              onChange={(e) => handleInputChange("handlooms", e.target.value)}
              placeholder="Enter handlooms"
              error={errors.handlooms}
              required
            />

            <Input
              label="Other"
              type="text"
              value={formData.otherMachines}
              onChange={(e) =>
                handleInputChange("otherMachines", e.target.value)
              }
              placeholder="Enter other machines"
              error={errors.otherMachines}
              required
            />
          </div>
        </div>
      </Card>

      {/* Operations Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          8. Operations
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="8(a). Whether the looms are operated by promoters themself?"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            value={formData.membersOperateLooms}
            onChange={(value) =>
              handleInputChange("membersOperateLooms", value)
            }
            name="membersOperateLooms"
            error={errors.membersOperateLooms}
            required
          />

          {formData.membersOperateLooms === "1" && (
            <div className="space-y-6">
              <RadioGroup
                label="8(a)(i). Whether the work is divided among the promoters as per their skill?"
                options={[
                  { value: "1", label: "Yes" },
                  { value: "0", label: "No" },
                ]}
                value={formData.workDividedBySkill}
                onChange={(value) =>
                  handleInputChange("workDividedBySkill", value)
                }
                name="workDividedBySkill"
                error={errors.workDividedBySkill}
                required
              />

              <Input
                label="8(b). Number of looms operated by cooperative society:"
                type="number"
                value={formData.numberOfLooms}
                onChange={(e) =>
                  handleInputChange("numberOfLooms", e.target.value)
                }
                placeholder="Enter number of looms"
                error={errors.numberOfLooms}
                required
              />
            </div>
          )}

          <RadioGroup
            label="8(c). Whether the cooperative society provide raw material to promoters & produced product taken after processing?"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
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
            label="8(d). Whether the raw material easily available to cooperative society?"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            value={formData.rawMaterialAvailable}
            onChange={(value) =>
              handleInputChange("rawMaterialAvailable", value)
            }
            name="rawMaterialAvailable"
            error={errors.rawMaterialAvailable}
            required
          />

          <RadioGroup
            label="8(e). Whether the wastes are generated in production process?"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            value={formData.wasteGenerated}
            onChange={(value) => handleInputChange("wasteGenerated", value)}
            name="wasteGenerated"
            error={errors.wasteGenerated}
            required
          />

          {formData.wasteGenerated === "1" && (
            <RadioGroup
              label="8(f). Whether the waste management facility is available in the society?"
              options={[
                { value: "1", label: "Yes" },
                { value: "0", label: "No" },
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

          <RadioGroup
            label="8(g). Whether the cooperative society operate retail shops/outlet to sale products?"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            value={formData.operatesRetailShops}
            onChange={(value) =>
              handleInputChange("operatesRetailShops", value)
            }
            name="operatesRetailShops"
            error={errors.operatesRetailShops}
            required
          />

          {formData.operatesRetailShops === "1" && (
            <Input
              label="8(g)(i). Number of retail shops/outlets operated by cooperative society:"
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
            label="8(h). Whether the products are sale out of area of operation of the cooperative society?"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            value={formData.productsSoldOutsideArea}
            onChange={(value) =>
              handleInputChange("productsSoldOutsideArea", value)
            }
            name="productsSoldOutsideArea"
            error={errors.productsSoldOutsideArea}
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

export default CooperativeRegistrationsKhadiGram;
