"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Pencil,
  ShieldOff,
  ShieldAlert,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/lib/context/auth-context";
import { useMockRole } from "@/lib/context/mock-role-context";
import {
  ADMIN_ROLES,
  ADMIN_ROLE_DESCRIPTIONS,
  ADMIN_ROLE_LABELS,
  canAccessAdminSettings,
  isLastSuperAdmin,
  type AdminRole,
} from "@/lib/domain/admin-roles";
import { LoadingState } from "@/components/loading-state";
import { adminService, type AdminTeamMember } from "@/lib/services/admin.service";

type FormMode = "create" | "edit";

interface AdminFormState {
  name: string;
  email: string;
  role: AdminRole;
  password: string;
  confirmPassword: string;
}

const emptyForm = (): AdminFormState => ({
  name: "",
  email: "",
  role: "admin",
  password: "",
  confirmPassword: "",
});

const MIN_PASSWORD_LENGTH = 8;

function validatePasswordPair(
  password: string,
  confirmPassword: string,
  required: boolean,
): string | null {
  if (!required && !password && !confirmPassword) return null;
  if (required && !password) return "Password is required";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (password !== confirmPassword) return "Passwords do not match";
  return null;
}

function formatLastLogin(value: string | null): string {
  if (!value) return "Never";
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

function roleBadgeClass(role: AdminRole): string {
  switch (role) {
    case "super_admin":
      return "bg-primary/15 text-primary";
    case "admin":
      return "bg-blue-500/15 text-blue-600 dark:text-blue-300";
    case "store_staff":
      return "bg-muted text-muted-foreground";
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "active":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "inactive":
      return "bg-muted text-muted-foreground";
    case "suspended":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function AdminSettingsPage() {
  const { role } = useMockRole();
  const { user } = useAuth();

  const [admins, setAdmins] = useState<AdminTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingAdmin, setEditingAdmin] = useState<AdminTeamMember | null>(
    null,
  );
  const [form, setForm] = useState<AdminFormState>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<AdminTeamMember | null>(
    null,
  );

  const allowed = canAccessAdminSettings(role);

  const loadAdmins = useCallback(async () => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const data = await adminService.listAdmins({
        page: 1,
        limit: 100,
        status: "active",
      });
      setAdmins(data.items);
    } catch (error: any) {
      setLoadError(error.message || "Failed to load admins");
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, [allowed]);

  useEffect(() => {
    void loadAdmins();
  }, [loadAdmins]);

  const currentAdminId = useMemo(() => {
    if (user?.userId) {
      const byId = admins.find((a) => a.id === user.userId);
      if (byId) return byId.id;
    }
    const email = user?.email?.toLowerCase();
    if (email) {
      const byEmail = admins.find((a) => a.email.toLowerCase() === email);
      if (byEmail) return byEmail.id;
    }
    return null;
  }, [admins, user?.email, user?.userId]);

  if (!allowed) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage who can access the dashboard and what they can do.
          </p>
        </div>
        <Card>
          <CardHeader className="items-center text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <ShieldAlert className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>Access denied</CardTitle>
            <CardDescription>
              Only Super Admins can manage admin accounts. Ask a Super Admin if
              you need access.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button variant="outline" asChild>
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const openCreate = () => {
    setFormMode("create");
    setEditingAdmin(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (admin: AdminTeamMember) => {
    setFormMode("edit");
    setEditingAdmin(admin);
    setForm({
      name: admin.name,
      email: admin.email,
      role: admin.role,
      password: "",
      confirmPassword: "",
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingAdmin(null);
    setForm(emptyForm());
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = async () => {
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    if (!name || !email) {
      toast.error("Name and email are required");
      return;
    }
    if (!email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }

    const passwordError = validatePasswordPair(
      form.password,
      form.confirmPassword,
      formMode === "create",
    );
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (
      formMode === "edit" &&
      editingAdmin &&
      editingAdmin.role === "super_admin" &&
      form.role !== "super_admin" &&
      isLastSuperAdmin(admins, editingAdmin.id)
    ) {
      toast.error("Cannot demote the last Super Admin");
      return;
    }

    setSaving(true);
    try {
      if (formMode === "create") {
        await adminService.createAdmin({
          name,
          email,
          password: form.password,
          role: form.role,
        });
        toast.success(`Admin ${email} created`);
      } else if (editingAdmin) {
        const payload: {
          name?: string;
          role?: AdminRole;
          password?: string;
        } = {};
        if (name !== editingAdmin.name) payload.name = name;
        if (form.role !== editingAdmin.role) payload.role = form.role;
        if (form.password) payload.password = form.password;

        if (Object.keys(payload).length === 0) {
          toast.message("No changes to save");
          closeForm();
          return;
        }

        await adminService.updateAdmin(editingAdmin.id, payload);
        toast.success(
          form.password ? "Admin updated (password set)" : "Admin updated",
        );
      }
      closeForm();
      await loadAdmins();
    } catch (error: any) {
      toast.error(error.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    if (removeTarget.id === currentAdminId) {
      toast.error("You cannot remove your own access");
      setRemoveTarget(null);
      return;
    }
    if (isLastSuperAdmin(admins, removeTarget.id)) {
      toast.error("Cannot remove the last Super Admin");
      setRemoveTarget(null);
      return;
    }

    setRemoving(true);
    try {
      await adminService.removeAdmin(removeTarget.id);
      toast.success(`Removed access for ${removeTarget.email}`);
      setRemoveTarget(null);
      await loadAdmins();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove access");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage who can access the dashboard and what they can do.
            </p>
          </div>
          <Button
            className="gap-2 shrink-0"
            onClick={openCreate}
            disabled={loading}
          >
            <Plus size={16} />
            Add admin
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Admin team</CardTitle>
            <CardDescription>
              Super Admins control access. Admins can use the full dashboard
              except this page. Store Staff see counter tools only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {loading && admins.length > 0 ? (
                <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-primary/20">
                  <div className="h-full w-1/3 animate-pulse bg-primary" />
                </div>
              ) : null}
              {loading && admins.length === 0 ? (
                <LoadingState label="Loading admins…" />
              ) : loadError ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <p className="text-sm text-destructive">{loadError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadAdmins()}
                  >
                    Retry
                  </Button>
                </div>
              ) : admins.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    No admins yet. Add someone with email and password to get
                    started.
                  </p>
                  <Button className="gap-2" onClick={openCreate}>
                    <Plus size={16} />
                    Add admin
                  </Button>
                </div>
              ) : (
                <div
                  className={
                    loading
                      ? "overflow-x-auto opacity-60 pointer-events-none transition-opacity"
                      : "overflow-x-auto transition-opacity"
                  }
                >
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">Name</th>
                      <th className="pb-3 pr-4 font-medium">Email</th>
                      <th className="pb-3 pr-4 font-medium">Role</th>
                      <th className="pb-3 pr-4 font-medium">Status</th>
                      <th className="pb-3 pr-4 font-medium">Last login</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin) => {
                      const isSelf = admin.id === currentAdminId;
                      const cannotRemove =
                        isSelf || isLastSuperAdmin(admins, admin.id);
                      const removeReason = isSelf
                        ? "You cannot remove your own access"
                        : isLastSuperAdmin(admins, admin.id)
                          ? "Cannot remove the last Super Admin"
                          : null;

                      return (
                        <tr
                          key={admin.id}
                          className="border-b border-border/60 last:border-0"
                        >
                          <td className="py-3.5 pr-4 font-medium">
                            {admin.name}
                            {isSelf ? (
                              <span className="ml-2 text-xs font-normal text-muted-foreground">
                                (you)
                              </span>
                            ) : null}
                          </td>
                          <td className="py-3.5 pr-4 text-muted-foreground">
                            {admin.email}
                          </td>
                          <td className="py-3.5 pr-4">
                            <div className="flex flex-col gap-0.5">
                              <span
                                className={`inline-flex w-fit rounded-md px-2 py-0.5 text-xs font-medium ${roleBadgeClass(admin.role)}`}
                              >
                                {ADMIN_ROLE_LABELS[admin.role]}
                              </span>
                              <span className="text-xs text-muted-foreground max-w-[220px]">
                                {ADMIN_ROLE_DESCRIPTIONS[admin.role]}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 pr-4">
                            <span
                              className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium capitalize ${statusBadgeClass(admin.status)}`}
                            >
                              {admin.status}
                            </span>
                          </td>
                          <td className="py-3.5 pr-4 text-muted-foreground whitespace-nowrap">
                            {formatLastLogin(admin.lastLoginAt)}
                          </td>
                          <td className="py-3.5">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Edit ${admin.name}`}
                                onClick={() => openEdit(admin)}
                              >
                                <Pencil size={14} />
                              </Button>
                              {cannotRemove ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex">
                                      <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        disabled
                                        aria-label="Remove access unavailable"
                                      >
                                        <ShieldOff size={14} />
                                      </Button>
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {removeReason}
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Remove access for ${admin.name}`}
                                  onClick={() => setRemoveTarget(admin)}
                                >
                                  <ShieldOff size={14} />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={formOpen} onOpenChange={(open) => !open && closeForm()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {formMode === "create" ? "Add admin" : "Edit admin"}
              </DialogTitle>
              <DialogDescription>
                {formMode === "create"
                  ? "Create an account with email, password, and role. They can sign in right away."
                  : "Update name, role, or set a new password."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="admin-name">Name *</Label>
                <Input
                  id="admin-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Full name"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-email">Email *</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={form.email}
                  disabled={formMode === "edit"}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="name@motogt.com"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label>Role *</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, role: v as AdminRole }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADMIN_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ADMIN_ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {ADMIN_ROLE_DESCRIPTIONS[form.role]}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">
                  {formMode === "create" ? "Password *" : "New password"}
                </Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                    placeholder={
                      formMode === "create"
                        ? "At least 8 characters"
                        : "Leave blank to keep current"
                    }
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-confirm-password">
                  {formMode === "create"
                    ? "Confirm password *"
                    : "Confirm new password"}
                </Label>
                <div className="relative">
                  <Input
                    id="admin-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeForm} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : formMode === "create" ? (
                  "Create admin"
                ) : (
                  "Save changes"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={Boolean(removeTarget)}
          onOpenChange={(open) => !open && !removing && setRemoveTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove access?</AlertDialogTitle>
              <AlertDialogDescription>
                {removeTarget
                  ? `${removeTarget.name} (${removeTarget.email}) will lose access to the admin dashboard.`
                  : null}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRemove} disabled={removing}>
                {removing ? "Removing…" : "Remove access"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
