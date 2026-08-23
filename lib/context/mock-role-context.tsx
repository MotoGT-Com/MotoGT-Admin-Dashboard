"use client";

/**
 * Role used for nav gating. Defaults to the authenticated user's dashboard
 * role from login. Header "Preview as" can override locally for demos.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AdminRole } from "@/lib/domain/admin-roles";
import { normalizeAdminRole } from "@/lib/domain/admin-roles";
import { useAuth } from "@/lib/context/auth-context";

export type MockRole = AdminRole;

interface MockRoleContextType {
  role: MockRole;
  setRole: (role: MockRole) => void;
  /** True when Preview as differs from the logged-in role. */
  isPreviewOverride: boolean;
  resetToAuthRole: () => void;
}

const MockRoleContext = createContext<MockRoleContextType | undefined>(
  undefined,
);

export function MockRoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const authRole = normalizeAdminRole(user?.role) ?? "admin";
  const [role, setRoleState] = useState<MockRole>(authRole);
  const [manualOverride, setManualOverride] = useState(false);

  useEffect(() => {
    if (!manualOverride) {
      setRoleState(authRole);
    }
  }, [authRole, manualOverride]);

  const setRole = (next: MockRole) => {
    setManualOverride(true);
    setRoleState(next);
  };

  const resetToAuthRole = () => {
    setManualOverride(false);
    setRoleState(authRole);
  };

  return (
    <MockRoleContext.Provider
      value={{
        role,
        setRole,
        isPreviewOverride: manualOverride && role !== authRole,
        resetToAuthRole,
      }}
    >
      {children}
    </MockRoleContext.Provider>
  );
}

export function useMockRole() {
  const context = useContext(MockRoleContext);
  if (context === undefined) {
    throw new Error("useMockRole must be used within a MockRoleProvider");
  }
  return context;
}
