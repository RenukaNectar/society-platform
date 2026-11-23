import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { PasswordInput } from "../components/ui/PasswordInput";
import { Modal } from "../components/ui/Modal";
import {
  User,
  Edit,
  Phone,
  Mail,
  Lock,
  PenTool,
  Upload,
  Eye,
} from "lucide-react";
import { getMySociety } from "../lib/data/users/api";
import { changePasswordSchema, ChangePasswordForm } from "../utils/validation";
import { toast } from "react-hot-toast";
import { changePassword } from "../lib/data/authUser/api";
import { SignatureUploadModal } from "../components/ui/signatureUploadModal";
import { API_BASE_URL } from "../lib/api";
import ActionPermissionGuard from "../components/guard/ActionPermissionGuard";
import { UserAvailabilityCard } from "../components/workflow/UserAvailabilityCard";

export const Profile: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { mode } = useSelector((state: RootState) => state.theme);
  const [profileData, setProfileData] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState<ChangePasswordForm>({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {},
  );
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const canUploadSignature =
    user?.role === "rcs_district" || user?.role === "drcs_arcs_district";

  useEffect(() => {
    const fetchSignature = async () => {
      try {
        const res = await getMySociety();
        const url = res?.data?.user?.signatureMedia?.url || null;
        setSignatureUrl(url);
      } catch (error) {
        console.error("signature fetch error:", error);
      }
    };

    fetchSignature();
  }, []);

  useEffect(() => {
    const fetchSociety = async () => {
      const response = await getMySociety();
      setProfileData(response.data.society);
    };

    if (!user?.district && !user?.state) {
      fetchSociety();
    }
  }, [user]);

  const handlePasswordChange = (
    field: keyof ChangePasswordForm,
    value: string,
  ) => {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user starts typing
    if (passwordErrors[field]) {
      setPasswordErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validatePasswordForm = () => {
    try {
      changePasswordSchema.parse(passwordForm);
      setPasswordErrors({});
      return true;
    } catch (error: any) {
      const newErrors: Record<string, string> = {};
      error.errors?.forEach((err: any) => {
        if (err.path[0]) {
          newErrors[err.path[0]] = err.message;
        }
      });
      setPasswordErrors(newErrors);
      return false;
    }
  };

  const handlePasswordSubmit = async () => {
    if (validatePasswordForm()) {
      try {
        setLoading(true);
        const response = await changePassword(passwordForm);
        if (response.success) {
          toast.success("Password changed successfully");
          setShowPasswordModal(false);
          setPasswordForm({
            current_password: "",
            new_password: "",
            confirm_password: "",
          });
        } else {
          toast.error(response.message);
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to change password",
        );
        console.log("Error:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePasswordModalClose = () => {
    setShowPasswordModal(false);
    setPasswordForm({
      current_password: "",
      new_password: "",
      confirm_password: "",
    });
    setPasswordErrors({});
  };

  return (
    <>
      <div className="space-y-6 mt-4">
        {/* Profile Header */}
        <Card>
          <div className="flex items-center space-x-6">
            <div
              className={`w-24 h-24 bg-indigo-100 ${mode}:bg-indigo-900 rounded-full flex items-center justify-center`}
            >
              <User
                className={`h-12 w-12 text-indigo-600 ${mode}:text-indigo-400`}
              />
            </div>
            <div className="flex-1">
              <h2
                className={`text-2xl font-bold text-gray-900 ${mode}:text-gray-100`}
              >
                {user?.first_name || ""} {user?.last_name || ""}
              </h2>
              <p className={`text-gray-500 ${mode}:text-gray-400 capitalize`}>
                {user?.role || "User"} Account
              </p>
              {(user?.state || profileData?.state) && (
                <div className="mt-2 text-gray-500 ${mode}:text-gray-400">
                  <p>
                    State:{" "}
                    {user?.state?.name || profileData?.state?.name || "-"}
                  </p>
                </div>
              )}
              {(user?.district || profileData?.district) && (
                <div className="mt-2 text-gray-500 ${mode}:text-gray-400">
                  <p>
                    District:{" "}
                    {user?.district?.name || profileData?.district?.name || "-"}
                  </p>
                </div>
              )}
              <div className="flex items-center space-x-4 mt-2">
                <div
                  className={`flex items-center space-x-1 text-sm text-gray-500 ${mode}:text-gray-400`}
                >
                  <Mail className="h-4 w-4" />
                  <span>{user?.email}</span>
                </div>
                <div
                  className={`flex items-center space-x-1 text-sm text-gray-500 ${mode}:text-gray-400`}
                >
                  <Phone className="h-4 w-4" />
                  <span>{user?.phone}</span>
                </div>
              </div>
            </div>
            <ActionPermissionGuard resource="profile" action="edit">
              <Button onClick={() => setShowEditModal(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </ActionPermissionGuard>
          </div>
        </Card>

        {user?.id && user?.role !== "applicant" && (
          <UserAvailabilityCard
            userId={user.id}
            initialIsAvailable={user.is_available}
          />
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="text-center">
            <Lock className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <div className="flex flex-col">
              <h3
                className={`text-lg font-semibold text-gray-900 ${mode}:text-gray-100 mb-2`}
              >
                Change Password
              </h3>
              <p className={`text-sm text-gray-500 ${mode}:text-gray-400 mb-4`}>
                Update your account password for security
              </p>
              <Button
                variant="outline"
                onClick={() => setShowPasswordModal(true)}
              >
                Change Password
              </Button>
            </div>
          </Card>

          {canUploadSignature && (
            <Card className="md:col-span-2">
              <div className="flex flex-col items-center text-center">
                <PenTool className="h-12 w-12 text-emerald-500 mb-4" />
                <h3
                  className={`text-lg font-semibold text-gray-900 ${mode}:text-gray-100 mb-2`}
                >
                  Signature
                </h3>
                <p
                  className={`text-sm text-gray-500 ${mode}:text-gray-400 mb-5 max-w-md`}
                >
                  Upload your signature (JPG, JPEG, PNG) to enhance your profile
                  and documents.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsSignatureModalOpen(true)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Signature
                  </Button>

                  {signatureUrl && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        const fullUrl = `${API_BASE_URL}${signatureUrl}`;

                        window.open(fullUrl, "_blank", "noopener,noreferrer");
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Signature
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
      {/* Edit Profile Modal */}
      {showEditModal && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Profile"
          size="md"
        >
          <div className="space-y-4">
            <Input
              label="Full Name"
              defaultValue={user?.first_name}
              placeholder="Enter your full name"
            />
            <Input
              label="Email Address"
              type="email"
              defaultValue={user?.email}
              placeholder="Enter your email"
            />
            <Input
              label="Mobile Number"
              defaultValue={user?.phone}
              placeholder="Enter your mobile number"
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button>Save Changes</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <Modal
          isOpen={showPasswordModal}
          onClose={handlePasswordModalClose}
          title="Change Password"
          size="md"
        >
          <div className="space-y-4">
            <PasswordInput
              label="Current Password"
              placeholder="Enter current password"
              value={passwordForm.current_password}
              onChange={(e) =>
                handlePasswordChange("current_password", e.target.value)
              }
              error={passwordErrors.current_password}
              required
            />
            <PasswordInput
              label="New Password"
              placeholder="Enter new password"
              value={passwordForm.new_password}
              onChange={(e) =>
                handlePasswordChange("new_password", e.target.value)
              }
              error={passwordErrors.new_password}
              required
            />
            <PasswordInput
              label="Confirm New Password"
              placeholder="Confirm new password"
              value={passwordForm.confirm_password}
              onChange={(e) =>
                handlePasswordChange("confirm_password", e.target.value)
              }
              error={passwordErrors.confirm_password}
              required
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={handlePasswordModalClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePasswordSubmit}
                loading={loading}
                disabled={loading}
              >
                Update Password
              </Button>
            </div>
          </div>
        </Modal>
      )}
      <SignatureUploadModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSuccess={async () => {
          try {
            const res = await getMySociety();
            const url = res?.data?.user?.signatureMedia?.url || null;
            setSignatureUrl(url);
          } catch (error) {
            console.error("signature fetch error:", error);
          }
        }}
      />
    </>
  );
};
