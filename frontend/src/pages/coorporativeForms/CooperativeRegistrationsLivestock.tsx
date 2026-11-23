import React, { useState } from "react";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { RadioGroup } from "../../components/ui/RadioGroup";
// import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

interface FormData {
  // Livestock/Poultry Type
  livestockType: string;

  // Office Building
  hasOfficeBuilding: string;
  officeBuildingType: string;

  // Financial Information
  authorizedShareCapital: string;
  annualTurnover: string;
  totalDeposit: string;

  // Products

  typeProduce: string;
  // Livestock Facilities
  hasLivestockFarm: string;

  // Caretaking
  caretakingByMembers: string;
  providesGuidance: string;

  // Feed and Marketing
  providesFeed: string;
  collectsProducts: string;

  // Waste Management
  wasteManagementAvailable: string;

  // Retail Operations
  operatesRetailShops: string;
  numberOfRetailShops: string;
  sellsOutsideArea: string;

  // Facilities
  facilities: string[];
}

const CooperativeRegistrationsLivestock = ({
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
    typeProduce: data?.typeProduce || "",
    livestockType: data?.livestockType || "",
    hasOfficeBuilding: data?.hasOfficeBuilding || "",
    officeBuildingType: data?.officeBuildingType || "",
    authorizedShareCapital: data?.authorizedShareCapital || "",
    annualTurnover: data?.annualTurnover || "",
    totalDeposit: data?.totalDeposit || "",
    hasLivestockFarm: data?.hasLivestockFarm || "",
    caretakingByMembers: data?.caretakingByMembers || "",
    providesGuidance: data?.providesGuidance || "",
    providesFeed: data?.providesFeed || "",
    collectsProducts: data?.collectsProducts || "",
    wasteManagementAvailable: data?.wasteManagementAvailable || "",
    operatesRetailShops: data?.operatesRetailShops || "",
    numberOfRetailShops: data?.numberOfRetailShops || "",
    sellsOutsideArea: data?.sellsOutsideArea || "",
    facilities: data?.facilities ? data.facilities.split(",") : [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const facilitiesOptions = [
    { value: "1", label: "Do not have basic amenities" },

    { value: "44", label: "Business Correspondence" },
  ];
  const livestockTypes = [
    { value: "1", label: "Cattle(Buffalo/Cow/Oxen)" },
    { value: "2", label: "Sheep/Goat" },
    { value: "3", label: "Pig" },
    { value: "4", label: "Horse/Donkey/Mule" },
    { value: "5", label: "Camel" },
    { value: "6", label: "Chicken" },
    { value: "7", label: "Duck" },
    { value: "8", label: "Turkey" },
    { value: "9", label: "Geese" },
    { value: "10", label: "Pigeon" },
    { value: "11", label: "Other" },
  ];

  const officeBuildingTypes = [
    { value: "1", label: "Own Building" },
    { value: "2", label: "Rented Building" },
    { value: "3", label: "Rent Free Building" },
    { value: "4", label: "Leased Building" },
    { value: "5", label: "Building Provided By Govt" },
  ];

  const typeProduceOptions = [
    { value: "11", label: "Meat" },
    { value: "12", label: "Eggs" },
    { value: "13", label: "Milk" },
    { value: "14", label: "Cheese" },
    { value: "15", label: "Honey" },
    { value: "16", label: "Leather" },
    { value: "18", label: "Wool / Fur" },
    { value: "19", label: "Manure" },
    { value: "20", label: "Other Products" },
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

      return {
        ...prev,
        facilities: exists
          ? prev.facilities.filter((v) => v !== value)
          : [...prev.facilities, value],
      };
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // if (!formData.livestockType)
    //   newErrors.livestockType = "Please select livestock/poultry type";
    if (!formData.hasOfficeBuilding)
      newErrors.hasOfficeBuilding =
        "Please specify if society has office building";
    if (formData.hasOfficeBuilding === "1" && !formData.officeBuildingType) {
      newErrors.officeBuildingType = "Office building type is required";
    }
    // if (!formData.authorizedShareCapital)
    //   newErrors.authorizedShareCapital = "Authorized share capital is required";
    // if (!formData.annualTurnover)
    //   newErrors.annualTurnover = "Annual turnover is required";
    if (!formData.totalDeposit)
      newErrors.totalDeposit = "Total deposit is required";
    if (!formData.hasLivestockFarm)
      newErrors.hasLivestockFarm =
        "Please specify if society has livestock farm";
    if (!formData.caretakingByMembers)
      newErrors.caretakingByMembers =
        "Please specify if caretaking is done by promoters";
    if (formData.caretakingByMembers === "1" && !formData.providesGuidance) {
      newErrors.providesGuidance =
        "Please specify if guidance/training is provided";
    }
    if (!formData.providesFeed)
      newErrors.providesFeed = "Please specify if society provides feed";
    if (!formData.collectsProducts)
      newErrors.collectsProducts =
        "Please specify if products are collected from promoters";
    if (!formData.wasteManagementAvailable)
      newErrors.wasteManagementAvailable =
        "Please specify if waste management is available";
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
    return {
      CooperativeRegistrationsLivestock: [
        {
          type_society: formData.livestockType || null,

          has_building: Number(formData.hasOfficeBuilding) || null,

          building_type:
            formData.hasOfficeBuilding === "1"
              ? officeBuildingTypes.findIndex(
                  (o) => o.value === formData.officeBuildingType,
                ) + 1
              : null,

          authorised_share: Number(formData.authorizedShareCapital) || null,

          type_produce: formData.typeProduce || null,

          common_work_place: Number(formData.hasLivestockFarm) || null,

          is_work_by_member: Number(formData.caretakingByMembers) || null,

          is_training_provide: Number(formData.providesGuidance) || null,

          is_poultry_feed: Number(formData.providesFeed) || null,

          is_collected_from_member: Number(formData.collectsProducts) || null,

          is_waste_facility: Number(formData.wasteManagementAvailable) || null,

          no_of_retail:
            formData.operatesRetailShops === "yes"
              ? Number(formData.numberOfRetailShops)
              : null,

          is_product_sale_out: Number(formData.sellsOutsideArea) || null,

          facilities: formData.facilities.join(",") || null,
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
      {/* Livestock/Poultry Type Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          1. Livestock/Poultry Type
        </h2>

        <Select
          label="1(a). Type of Livestock/Poultry reared by the cooperative society"
          value={formData.livestockType}
          onChange={(e) => handleInputChange("livestockType", e.target.value)}
          placeholder="Select livestock/poultry type"
          // error={errors.livestockType}
          // required
        >
          {livestockTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
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
            label="Whether the co-operative society has an office building"
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
                2(a). Type of Office Building
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

      {/* Financial Information Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          3. Financial Information
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
            // error={errors.authorizedShareCapital}
            // required
          />

          <Input
            label="3(b). Annual Turn Over of the Cooperative Society (in Rs)"
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
            label="3(c). Total Deposit by Cooperative Society (in Rs)"
            type="number"
            value={formData.totalDeposit}
            onChange={(e) =>
              handleInputChange("totalDeposit", e.target.value)
            }
            placeholder="Enter total deposit amount"
            error={errors.totalDeposit}
            required
          />
        </div>
      </Card>

      {/* Products Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          4. Products Produced
        </h2>

        {/* <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            11(d). Type of product produced by cooperative society?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RadioGroup
              label="Meat"
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              value={formData.meat}
              onChange={(value) => handleInputChange("meat", value)}
              name="meat"
            />

            <RadioGroup
              label="Eggs"
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              value={formData.eggs}
              onChange={(value) => handleInputChange("eggs", value)}
              name="eggs"
            />

            <RadioGroup
              label="Milk"
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              value={formData.milk}
              onChange={(value) => handleInputChange("milk", value)}
              name="milk"
            />

            <RadioGroup
              label="Cheese"
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              value={formData.cheese}
              onChange={(value) => handleInputChange("cheese", value)}
              name="cheese"
            />

            <RadioGroup
              label="Honey"
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              value={formData.honey}
              onChange={(value) => handleInputChange("honey", value)}
              name="honey"
            />

            <RadioGroup
              label="Leather"
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              value={formData.leather}
              onChange={(value) => handleInputChange("leather", value)}
              name="leather"
            />

            <RadioGroup
              label="Wool/Fur"
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              value={formData.woolFur}
              onChange={(value) => handleInputChange("woolFur", value)}
              name="woolFur"
            />

            <RadioGroup
              label="Manure"
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              value={formData.manure}
              onChange={(value) => handleInputChange("manure", value)}
              name="manure"
            />

            <RadioGroup
              label="Other Products"
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              value={formData.otherProducts}
              onChange={(value) => handleInputChange("otherProducts", value)}
              name="otherProducts"
            />
          </div>
        </div> */}
        <Select
          label="4(a). Type of product produced by cooperative society"
          value={formData.typeProduce}
          onChange={(e) => handleInputChange("typeProduce", e.target.value)}
        >
          <option value="">Select product</option>

          {typeProduceOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
      </Card>

      {/* Livestock Farm Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          5. Livestock Farm
        </h2>

        <RadioGroup
          label="5(a). Whether the cooperative society has common Livestock Shade/poultry farm?"
          options={[
            { value: "1", label: "Yes" },
            { value: "0", label: "No" },
          ]}
          value={formData.hasLivestockFarm}
          onChange={(value) => handleInputChange("hasLivestockFarm", value)}
          name="hasLivestockFarm"
          error={errors.hasLivestockFarm}
          required
        />
      </Card>

      {/* Caretaking Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          6. Caretaking and Training
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="6(a). Whether the caretaking of livestock/poultry is done by member themselves?"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            value={formData.caretakingByMembers}
            onChange={(value) =>
              handleInputChange("caretakingByMembers", value)
            }
            name="caretakingByMembers"
            error={errors.caretakingByMembers}
            required          />

          {formData.caretakingByMembers === "1" && (
            <RadioGroup
              label="6(a)(i). Whether the regular guidance/training is provided by cooperative society to promoters?"
              options={[
                { value: "1", label: "Yes" },
                { value: "0", label: "No" },
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

      {/* Feed and Marketing Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          7. Feed and Marketing
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="7(a). Whether the cooperative society provide livestock/poultry feed to promoters?"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            value={formData.providesFeed}
            onChange={(value) => handleInputChange("providesFeed", value)}
            name="providesFeed"
            error={errors.providesFeed}
            required
          />

          <RadioGroup
            label="7(b). Whether livestock/poultry products are collected from promoters for marketing by cooperative society?"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            value={formData.collectsProducts}
            onChange={(value) => handleInputChange("collectsProducts", value)}
            name="collectsProducts"
            error={errors.collectsProducts}
            required
          />
        </div>
      </Card>

      {/* Waste Management Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          8. Waste Management
        </h2>

        <RadioGroup
          label="8(i). Whether the livestock/poultry waste management facility is available in the society?"
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
              label="9(a)(i). Number of retail shops/outlets operated by cooperative society?"
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
            label="9(b). Whether the products are sale out of the area of operation of the cooperative society?"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            value={formData.sellsOutsideArea}
            onChange={(value) => handleInputChange("sellsOutsideArea", value)}
            name="sellsOutsideArea"
            error={errors.sellsOutsideArea}
            required
          />
        </div>
      </Card>

      {/* Facilities Section */}
      {/* <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          10. Facilities
        </h2>

        <Textarea
          label="12. Facility provided by cooperative society?"
          value={formData.facilities}
          onChange={(e) => handleInputChange("facilities", e.target.value)}
          placeholder="Describe the facilities provided by the cooperative society"
          rows={4}
        />
      </Card> */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          10. Facilities
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {facilitiesOptions.map((item) => (
            <label key={item.value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                value={item.value}
                checked={formData.facilities.includes(item.value)}
                onChange={() => handleFacilityChange(item.value)}
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

export default CooperativeRegistrationsLivestock;
