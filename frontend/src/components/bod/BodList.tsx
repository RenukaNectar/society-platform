import React, { useEffect, useState } from "react";
import { Card } from "../ui/Card";
import { getBodList, sendBodOtp } from "../../lib/data/BOD/api";
import { getCurrentUserSociety } from "../../lib/data/societies/api";
import { LiquidationModule } from "../../pages/modules/LiquidationModule";
import toast from "react-hot-toast";

const maskNumber = (num: string) => {
  if (!num) return "-";
  return "********" + num.slice(-2);
};

type BodListProps = {
  onSelect: (bod: any, societyId: string) => void;
  module_name: "liquidation" | "conversion";
};
export default function BodList({ onSelect, module_name }: BodListProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [societyId, setSocietyId] = useState<string>("");
  const [is_verified, setis_verified] = useState<number>();

  const [data, setdata] = useState();

  // ================= FETCH CURRENT USER SOCIETY =================

  useEffect(() => {
    const loadSociety = async () => {
      try {
        const res = await getCurrentUserSociety();
        setdata(res);
        // setMembers(Array.isArray(res?.members) ? res.members : []);

        const id = res?.society?.id || res?.society_id;
        if (id) setSocietyId(id);
      } catch (err) {
        console.log("ERROR LOADING SOCIETY", err);
        setMembers([]);
      }
    };

    loadSociety();
  }, []);

  useEffect(() => {
    const handleBod = async () => {
      try {
        const res = await getBodList(societyId, module_name);
        setMembers(res?.data?.members);
        setis_verified(res?.data?.is_verified);
      } catch (error) {
        console.log("Error fetching BOD:", error);
      }
    };

    if (societyId) {
      handleBod();
    }
  }, [societyId]);

  // ================= SEND OTP =================
  const handleSendOtp = async () => {
    const bod = members.find((b) => b.id === selectedId);

    if (!bod) return;

    try {
      const res = await sendBodOtp(bod.id, societyId, module_name);

      if (res?.success) {
        toast.success(res?.message);
        onSelect(bod, societyId);
      } else {
        console.log("OTP failed:", res?.data?.message);
      }
    } catch (err) {
      console.log("SEND OTP ERROR", err);
    }
  };

  return (
    <>
      {data?.society?.status?.key === "certificate_issued" ? (
        <Card className="p-6 rounded-2xl shadow-sm border space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-xl text-gray-900">
              Board Of Directors
            </h2>

            <button
              disabled={!selectedId}
              onClick={handleSendOtp}
              className="w-auto bg-indigo-600 text-white px-4 py-3 rounded-xl font-medium shadow-sm
            hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send OTP
            </button>
          </div>

          {members.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">
              No members found
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {members.map((m) => {
                const isSelected = selectedId === m.id;

                return (
                  <label
                    key={m.id}
                    className={`flex items-center justify-between gap-4 border rounded-xl p-4 cursor-pointer transition
                    ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50 shadow-sm"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 uppercase">
                        {m?.name ? m.name.charAt(0) : "?"}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 text-base">
                            {m?.name || "-"}
                          </p>

                          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-3 py-1 rounded-full">
                            {m?.designation || "-"}
                          </span>

                          <span className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full capitalize">
                            {m?.gender || "-"}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-gray-800">
                            Mobile:
                          </span>{" "}
                          {m?.mobile ? maskNumber(m.mobile) : "-"}
                        </p>
                      </div>
                    </div>

                    <input
                      type="radio"
                      name="bod"
                      checked={isSelected}
                      onChange={() => setSelectedId(m.id)}
                      className="w-5 h-5 accent-indigo-600 cursor-pointer"
                    />
                  </label>
                );
              })}
            </div>
          )}
        </Card>
      ) : (
        <div className="flex justify-center items-center h-[90vh] bg-white rounded-lg p-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            <h1 className="text-2xl font-bold">Society is under review</h1>
            <h3 className="text-gray-600">
              Please wait for the review to be completed
            </h3>
          </div>
        </div>
      )}
    </>
  );
}
