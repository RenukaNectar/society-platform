import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card } from "../ui/Card";
import toast from "react-hot-toast";
import {
  getUserAvailability,
  setUserAvailability,
} from "../../lib/data/users/availability";
import { updateUser } from "../../store/slices/authSlice";
import { RootState } from "../../store";

interface UserAvailabilityCardProps {
  userId: string;
  initialIsAvailable?: boolean;
  onUpdated?: () => void;
}

export const UserAvailabilityCard: React.FC<UserAvailabilityCardProps> = ({
  userId,
  initialIsAvailable,
  onUpdated,
}) => {
  const dispatch = useDispatch();
  const authUser = useSelector((state: RootState) => state.auth.user);
  const [isAvailable, setIsAvailable] = useState(
    initialIsAvailable !== false,
  );
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setFetching(true);
        const summary = await getUserAvailability(userId);
        if (cancelled) return;

        if (summary) {
          setIsAvailable(summary.is_available !== false);
        } else if (initialIsAvailable !== undefined) {
          setIsAvailable(initialIsAvailable !== false);
        }
      } catch {
        if (!cancelled && initialIsAvailable !== undefined) {
          setIsAvailable(initialIsAvailable !== false);
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, initialIsAvailable]);

  const handleToggle = async (nextAvailable: boolean) => {
    const previous = isAvailable;
    setIsAvailable(nextAvailable);

    try {
      setLoading(true);
      const res: any = await setUserAvailability(userId, {
        isAvailable: nextAvailable,
      });

      if (res?.success === false) {
        setIsAvailable(previous);
        toast.error(res?.message || "Failed to update availability");
        return;
      }

      if (authUser?.id === userId) {
        dispatch(
          updateUser({
            ...authUser,
            is_available: nextAvailable,
          }),
        );
      }

      toast.success(
        nextAvailable
          ? "You are now marked as available"
          : "You are marked as unavailable"
      );
      onUpdated?.();
    } catch (e: any) {
      setIsAvailable(previous);
      toast.error(e?.message || "Failed to update availability");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 mb-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Work Availability</h3>

      <div className="flex items-center gap-3">
        <label
          className={`relative inline-flex items-center shrink-0 ${loading || fetching ? "opacity-60 pointer-events-none" : "cursor-pointer"}`}
        >
          <input
            type="checkbox"
            className="sr-only peer"
            checked={isAvailable}
            disabled={loading || fetching}
            onChange={(e) => handleToggle(e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600" />
        </label>
        <span className="text-sm text-gray-700">
          {fetching
            ? "Loading availability…"
            : isAvailable
              ? "Available for work"
              : "Unavailable (on leave)"}
        </span>
        {loading && (
          <span className="text-xs text-gray-400">Saving…</span>
        )}
      </div>
    </Card>
  );
};
