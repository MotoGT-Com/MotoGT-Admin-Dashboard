"use client";

// TODO(IA): This page and /dashboard/users both represent "customers" today.
// This CRM view pulls from GET /admin/users?role=customer. Once the backend
// unifies channel aggregates (channels, order counts, claim status), consider
// merging Users + Customers more tightly.
//
// BACKEND GAPS surfaced on this page (see the in-store backend guide):
// - Channel badges per customer (needs per-customer channel aggregates)
// - Total order count per customer (needs order count in the users list)
// - "Unclaimed" account status + create-customer + resend-activation APIs

import { useCallback, useEffect, useState } from "react";
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
import { userService, type User } from "@/lib/services/user.service";
import { AccountStatusBadge } from "@/components/in-store/badges";
import {
  NewCustomerForm,
  type NewCustomerFormValues,
} from "@/components/in-store/new-customer-form";

type VerifiedFilter = "all" | "verified" | "unverified";

const userDisplayName = (user: User): string =>
  [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

const userPhone = (user: User): string =>
  user.phoneNumber || user.phone || "—";

export default function InStoreCustomersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState<VerifiedFilter>("all");
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await userService.listUsers({
        page: currentPage,
        limit: rowsPerPage,
        q: searchTerm.trim() || undefined,
        role: "customer",
        emailVerified:
          verifiedFilter === "all" ? undefined : verifiedFilter === "verified",
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
  }, [currentPage, rowsPerPage, searchTerm, verifiedFilter]);

  // Debounce so typing in search doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, verifiedFilter, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);

  const handleCreateCustomer = (values: NewCustomerFormValues) => {
    // BACKEND GAP: no admin create-customer endpoint yet.
    console.log("[in-store] Create customer payload", values);
    toast.info(
      "Customer creation isn't available yet — the admin create-customer API is pending."
    );
    setIsNewCustomerOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground mt-1">
            Search registered customers by name, email, or phone.
          </p>
        </div>
        <Button onClick={() => setIsNewCustomerOpen(true)} className="gap-2">
          <UserPlus size={18} />
          New customer
        </Button>
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex-1 relative min-w-[220px]">
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
              {verifiedFilter !== "all" && (
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
                  ["verified", "Active (verified)"],
                  ["unverified", "Invited (unverified)"],
                ] as [VerifiedFilter, string][]
              ).map(([value, label]) => (
                <label
                  key={value}
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80"
                >
                  <Checkbox
                    checked={verifiedFilter === value}
                    onCheckedChange={() =>
                      setVerifiedFilter((prev) =>
                        prev === value ? "all" : value
                      )
                    }
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* BACKEND GAP: the Channel filter (Online / WhatsApp / In-Store)
            needs per-customer channel data from the API. */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button variant="outline" className="gap-2" disabled>
                  <Filter size={18} />
                  Channel
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              Channel filtering requires per-customer channel data from the
              backend.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 size={18} className="animate-spin" />
            Loading customers...
          </div>
        ) : loadError ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <p className="text-destructive">{loadError}</p>
              <Button variant="outline" onClick={fetchUsers}>
                Retry
              </Button>
            </div>
          </div>
        ) : users.length === 0 ? (
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left py-4 px-6 font-semibold">Name</th>
                <th className="text-left py-4 px-6 font-semibold">Phone</th>
                <th className="text-left py-4 px-6 font-semibold">Email</th>
                <th className="text-left py-4 px-6 font-semibold">
                  Channels
                </th>
                <th className="text-left py-4 px-6 font-semibold">Orders</th>
                <th className="text-left py-4 px-6 font-semibold">Status</th>
                <th className="text-right py-4 px-6 font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const needsActivation = !user.emailVerified;
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
                      {user.email}
                    </td>
                    {/* BACKEND GAP: channels + order count per customer. */}
                    <td className="py-4 px-6 text-muted-foreground">—</td>
                    <td className="py-4 px-6 text-muted-foreground">—</td>
                    <td className="py-4 px-6">
                      <AccountStatusBadge
                        status={user.emailVerified ? "active" : "invited"}
                      />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-1">
                        {needsActivation && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    disabled
                                    className="opacity-60 text-muted-foreground"
                                    aria-label={`Resend activation link to ${userDisplayName(user)}`}
                                  >
                                    <Send size={14} />
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                Activation sending isn&apos;t wired up yet —
                                needs a backend endpoint.
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
            <span className="text-sm text-muted-foreground">
              Rows per page
            </span>
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
              Create a customer record for a walk-in sale or manual entry.
            </DialogDescription>
          </DialogHeader>
          <NewCustomerForm
            onSubmit={handleCreateCustomer}
            onCancel={() => setIsNewCustomerOpen(false)}
            submitLabel="Create customer"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
