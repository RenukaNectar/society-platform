import { FileText } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

interface NotFoundProps {
  theme: any;
  title?: string;
  description?: string;
  enableButton?: boolean;
  buttonLabel?: string;
  onPress?: () => void;
  buttonIcon?: any
}

export const NotFound = ({ theme, title, description, enableButton, onPress, buttonLabel, buttonIcon }: NotFoundProps) => {
  return (
    <div className="w-full flex justify-center">
      <div className="w-full">
        <Card className="border-0 shadow-none">
          <div className="text-center py-12">
            <FileText className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className={`text-lg font-medium text-gray-900 ${theme}:text-gray-100 mb-2`}>
              {title || 'No data found'}
            </h3>
            <p className={`text-gray-500 ${theme}:text-gray-400 mb-6`}>
              {description || 'Get started by creating your first registration.'}
            </p>
            {enableButton && <Button onClick={onPress}>
              {buttonIcon}
              {buttonLabel || 'New Registration'}
            </Button>}
          </div>
        </Card>
      </div>
    </div>
  );
};
