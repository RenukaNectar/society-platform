interface AssigneeUnavailableNoticeProps {
  visible: boolean;
  assigneeName: string;
  unavailableUntil?: string | null;
  onReassign: () => void;
}

export const AssigneeUnavailableNotice: React.FC<
  AssigneeUnavailableNoticeProps
> = ({ visible, assigneeName, unavailableUntil, onReassign }) => {
  if (!visible) return null;

  return (
    <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 shadow-sm">
      <p className="font-semibold">Assigned officer unavailable</p>
      <p className="mt-1 text-amber-900">
        <span className="font-medium">{assigneeName}</span> is not available (on
        leave). This application has been returned to you. Reassign it to another
        available officer using the button below or in the action bar.
      </p>
      {unavailableUntil && (
        <p className="mt-1 text-xs text-amber-800">
          Until: {new Date(unavailableUntil).toLocaleDateString()}
        </p>
      )}
      <button
        type="button"
        className="mt-3 inline-flex items-center rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1"
        onClick={onReassign}
      >
        Reassign to another officer
      </button>
    </div>
  );
};
