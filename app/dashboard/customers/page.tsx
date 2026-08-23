"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  UserPlus,
  Filter,
  ChevronRight,
  Send,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { LoadingState } from "@/components/loading-state";
import { userService, type User } from "@/lib/services/user.service";
import {
  AccountStatusBadge,
  ChannelBadgeList,
} from "@/components/in-store/badges";
import {
  NewCustomerForm,
  type NewCustomerFormValues,
} from "@/components/in-store/new-customer-form";
import {
  displayCustomerEmail,
  isPlaceholderEmail,
} from "@/lib/customers/email";
import type { AccountStatus, OrderChannel } from "@/lib/domain/channels";
import { resolveStoreId } from "@/lib/stores/resolve-store-id";

type ClaimFilter = "all" | AccountStatus;
type ChannelFilter = "all" | OrderChannel;

const userDisplayName = (user: User): string =>
  [user.firstName, user.lastName].filter(Boolean).join(" ") ||
  displayCustomerEmail(user.email) ||
  "Customer";

const userPhone = (user: User): string =>
  user.phoneNumber || user.phone || "—";

function resolveAccountStatus(user: User): AccountStatus {
  if (user.accountStatus) return user.accountStatus;
  return user.emailVerified || user.isEmailVerified ? "active" : "invited";
}

export default function CustomersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [claimFilter, setClaimFilter] = useState<ClaimFilter>("all");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    resolveStoreId().then(setStoreId).catch(() => setStoreId(null));
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await userService.listUsers({
        page: currentPage,
        limit: rowsPerPage,
        q: searchTerm.trim() || undefined,
        role: "customer",
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      setUsers(result.items);
      setTotal(result.total);
    } catch (error: any) {
      setLoadError(error.message || "Failed to fetch customers");
      setUsers([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, rowsPerPage, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, claimFilter, channelFilter, rowsPerPage]);

  const visibleUsers = useMemo(() => {
    return users.filter((user) => {
      const status = resolveAccountStatus(user);
      if (claimFilter !== "all" && status !== claimFilter) return false;
      if (channelFilter !== "all") {
        const channels = (user.channels ?? []) as string[];
        if (!channels.includes(channelFilter)) return false;
      }
      return true;
    });
  }, [users, claimFilter, channelFilter]);

  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);

  const handleCreateCustomer = async (values: NewCustomerFormValues) => {
    setCreating(true);
    try {
      const sid = storeId ?? (await resolveStoreId());
      const created = await userService.createUser({
        name: values.name,
        phone: values.phone,
        email: values.email || undefined,
        sendInvite: Boolean(values.email),
        storeId: sid,
      });
      toast.success("Customer created");
      setIsNewCustomerOpen(false);
      router.push(`/dashboard/customers/${created.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create customer");
    } finally {
      setCreating(false);
    }
  };

  const handleResendInvite = async (user: User) => {
    if (isPlaceholderEmail(user.email)) {
      toast.error("Add a real email before sending an invite");
      return;
    }
    setResendingId(user.id);
    try {
      await userService.resendInvite(user.id);
      toast.success("Invite sent");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to resend invite");
    } finally {
      setResendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Search registered customers by name, email, or phone.
          </p>
        </div>
        <Button
          onClick={() => setIsNewCustomerOpen(true)}
          className="gap-2 w-full sm:w-auto shrink-0"
        >
          <UserPlus size={18} />
          New customer
        </Button>
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative w-full min-w-0 sm:flex-1 sm:min-w-[220px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <Input
            placeholder="Search by name, email, or phone..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter size={18} />
              Status
              {claimFilter !== "all" && (
                <span className="ml-1 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  1
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 p-4">
            <div className="space-y-3">
              {(
                [
                  ["active", "Active"],
                  ["unclaimed", "Unclaimed"],
                  ["invited", "Invited"],
                ] as [AccountStatus, string][]
              ).map(([value, label]) => (
                <label
                  key={value}
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80"
                >
                  <Checkbox
                    checked={claimFilter === value}
                    onCheckedChange={() =>
                      setClaimFilter((prev) =>
                        prev === value ? "all" : value,
                      )
                    }
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter size={18} />
              Channel
              {channelFilter !== "all" && (
                <span className="ml-1 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  1
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 p-4">
            <div className="space-y-3">
              {(
                [
                  ["online", "Online"],
                  ["whatsapp", "WhatsApp"],
                  ["in_store", "In-Store"],
                ] as [OrderChannel, string][]
              ).map(([value, label]) => (
                <label
                  key={value}
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80"
                >
                  <Checkbox
                    checked={channelFilter === value}
                    onCheckedChange={() =>
                      setChannelFilter((prev) =>
                        prev === value ? "all" : value,
                      )
                    }
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="border border-border rounded-lg overflow-x-auto relative">
        {isLoading && users.length > 0 ? (
          <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-primary/20">
            <div className="h-full w-1/3 animate-pulse bg-primary" />
          </div>
        ) : null}
        {isLoading && users.length === 0 ? (
          <LoadingState label="Loading customers…" />
        ) : loadError ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <p className="text-destructive">{loadError}</p>
              <Button variant="outline" onClick={fetchUsers}>
                Retry
              </Button>
            </div>
          </div>
        ) : visibleUsers.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground mb-2">
                No customers found
              </p>
              <p className="text-muted-foreground">
                {searchTerm
                  ? `No customers match "${searchTerm}".`
                  : "No customers match the selected filters."}
              </p>
            </div>
          </div>
        ) : (
          <table
            className={`w-full text-sm transition-opacity ${
              isLoading ? "opacity-60 pointer-events-none" : ""
            }`}
          >
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left py-4 px-6 font-semibold">Name</th>
                <th className="text-left py-4 px-6 font-semibold">Phone</th>
                <th className="text-left py-4 px-6 font-semibold">Email</th>
                <th className="text-left py-4 px-6 font-semibold">Channels</th>
                <th className="text-left py-4 px-6 font-semibold">Orders</th>
                <th className="text-left py-4 px-6 font-semibold">Status</th>
                <th className="text-right py-4 px-6 font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => {
                const status = resolveAccountStatus(user);
                const email = displayCustomerEmail(user.email);
                const canInvite =
                  Boolean(email) && status !== "active";
                return (
                  <tr
                    key={user.id}
                    className="border-b border-border hover:bg-primary/5 transition cursor-pointer group"
                    onClick={() =>
                      router.push(`/dashboard/customers/${user.id}`)
                    }
                  >
                    <td className="py-4 px-6 font-medium">
                      {userDisplayName(user)}
                    </td>
                    <td className="py-4 px-6 text-muted-foreground">
                      {userPhone(user)}
                    </td>
                    <td className="py-4 px-6 text-muted-foreground">
                      {email ?? "—"}
                    </td>
                    <td className="py-4 px-6">
                      <ChannelBadgeList channels={user.channels ?? []} />
                    </td>
                    <td className="py-4 px-6 text-muted-foreground">
                      {user.totalOrders ?? 0}
                    </td>
                    <td className="py-4 px-6">
                      <AccountStatusBadge status={status} />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-1">
                        {canInvite && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  disabled={resendingId === user.id}
                                  className="text-muted-foreground"
                                  aria-label={`Resend invite to ${userDisplayName(user)}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleResendInvite(user);
                                  }}
                                >
                                  {resendingId === user.id ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <Send size={14} />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Resend activation invite
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <ChevronRight
                          size={16}
                          className="text-muted-foreground group-hover:text-foreground transition-colors"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-border">
          <div className="flex items-center gap-2">
            <select
              className="bg-background border border-border rounded px-3 py-2 text-sm"
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-muted-foreground">Rows per page</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Page {safePage} of {totalPages} ({total} total customers)
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={safePage === 1}
              >
                «
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
              >
                ‹
              </Button>
              <Button
                variant="default"
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                {safePage}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={safePage === totalPages}
              >
                ›
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage === totalPages}
              >
                »
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New customer</DialogTitle>
            <DialogDescription>
              Create a walk-in customer (no email) or invite them with an email.
            </DialogDescription>
          </DialogHeader>
          {creating ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 size={18} className="animate-spin" />
              Creating customer...
            </div>
          ) : (
            <NewCustomerForm
              onSubmit={handleCreateCustomer}
              onCancel={() => setIsNewCustomerOpen(false)}
              submitLabel="Create customer"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
