import React from "react";
import { Info } from "lucide-react";
import { Card } from "../ui/Card";
import { convertKeyToText } from "../../utils/convertKeyToText";
import {
  formatCooperativeFieldValue,
  getConversionFieldLabel,
  normalizeConversionFormData,
} from "../../utils/conversionFormData";

type AdditionalDetailsProps = {
  additionalData: any;
  title?: string;
  /** Use cooperative-form field labels and flatten nested sector form data */
  useConversionLabels?: boolean;
};

const isEmptyDetailValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (typeof value === "number" || typeof value === "boolean") return false;
  if (Array.isArray(value)) {
    return value.length === 0 || value.every(isEmptyDetailValue);
  }
  if (typeof value === "object") {
    const entries = Object.values(value as Record<string, unknown>);
    return entries.length === 0 || entries.every(isEmptyDetailValue);
  }
  return false;
};

export const AdditionalDetails = ({
  additionalData,
  title = "Additional Information",
  useConversionLabels = false,
}: AdditionalDetailsProps) => {
  if (!additionalData) return null;

  const formatFieldLabel = (key: string) =>
    useConversionLabels ? getConversionFieldLabel(key) : convertKeyToText(key);

  const renderEmpty = () => (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300 rounded-full">
      Not Found
    </span>
  );

  const renderValue = (key: string, value: any): React.ReactNode => {
    if (isEmptyDetailValue(value)) {
      return renderEmpty();
    }

    if (
      useConversionLabels &&
      (typeof value !== "object" || value === null)
    ) {
      const formatted = formatCooperativeFieldValue(key, value);
      if (formatted === "-") {
        return renderEmpty();
      }
      return <span className="text-gray-900">{formatted}</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return renderEmpty();
      }

      if (typeof value[0] === "object" && value[0] !== null) {
        return (
          <div className="space-y-2">
            {value.map((item: any, index: number) => (
              <div
                key={index}
                className="bg-gray-50 p-2 rounded border-l-2 border-blue-200"
              >
                {Object.entries(item).map(([itemKey, val]) => (
                  <div key={itemKey} className="text-xs">
                    <span className="font-medium text-gray-700">
                      {formatFieldLabel(itemKey)}:{" "}
                    </span>
                    <span className="text-gray-600">
                      {renderValue(itemKey, val)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      }

      return <span className="text-gray-900">{value.join(", ")}</span>;
    }

    if (typeof value === "object" && value !== null) {
      return (
        <div className="bg-gray-50 p-2 rounded border-l-2 border-green-200">
          {Object.entries(value).map(([objKey, val]) => (
            <div key={objKey} className="text-xs">
              <span className="font-medium text-gray-700">
                {formatFieldLabel(objKey)}:{" "}
              </span>
              <span className="text-gray-600">{renderValue(objKey, val)}</span>
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === "boolean") {
      return (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {value ? "Yes" : "No"}
        </span>
      );
    }

    if (typeof value === "string" && value.trim() === "") {
      return renderEmpty();
    }

    return <span className="text-gray-900">{String(value)}</span>;
  };

  const renderField = (key: string, value: any) => {
    if (useConversionLabels && isEmptyDetailValue(value)) {
      return null;
    }

    return (
      <div key={key} className="flex flex-col">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
          {formatFieldLabel(key)}
        </span>
        <div className="text-sm font-medium text-gray-900">
          {renderValue(key, value)}
        </div>
      </div>
    );
  };

  const getDisplayData = () => {
    try {
      const parsed =
        typeof additionalData === "string"
          ? JSON.parse(additionalData)
          : additionalData;

      if (useConversionLabels) {
        return normalizeConversionFormData(parsed);
      }

      return parsed;
    } catch {
      return null;
    }
  };

  const displayData = getDisplayData();

  if (!displayData || Object.keys(displayData).length === 0) {
    return null;
  }

  const fields = Object.entries(displayData)
    .filter(([, value]) => {
      if (!useConversionLabels) return true;
      return !isEmptyDetailValue(value);
    })
    .sort(([keyA], [keyB]) => {
      if (!useConversionLabels) return 0;
      if (keyA === "society_form_type") return -1;
      if (keyB === "society_form_type") return 1;
      return 0;
    });

  if (fields.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Info className="w-5 h-5 mr-2 text-blue-600" />
          {title}
        </h3>
        <p className="text-sm text-gray-400">--</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Info className="w-5 h-5 mr-2 text-blue-600" />
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fields.map(([key, value]) => renderField(key, value))}
      </div>
    </Card>
  );
};
