import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAuditors, createAuditor, updateAuditor, deleteAuditor, getAuditorById } from "../../lib/data/others/api";
import { usePermissions } from "../../hooks/usePermissions";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Search, Phone, Mail, MapPin, Plus, Edit, Trash2 } from "lucide-react";
import { AuditorForm } from "../../components/forms/AuditorForm";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import { Modal } from "../../components/ui/Modal";
import toast from "react-hot-toast";

export const Auditors: React.FC = () => {
    const { isAdmin } = usePermissions();
    const canManageAuditors = isAdmin();
    const [auditors, setAuditors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingAuditor, setEditingAuditor] = useState<any>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [auditorToDelete, setAuditorToDelete] = useState<any>(null);
    const [btnLoading, setBtnLoading] = useState(false);

    useEffect(() => {
        const fetchAuditors = async () => {
            try {
                setLoading(true);
                const response = await getAuditors();
                if (response) {
                    setAuditors(response);
                }
            } catch (error) {
                console.error('Error fetching auditors:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAuditors();
    }, []);

    // Filter auditors based on search term
    const filteredAuditors = auditors.filter(auditor =>
        auditor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auditor.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (auditor.mobile1 && auditor.mobile1.includes(searchTerm)) ||
        (auditor.mobile2 && auditor.mobile2.includes(searchTerm)) ||
        (auditor.email && auditor.email.some((email: string) => 
            email.toLowerCase().includes(searchTerm.toLowerCase())
        ))
    );

    const handleAddAuditor = async (data: any) => {
        try {
            setBtnLoading(true);
            const response = await createAuditor(data);
            if (response) {
                // Refresh the auditors list
                const updatedAuditors = await getAuditors();
                if (updatedAuditors) {
                    setAuditors(updatedAuditors);
                }
                setShowForm(false);
                toast.success('Auditor added successfully!');
            }
        } catch (error) {
            console.error('Error adding auditor:', error);
            toast.error('Failed to add auditor. Please try again.');
        } finally {
            setBtnLoading(false);
        }
    };

    const handleEditAuditor = async (data: any) => {
        try {
            setBtnLoading(true);
            const response = await updateAuditor(editingAuditor.id, data);
            if (response) {
                // Refresh the auditors list
                const updatedAuditors = await getAuditors();
                if (updatedAuditors) {
                    setAuditors(updatedAuditors);
                }
                setShowForm(false);
                setEditingAuditor(null);
                toast.success('Auditor updated successfully!');
            }
        } catch (error) {
            console.error('Error updating auditor:', error);
            toast.error('Failed to update auditor. Please try again.');
        } finally {
            setBtnLoading(false);
        }
    };

    const handleDeleteAuditor = async () => {
        try {
            setBtnLoading(true);
            const response = await deleteAuditor(auditorToDelete.id);
            if (response) {
                // Refresh the auditors list
                const updatedAuditors = await getAuditors();
                if (updatedAuditors) {
                    setAuditors(updatedAuditors);
                }
                setShowDeleteModal(false);
                setAuditorToDelete(null);
                toast.success('Auditor deleted successfully!');
            }
        } catch (error) {
            console.error('Error deleting auditor:', error);
            toast.error('Failed to delete auditor. Please try again.');
        } finally {
            setBtnLoading(false);
        }
    };

    const openEditForm = (auditor: any) => {
        setEditingAuditor(auditor);
        setShowForm(true);
    };

    const openDeleteModal = (auditor: any) => {
        setAuditorToDelete(auditor);
        setShowDeleteModal(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingAuditor(null);
    };

    if (!canManageAuditors) {
        return <Navigate to="/" replace />;
    }

    if (loading) {
        return (
            <div className="mt-4">
                <Card className="p-6">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading auditors...</p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 mt-4">
            <Card>
                {/* Header with Add Button */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Auditors</h2>
                    <Button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add Auditor
                    </Button>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, address, phone, or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Auditors Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAuditors.map((auditor) => (
                        <div key={auditor.sl_no} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {auditor.name}
                                    </h3>
                                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                                        #{auditor.sl_no}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => openEditForm(auditor)}
                                        variant="outline"
                                        size="sm"
                                        className="p-2"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        onClick={() => openDeleteModal(auditor)}
                                        variant="outline"
                                        size="sm"
                                        className="p-2 text-red-600 hover:text-red-700 hover:border-red-300"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Address */}
                            <div className="mb-3">
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {auditor.address}
                                    </p>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="space-y-2">
                                {/* Mobile 1 */}
                                {auditor.mobile1 && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm text-gray-700 font-medium">
                                            {auditor.mobile1}
                                        </span>
                                    </div>
                                )}

                                {/* Mobile 2 */}
                                {auditor.mobile2 && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm text-gray-700 font-medium">
                                            {auditor.mobile2}
                                        </span>
                                    </div>
                                )}

                                {/* Email */}
                                {auditor.email && auditor.email.length > 0 && (
                                    <div className="flex items-start gap-2">
                                        <Mail className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                        <div className="flex flex-col gap-1">
                                            {auditor.email.map((email: string, index: number) => (
                                                <a
                                                    key={index}
                                                    href={`mailto:${email}`}
                                                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    {email}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* No Results */}
                {filteredAuditors.length === 0 && (
                    <div className="text-center py-8">
                        <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-900">No auditors found</p>
                        <p className="text-sm text-gray-500">
                            Try adjusting your search terms
                        </p>
                    </div>
                )}
            </Card>

            {/* Add/Edit Form Modal */}
            <Modal
                isOpen={showForm}
                onClose={closeForm}
                title={editingAuditor ? 'Edit Auditor' : 'Add New Auditor'}
                size="lg"
            >
                <AuditorForm
                    initialData={editingAuditor}
                    onSubmit={editingAuditor ? handleEditAuditor : handleAddAuditor}
                    onCancel={closeForm}
                    isEditing={!!editingAuditor}
                    loading={btnLoading}
                />
            </Modal>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteAuditor}
                title="Delete Auditor"
                message={`Are you sure you want to delete "${auditorToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                loading={btnLoading}
            />
        </div>
    );
};