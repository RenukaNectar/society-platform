import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { getAllStatuses } from "../../lib/data/others/api";
import { setStatuses } from "../../store/slices/statusSlice";
import moment from "moment";

import { getMySociety } from "../../lib/data/users/api";
import { setSocietyStatus } from "../../store/slices/societySlice";
import { fetchPermissionsByRole } from "../../store/slices/thunks/permissionThunks";

const getPageTitle = (pathname: string): string => {
  const routes: Record<string, string> = {
    '/users': 'Users',
    '/permissions': 'Permissions',
    '/roles': 'Roles',
    '/modules': 'Modules',
    '/registrations': 'Society Registrations',
    '/conversion-society': 'Conversion Society',
    '/renewals': 'Renewals',
    '/annual-filings': 'Annual Filing',
    '/amendments': 'Amendments',
    '/audit-requests': 'Audit Requests',
    '/election-requests': 'Election Requests',
    '/liquidation': 'Liquidation',
    '/liquidations': 'Liquidation Details',
    '/inquiries': 'Inquiries / Inspections',
    '/appeals': 'Appeals',
    '/profile': 'Profile',
    '/notifications': 'Notifications',
    '/settings': 'Settings',
    '/my-society': 'My Society',
    '/society': 'My Society',
    '/sector-of-operation': 'Business Activity',
    '/annual-general-meeting': 'Annual General Meeting',
    '/board-of-directors': 'Board of Directors',
    '/board-of-directors-meeting': 'BOD Meeting',
    '/special-annual-general-meeting': 'Special General Body Meeting',
    '/auditors': 'Auditors',
    '/history': 'History',
    '/': 'Dashboard',
  };

  const match = Object.keys(routes).find(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  return (match && routes[match]) || "Dashboard";
};

export const Layout: React.FC = () => {
  const location = useLocation();
  const title = getPageTitle(location.pathname);
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();

  const getRoleId = (u: any): string | null => {
    if (!u) return null;
    const id = u?.role_id || u?.role?.id || (typeof u?.role === "string" ? u.role : null);
    return id ? String(id) : null;
  };

  useEffect(() => {
    if (!user) return;

    const initLayout = async () => {
      const roleId = getRoleId(user);

      // Keep permissions independent from other APIs so sidebar still works on reload.
      if (roleId) {
        fetchPermissionsByRole(roleId).catch((err) => {
          console.error("Failed to fetch permissions in layout", err);
        });
      }

      getMySociety()
        .then((meRes) => {
          const statusKey =
            meRes?.data?.society?.statusDetails?.key ??
            meRes?.data?.society?.status?.key ??
            null;
          dispatch(setSocietyStatus(statusKey));
        })
        .catch((err) => {
          console.error("Failed to fetch society status", err);
        });

      try {
        const res = await getAllStatuses();
        dispatch(setStatuses(res));
      } catch (err) {
        console.error("Failed to fetch statuses", err);
      }
    };

    initLayout();
  }, [dispatch, user]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Fixed height, internal scroll */}
      <div className="w-64 flex-shrink-0 h-screen">
        <Sidebar />
      </div>

      {/* Main content area - Fixed height, internal scroll */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6 pt-0 bg-gray-50">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>Copyright © {moment().year()} RCS</span>
            <div className="flex space-x-4">
              <a
                href="/terms-and-conditions"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-700"
              >
                Terms & Conditions
              </a>
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-700"
              >
                Privacy Policy
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};