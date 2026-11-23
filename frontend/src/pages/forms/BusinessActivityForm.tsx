import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useMasterData } from '../../hooks/useMasterData';
import { CoorporativeMapping } from '../coorporativeForms/coorporativeMapping';
import { createBusinessActivity, updateBusinessActivity } from '../../lib/data/businessActivities/api';
import toast from 'react-hot-toast';

type BusinessActivityFormProps = {
  societyId: string;
  societyName: string;
  activityId?: string | null;
  initialSectorId?: string;
  initialAdditionalData?: any;
  onCancel: () => void;
  onSuccess: () => void;
};

export const BusinessActivityForm: React.FC<BusinessActivityFormProps> = ({
  societyId,
  societyName,
  activityId,
  initialSectorId = '',
  initialAdditionalData = null,
  onCancel,
  onSuccess,
}) => {
  const { masterData } = useMasterData();
  const [sectorOfOperation, setSectorOfOperation] = useState(initialSectorId);
  const [coorporativeSocietyType, setCoorporativeSocietyType] = useState('');
  const [additionalData, setAdditionalData] = useState<any>(initialAdditionalData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSectorOfOperation(initialSectorId || '');
    setAdditionalData(initialAdditionalData ?? null);
  }, [initialSectorId, initialAdditionalData, activityId]);

  useEffect(() => {
    if (!sectorOfOperation || !masterData.sectorOfOperations.length) return;
    const sector = masterData.sectorOfOperations.find(
      (item) => String(item.id) === String(sectorOfOperation)
    );
    if (sector?.respective_table) {
      setCoorporativeSocietyType(sector.respective_table);
    }
  }, [sectorOfOperation, masterData.sectorOfOperations]);

  const handleSectorChange = (value: string) => {
    setSectorOfOperation(value);
    setAdditionalData(null);
    const sector = masterData.sectorOfOperations.find((item) => String(item.id) === String(value));
    setCoorporativeSocietyType(sector?.respective_table || '');
  };

  const handleFormSubmit = async (data: any) => {
    if (!societyId) {
      toast.error('Society not found. Please complete society registration first.');
      return;
    }
    if (!sectorOfOperation) {
      toast.error('Please select a Sector Of Operation');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        sector_of_operation: sectorOfOperation,
        additional_data: data,
      };
      const response: any = activityId
        ? await updateBusinessActivity(activityId, payload)
        : await createBusinessActivity(societyId, payload);

      if (response?.success === false) {
        throw new Error(response?.message || 'Failed to save sector of operation');
      }

      toast.success(response?.message || 'Sector of operation submitted successfully');
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save sector of operation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card padding="md">
        <div className="mb-6 flex items-start justify-between gap-3">
          <p className="text-sm text-gray-500 mt-1">
            Select the sector of operation and fill the related form.
          </p>
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Society Name" value={societyName} disabled required />
          <Select
            label="Sector Of Operation"
            value={sectorOfOperation}
            onChange={(e) => handleSectorChange(e.target.value)}
            disabled={masterData.loading || saving}
            required
          >
            <option value="">-- Select --</option>
            {masterData.sectorOfOperations.map((sector) => (
              <option key={sector.id} value={sector.id}>
                {sector.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {coorporativeSocietyType ? (
        <Card padding="md">
          {saving && <p className="text-sm text-indigo-600 mb-3">Saving form data...</p>}
          <CoorporativeMapping
            societyType={coorporativeSocietyType}
            data={additionalData}
            onCancel={() => {
              if (!saving) onCancel();
            }}
            onClose={() => {
              if (!saving) onCancel();
            }}
            onSubmit={handleFormSubmit}
          />
        </Card>
      ) : (
        <Card padding="md">
          <p className="text-sm text-gray-500 text-center py-8">
            Select a Sector Of Operation to load the related form.
          </p>
        </Card>
      )}
    </div>
  );
};
