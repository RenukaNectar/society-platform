import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useMasterData } from '../hooks/useMasterData';
import { CoorporativeMapping } from './coorporativeForms/coorporativeMapping';
import { getMySociety } from '../lib/data/users/api';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

export const SectorOfOperation: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const isCertificateIssued = useSelector(
    (state: RootState) => state.society.isCertificateIssued
  );
  const { masterData } = useMasterData();

  const [societyId, setSocietyId] = useState('');
  const [societyName, setSocietyName] = useState('');
  const [sectorOfOperation, setSectorOfOperation] = useState('');
  const [coorporativeSocietyType, setCoorporativeSocietyType] = useState('');
  const [additionalData, setAdditionalData] = useState<any>(null);
  const [loadingSociety, setLoadingSociety] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSociety = async () => {
      if (user?.role !== 'applicant' || !isCertificateIssued) return;

      setLoadingSociety(true);
      try {
        const response = await getMySociety();
        const society = response?.data?.society;
        if (society) {
          setSocietyId(String(society.id || ''));
          setSocietyName(society.cooperative_society_name || society.name || '');
          const sectorId = society.sector_of_operation?.id || society.sector_of_operation || '';
          if (sectorId) setSectorOfOperation(String(sectorId));
          if (society.additional_data) setAdditionalData(society.additional_data);

          const respectiveTable =
            society.sector_of_operation?.respective_table ||
            masterData.sectorOfOperations.find((s) => String(s.id) === String(sectorId))?.respective_table;
          if (respectiveTable) setCoorporativeSocietyType(respectiveTable);
        }
      } catch (error) {
        console.error('Failed to load society', error);
      } finally {
        setLoadingSociety(false);
      }
    };

    loadSociety();
  }, [user, isCertificateIssued]);

  useEffect(() => {
    if (!sectorOfOperation || !masterData.sectorOfOperations.length) return;

    const sector = masterData.sectorOfOperations.find(
      (s) => String(s.id) === String(sectorOfOperation)
    );
    if (sector?.respective_table) {
      setCoorporativeSocietyType(sector.respective_table);
    }
  }, [sectorOfOperation, masterData.sectorOfOperations]);

  const handleSectorChange = (value: string) => {
    setSectorOfOperation(value);
    setAdditionalData(null);

    const sector = masterData.sectorOfOperations.find((s) => String(s.id) === String(value));
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
      const response: any = await api.put(`/society-registrations/${societyId}/additional-data`, {
        sector_of_operation: sectorOfOperation,
        additional_data: data,
      });

      if (!response?.success) {
        throw new Error(response?.message || 'Failed to update sector of operation');
      }

      setAdditionalData(data);
      toast.success(response?.message || 'Sector of operation form updated successfully');
    } catch (error) {
      console.error('Failed to update sector of operation', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update sector of operation');
    } finally {
      setSaving(false);
    }
  };

  if (!isCertificateIssued) {
    return (
      <div className="flex justify-center items-center h-[90vh] bg-white rounded-lg p-4">
        <div className="flex flex-col items-center justify-center space-y-4">
          <h1 className="text-2xl font-bold">Society is under review</h1>
          <h3>Please wait for the review to be completed</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card padding="md">
        <div className="mb-6">
          <p className="text-sm text-gray-500 mt-1">
            Select society details and fill the sector of operation form.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Society Name"
            placeholder="Enter society name"
            value={societyName}
            onChange={(e) => setSocietyName(e.target.value)}
            disabled={loadingSociety}
            required
          />

          <Select
            label="Sector Of Operation"
            value={sectorOfOperation}
            onChange={(e) => handleSectorChange(e.target.value)}
            disabled={masterData.loading || saving}
            required
          >
            <option value="">-- Select --</option>
            {masterData.loading ? (
              <option value="" disabled>Loading...</option>
            ) : (
              masterData.sectorOfOperations.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))
            )}
          </Select>
        </div>
      </Card>

      {coorporativeSocietyType ? (
        <Card padding="md">
          {saving && (
            <p className="text-sm text-indigo-600 mb-3">Saving form data...</p>
          )}
          <CoorporativeMapping
            societyType={coorporativeSocietyType}
            data={additionalData}
            onCancel={() => {
              if (saving) return;
              setCoorporativeSocietyType('');
              setSectorOfOperation('');
              setAdditionalData(null);
            }}
            onClose={() => {
              if (saving) return;
              setCoorporativeSocietyType('');
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
