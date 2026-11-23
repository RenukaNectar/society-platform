import toast from "react-hot-toast";
import { Card } from "../ui/Card";
import { verifyBodOtp } from "../../lib/data/BOD/api";
import { useState } from "react";

export default function BodOtpVerify({
  bod,
  societyId,
  onChangeBod,
  onVerified,
  module_name,
}: any) {
  const [otp, setOtp] = useState(["", "", "", ""]);

  const handleChange = (val: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);
  };
  const [verifying, setVerifying] = useState(false);

  const verifyOtp = async () => {
    if (verifying) return;

    try {
      setVerifying(true);

      const res = await verifyBodOtp(
        bod?.id,
        societyId,
        otp.join(""),
        module_name,
      );

      if (res?.success) {
        toast.success(res?.message || "OTP Verified");
        onVerified();
      } else {
        toast.error(res?.message || "Invalid OTP");
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || error?.message || "Invalid OTP",
      );
    } finally {
      setVerifying(false);
    }
  };

  // const verifyOtp = async () => {
  //   try {
  //     const res = await verifyBodOtp(
  //       bod?.id,
  //       societyId,
  //       otp.join(""),
  //       module_name,
  //     );

  //     if (res?.success) {
  //       toast.success(res?.message || "OTP Verified");
  //       onVerified(); // ✅ redirect to form
  //     }
  //     //  else {
  //     //   toast.error(res?.message || "Invalid OTP");
  //     // }
  //   } catch (error: any) {
  //     toast.error(
  //       error?.response?.data?.message || error?.message || "Invalid OTP",
  //     );
  //   }
  // };

  return (
    <div className="w-full h-3/4  flex items-center justify-center">
      <Card className="p-6 space-y-6 max-w-md f">
        <h2 className="font-semibold text-lg">Verify OTP</h2>

        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="font-medium">{bod.name}</p>
          <p className="text-sm text-gray-500">{bod.email}</p>
          <p className="text-sm">XXXXXXXX{bod.mobile?.slice(-2)}</p>
        </div>

        {/* <div className="flex gap-3 justify-center">
        {otp.map((digit, i) => (
          <input
            key={i}
            value={digit}
            onChange={(e) => handleChange(e.target.value, i)}
            maxLength={1}
            className="w-12 h-12 text-center border rounded-lg text-xl"
          />
        ))}
      </div> */}
        <div className="flex gap-3 justify-center">
          {otp.map((digit, i) => (
            <input
              placeholder="0"
              key={i}
              value={digit}
              maxLength={1}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, ""); // only number
                handleChange(val, i);

                if (val && i < otp.length - 1) {
                  const nextInput = document.getElementById(`otp-${i + 1}`);
                  nextInput?.focus();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !otp[i] && i > 0) {
                  const prevInput = document.getElementById(`otp-${i - 1}`);
                  prevInput?.focus();
                }
              }}
              id={`otp-${i}`}
              className="w-12 h-12 text-center border rounded-lg text-xl"
            />
          ))}
        </div>

        <div className="flex gap-3 justify-between">
          <button onClick={onChangeBod} className="px-4 py-2 border rounded-lg">
            Change BOD
          </button>

          <button className="px-4 py-2 border rounded-lg">Resend OTP</button>

          <button
            disabled={verifying}
            onClick={verifyOtp}
            className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {verifying ? "Verifying..." : "Submit"}
          </button>
        </div>
      </Card>
    </div>
  );
}
