import React from "react";
import { Card } from "../ui/Card";

export const ConversionMeetingAccessBlock: React.FC = () => {
  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      <Card className="max-w-xl w-full p-8">
        <p className="text-center text-lg font-medium text-gray-800">
          First complete AGM or SGBM workflow
        </p>
      </Card>
    </div>
  );
};
