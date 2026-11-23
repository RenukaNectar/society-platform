import React, { useState } from "react";
import { Input } from "../../components/ui/Input";
// import { Select } from '../../components/ui/Select';
import { RadioGroup } from "../../components/ui/RadioGroup";
// import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

interface FormData {
  // Education Type
  educationType: string;

  // Office Building
  hasOfficeBuilding: string;
  officeBuildingType: string;

  // Land Details
  hasLand: string;
  landDetails: string;

  // Member Details
  individualMembers: string;
  institutionalMembers: string;

  // Share Capital
  authorizedShareCapital: string;
  membersShareCapital: string;
  governmentShareCapital: string;

  // Education Details
  levelOfEdu: string;
  durationOfCourse: string;
  levelAndDurationOfCourse: string[];

  // Paid Up Share
  paidUpShareDate: string;

  // Annual Turnover
  annualTurnover: string;
  annualExpenses: string;

  // Courses and Training
  numberOfCourses: string;
  numberOfStudentsCompleted: string;
  numberOfTrainingCourses: string;
  numberOfParticipants: string;

  // International Training
  conductsInternationalTraining: string;
  internationalTrainingCount: string;
  internationalParticipants: string;

  // Faculty
  hasOwnFaculty: string;
  regularFaculties: string;
  adhocFaculties: string;

  // Facilities
  facilities: string[];
}

const CooperativeRegistrationsEducation = ({
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
    educationType: data?.educationType || "",
    hasOfficeBuilding: data?.hasOfficeBuilding || "",
    officeBuildingType: data?.officeBuildingType || "",
    hasLand: data?.hasLand || "",
    landDetails: data?.landDetails || "",
    individualMembers: data?.individualMembers || "",
    institutionalMembers: data?.institutionalMembers || "",
    authorizedShareCapital: data?.authorizedShareCapital || "",
    membersShareCapital: data?.membersShareCapital || "",
    governmentShareCapital: data?.governmentShareCapital || "",
    levelOfEdu: data?.levelOfEdu || "",
    durationOfCourse: data?.durationOfCourse || "",
    levelAndDurationOfCourse: data?.levelAndDurationOfCourse || [],
    paidUpShareDate: data?.paidUpShareDate || "",
    annualTurnover: data?.annualTurnover || "",
    annualExpenses: data?.annualExpenses || "",
    numberOfCourses: data?.numberOfCourses || "",
    numberOfStudentsCompleted: data?.numberOfStudentsCompleted || "",
    numberOfTrainingCourses: data?.numberOfTrainingCourses || "",
    numberOfParticipants: data?.numberOfParticipants || "",
    conductsInternationalTraining: data?.conductsInternationalTraining || "",
    internationalTrainingCount: data?.internationalTrainingCount || "",
    internationalParticipants: data?.internationalParticipants || "",
    hasOwnFaculty: data?.hasOwnFaculty || "",
    regularFaculties: data?.regularFaculties || "",
    adhocFaculties: data?.adhocFaculties || "",
    facilities: data?.facilities ? data.facilities.split(",") : [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const educationTypeOptions = [
    { value: "1", label: "Education Cooperative Society" },
    { value: "2", label: "Training Cooperative Society" },
    { value: "3", label: "Both Training & Education" },
    { value: "4", label: "College Cooperative" },
  ];

  const levelOfEduOptions = [
    { value: "1", label: "Elementary / Basic Education" },
    { value: "2", label: "School Education" },
    { value: "3", label: "Diploma Courses" },
    { value: "4", label: "Degree Courses" },
  ];

  const durationOptions = [
    { value: "5", label: "Basic short term training courses" },
    { value: "6", label: "Medium to long term professional training courses" },
  ];

  const levelDurationOptions = [
    { value: "1", label: "Elementary/Basic Education" },
    { value: "2", label: "School Education" },
    { value: "3", label: "Diploma courses" },
    { value: "4", label: "Degree courses" },
    { value: "5", label: "Basic short term training courses" },
    { value: "6", label: "Medium to long term professional training courses" },
  ];

  const officeBuildingTypes = [
    { value: "1", label: "Own Building" },
    { value: "2", label: "Rented Building" },
    { value: "3", label: "Rent Free Building" },
    { value: "4", label: "Leased Building" },
    { value: "5", label: "Building Provided By Govt" },
  ];

  const facilitiesOptions = [
    { value: "1", label: "Do not have basic amenities" },
    { value: "39", label: "Hostel" },
    { value: "40", label: "Transport Service" },
    { value: "41", label: "Sports Complex/playground/park" },
    { value: "42", label: "Library" },
  ];

  const landTypeOptions = [
    { value: "owned", label: "Owned Land" },
    { value: "leased", label: "Leased Land" },
    { value: "govt_allotted", label: "Land allotted by the Government" },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => {
      if (field === "hasOfficeBuilding" && value === "no") {
        return { ...prev, hasOfficeBuilding: value, officeBuildingType: "" };
      }

      if (field === "hasLand" && value === "no") {
        return { ...prev, hasLand: value, landDetails: "" };
      }

      return { ...prev, [field]: value };
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.educationType)
      newErrors.educationType = "Education type is required";
    if (!formData.hasOfficeBuilding)
      newErrors.hasOfficeBuilding =
        "Please specify if society has office building";
    if (formData.hasOfficeBuilding === "yes" && !formData.officeBuildingType) {
      newErrors.officeBuildingType = "Office building type is required";
    }
    if (!formData.hasLand)
      newErrors.hasLand = "Please specify if society has land";
    if (formData.hasLand === "yes" && !formData.landDetails) {
      newErrors.landDetails = "Land details are required";
    }
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
    //   newErrors.governmentShareCapital = "Government share capital is required";
    // if (!formData.annualTurnover)
    //   newErrors.annualTurnover = "Annual turnover is required";
    if (!formData.numberOfCourses)
      newErrors.numberOfCourses = "Number of courses is required";
    if (!formData.numberOfStudentsCompleted)
      newErrors.numberOfStudentsCompleted =
        "Number of students completed is required";
    if (!formData.numberOfTrainingCourses)
      newErrors.numberOfTrainingCourses =
        "Number of training courses is required";
    if (!formData.numberOfParticipants)
      newErrors.numberOfParticipants = "Number of participants is required";
    if (!formData.conductsInternationalTraining)
      newErrors.conductsInternationalTraining =
        "Please specify if society conducts international training";
    if (formData.conductsInternationalTraining === "yes") {
      if (!formData.internationalTrainingCount)
        newErrors.internationalTrainingCount =
          "International training count is required";
      if (!formData.internationalParticipants)
        newErrors.internationalParticipants =
          "International participants count is required";
    }
    if (!formData.levelOfEdu && formData.educationType === "1")
      newErrors.levelOfEdu = "Level of education is required";

    if (!formData.durationOfCourse && formData.educationType === "2")
      newErrors.durationOfCourse = "Duration of course is required";

    if (
      formData.educationType === "3" &&
      !formData.levelAndDurationOfCourse.length
    )
      newErrors.levelAndDurationOfCourse = "Select course level or duration";
    if (!formData.hasOwnFaculty)
      newErrors.hasOwnFaculty = "Please specify if society has own faculty";
    if (formData.hasOwnFaculty === "yes") {
      if (!formData.regularFaculties)
        newErrors.regularFaculties = "Number of regular faculties is required";
      if (!formData.adhocFaculties)
        newErrors.adhocFaculties = "Number of adhoc faculties is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const transformToApiPayload = () => {
    const members = Number(formData.membersShareCapital);
    const govt = Number(formData.governmentShareCapital);

    return {
      CooperativeRegistrationsEducation: [
        {
          type_society: Number(formData.educationType) || null,

          level_of_edu:
            formData.educationType === "1" ? Number(formData.levelOfEdu) : null,

          duration_of_course:
            formData.educationType === "2"
              ? Number(formData.durationOfCourse)
              : null,

          level_and_duration_of_course:
            formData.educationType === "3"
              ? formData.levelAndDurationOfCourse.join(",")
              : null,

          has_building: formData.hasOfficeBuilding === "yes" ? 1 : 0,

          building_type:
            formData.hasOfficeBuilding === "yes"
              ? Number(formData.officeBuildingType)
              : 0,

          has_land: formData.hasLand === "yes" ? 1 : 0,

          individual_member: Number(formData.individualMembers) || null,

          institutional_member: Number(formData.institutionalMembers) || null,

          authorised_share: Number(formData.authorizedShareCapital) || null,

          paid_up_members: members || null,

          paid_up_government_bodies: govt || null,

          paid_up_total: members + govt || null,
          paid_up_share_date: formData.paidUpShareDate || null,

          annual_turn_over: Number(formData.annualTurnover) || null,

          annual_expenses: Number(formData.annualExpenses) || null,

          course_in_audit: Number(formData.numberOfCourses) || null,

          stu_in_audit: Number(formData.numberOfStudentsCompleted) || null,

          training_course_in_audit:
            Number(formData.numberOfTrainingCourses) || null,

          participants_in_audit: Number(formData.numberOfParticipants) || null,

          course_international_participant:
            formData.conductsInternationalTraining === "yes" ? 1 : 0,

          no_of_training_course:
            formData.conductsInternationalTraining === "yes"
              ? Number(formData.internationalTrainingCount)
              : 0,

          attended_training:
            formData.conductsInternationalTraining === "yes"
              ? Number(formData.internationalParticipants)
              : 0,

          society_recruit: formData.hasOwnFaculty === "yes" ? 1 : 0,

          no_regular_faculty:
            formData.hasOwnFaculty === "yes"
              ? Number(formData.regularFaculties)
              : 0,

          no_other_faculty:
            formData.hasOwnFaculty === "yes"
              ? Number(formData.adhocFaculties)
              : 0,

          facilities: formData.facilities.length
            ? formData.facilities.join(",")
            : null,
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
      {/* Education Type Section */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            1. Education Type
          </h2>

          <RadioGroup
            label="1(a). Type of education Cooperative"
            options={educationTypeOptions}
            value={formData.educationType}
            onChange={(value) => {
              setFormData((prev) => ({
                ...prev,
                educationType: value,
                levelOfEdu: "",
                durationOfCourse: "",
                levelAndDurationOfCourse: [],
              }));
            }}
            name="educationType"
            error={errors.educationType}
          />
        </div>

        {formData.educationType === "1" && (
          <RadioGroup
            label="1(b). Level of Education"
            options={levelOfEduOptions}
            value={formData.levelOfEdu}
            onChange={(value) => handleInputChange("levelOfEdu", value)}
            name="levelOfEdu"
            error={errors.levelOfEdu}
          />
        )}

        {formData.educationType === "2" && (
          <RadioGroup
            label="1(b). Duration of Course"
            options={durationOptions}
            value={formData.durationOfCourse}
            onChange={(value) => handleInputChange("durationOfCourse", value)}
            name="durationOfCourse"
            error={errors.durationOfCourse}
          />
        )}

        {formData.educationType === "3" && (
          <div>
            <label className="text-sm font-medium text-gray-900 mb-6">
              1(b). Level and Duration of Course
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {levelDurationOptions.map((option) => (
                <label key={option.value} className="flex gap-3 items-start">
                  <input
                    type="checkbox"
                    checked={formData.levelAndDurationOfCourse.includes(
                      option.value,
                    )}
                    onChange={() => {
                      const updated =
                        formData.levelAndDurationOfCourse.includes(option.value)
                          ? formData.levelAndDurationOfCourse.filter(
                              (v) => v !== option.value,
                            )
                          : [
                              ...formData.levelAndDurationOfCourse,
                              option.value,
                            ];

                      setFormData((prev) => ({
                        ...prev,
                        levelAndDurationOfCourse: updated,
                      }));
                    }}
                    className="mt-1 h-4 w-4"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
            {errors.levelAndDurationOfCourse && (
              <p className="text-red-600 text-sm mt-1">
                {errors.levelAndDurationOfCourse}
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Office Building Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          2. Office Building
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="2(a). Whether the co-operative society has an office building"
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
                2(a)(i). Type of Office Building
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

      {/* Land Details Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          3. Land Details
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="3(a). Whether the co-operative society has land"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.hasLand}
            onChange={(value) => handleInputChange("hasLand", value)}
            name="hasLand"
            error={errors.hasLand}
          />

          {formData.hasLand === "yes" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                3(a)(i). Detail of Land Available with the Cooperative
              </h3>
              <RadioGroup
                options={landTypeOptions}
                value={formData.landDetails}
                onChange={(value) => handleInputChange("landDetails", value)}
                name="landDetails"
                error={errors.landDetails}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Member Details Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          4. Promoter Detail of Cooperative Society
        </h2>

        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Type of Promoter | No. of Promoter
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Individual"
              type="number"
              value={formData.individualMembers}
              onChange={(e) =>
                handleInputChange("individualMembers", e.target.value)
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
                handleInputChange("institutionalMembers", e.target.value)
              }
              placeholder="Enter number of institutional promoters"
              error={errors.institutionalMembers}
              required
            />
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
            label="5(a). Authorised Share Capital (in Rs)"
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
              5(b). Paid up Share Capital by different Entity
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Promoters"
                type="number"
                value={formData.membersShareCapital}
                onChange={(e) =>
                  handleInputChange("membersShareCapital", e.target.value)
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
                  handleInputChange("governmentShareCapital", e.target.value)
                }
                placeholder="Enter government share capital"
                // error={errors.governmentShareCapital}
                // required
              />
            </div>
          </div>
          <Input
            label="5(c). Paid Up Share Date"
            type="date"
            value={formData.paidUpShareDate}
            onChange={(e) =>
              handleInputChange("paidUpShareDate", e.target.value)
            }
          />
        </div>
      </Card>

      {/* Annual Turnover Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          6. Annual Turn Over
        </h2>

        <div className="mb-4">
          <Input
            label="6(a). Annual Turn Over of the Cooperative Society (in Rs)"
            type="number"
            value={formData.annualTurnover}
            onChange={(e) =>
              handleInputChange("annualTurnover", e.target.value)
            }
            placeholder="Enter annual turnover amount"
            // error={errors.annualTurnover}
            // required
          />
        </div>
        <Input
          label="6(b). Annual Expenses of the Cooperative Society (in Rs)"
          type="number"
          value={formData.annualExpenses}
          onChange={(e) => handleInputChange("annualExpenses", e.target.value)}
          placeholder="Enter annual expenses amount"
          // error={errors.annualTurnover}
          // required
        />
      </Card>

      {/* Courses and Training Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          7. Courses and Training
        </h2>

        <div className="space-y-6">
          <Input
            label="7(a). Number of courses offered in the audited year"
            type="number"
            value={formData.numberOfCourses}
            onChange={(e) =>
              handleInputChange("numberOfCourses", e.target.value)
            }
            placeholder="Enter number of courses"
            error={errors.numberOfCourses}
            required
          />

          <Input
            label="7(b). Number of students completed courses offered in the audited year"
            type="number"
            value={formData.numberOfStudentsCompleted}
            onChange={(e) =>
              handleInputChange("numberOfStudentsCompleted", e.target.value)
            }
            placeholder="Enter number of students completed"
            error={errors.numberOfStudentsCompleted}
            required
          />

          <Input
            label="7(c). Number of training courses conducted in the audited year"
            type="number"
            value={formData.numberOfTrainingCourses}
            onChange={(e) =>
              handleInputChange("numberOfTrainingCourses", e.target.value)
            }
            placeholder="Enter number of training courses"
            error={errors.numberOfTrainingCourses}
            required
          />

          <Input
            label="7(d). Number of participants attended training in the audited year"
            type="number"
            value={formData.numberOfParticipants}
            onChange={(e) =>
              handleInputChange("numberOfParticipants", e.target.value)
            }
            placeholder="Enter number of participants"
            error={errors.numberOfParticipants}
            required
          />
        </div>
      </Card>

      {/* International Training Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          8. International Training
        </h2>

        <div className="space-y-6">
          <RadioGroup
            label="8(a). Whether the Society conduct any course/training for international Participants?"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.conductsInternationalTraining}
            onChange={(value) =>
              handleInputChange("conductsInternationalTraining", value)
            }
            name="conductsInternationalTraining"
            error={errors.conductsInternationalTraining}
          />

          {formData.conductsInternationalTraining === "yes" && (
            <div className="space-y-6">
              <Input
                label="8(a)(i). Number of trainings/courses conducted"
                type="number"
                value={formData.internationalTrainingCount}
                onChange={(e) =>
                  handleInputChange(
                    "internationalTrainingCount",
                    e.target.value,
                  )
                }
                placeholder="Enter number of international trainings/courses"
                error={errors.internationalTrainingCount}
                required
              />

              <Input
                label="8(a)(ii). Number of participants attended training/course"
                type="number"
                value={formData.internationalParticipants}
                onChange={(e) =>
                  handleInputChange("internationalParticipants", e.target.value)
                }
                placeholder="Enter number of international participants"
                error={errors.internationalParticipants}
                required
              />
            </div>
          )}
        </div>
      </Card>

      {/* Faculty Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">9. Faculty</h2>

        <div className="space-y-6">
          <RadioGroup
            label="9(a). Whether the Society has recruited own faculty"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={formData.hasOwnFaculty}
            onChange={(value) => handleInputChange("hasOwnFaculty", value)}
            name="hasOwnFaculty"
            error={errors.hasOwnFaculty}
          />

          {formData.hasOwnFaculty === "yes" && (
            <div className="space-y-6">
              <Input
                label="9(a)(i). Number of Regular Faculties"
                type="number"
                value={formData.regularFaculties}
                onChange={(e) =>
                  handleInputChange("regularFaculties", e.target.value)
                }
                placeholder="Enter number of regular faculties"
                error={errors.regularFaculties}
                required
              />

              <Input
                label="9(a)(ii). Number of Adhoc/Contractual/Visiting Faculties"
                type="number"
                value={formData.adhocFaculties}
                onChange={(e) =>
                  handleInputChange("adhocFaculties", e.target.value)
                }
                placeholder="Enter number of adhoc faculties"
                error={errors.adhocFaculties}
                required
              />
            </div>
          )}
        </div>
      </Card>

      {/* Facilities Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          10. Facilities
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {facilitiesOptions.map((option) => (
            <label key={option.value} className="flex gap-3 items-start">
              <input
                type="checkbox"
                checked={formData.facilities.includes(option.value)}
                onChange={() => {
                  const updated = formData.facilities.includes(option.value)
                    ? formData.facilities.filter((v) => v !== option.value)
                    : [...formData.facilities, option.value];

                  setFormData((prev) => ({ ...prev, facilities: updated }));
                }}
                className="mt-1 h-4 w-4"
              />
              <span className="text-sm">{option.label}</span>
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

export default CooperativeRegistrationsEducation;
