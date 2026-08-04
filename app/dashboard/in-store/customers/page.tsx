"use client";

// TODO(IA): This page and /dashboard/users both represent "customers" today but pull
// from different identity sources (in-store mock data here vs. the real Users API
// there). Once the backend unifies customer identity across channels, merge this into
// a single directory. For now this stays under In-Store as the channel-spanning mock
// view, and /dashboard/users is left untouched.

import { useEffect, useMemo, useState } from "react";
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
  X,
  ChevronRight,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import {
  mockCustomers,
  type MockCustomer,
  type AccountStatus,
  type Channel,
} from "@/lib/mock-data/in-store";
import {
  AccountStatusBadge,
  ChannelBadgeList,
} from "@/components/in-store/badges";
import {
  NewCustomerForm,
  type NewCustomerFormValues,
} from "@/components/in-store/new-customer-form";

const channelOptions: Channel[] = ["online", "whatsapp", "in_store"];
const channelLabels: Record<Channel, string> = {
  online: "Online",
  whatsapp: "WhatsApp",
  in_store: "In-Store",
};

const statusOptions: AccountStatus[] = ["active", "unclaimed", "invited"];
const statusLabels: Record<AccountStatus, string> = {
  active: "Active",
  unclaimed: "Unclaimed",
  invited: "Invited",
};

export default function InStoreCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<MockCustomer[]>(mockCustomers);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<AccountStatus[]>(
    []
  );
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const toggleChannel = (channel: Channel) => {
    setSelectedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  };

  const toggleStatus = (status: AccountStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const clearFilters = () => {
    setSelectedChannels([]);
    setSelectedStatuses([]);
  };

  const filteredCustomers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return customers.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.replace(/\s+/g, "").includes(q.replace(/\s+/g, ""));
      const matchesChannel =
        selectedChannels.length === 0 ||
        c.channels.some((channel) => selectedChannels.includes(channel));
      const matchesStatus =
        selectedStatuses.length === 0 || selectedStatuses.includes(c.status);
      return matchesSearch && matchesChannel && matchesStatus;
    });
  }, [customers, searchTerm, selectedChannels, selectedStatuses]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedChannels, selectedStatuses]);

  const totalCustomers = filteredCustomers.length;
  const totalPages = Math.max(1, Math.ceil(totalCustomers / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const pageSlice = filteredCustomers.slice(
    (safePage - 1) * rowsPerPage,
    safePage * rowsPerPage
  );

  const handleCreateCustomer = (values: NewCustomerFormValues) => {
    const newCustomer: MockCustomer = {
      id: `cust-new-${Date.now()}`,
      name: values.name,
      phone: values.phone,
      email: values.email || undefined,
      memberSince: new Date().toISOString().slice(0, 10),
      status: "unclaimed",
      channels: ["in_store"],
      totalOrders: 0,
      vehicles: [],
    };
    // No backend yet — simulate the API call that would create the customer.
    console.log("[in-store] Create customer payload", newCustomer);
    setCustomers((prev) => [newCustomer, ...prev]);
    toast.success(`${newCustomer.name} added as a new customer`);
    setIsNewCustomerOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground mt-1">
            Search customers by name or phone across every sales channel.
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
            placeholder="Search by name or phone..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter size={18} />
              Channel
              {selectedChannels.length > 0 && (
                <span className="ml-1 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  {selectedChannels.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 p-4">
            <div className="space-y-3">
              {channelOptions.map((channel) => (
                <label
                  key={channel}
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80"
                >
                  <Checkbox
                    checked={selectedChannels.includes(channel)}
                    onCheckedChange={() => toggleChannel(channel)}
                  />
                  <span className="text-sm">{channelLabels[channel]}</span>
                </label>
              ))}
            </div>
            {selectedChannels.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedChannels([])}
                  className="w-full text-muted-foreground"
                >
                  Clear filters
                </Button>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter size={18} />
              Status
              {selectedStatuses.length > 0 && (
                <span className="ml-1 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  {selectedStatuses.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 p-4">
            <div className="space-y-3">
              {statusOptions.map((status) => (
                <label
                  key={status}
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80"
                >
                  <Checkbox
                    checked={selectedStatuses.includes(status)}
                    onCheckedChange={() => toggleStatus(status)}
                  />
                  <span className="text-sm">{statusLabels[status]}</span>
                </label>
              ))}
            </div>
            {selectedStatuses.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedStatuses([])}
                  className="w-full text-muted-foreground"
                >
                  Clear filters
                </Button>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {(selectedChannels.length > 0 || selectedStatuses.length > 0) && (
        <div className="flex gap-2 items-center flex-wrap">
          {selectedChannels.map((channel) => (
            <div
              key={channel}
              className="flex items-center gap-2 bg-primary/20 text-primary px-3 py-1 rounded-full text-sm"
            >
              Channel: {channelLabels[channel]}
              <button
                onClick={() => toggleChannel(channel)}
                className="hover:opacity-70"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {selectedStatuses.map((status) => (
            <div
              key={status}
              className="flex items-center gap-2 bg-blue-900/20 text-blue-300 px-3 py-1 rounded-full text-sm"
            >
              Status: {statusLabels[status]}
              <button
                onClick={() => toggleStatus(status)}
                className="hover:opacity-70"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            Reset All
          </Button>
        </div>
      )}

      <div className="border border-border rounded-lg overflow-hidden">
        {pageSlice.length === 0 ? (
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
                <th className="text-left py-4 px-6 font-semibold">
                  Channels
                </th>
                <th className="text-left py-4 px-6 font-semibold">
                  Total Orders
                </th>
                <th className="text-left py-4 px-6 font-semibold">Status</th>
                <th className="text-right py-4 px-6 font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {pageSlice.map((customer) => {
                const needsActivation =
                  customer.status === "unclaimed" ||
                  customer.status === "invited";
                return (
                  <tr
                    key={customer.id}
                    className="border-b border-border hover:bg-primary/5 transition cursor-pointer group"
                    onClick={() =>
                      router.push(
                        `/dashboard/in-store/customers/${customer.id}`
                      )
                    }
                  >
                    <td className="py-4 px-6 font-medium">{customer.name}</td>
                    <td className="py-4 px-6 text-muted-foreground">
                      {customer.phone}
                    </td>
                    <td className="py-4 px-6">
                      <ChannelBadgeList channels={customer.channels} />
                    </td>
                    <td className="py-4 px-6">{customer.totalOrders}</td>
                    <td className="py-4 px-6">
                      <AccountStatusBadge status={customer.status} />
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
                                    aria-label={`Resend activation link to ${customer.name}`}
                                  >
                                    <Send size={14} />
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                Activation sending isn&apos;t wired up yet —
                                visual only.
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
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
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
              Page {safePage} of {totalPages} ({totalCustomers} total
              customers)
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
