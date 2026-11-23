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

  // Land

  hasLand: string;
  landOwned: string;
  landLeased: string;
  landAllotted: string;

  // Warehouses
  hasWarehouses: string;
  hasCapacityWarehouses: string;

  // Share Capital
  authorizedShareCapital: string;
  membersShareCapital: string;
  governmentShareCapital: string;

  // Annual Financials
  annualTurnover: string;
  annualExpenses: string;
  totalDeposit: string;
  // Licensed Items
  licensedItems: string[];
  sellItems: string[];
}

const CooperativeRegistrationsMarketing = ({
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
    totalDeposit: data?.totalDeposit || "",
    hasOfficeBuilding: data?.hasOfficeBuilding || "",
    officeBuildingType: data?.officeBuildingType || "",
    hasLand: data?.hasLand || "",
    landOwned: data?.landOwned || "",
    landLeased: data?.landLeased || "",
    landAllotted: data?.landAllotted || "",
    hasWarehouses: data?.hasWarehouses || "",
    hasCapacityWarehouses: data?.hasCapacityWarehouses || "",
    authorizedShareCapital: data?.authorizedShareCapital || "",
    membersShareCapital: data?.membersShareCapital || "",
    governmentShareCapital: data?.governmentShareCapital || "",
    annualTurnover: data?.annualTurnover || "",
    annualExpenses: data?.annualExpenses || "",
    licensedItems: data?.licensedItems ? data.licensedItems.split(",") : [],
    sellItems: data?.sellItems ? data.sellItems.split(",") : [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const licenseOptions = [
    { value: "1", label: "Seeds" },
    { value: "2", label: "Food grains Procurement on MSP" },
    { value: "3", label: "PDS Shop" },
    { value: "4", label: "Fertilizer" },
    { value: "5", label: "Pesticide" },
    { value: "6", label: "Agricultural Equipment on Rent" },
  ];
  const officeBuildingTypes = [
    { value: "1", label: "Own Building" },
    { value: "2", label: "Rented Building" },
    { value: "3", label: "Rent Free Building" },
    { value: "4", label: "Leased Building" },
    { value: "5", label: "Building Provided By Govt" },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.hasOfficeBuilding)
      newErrors.hasOfficeBuilding =
        "Please specify if society has office building";
    if (formData.hasOfficeBuilding === "1" && !formData.officeBuildingType) {
      newErrors.officeBuildingType = "Office building type is required";
    }
    if (!formData.hasLand)
      newErrors.hasLand = "Please specify if society has land";
    if (!formData.hasWarehouses)
      newErrors.hasWarehouses = "Please specify if society has warehouses";
    if (!formData.hasCapacityWarehouses)
      newErrors.hasCapacityWarehouses =
        " Please specify the capacity of the warehouse";
    if (!formData.totalDeposit)
      newErrors.totalDeposit = "Please specify the total deposit";
    // if (!formData.authorizedShareCapital)
    //   newErrors.authorizedShareCapital = "Authorized share capital is required";
    // if (!formData.membersShareCapital)
    //   newErrors.membersShareCapital = "Promoters share capital is required";
    // if (!formData.governmentShareCapital)
    //   newErrors.governmentShareCapital = "Government share capital is required";
    // if (!formData.annualTurnover)
    //   newErrors.annualTurnover = "Annual turnover is required";
    // if (!formData.annualExpenses)
    //   newErrors.annualExpenses = "Annual expenses is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const transformToApiPayload = () => {
    const selectedLicenses = formData.licensedItems.join(",");
    const selectedSell = formData.sellItems.join(",");

    const members = Number(formData.membersShareCapital);
    const govt = Number(formData.governmentShareCapital);

    // Map licensed items → backend codes
    // const licenseMap: Record<string, number> = {
    //   seeds: 1,
    //   foodGrainsProcurement: 2,
    //   pdsShop: 3,
    //   fertilizer: 4,
    //   pesticide: 5,
    //   agriculturalEquipment: 6,
    // };

    return {
      CooperativeRegistrationsMarketing: [
        {
          has_building: Number(formData.hasOfficeBuilding) || null,
          total_deposit: Number(formData.totalDeposit) || null,
          building_type:
            formData.hasOfficeBuilding === "1"
              ? officeBuildingTypes.findIndex(
                  (o) => o.value === formData.officeBuildingType,
                ) + 1
              : null,

          has_land: Number(formData.hasLand) || null,

          has_warehouses: Number(formData.hasWarehouses) || null,

          // backend expects number even if UI doesn’t capture it
          capacity_warehouses: formData.hasCapacityWarehouses || null,

          authorised_share: Number(formData.authorizedShareCapital) || null,

          paid_up_members: members || null,

          paid_up_government_bodies: govt || null,

          paid_up_total: members + govt || null,

          annual_turn_over: Number(formData.annualTurnover) || null,

          annual_expenses: Number(formData.annualExpenses) || null,

          land_owned: Number(formData.landOwned) || null,
          land_leased: Number(formData.landLeased) || null,
          land_allotted: Number(formData.landAllotted) || null,

          liecense_to_sell: selectedLicenses || null,
          sell_the_item: selectedSell || null,
        },
      ],
    };
  };
  const handleLicenseChange = (value: string) => {
    setFormData((prev) => {
      const exists = prev.licensedItems.includes(value);

      return {
        ...prev,
        licensedItems: exists
          ? prev.licensedItems.filter((v) => v !== value)
          : [...prev.licensedItems, value],
      };
    });
  };

  const handleSellChange = (value: string) => {
    setFormData((prev) => {
      const exists = prev.sellItems.includes(value);

      return {
        ...prev,
        sellItems: exists
          ? prev.sellItems.filter((v) => v !== value)
          : [...prev.sellItems, value],
      };
    });
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
            label="1(a). Whether the co-operative society has an office building?"
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

      {/* Land Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">2. Land</h2>

        <RadioGroup
          label="2(a). Whether the co-operative society has land"
          options={[
            { value: "1", label: "Yes" },
            { value: "0", label: "No" },
          ]}
          value={formData.hasLand}
          onChange={(value) => handleInputChange("hasLand", value)}
          name="hasLand"
          error={errors.hasLand}
          required
        />

        {formData.hasLand === "1" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Input
              label="Land Owned (in Acre)"
              placeholder="Enter land owned"
              type="number"
              step="0.01"
              value={formData.landOwned}
              onChange={(e) => handleInputChange("landOwned", e.target.value)}
            />

            <Input
              label="Land Leased (in Acre)"
              placeholder="Enter land leased"
              type="number"
              step="0.01"
              value={formData.landLeased}
              onChange={(e) => handleInputChange("landLeased", e.target.value)}
            />

            <Input
              label="Land Allotted (in Acre)"
              placeholder="Enter land alloted"
              type="number"
              step="0.01"
              value={formData.landAllotted}
              onChange={(e) =>
                handleInputChange("landAllotted", e.target.value)
              }
            />
          </div>
        )}
      </Card>

      {/* Warehouses Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          3. Warehouses
        </h2>

        <div className="mb-4">
          <RadioGroup
            label="3(a). Does the co-operative society have warehouses or godowns?"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            value={formData.hasWarehouses}
            onChange={(value) => handleInputChange("hasWarehouses", value)}
            name="hasWarehouses"
            error={errors.hasWarehouses}
            required
          />
        </div>
        <Input
          label="3(b). Capacity of the society warehouse"
          type="number"
          value={formData.hasCapacityWarehouses}
          onChange={(e) =>
            handleInputChange("hasCapacityWarehouses", e.target.value)
          }
          placeholder="Enter the capacity of warehouse"
          error={errors.hasCapacityWarehouses}
          required
        />
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
          <Input
            label="Total Deposit (in Rs)"
            type="number"
            value={formData.totalDeposit}
            onChange={(e) => handleInputChange("totalDeposit", e.target.value)}
            placeholder="Enter total deposit"
            error={errors.totalDeposit}
            required
          />
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              4(b). Paid up Share Capital by different Entity
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

      {/* Annual Financials Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          5. Annual Financials
        </h2>

        <div className="space-y-6">
          <Input
            label="5(a). Annual Turn Over of the Cooperative Society (in Rs)"
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
            label="5(b). Annual Expenses of the Cooperative Society (in Rs)"
            type="number"
            value={formData.annualExpenses}
            onChange={(e) =>
              handleInputChange("annualExpenses", e.target.value)
            }
            placeholder="Enter annual expenses amount"
            // error={errors.annualExpenses}
            // required
          />
        </div>
      </Card>

      {/* Licensed Items Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          6. Licensed Items
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {licenseOptions.map((item) => (
            <label key={item.value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                value={item.value}
                checked={formData.licensedItems.includes(item.value)}
                onChange={() => handleLicenseChange(item.value)}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          7. Sell Items
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {licenseOptions.map((item) => (
            <label key={item.value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                value={item.value}
                checked={formData.sellItems.includes(item.value)}
                onChange={() => handleSellChange(item.value)}
              />
              <span>{item.label}</span>
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

export default CooperativeRegistrationsMarketing;
