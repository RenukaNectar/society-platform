import React, { useState } from "react";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { RadioGroup } from "../../components/ui/RadioGroup";
import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

interface FormData {
  // Basic Details
  societyName: string;
  sectorOfOperation: string;
  primaryActivity: string;
  registrationAuthority: string;
  registrationNumber: string;
  dateOfRegistration: string;
  functionalStatus: string;

  // Location Details - Urban
  urbanLocation: string;
  urbanState: string;
  urbanDistrict: string;
  urbanLocalBodyCategory: string;
  urbanLocalBody: string;
  urbanLocality: string;
  urbanPinCode: string;
  urbanAddress: string;

  // Location Details - Rural
  ruralLocation: string;
  ruralState: string;
  ruralDistrict: string;
  ruralBlock: string;
  ruralGramPanchayat: string;
  ruralVillage: string;
  ruralPinCode: string;
  ruralAddress: string;

  // Contact Details
  contactName: string;
  contactDesignation: string;
  mobileNumber: string;
  landlineNumber: string;
  emailId: string;

  // Sector Details
  operationAreaLocation: string;
  urbanAreaOfOperation: string;
  urbanDistrictOp: string;
  urbanLocalBodyCategoryOp: string;
  urbanLocalBodyOp: string;
  urbanLocalityOp: string;
  ruralAreaOfOperation: string;
  ruralDistrictOp: string;
  ruralBlockOp: string;
  ruralGramPanchayatOp: string;
  ruralVillageOp: string;
  waterBodyAdjacent: string;
  waterBodyType: string;
  affiliatedToUnion: string;
  unionLevel: string;
  unionName: string;

  // Member Details
  financialAuditDone: string;
  latestAuditYear: string;
  auditCategory: string;
  profitMaking: string;
  netProfit: string;
  netLoss: string;
  dividendPaid: string;
  dividendRate: string;
  bankType: string;
  bankName: string;

  // Secondary Activities and Office Building
  secondaryActivities: string[];
  hasOfficeBuilding: string;
  officeBuildingType: string;

  // Share Capital
  authorizedShareCapital: string;
  membersShareCapital: string;
  governmentShareCapital: string;
  totalShareCapital: string;
  totalDeposit: string;
  // Annual Turnover and Storage
  annualTurnover: string;
  hasStorage: string;
  storageCapacity: string;

  // Raw Material and Training
  providesRawMaterial: string;
  providesGuidance: string;

  // Retail Operations
  operatesRetailShops: string;
  numberOfRetailShops: string;
  sellsOutsideArea: string;

  // Facilities
  facilities: string[];
}

const CooperativeRegistrationsMulti = ({
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
    societyName: data?.societyName || "",
    sectorOfOperation: data?.sectorOfOperation || "",
    primaryActivity: data?.primaryActivity || "",
    registrationAuthority: data?.registrationAuthority || "",
    registrationNumber: data?.registrationNumber || "",
    dateOfRegistration: data?.dateOfRegistration || "",
    functionalStatus: data?.functionalStatus || "",
    urbanLocation: data?.urbanLocation || "",
    urbanState: data?.urbanState || "",
    urbanDistrict: data?.urbanDistrict || "",
    urbanLocalBodyCategory: data?.urbanLocalBodyCategory || "",
    urbanLocalBody: data?.urbanLocalBody || "",
    urbanLocality: data?.urbanLocality || "",
    urbanPinCode: data?.urbanPinCode || "",
    urbanAddress: data?.urbanAddress || "",
    ruralLocation: data?.ruralLocation || "",
    ruralState: data?.ruralState || "",
    ruralDistrict: data?.ruralDistrict || "",
    ruralBlock: data?.ruralBlock || "",
    ruralGramPanchayat: data?.ruralGramPanchayat || "",
    ruralVillage: data?.ruralVillage || "",
    ruralPinCode: data?.ruralPinCode || "",
    ruralAddress: data?.ruralAddress || "",
    contactName: data?.contactName || "",
    contactDesignation: data?.contactDesignation || "",
    mobileNumber: data?.mobileNumber || "",
    landlineNumber: data?.landlineNumber || "",
    emailId: data?.emailId || "",
    operationAreaLocation: data?.operationAreaLocation || "",
    urbanAreaOfOperation: data?.urbanAreaOfOperation || "",
    urbanDistrictOp: data?.urbanDistrictOp || "",
    urbanLocalBodyCategoryOp: data?.urbanLocalBodyCategoryOp || "",
    urbanLocalBodyOp: data?.urbanLocalBodyOp || "",
    urbanLocalityOp: data?.urbanLocalityOp || "",
    ruralAreaOfOperation: data?.ruralAreaOfOperation || "",
    ruralDistrictOp: data?.ruralDistrictOp || "",
    ruralBlockOp: data?.ruralBlockOp || "",
    ruralGramPanchayatOp: data?.ruralGramPanchayatOp || "",
    ruralVillageOp: data?.ruralVillageOp || "",
    waterBodyAdjacent: data?.waterBodyAdjacent || "",
    waterBodyType: data?.waterBodyType || "",
    affiliatedToUnion: data?.affiliatedToUnion || "",
    unionLevel: data?.unionLevel || "",
    unionName: data?.unionName || "",
    financialAuditDone: data?.financialAuditDone || "",
    latestAuditYear: data?.latestAuditYear || "",
    auditCategory: data?.auditCategory || "",
    profitMaking: data?.profitMaking || "",
    netProfit: data?.netProfit || "",
    netLoss: data?.netLoss || "",
    dividendPaid: data?.dividendPaid || "",
    dividendRate: data?.dividendRate || "",
    bankType: data?.bankType || "",
    bankName: data?.bankName || "",
    secondaryActivities: data?.secondaryActivities
      ? data.secondaryActivities.split(",")
      : [],
    hasOfficeBuilding: data?.hasOfficeBuilding || "",
    officeBuildingType: data?.officeBuildingType || "",
    authorizedShareCapital: data?.authorizedShareCapital || "",
    membersShareCapital: data?.membersShareCapital || "",
    governmentShareCapital: data?.governmentShareCapital || "",
    totalShareCapital: data?.totalShareCapital || "",
    annualTurnover: data?.annualTurnover || "",
    hasStorage: data?.hasStorage || "",
    storageCapacity: data?.storageCapacity || "",
    providesRawMaterial: data?.providesRawMaterial || "",
    providesGuidance: data?.providesGuidance || "",
    operatesRetailShops: data?.operatesRetailShops || "",
    numberOfRetailShops: data?.numberOfRetailShops || "",
    sellsOutsideArea: data?.sellsOutsideArea || "",
    facilities: data?.facilities ? data.facilities.split(",") : [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // const sectorOptions = [
  //   { value: "non_credit", label: "Non Credit" },
  //   { value: "credit", label: "Credit" },
  // ];

  const secondaryActivityOptions = [
    { value: "1", label: "PACS" },
    { value: "2", label: "Credit & Thrift (other than PACS)" },
    { value: "3", label: "Agriculture & Allied" },
    { value: "4", label: "Dairy" },
    { value: "7", label: "Fisheries & Allied" },
    { value: "8", label: "Sugar" },
    { value: "9", label: "Housing" },
    { value: "10", label: "Marketing" },
    { value: "11", label: "Consumer" },
    { value: "12", label: "Labour" },
    { value: "13", label: "Handloom & Weaver" },
    { value: "20", label: "Handicraft" },
    { value: "21", label: "Women" },
    { value: "22", label: "SC / Tribal" },
    { value: "23", label: "Jute & Coir" },
    { value: "24", label: "Transport" },
    { value: "25", label: "Retail Trade" },
    { value: "26", label: "Processing / Industrial" },
    { value: "27", label: "Livestock & Poultry" },
    { value: "28", label: "Tourism" },
    { value: "29", label: "Sericulture" },
    { value: "30", label: "Social Welfare" },
    { value: "31", label: "Information Technology" },
    { value: "32", label: "Education & Trainings" },
  ];

  // const primaryActivityOptions = [
  //   { value: "1", label: "Multipurpose cooperative" },
  //   { value: "2", label: "Agriculture" },
  //   { value: "3", label: "Dairy" },
  //   { value: "4", label: "Fishery" },
  //   { value: "5", label: "Handloom" },
  //   { value: "6", label: "Other" },
  // ];
  // const functionalStatusOptions = [
  //   { value: "functional", label: "Functional" },
  //   { value: "non_functional", label: "Non-functional" },
  //   { value: "under_liquidation", label: "Under liquidation" },
  // ];

  // const operationAreaOptions = [
  //   { value: "urban", label: "Urban" },
  //   { value: "rural", label: "Rural" },
  //   { value: "both", label: "Both" },
  // ];

  const officeBuildingTypes = [
    { value: "1", label: "Own Building" },
    { value: "2", label: "Rented Building" },
    { value: "3", label: "Rent Free Building" },
    { value: "4", label: "Leased Building" },
    { value: "5", label: "Building Provided By Govt" },
  ];
  const facilitiesOptions = [
    { value: "1", label: "Do not have basic amenities" },
    { value: "54", label: "LPG Distribution" },
    { value: "55", label: "PDS Shop" },
    { value: "56", label: "Business Correspondence" },
  ];

  // const bankTypes = [
  //   { value: "public_sector", label: "Public Sector Bank" },
  //   { value: "private_sector", label: "Private Sector Bank" },
  //   { value: "cooperative", label: "Cooperative Bank" },
  //   { value: "regional_rural", label: "Regional Rural Bank" },
  //   { value: "foreign", label: "Foreign Bank" },
  // ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSecondaryActivityChange = (value: string) => {
    setFormData((prev) => {
      const exists = prev.secondaryActivities.includes(value);

      const updated = exists
        ? prev.secondaryActivities.filter((v) => v !== value)
        : [...prev.secondaryActivities, value];

      return { ...prev, secondaryActivities: updated };
    });

    if (errors.secondaryActivities) {
      setErrors((prev) => ({ ...prev, secondaryActivities: "" }));
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

  const calculateTotalShareCapital = (memberVal: string, govtVal: string) => {
    const members = Number(memberVal) || 0;
    const government = Number(govtVal) || 0;
    const total = members + government;

    handleInputChange("totalShareCapital", total.toString());
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Basic validation for required fields
    // if (!formData.societyName)
    //   newErrors.societyName = "Society name is required";
    // if (!formData.sectorOfOperation)
    //   newErrors.sectorOfOperation = "Sector of operation is required";
    // if (!formData.primaryActivity)
    //   newErrors.primaryActivity = "Primary activity is required";
    // if (!formData.registrationAuthority)
    //   newErrors.registrationAuthority = "Registration authority is required";
    // if (!formData.registrationNumber)
    //   newErrors.registrationNumber = "Registration number is required";
    // if (!formData.dateOfRegistration)
    //   newErrors.dateOfRegistration = "Date of registration is required";
    // if (!formData.functionalStatus)
    //   newErrors.functionalStatus = "Functional status is required";
    // if (!formData.contactName)
    //   newErrors.contactName = "Contact name is required";
    // if (!formData.mobileNumber)
    //   newErrors.mobileNumber = "Mobile number is required";
    // if (!formData.emailId) newErrors.emailId = "Email ID is required";
    // if (!formData.operationAreaLocation)
    //   newErrors.operationAreaLocation = "Operation area location is required";
    if (formData.secondaryActivities.length === 0) {
      newErrors.secondaryActivities =
        "Please select at least one secondary activity";
    }
    if (!formData.totalDeposit)
      newErrors.totalDeposit = "Total deposit is require";

    // Conditional validation for office building
    if (!formData.hasOfficeBuilding)
      newErrors.hasOfficeBuilding =
        "Please specify if society has office building";
    if (formData.hasOfficeBuilding === "1" && !formData.officeBuildingType) {
      newErrors.officeBuildingType = "Office building type is required";
    }
    if (!formData.hasStorage)
      newErrors.hasStorage = "Storage/GODOWN/Warehouse is required";
    if (formData.hasStorage === "1" && !formData.storageCapacity) {
      newErrors.storageCapacity = "Storage capacity is required";
    }
    if (!formData.operatesRetailShops)
      newErrors.operatesRetailShops = "Retail shops is required";
    if (!formData.providesRawMaterial)
      newErrors.providesRawMaterial = "Raw material is required";
    if (formData.operatesRetailShops === "1" && !formData.numberOfRetailShops) {
      newErrors.numberOfRetailShops = "Number of retail shops is required";
    }
    if (!formData.sellsOutsideArea)
      newErrors.sellsOutsideArea = "Sale out is required";

    // Financial validation
    // if (!formData.authorizedShareCapital)
    //   newErrors.authorizedShareCapital = "Authorized share capital is required";
    // if (!formData.membersShareCapital)
    //   newErrors.membersShareCapital = "Promoters share capital is required";
    // if (!formData.governmentShareCapital)
    //   newErrors.governmentShareCapital = "Government share capital is required";
    // if (!formData.annualTurnover)
    //   newErrors.annualTurnover = "Annual turnover is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const transformToApiPayload = () => {
    const hasBuilding = Number(formData.hasOfficeBuilding);

    const buildingType =
      hasBuilding === 1
        ? officeBuildingTypes.findIndex(
            (b) => b.value === formData.officeBuildingType,
          ) + 1
        : null;

    const paidUpMembers = Number(formData.membersShareCapital);
    const paidUpGovt = Number(formData.governmentShareCapital);

    return {
      CooperativeRegistrationsMulti: [
        {
          sec_activity: formData.secondaryActivities.join(",") || null,

          has_building: hasBuilding || null,
          building_type: buildingType || null,

          authorised_share: Number(formData.authorizedShareCapital) || null,

          paid_up_members: paidUpMembers || null,
          paid_up_government_bodies: paidUpGovt || null,
          paid_up_total: paidUpMembers + paidUpGovt || null,

          annual_turn_over: Number(formData.annualTurnover) || null,

          has_storage: Number(formData.hasStorage) || null,
          storage_capacity:
            formData.hasStorage === "1"
              ? Number(formData.storageCapacity)
              : null,

          provide_raw: Number(formData.providesRawMaterial) || null,
          guidance_by_member: Number(formData.providesGuidance) || null,

          is_operate_retail: Number(formData.operatesRetailShops) || null,
          no_of_retail:
            formData.operatesRetailShops === "1"
              ? Number(formData.numberOfRetailShops)
              : null,

          is_product_sale_out: Number(formData.sellsOutsideArea),

          facilities: formData.facilities.join(",") || null,
          total_deposit: Number(formData?.totalDeposit) || null,
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
      {/* Basic Details Section */}
      {/* <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          1. Basic Details
        </h2>

        <div className="space-y-6"> 
           <Input
            label="1(a). Name of Cooperative Society"
            value={formData.societyName}
            onChange={(e) => handleInputChange("societyName", e.target.value)}
            placeholder="Enter society name"
            error={errors.societyName}
            required
          /> 

          <Select
            label="1(b). Sector of Operation"
            value={formData.sectorOfOperation}
            onChange={(e) =>
              handleInputChange("sectorOfOperation", e.target.value)
            }
            placeholder="Select sector of operation"
            error={errors.sectorOfOperation}
            required
          >
            {sectorOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select> 

           <Select
            label="1(c). Primary activity"
            value={formData.primaryActivity}
            onChange={(e) =>
              handleInputChange("primaryActivity", e.target.value)
            }
            placeholder="Select primary activity"
            error={errors.primaryActivity}
            required
          >
            {primaryActivityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select> 

           <Input
            label="1(d). Registration Authority"
            value={formData.registrationAuthority}
            onChange={(e) =>
              handleInputChange("registrationAuthority", e.target.value)
            }
            placeholder="Enter registration authority"
            error={errors.registrationAuthority}
            required
          /> 

          <Input
            label="1(e). Registration Number"
            value={formData.registrationNumber}
            onChange={(e) =>
              handleInputChange("registrationNumber", e.target.value)
            }
            placeholder="Enter registration number"
            error={errors.registrationNumber}
            required
          /> 

          <Input
            label="1(f). Date of Registration"
            type="date"
            value={formData.dateOfRegistration}
            onChange={(e) =>
              handleInputChange("dateOfRegistration", e.target.value)
            }
            error={errors.dateOfRegistration}
            required
          /> 

           <Select
            label="1(g). Present Functional Status"
            value={formData.functionalStatus}
            onChange={(e) =>
              handleInputChange("functionalStatus", e.target.value)
            }
            placeholder="Select functional status"
            error={errors.functionalStatus}
            required
          >
            {functionalStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </Card>  */}

      {/* Location Details Section - Urban */}
      {/* <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          2. Location Details of Registered Office - Urban
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="2(a). Location of Registered Office"
            options={[
              { value: "urban", label: "Urban" },
              { value: "rural", label: "Rural" },
            ]}
            value={formData.urbanLocation}
            onChange={(value) => handleInputChange("urbanLocation", value)}
            name="urbanLocation"
          />

          <Input
            label="2(b). State / UT"
            value={formData.urbanState}
            onChange={(e) => handleInputChange("urbanState", e.target.value)}
            placeholder="Enter state or UT"
          />

          <Input
            label="2(c). District"
            value={formData.urbanDistrict}
            onChange={(e) => handleInputChange("urbanDistrict", e.target.value)}
            placeholder="Enter district"
          />

          <Input
            label="2(d). Category of Urban Local Body"
            value={formData.urbanLocalBodyCategory}
            onChange={(e) =>
              handleInputChange("urbanLocalBodyCategory", e.target.value)
            }
            placeholder="Enter category of urban local body"
          />

          <Input
            label="2(e). Urban Local Body"
            value={formData.urbanLocalBody}
            onChange={(e) =>
              handleInputChange("urbanLocalBody", e.target.value)
            }
            placeholder="Enter urban local body"
          />

          <Input
            label="2(f). Locality or Ward"
            value={formData.urbanLocality}
            onChange={(e) => handleInputChange("urbanLocality", e.target.value)}
            placeholder="Enter locality or ward"
          />

          <Input
            label="2(g). Pin Code"
            value={formData.urbanPinCode}
            onChange={(e) => handleInputChange("urbanPinCode", e.target.value)}
            placeholder="Enter pin code"
          />

          <Textarea
            label="2(h). Full Address"
            value={formData.urbanAddress}
            onChange={(e) => handleInputChange("urbanAddress", e.target.value)}
            placeholder="Enter full address"
            rows={3}
          />
        </div>
      </Card> */}

      {/* Location Details Section - Rural */}
      {/* <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          2. Location Details of Registered Office - Rural
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="2(a). Location of Registered Office"
            options={[
              { value: "urban", label: "Urban" },
              { value: "rural", label: "Rural" },
            ]}
            value={formData.ruralLocation}
            onChange={(value) => handleInputChange("ruralLocation", value)}
            name="ruralLocation"
          />

          <Input
            label="2(b). State / UT"
            value={formData.ruralState}
            onChange={(e) => handleInputChange("ruralState", e.target.value)}
            placeholder="Enter state or UT"
          />

          <Input
            label="2(c). District"
            value={formData.ruralDistrict}
            onChange={(e) => handleInputChange("ruralDistrict", e.target.value)}
            placeholder="Enter district"
          />

          <Input
            label="2(d). Block"
            value={formData.ruralBlock}
            onChange={(e) => handleInputChange("ruralBlock", e.target.value)}
            placeholder="Enter block"
          />

          <Input
            label="2(e). Gram Panchayat"
            value={formData.ruralGramPanchayat}
            onChange={(e) =>
              handleInputChange("ruralGramPanchayat", e.target.value)
            }
            placeholder="Enter gram panchayat"
          />

          <Input
            label="2(f). Village"
            value={formData.ruralVillage}
            onChange={(e) => handleInputChange("ruralVillage", e.target.value)}
            placeholder="Enter village"
          />

          <Input
            label="2(g). Pin Code"
            value={formData.ruralPinCode}
            onChange={(e) => handleInputChange("ruralPinCode", e.target.value)}
            placeholder="Enter pin code"
          />

          <Textarea
            label="2(h). Full Address"
            value={formData.ruralAddress}
            onChange={(e) => handleInputChange("ruralAddress", e.target.value)}
            placeholder="Enter full address"
            rows={3}
          />
        </div>
      </Card> */}

      {/* Contact Details Section */}
      {/* <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          3. Contact Details
        </h2>

        <div className="space-y-6">
          <Input
            label="3(a). Name"
            value={formData.contactName}
            onChange={(e) => handleInputChange("contactName", e.target.value)}
            placeholder="Enter contact name"
            error={errors.contactName}
            required
          />

          <Input
            label="3(b). Designation"
            value={formData.contactDesignation}
            onChange={(e) =>
              handleInputChange("contactDesignation", e.target.value)
            }
            placeholder="Enter designation"
          />

          <Input
            label="3(c). Mobile Number"
            value={formData.mobileNumber}
            onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
            placeholder="Enter mobile number"
            maxLength={10}
            error={errors.mobileNumber}
            required
          />

          <Input
            label="3(d). Landline Number"
            value={formData.landlineNumber}
            maxLength={15}
            onChange={(e) =>
              handleInputChange("landlineNumber", e.target.value)
            }
            placeholder="Enter landline number"
          />

          <Input
            label="3(e). Email ID"
            type="email"
            value={formData.emailId}
            onChange={(e) => handleInputChange("emailId", e.target.value)}
            placeholder="Enter email ID"
            error={errors.emailId}
            required
          />
        </div>
      </Card> */}

      {/* Sector Details Section */}
      {/* <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          4. Sector Details
        </h2>

        <div className="space-y-6">
          <Select
            label="4(a). Operation Area Location"
            value={formData.operationAreaLocation}
            onChange={(e) =>
              handleInputChange("operationAreaLocation", e.target.value)
            }
            placeholder="Select operation area location"
            error={errors.operationAreaLocation}
            required
          >
            {operationAreaOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          {formData.operationAreaLocation === "urban" && (
            <div className="space-y-4 ml-6">
              <Input
                label="4(b)(i). Area of Operation Urban"
                value={formData.urbanAreaOfOperation}
                onChange={(e) =>
                  handleInputChange("urbanAreaOfOperation", e.target.value)
                }
                placeholder="Enter urban area of operation"
              />
              <Input
                label="4(c)(i). District"
                value={formData.urbanDistrictOp}
                onChange={(e) =>
                  handleInputChange("urbanDistrictOp", e.target.value)
                }
                placeholder="Enter district"
              />
              <Input
                label="4(c)(ii). Category of Urban Local Body"
                value={formData.urbanLocalBodyCategoryOp}
                onChange={(e) =>
                  handleInputChange("urbanLocalBodyCategoryOp", e.target.value)
                }
                placeholder="Enter category of urban local body"
              />
              <Input
                label="4(c)(iii). Urban Local Body"
                value={formData.urbanLocalBodyOp}
                onChange={(e) =>
                  handleInputChange("urbanLocalBodyOp", e.target.value)
                }
                placeholder="Enter urban local body"
              />
              <Input
                label="4(c)(iv). Locality or Ward"
                value={formData.urbanLocalityOp}
                onChange={(e) =>
                  handleInputChange("urbanLocalityOp", e.target.value)
                }
                placeholder="Enter locality or ward"
              />
            </div>
          )}

          {formData.operationAreaLocation === "rural" && (
            <div className="space-y-4 ml-6">
              <Input
                label="4(b)(i). Area of Operation Rural"
                value={formData.ruralAreaOfOperation}
                onChange={(e) =>
                  handleInputChange("ruralAreaOfOperation", e.target.value)
                }
                placeholder="Enter rural area of operation"
              />
              <Input
                label="4(c)(i). District"
                value={formData.ruralDistrictOp}
                onChange={(e) =>
                  handleInputChange("ruralDistrictOp", e.target.value)
                }
                placeholder="Enter district"
              />
              <Input
                label="4(c)(ii). Block"
                value={formData.ruralBlockOp}
                onChange={(e) =>
                  handleInputChange("ruralBlockOp", e.target.value)
                }
                placeholder="Enter block"
              />
              <Input
                label="4(c)(iii). Gram Panchayat"
                value={formData.ruralGramPanchayatOp}
                onChange={(e) =>
                  handleInputChange("ruralGramPanchayatOp", e.target.value)
                }
                placeholder="Enter gram panchayat"
              />
              <Input
                label="4(c)(iv). Village"
                value={formData.ruralVillageOp}
                onChange={(e) =>
                  handleInputChange("ruralVillageOp", e.target.value)
                }
                placeholder="Enter village"
              />
            </div>
          )}

          {formData.operationAreaLocation === "both" && (
            <div className="ml-6">
              <p className="text-gray-600 italic">
                Both above Urban and Rural showing
              </p>
            </div>
          )}

          <RadioGroup
            label="4(d). Whether Area of Operation (Village, Panchayat, Block or Mandal or Town, Taluka/ District) is adjacent to or includes water body?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.waterBodyAdjacent}
            onChange={(value) => handleInputChange("waterBodyAdjacent", value)}
            name="waterBodyAdjacent"
          />

          {formData.waterBodyAdjacent === "yes" && (
            <Input
              label="4(e). Type of water body"
              value={formData.waterBodyType}
              onChange={(e) =>
                handleInputChange("waterBodyType", e.target.value)
              }
              placeholder="Enter type of water body"
            />
          )}

          <RadioGroup
            label="4(f). Whether the Society is affiliated to Union/Federation"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.affiliatedToUnion}
            onChange={(value) => handleInputChange("affiliatedToUnion", value)}
            name="affiliatedToUnion"
          />

          {formData.affiliatedToUnion === "yes" && (
            <div className="space-y-4 ml-6">
              <Input
                label="4(g). Level of Affiliated Union/Federation"
                value={formData.unionLevel}
                onChange={(e) =>
                  handleInputChange("unionLevel", e.target.value)
                }
                placeholder="Enter union level"
              />
              <Input
                label="4(h). Name of Affiliated Union/Federation"
                value={formData.unionName}
                onChange={(e) => handleInputChange("unionName", e.target.value)}
                placeholder="Enter union name"
              />
            </div>
          )}
        </div>
      </Card> */}

      {/* Member Details Section */}
      {/* <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          5. Number of Members of the Cooperative Society (in caste and sex
          wise)
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="6(a). Whether Financial Audit has been done?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.financialAuditDone}
            onChange={(value) => handleInputChange("financialAuditDone", value)}
            name="financialAuditDone"
          />

          {formData.financialAuditDone === "yes" && (
            <div className="space-y-4 ml-6">
              <Input
                label="6(b). Year of Latest Audit Completed"
                value={formData.latestAuditYear}
                onChange={(e) =>
                  handleInputChange("latestAuditYear", e.target.value)
                }
                placeholder="Enter latest audit year"
              />
              <Input
                label="6(c). Category of Audit"
                value={formData.auditCategory}
                onChange={(e) =>
                  handleInputChange("auditCategory", e.target.value)
                }
                placeholder="Enter audit category"
              />
            </div>
          )}

          <RadioGroup
            label="7(a). Whether the Cooperative Society is profit making?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.profitMaking}
            onChange={(value) => handleInputChange("profitMaking", value)}
            name="profitMaking"
          />

          {formData.profitMaking === "yes" && (
            <Input
              label="7(b). Net Profit of the Cooperative Society"
              type="number"
              value={formData.netProfit}
              onChange={(e) => handleInputChange("netProfit", e.target.value)}
              placeholder="Enter net profit amount"
            />
          )}

          {formData.profitMaking === "no" && (
            <Input
              label="7(b). Net Loss of the Cooperative Society"
              type="number"
              value={formData.netLoss}
              onChange={(e) => handleInputChange("netLoss", e.target.value)}
              placeholder="Enter net loss amount"
            />
          )}

          <RadioGroup
            label="8(a). Whether the dividend is paid by the Cooperative Society?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.dividendPaid}
            onChange={(value) => handleInputChange("dividendPaid", value)}
            name="dividendPaid"
          />

          {formData.dividendPaid === "yes" && (
            <Input
              label="8(b). Dividend Rate Paid by the Cooperative Society (in %)"
              type="number"
              value={formData.dividendRate}
              onChange={(e) =>
                handleInputChange("dividendRate", e.target.value)
              }
              placeholder="Enter dividend rate percentage"
              step="0.01"
            />
          )}

          <Select
            label="9(a). Select the type of bank where the cooperative society have a bank account?"
            value={formData.bankType}
            onChange={(e) => handleInputChange("bankType", e.target.value)}
            placeholder="Select bank type"
          >
            {bankTypes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Input
            label="9(b). Select bank name where the cooperative society has its bank account: -"
            value={formData.bankName}
            onChange={(e) => handleInputChange("bankName", e.target.value)}
            placeholder="Enter bank name"
          />
        </div>
      </Card> */}

      {/* Secondary Activities and Office Building Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          1. Secondary Activities and Office Building
        </h2>

        <div className="space-y-6">
          {/* <Textarea
            label="10(a). Secondary Activities"
            value={formData.secondaryActivities}
            onChange={(e) =>
              handleInputChange("secondaryActivities", e.target.value)
            }
            placeholder="Enter secondary activities"
            rows={3}
          /> */}
          <div>
            <h3 className="text-lg font-medium mb-4">
              1(a). Secondary Activities
            </h3>

            <div>
              <div className="grid grid-cols-2 gap-3">
                {secondaryActivityOptions.map((item) => (
                  <label key={item.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      value={item.value}
                      checked={formData.secondaryActivities.includes(
                        item.value,
                      )}
                      onChange={() => handleSecondaryActivityChange(item.value)}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>

              {errors.secondaryActivities && (
                <p className="text-red-500 text-sm mt-2">
                  {errors.secondaryActivities}
                </p>
              )}
            </div>
          </div>
          <RadioGroup
            label="1(b). Whether the co-operative society has an office building"
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
                1(b)(i). Type of Office Building
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

      {/* Share Capital Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          2. Share Capital
        </h2>

        <div className="space-y-6">
          <Input
            label="2(a) I. Authorised Share Capital (in Rs)"
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
            label="2(a) II. Total Deposit (in Rs)"
            type="number"
            value={formData.totalDeposit}
            placeholder="Enter total deposit amount"
            onChange={(e) => handleInputChange("totalDeposit", e.target.value)}
            error={errors.totalDeposit}
            required
          />
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              3(a). Paid up Share Capital by different Entity
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
                      Members
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Input
                        type="number"
                        value={formData.membersShareCapital}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleInputChange("membersShareCapital", value);
                          calculateTotalShareCapital(
                            value,
                            formData.governmentShareCapital,
                          );
                        }}
                        placeholder="Enter members share capital amount"
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
                          const value = e.target.value;
                          handleInputChange("governmentShareCapital", value);
                          calculateTotalShareCapital(
                            formData.membersShareCapital,
                            value,
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

      {/* Annual Turnover and Storage Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          4. Annual Turnover and Storage
        </h2>

        <div className="space-y-6">
          <Input
            label="4(a). Annual Turn Over of the Cooperative Society (in Rs)"
            type="number"
            value={formData.annualTurnover}
            onChange={(e) =>
              handleInputChange("annualTurnover", e.target.value)
            }
            placeholder="Enter annual turnover amount"
            // error={errors.annualTurnover}
            // required
          />

          <RadioGroup
            label="4(b). Whether the Cooperative society has Storage/GODOWN/Warehouse ?"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            value={formData.hasStorage}
            onChange={(value) => handleInputChange("hasStorage", value)}
            error={errors.hasStorage}
            required
            name="hasStorage"
          />

          {formData.hasStorage === "1" && (
            <Input
              label="4(b)(i). Capacity of Storage/Godown/Warehouse operated by cooperative society (in MT)"
              type="number"
              value={formData.storageCapacity}
              onChange={(e) =>
                handleInputChange("storageCapacity", e.target.value)
              }
              placeholder="Enter storage capacity in MT"
              error={errors.storageCapacity}
              required
              step="0.01"
            />
          )}
        </div>
      </Card>

      {/* Raw Material and Training Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          5. Raw Material and Training
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="5(a). Whether the cooperative society provide raw material to members & produced take back from them for marketing?"
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
           
          />

          {formData.providesRawMaterial === "1" && (
            <RadioGroup
              label="5(a)(i). Whether the regular guidance/training is provided by cooperative society to members?"
              options={[
                { value: "1", label: "Yes" },
                { value: "0", label: "No" },
              ]}
              value={formData.providesGuidance}
              onChange={(value) => handleInputChange("providesGuidance", value)}
              name="providesGuidance"
              error={errors.providesGuidance}
            />
          )}
        </div>
      </Card>

      {/* Retail Operations Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          6. Retail Operations
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="6(a). Whether the cooperative society operate retail shops/outlet to sale their products?"
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
              label="6(a)(i). Number of retail shops/outlets operated by the cooperative society"
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
            label="6(b). Whether products of society are sale out of the area of operation of the cooperative society"
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
          11. Facilities
        </h2>

        <Textarea
          label="13. Facility provided by cooperative society?"
          value={formData.facilities}
          onChange={(e) => handleInputChange("facilities", e.target.value)}
          placeholder="Describe the facilities provided by the cooperative society"
          rows={4}
        />
      </Card> */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">11. Facilities</h2>

        <div className="grid grid-cols-2 gap-3">
          {facilitiesOptions.map((item) => (
            <label key={item.value} className="flex items-center gap-2">
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

export default CooperativeRegistrationsMulti;
