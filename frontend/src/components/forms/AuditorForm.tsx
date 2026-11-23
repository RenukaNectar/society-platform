import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Plus } from 'lucide-react';

interface AuditorFormData {
    name: string;
    address: string;
    mobile1: string;
    mobile2: string;
    email: any;
}

interface AuditorFormProps {
    initialData?: AuditorFormData;
    onSubmit: (data: AuditorFormData) => void;
    onCancel: () => void;
    isEditing?: boolean;
    loading?: boolean;
}

export const AuditorForm: React.FC<AuditorFormProps> = ({
    initialData,
    onSubmit,
    onCancel,
    isEditing = false,
    loading = false
}) => {
    const [formData, setFormData] = useState<AuditorFormData>({
        name: '',
        address: '',
        mobile1: '',
        mobile2: '',
        email: ['']
    });

    const [errors, setErrors] = useState<Partial<AuditorFormData>>({});

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const validateForm = (): boolean => {
        const newErrors: Partial<AuditorFormData> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        } else if (formData.name.length > 255) {
            newErrors.name = 'Name must be less than 255 characters';
        }

        if (!formData.address.trim()) {
            newErrors.address = 'Address is required';
        } else if (formData.address.length > 1000) {
            newErrors.address = 'Address must be less than 1000 characters';
        }

        if (!formData.mobile1.trim()) {
            newErrors.mobile1 = 'Mobile 1 is required';
        } else if (!/^\d{10}$/.test(formData.mobile1)) {
            newErrors.mobile1 = 'Mobile 1 must be exactly 10 digits';
        }

        if (formData.mobile2 && !/^\d{10}$/.test(formData.mobile2)) {
            newErrors.mobile2 = 'Mobile 2 must be exactly 10 digits';
        }

        if (!formData.email.length || !formData.email[0].trim()) {
            newErrors.email = 'At least one email is required';
        } else {
            const emailErrors = formData.email.map((email: any) => {
                if (!email.trim()) return 'Email cannot be empty';
                if (!email.includes('@')) return 'Invalid email format';
                return null;
            }).filter(Boolean);
            
            if (emailErrors.length > 0) {
                newErrors.email = emailErrors[0];
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            // Filter out empty emails
            const filteredEmails = formData.email.filter((email: any) => email.trim());
            onSubmit({
                ...formData,
                email: filteredEmails
            });
        }
    };

    const addEmail = () => {
        setFormData(prev => ({
            ...prev,
            email: [...prev.email, '']
        }));
    };

    const removeEmail = (index: number) => {
        if (formData.email.length > 1) {
            setFormData(prev => ({
                ...prev,
                email: prev.email.filter((_: any, i: any) => i !== index)
            }));
        }
    };

    const updateEmail = (index: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            email: prev.email.map((email: any, i: any) => i === index ? value : email)
        }));
    };

    return (
        <div>
            <div className="mb-4">
                <p className="text-gray-600">
                    {isEditing ? 'Update auditor information below' : 'Enter auditor details below'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                    <Input
                        label="Auditor Name *"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        error={errors.name}
                        placeholder="Enter auditor name"
                        required
                    />
                </div>

                {/* Address */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address *
                    </label>
                    <textarea
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter complete address"
                        rows={3}
                        required
                    />
                    {errors.address && (
                        <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                    )}
                </div>

                {/* Mobile Numbers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Mobile 1 *"
                        value={formData.mobile1}
                        onChange={(e) => setFormData(prev => ({ ...prev, mobile1: e.target.value }))}
                        error={errors.mobile1}
                        placeholder="Enter mobile number"
                        required
                    />
                    <Input
                        label="Mobile 2 (Optional)"
                        value={formData.mobile2}
                        onChange={(e) => setFormData(prev => ({ ...prev, mobile2: e.target.value }))}
                        error={errors.mobile2}
                        placeholder="Enter mobile number"
                    />
                </div>

                {/* Email Addresses */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Addresses *
                    </label>
                    <div className="space-y-3">
                        {formData.email.map((email: any, index: any) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => updateEmail(index, e.target.value)}
                                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.email ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Enter email address"
                                    required={index === 0}
                                />
                                {formData.email.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => removeEmail(index)}
                                        className="px-3 py-2"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={addEmail}
                            className="flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add Email
                        </Button>
                    </div>
                    {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={loading}
                        loading={loading}
                    >
                        {isEditing ? 'Update Auditor' : 'Add Auditor'}
                    </Button>
                </div>
            </form>
        </div>
    );
};
