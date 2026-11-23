import { FileText } from "lucide-react";
import { Card } from "../ui/Card";

export type AttachmentValue = string | Record<string, string>;

export interface AttachmentType {
  attachments: {
    [key: string]: AttachmentValue;
  };
}

export const Attachments: React.FC<AttachmentType> = ({ attachments }) => {
  const renderAttachment = (label: string, url: string, index: number) => {
    const fileName = url.split('/').pop() || 'document';
    return (
      <li key={`${label}-${index}`} className="flex items-center space-x-2">
        <FileText className="w-4 h-4" />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
          download
        >
          {label.replace(/_/g, ' ')} ({decodeURIComponent(fileName)})
        </a>
      </li>
    );
  };

  return (
    <Card className="p-4" padding="sm">
      <h3 className="font-semibold mb-3">Attached Documents</h3>
      <ul className="space-y-2 text-blue-600 text-sm">
        {Object.keys(attachments)?.length > 0 ? (
          Object.entries(attachments).map(([key, value], index) => {
            if (typeof value === "string") {
              return renderAttachment(key, value, index);
            } else if (typeof value === "object") {
              return Object.entries(value).map(([subKey, subVal], subIndex) =>
                renderAttachment(`${key} - ${subKey}`, subVal, subIndex)
              );
            } else {
              return null;
            }
          })
        ) : (
          <li className="text-gray-500">No attachments found.</li>
        )}
      </ul>
    </Card>
  );
};
