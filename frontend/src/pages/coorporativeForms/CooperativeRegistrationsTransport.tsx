import React, { useState } from "react";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { RadioGroup } from "../../components/ui/RadioGroup";
import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

interface FormData {
  // Transport Type
  transportType: string;

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
  totalDeposit: string;
  // Annual Turnover
  annualTurnover: string;

  // Vehicle Ownership
  vehicleOwnershipType: string;

  // Vehicle Details
  busCount: string;
  truckLorryCount: string;
  otherVehicles: string;

  // Travel Details - Passenger
  passengerVehicleDetails: string;

  // Travel Details - Freight
  freightVehicleDetails: string;

  // Vehicle Operations

  membersOperateVehicles: string;
  membersUseTransport: string;
}

const CooperativeRegistrationsTransport = ({
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
  console.log(data);
  const [formData, setFormData] = useState<FormData>({
    transportType: "",
    totalDeposit: "",
    hasOfficeBuilding: "",
    officeBuildingType: "",
    individualMembers: "",
    institutionalMembers: "",
    totalMembers: "",
    authorizedShareCapital: "",
    membersShareCapital: "",
    governmentShareCapital: "",
    totalShareCapital: "",
    annualTurnover: "",
    vehicleOwnershipType: "",
    busCount: "",
    truckLorryCount: "",
    otherVehicles: "",
    passengerVehicleDetails: "",
    freightVehicleDetails: "",
    membersOperateVehicles: "",
    membersUseTransport: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const transportTypes = [
    { value: "1", label: "Passenger Transport Cooperative Society" },
    { value: "2", label: "Goods Transport Cooperative Society" },
  ];

  const officeBuildingTypes = [
    { value: "1", label: "Own Building" },
    { value: "2", label: "Rented Building" },
    { value: "3", label: "Rent Free Building" },
    { value: "4", label: "Leased Building" },
    { value: "5", label: "Building Provided By Govt" },
  ];

  const vehicleOwnershipTypes = [
    { value: "1", label: "Individual Members" },
    { value: "2", label: "Owned by the Society" },
    { value: "3", label: "Mixed Ownership" },
  ];

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
    const individual = parseInt(individualValue);
    const institutional = parseInt(institutionalValue);

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
    const members = parseInt(membersValue);
    const government = parseInt(governmentValue);

    const total = members + government;

    setFormData((prev) => ({
      ...prev,
      membersShareCapital: membersValue,
      governmentShareCapital: governmentValue,
      totalShareCapital: total.toString(),
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.transportType)
      newErrors.transportType = "Transport type is required";
    if (!formData.hasOfficeBuilding)
      newErrors.hasOfficeBuilding =
        "Please specify if society has office building";
    if (formData.hasOfficeBuilding === "1" && !formData.officeBuildingType) {
      newErrors.officeBuildingType = "Office building type is required";
    }
    if (!formData.individualMembers)
      newErrors.individualMembers =
        "Number of individual promoters is required";
    if (!formData.institutionalMembers)
      newErrors.institutionalMembers =
        "Number of institutional promoters is required";
    if (!formData.totalDeposit)
      newErrors.totalDeposit = "Total deposit is required";
    // if (!formData.authorizedShareCapital)
    //   newErrors.authorizedShareCapital = "Authorized share capital is required";
    // if (!formData.membersShareCapital)
    //   newErrors.membersShareCapital = "Promoters share capital is required";
    // if (!formData.governmentShareCapital)
    //   newErrors.governmentShareCapital = "Government share capital is required";
    // if (!formData.annualTurnover)
    //   newErrors.annualTurnover = "Annual turnover is required";
    // if (!formData.vehicleOwnershipType)
    //   newErrors.vehicleOwnershipType = "Vehicle ownership type is required";
    if (!formData.membersOperateVehicles)
      newErrors.membersOperateVehicles =
        "Vehicle operated/maintained is required";
    if (!formData.membersUseTransport)
      newErrors.membersUseTransport = "Transport facility is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const transformToApiPayload = () => {
    const paidUpMembers = Number(formData.membersShareCapital);
    const paidUpGovt = Number(formData.governmentShareCapital);
    const totalPaidUp = paidUpMembers + paidUpGovt;

    return {
      CooperativeRegistrationsTransport: [
        {
          type_society: Number(formData.transportType) || 0,
          total_deposit: Number(formData.totalDeposit) || 0,
          has_building: Number(formData.hasOfficeBuilding),

          building_type:
            formData.hasOfficeBuilding === "1"
              ? officeBuildingTypes.findIndex(
                  (o) => o.value === formData.officeBuildingType,
                ) + 1
              : null,

          individual_member: Number(formData.individualMembers) || null,

          institutional_member: Number(formData.institutionalMembers) || null,

          authorised_share: Number(formData.authorizedShareCapital) || null,

          paid_up_members: paidUpMembers || null,

          paid_up_government_bodies: paidUpGovt || null,

          paid_up_total: totalPaidUp || null,

          annual_turn_over: Number(formData.annualTurnover) || null,

          type_owner: Number(formData.vehicleOwnershipType) || null,

          bus_type_detail: Number(formData.busCount) || null,

          truck_type_detail: Number(formData.truckLorryCount) || null,

          other_type_detail: Number(formData.otherVehicles) || null,

          no_passenger_vehicle:
            formData.transportType === "passenger" ||
            formData.transportType === "mixed"
              ? Number(formData.busCount)
              : null,

          no_member_travel: Number(formData.totalMembers) || null,

          no_freight_vehicle:
            formData.transportType === "freight" ||
            formData.transportType === "mixed"
              ? Number(formData.truckLorryCount)
              : null,

          member_themself: Number(formData.membersOperateVehicles) || null,

          is_user_transport_facility:
            Number(formData.membersUseTransport) || null,
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
      {/* Transport Type Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          1. Transport Type
        </h2>

        <Select
          label="10(a). Type of Transport Cooperative Society"
          value={formData.transportType}
          onChange={(e) => handleInputChange("transportType", e.target.value)}
          placeholder="Select transport type"
          error={errors.transportType}
          required
        >
          {transportTypes.map((option) => (
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
            label="10(b). Whether the co-operative society has an office building"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            value={formData.hasOfficeBuilding}
            onChange={(value) => handleInputChange("hasOfficeBuilding", value)}
            name="hasOfficeBuilding"
            error={errors.hasOfficeBuilding}
          />

          {formData.hasOfficeBuilding === "1" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                10(c). Type of Office Building
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
          3. Promoter Details
        </h2>

        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Promoter Detail of Cooperative Society - type of promoter
            (Individual/Institutional)
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">
                    Type of Promoter
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left">
                    Number of Promoters
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
                  <td className="border border-gray-300 px-4 py-2">
                    Institutional
                  </td>
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
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          4. Share Capital
        </h2>
        <Input
          label="Total Deposit (in Rs)"
          type="number"
          value={formData.totalDeposit}
          onChange={(e) => handleInputChange("totalDeposit", e.target.value)}
          placeholder="Enter total deposit"
          error={errors.totalDeposit}
          required
        />
        <div className="space-y-6 mt-4">
          <Input
            label="Authorised Share Capital (in Rs)"
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
              12(a). Paid up Share Capital by different Entity - Name of entity
              (Members, Government or Government bodies)
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
                    <td className="border border-gray-300 px-4 py-2">
                      Government or Government Bodies
                    </td>
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
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          5. Annual Turnover
        </h2>

        <Input
          label="Annual Turn Over of the Cooperative Society (in Rs)"
          type="number"
          value={formData.annualTurnover}
          onChange={(e) => handleInputChange("annualTurnover", e.target.value)}
          placeholder="Enter annual turnover amount"
          // error={errors.annualTurnover}
          // required
        />
      </Card>

      {/* Vehicle Ownership Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          6. Vehicle Ownership
        </h2>

        <Select
          label="13(a). Type of Vehicle Ownership in Operation?"
          value={formData.vehicleOwnershipType}
          onChange={(e) =>
            handleInputChange("vehicleOwnershipType", e.target.value)
          }
          placeholder="Select vehicle ownership type"
          // error={errors.vehicleOwnershipType}
          // required
        >
          {vehicleOwnershipTypes.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Card>

      {/* Vehicle Details Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          7. Vehicle Details
        </h2>

        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Details of Vehicle operated by cooperative society: Type of vehicles
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="Bus"
              type="number"
              value={formData.busCount}
              onChange={(e) => handleInputChange("busCount", e.target.value)}
              placeholder="Enter number of buses"
            />

            <Input
              label="Truck/Lorry"
              type="number"
              value={formData.truckLorryCount}
              onChange={(e) =>
                handleInputChange("truckLorryCount", e.target.value)
              }
              placeholder="Enter number of trucks/lorries"
            />

            <Input
              label="Other Vehicles"
              type="number"
              value={formData.otherVehicles}
              onChange={(e) =>
                handleInputChange("otherVehicles", e.target.value)
              }
              placeholder="Enter number of other vehicles"
            />
          </div>
        </div>
      </Card>

      {/* Travel Details - Passenger Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          8. Travel Details - Passenger
        </h2>

        <Textarea
          label="14(a). Travel Details of Passenger Vehicle in the Audit Year"
          value={formData.passengerVehicleDetails}
          onChange={(e) =>
            handleInputChange("passengerVehicleDetails", e.target.value)
          }
          placeholder="Enter travel details of passenger vehicles including routes, frequency, passenger count, etc."
          rows={4}
        />
      </Card>

      {/* Travel Details - Freight Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          9. Travel Details - Freight
        </h2>

        <Textarea
          label="14(b). Travel Details of Freight Vehicle in the Audit Year"
          value={formData.freightVehicleDetails}
          onChange={(e) =>
            handleInputChange("freightVehicleDetails", e.target.value)
          }
          placeholder="Enter travel details of freight vehicles including routes, cargo types, tonnage, etc."
          rows={4}
        />
      </Card>

      {/* Vehicle Operations Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          10. Vehicle Operations
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="14(c). Whether the vehicle are operated/maintained by members themself?"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            value={formData.membersOperateVehicles}
            onChange={(value) =>
              handleInputChange("membersOperateVehicles", value)
            }
            name="membersOperateVehicles"
            error={errors.membersOperateVehicles}
            required
          />

          <RadioGroup
            label="14(d). Whether the members are users of the transport facility of Cooperative Society?"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            value={formData.membersUseTransport}
            onChange={(value) =>
              handleInputChange("membersUseTransport", value)
            }
            name="membersUseTransport"
            error={errors.membersUseTransport}
            required
          />
        </div>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline">
          Save Draft
        </Button>
        <Button type="submit">Submit Application</Button>
      </div>
    </form>
  );
};

export default CooperativeRegistrationsTransport;
