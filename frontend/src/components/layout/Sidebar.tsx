import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Edit,
  ClipboardCheck,
  Vote,
  Trash2,
  Search,
  Scale,
  User,
  Users,
  LogOut,
  Building2,
  RefreshCw,
  Shield,
  Key,
  Boxes,
  Layers,
} from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { usePermissions } from "../../hooks/usePermissions";
import { Button } from "../ui/Button";

/**
 * Environment check (from .env: VITE_NODE_ENV)
 * development -> local
 * production  -> live
 */
const IS_DEV = import.meta.env.VITE_NODE_ENV === "development";

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  module?: string;
  action?: "view" | "create" | "update" | "delete" | "approve" | "reject";
  always?: boolean;
  adminOnly?: boolean;
  applicantOnly?: boolean;
  devOnly?: boolean;
  devAdminOnly?: boolean;
}

const navItems: NavItem[] = [
  /* ---------------- DASHBOARD ---------------- */
  {
    name: "Dashboard",
    path: "/",
    icon: <LayoutDashboard className="h-5 w-5" />,
    module: "dashboard",
    action: "view",
  },

  /* ---------------- USERS ---------------- */
  {
    name: "Users",
    path: "/users",
    icon: <Users className="h-5 w-5" />,
    module: "users",
    action: "view",
    adminOnly: true,
  },

  /* -------- DEV + ADMIN ONLY -------- */
  // {
  //   name: "Permissions",
  //   path: "/permissions",
  //   icon: <Key className="h-5 w-5" />,
  //   // devAdminOnly: true,
  // },
  // {
  //   name: "Roles",
  //   path: "/roles",
  //   icon: <Shield className="h-5 w-5" />,
  //   // devAdminOnly: true,
  // },
  {
    name: "Modules",
    path: "/modules",
    icon: <Boxes className="h-5 w-5" />,
    module: "modules",
    action: "view",
    adminOnly: true,
  },

  /* ---------------- BUSINESS MODULES ---------------- */
  {
    name: "Societies",
    path: "/registrations",
    icon: <FileText className="h-5 w-5" />,
    module: "societies",
    action: "view",
  },
  {
    name: "Renewals",
    path: "/renewals",
    icon: <RefreshCw className="h-5 w-5" />,
    module: "renewals",
    action: "view",
  },
  {
    name: "Conversion",
    path: "/conversion-society",
    icon: <FileText className="h-5 w-5" />,
    module: "conversion",
    action: "view",
  },
  {
    name: "Annual Filings",
    path: "/annual-filings",
    icon: <FileText className="h-5 w-5" />,
    module: "annual-filing",
    action: "view",
  },
  {
    name: "Amendments",
    path: "/amendments",
    icon: <Edit className="h-5 w-5" />,
    module: "amendment",
    action: "view",
  },
  {
    name: "Audit Requests",
    path: "/audit-requests",
    icon: <ClipboardCheck className="h-5 w-5" />,
    module: "audit",
    action: "view",
  },
  {
    name: "Election Requests",
    path: "/election-requests",
    icon: <Vote className="h-5 w-5" />,
    module: "election",
    action: "view",
  },
  {
    name: "Liquidation",
    path: "/liquidation",
    icon: <Trash2 className="h-5 w-5" />,
    module: "liquidation",
    action: "view",
  },
  {
    name: "Inquiries / Inspections",
    path: "/inquiries",
    icon: <Search className="h-5 w-5" />,
    module: "inspection",
    action: "view",
  },
  {
    name: "Appeals",
    path: "/appeals",
    icon: <Scale className="h-5 w-5" />,
    module: "appeal",
    action: "view",
  },
  {
    name: "AGM",
    path: "/annual-general-meeting",
    icon: <FileText className="h-5 w-5" />,
    module: "agm",
    action: "view",
  },
  {
    name: "SGBM",
    path: "/special-annual-general-meeting",
    icon: <FileText className="h-5 w-5" />,
    module: "sgbm",
    action: "view",
  },
  {
    name: "Board of Directors",
    path: "/board-of-directors",
    icon: <Users className="h-5 w-5" />,
    module: "bod",
    action: "view",
  },
  {
    name: "Auditors",
    path: "/auditors",
    icon: <Users className="h-5 w-5" />,
    module: "auditors",
    action: "view",
    adminOnly: true,
  },

  /* ---------------- APPLICANT ---------------- */
  {
    name: "Business Activity",
    path: "/sector-of-operation",
    icon: <Layers className="h-5 w-5" />,
    always: true,
  },
  {
    name: "My Society",
    path: "/my-society",
    icon: <Building2 className="h-5 w-5" />,
    module: "my-society",
    action: "view",
    applicantOnly: true,
  },

  /* ---------------- ALWAYS ---------------- */
  {
    name: "Profile",
    path: "/profile",
    icon: <User className="h-5 w-5" />,
    always: true,
  },
];

export const Sidebar: React.FC = () => {
  const { signOut } = useAuth();
  const { canPerformAction, user, isAdmin } = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdminUser = isAdmin();
  const isApplicant = user?.role === "applicant";

  const getNavPath = (item: NavItem): string => {
    if (item.path === "/board-of-directors") {
      return isApplicant
        ? "/board-of-directors"
        : "/board-of-directors/meetings";
    }
    return item.path;
  };

  return (
    <div className="h-screen bg-indigo-600 text-white flex flex-col">
      {/* USER HEADER */}
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold">
              {user?.first_name?.[0] || ""}
              {user?.last_name?.[0] || ""}
            </span>
          </div>
          <div>
            <div className="font-semibold">
              {user?.first_name} {user?.last_name}
            </div>
            <div className="text-xs text-indigo-200">
              {user?.roleDescription}
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`
          nav::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {navItems.map((item) => {

          // DEV + ADMIN ONLY (THIS WAS MISSING)
          if (item.devAdminOnly && (!IS_DEV || !isAdminUser)) return null;

          // Dev-only menus hidden in production
          if (item.devOnly && !IS_DEV) return null;

          // Admin-only menus
          if (item.adminOnly && !isAdminUser) return null;

          // Applicant-only menus (e.g. My Society)
          if (item.applicantOnly && !isApplicant) return null;

          // Permission check (applicants always see Conversion in sidebar; access is gated on the page)
          if (!item.always && item.module && item.action && !isAdminUser) {
            const skipPermissionForApplicantMenu =
              isApplicant && (item.module === "conversion" || item.module === "sgbm");
            if (
              !skipPermissionForApplicantMenu &&
              !canPerformAction(item.module, item.action)
            ) {
              return null;
            }
          }

          return (
            <NavLink
              key={item.path}
              to={getNavPath(item)}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition ${isActive ||
                  (item.path !== "/" && location.pathname.startsWith(item.path))
                  ? "bg-indigo-700"
                  : "hover:bg-indigo-500"
                }`
              }
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="p-4 border-t border-indigo-500">
        <Button
          variant="ghost"
          className="w-full justify-start text-indigo-100 hover:bg-indigo-500 hover:text-white"
          onClick={() => {
            if (confirm("Are you sure to logout?")) {
              signOut();
              navigate("/login");
            }
          }}
        >
          <LogOut className="h-5 w-5" />
          <span className="ml-3">Log Out</span>
        </Button>
      </div>
    </div>
  );
};
