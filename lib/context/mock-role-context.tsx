"use client";

/**
 * Dev-only mock role switcher for previewing role-scoped navigation
 * (see components/sidebar.tsx and components/header.tsx). Not tied to
 * real auth — swap for the real role from useAuth() once roles/permissions
 * are wired up server-side.
 */

import { createContext, useContext, useState, type ReactNode } from "react";

export type MockRole = "admin" | "store_staff";

interface MockRoleContextType {
  role: MockRole;
  setRole: (role: MockRole) => void;
}

const MockRoleContext = createContext<MockRoleContextType | undefined>(
  undefined
);

export function MockRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<MockRole>("admin");

  return (
    <MockRoleContext.Provider value={{ role, setRole }}>
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
