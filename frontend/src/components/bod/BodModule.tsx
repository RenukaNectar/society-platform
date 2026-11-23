import { useState } from "react";
import BodList from "./BodList";
import BodOtpVerify from "./BodOtpVerify";

export default function BodModule({
  module_name,
  onVerified,
}: {
  module_name: string;
  onVerified: () => void;
}) {
  const [selectedBod, setSelectedBod] = useState<any>(null);
  const [selectedSocietyId, setSelectedSocietyId] = useState<string>("");

  return (
    <>
      {!selectedBod ? (
        <BodList
          module_name={module_name}
          onSelect={(bod, societyId) => {
            setSelectedBod(bod);
            setSelectedSocietyId(societyId);
          }}
        />
      ) : (
        <BodOtpVerify
          module_name={module_name}
          bod={selectedBod}
          societyId={selectedSocietyId}
          onChangeBod={() => {
            setSelectedBod(null);
            setSelectedSocietyId("");
          }}
          onVerified={onVerified} // ✅ important
        />
      )}
    </>
  );
}
