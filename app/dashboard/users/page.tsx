"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  ChevronDown,
  MoreHorizontal,
  Eye,
  ShieldCheck,
  ShieldX,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  userService,
  User,
  UserStatus,
  UserRole,
} from "@/lib/services/user.service";
import { toast } from "sonner";

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<UserStatus[]>([]);
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>();
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState<
    boolean | undefined
  >();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    name: true,
    email: true,
    phone: true,
    role: true,
    status: true,
    emailVerified: true,
    lastLogin: true,
    joined: true,
  });

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.listUsers({
        page: currentPage,
        limit: rowsPerPage,
        q: searchQuery || undefined,
        status: statusFilters.length === 1 ? statusFilters[0] : undefined,
        role: roleFilter,
        emailVerified: emailVerifiedFilter,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      setUsers(response.items);
      setTotalUsers(response.total);
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
      toast.error("Error", { description: error.message || "Failed to fetch users" });
    } finally {
      setLoading(false);
    }
  };

  // Fetch users on mount and when filters change
  useEffect(() => {
    fetchUsers();
  }, [
    currentPage,
    rowsPerPage,
    searchQuery,
    statusFilters,
    roleFilter,
    emailVerifiedFilter,
  ]);

  const toggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await userService.unverifyUser(userId);
        toast.success("Success", { description: "User email unverified successfully", });
      } else {
        await userService.verifyUser(userId);
        toast.success("Success", { description: "User email verified successfully", });
      }

      // Refresh the users list
      await fetchUsers();
    } catch (error: any) {
      console.error("Failed to toggle verification:", error);
      toast.error("Error", { description: error.message || "Failed to update verification status" });
    }
  };

  const toggleStatusFilter = (status: UserStatus) => {
    setStatusFilters((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [status]
    );
    setCurrentPage(1);
  };

  const toggleEmailVerifiedFilter = (verified: boolean) => {
    setEmailVerifiedFilter((prev) =>
      prev === verified ? undefined : verified
    );
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalUsers / rowsPerPage);

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));

  const handleRowsPerPageChange = (value: number) => {
    setRowsPerPage(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFullName = (user: User) => {
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    return `${firstName} ${lastName}`.trim() || "N/A";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">User List</h1>
        <p className="text-muted-foreground mt-1">
          Manage your users and their roles here.
        </p>
      </div>

      <div className="flex gap-3 items-center">
        <div className="flex-1 relative">
          <Input
            placeholder="Search by email, name, or phone..."
            className="bg-background border-border"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter size={18} />
              Status {statusFilters.length > 0 && `(${statusFilters.length})`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              checked={statusFilters.includes("active")}
              onCheckedChange={() => toggleStatusFilter("active")}
            >
              Active
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilters.includes("inactive")}
              onCheckedChange={() => toggleStatusFilter("inactive")}
            >
              Inactive
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilters.includes("suspended")}
              onCheckedChange={() => toggleStatusFilter("suspended")}
            >
              Suspended
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter size={18} />
              Verified {emailVerifiedFilter !== undefined && "(1)"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              checked={emailVerifiedFilter === true}
              onCheckedChange={() => toggleEmailVerifiedFilter(true)}
            >
              Verified
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={emailVerifiedFilter === false}
              onCheckedChange={() => toggleEmailVerifiedFilter(false)}
            >
              Not Verified
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              View
              <ChevronDown size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-2 text-sm font-semibold">
              Toggle columns
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={visibleColumns.id}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({ ...prev, id: checked }))
              }
            >
              ID
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.name}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({ ...prev, name: checked }))
              }
            >
              Name
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.email}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({ ...prev, email: checked }))
              }
            >
              Email
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.phone}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({ ...prev, phone: checked }))
              }
            >
              Phone
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.role}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({ ...prev, role: checked }))
              }
            >
              Role
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.status}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({ ...prev, status: checked }))
              }
            >
              Status
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.emailVerified}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({
                  ...prev,
                  emailVerified: checked,
                }))
              }
            >
              Email Verified
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.lastLogin}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({ ...prev, lastLogin: checked }))
              }
            >
              Last Login
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.joined}
              onCheckedChange={(checked) =>
                setVisibleColumns((prev) => ({ ...prev, joined: checked }))
              }
            >
              Joined
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {visibleColumns.id && (
                    <th className="text-left py-4 px-6 font-semibold">ID</th>
                  )}
                  {visibleColumns.name && (
                    <th className="text-left py-4 px-6 font-semibold">Name</th>
                  )}
                  {visibleColumns.email && (
                    <th className="text-left py-4 px-6 font-semibold">Email</th>
                  )}
                  {visibleColumns.phone && (
                    <th className="text-left py-4 px-6 font-semibold">Phone</th>
                  )}
                  {visibleColumns.role && (
                    <th className="text-left py-4 px-6 font-semibold">Role</th>
                  )}
                  {visibleColumns.status && (
                    <th className="text-left py-4 px-6 font-semibold">
                      Status
                    </th>
                  )}
                  {visibleColumns.emailVerified && (
                    <th className="text-left py-4 px-6 font-semibold">
                      Email Verified
                    </th>
                  )}
                  {visibleColumns.lastLogin && (
                    <th className="text-left py-4 px-6 font-semibold">
                      Last Login
                    </th>
                  )}
                  {visibleColumns.joined && (
                    <th className="text-left py-4 px-6 font-semibold">
                      Joined
                    </th>
                  )}
                  <th className="text-center py-4 px-6 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-20 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                      <p className="mt-2 text-muted-foreground">
                        Loading users...
                      </p>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="py-20 text-center text-muted-foreground"
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-border hover:bg-accent/5 transition"
                    >
                      {visibleColumns.id && (
                        <td className="py-4 px-6 text-muted-foreground text-xs font-mono">
                          {user.id.substring(0, 18)}...
                        </td>
                      )}
                      {visibleColumns.name && (
                        <td className="py-4 px-6 font-medium text-foreground">
                          {getFullName(user)}
                        </td>
                      )}
                      {visibleColumns.email && (
                        <td className="py-4 px-6 text-muted-foreground">
                          {user.email}
                        </td>
                      )}
                      {visibleColumns.phone && (
                        <td className="py-4 px-6 text-muted-foreground">
                          {user.phone || "N/A"}
                        </td>
                      )}
                      {visibleColumns.role && (
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              user.role === "admin"
                                ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            }`}
                          >
                            {user.role.charAt(0).toUpperCase() +
                              user.role.slice(1)}
                          </span>
                        </td>
                      )}
                      {visibleColumns.status && (
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              user.status === "active"
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : user.status === "suspended"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "bg-muted text-muted-foreground border border-border"
                            }`}
                          >
                            {user.status.charAt(0).toUpperCase() +
                              user.status.slice(1)}
                          </span>
                        </td>
                      )}
                      {visibleColumns.emailVerified && (
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              user.emailVerified
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : "bg-muted text-muted-foreground border border-border"
                            }`}
                          >
                            {user.emailVerified ? "Yes" : "No"}
                          </span>
                        </td>
                      )}
                      {visibleColumns.lastLogin && (
                        <td className="py-4 px-6 text-muted-foreground">
                          {user.lastLoginAt
                            ? formatDate(user.lastLoginAt)
                            : "Never"}
                        </td>
                      )}
                      {visibleColumns.joined && (
                        <td className="py-4 px-6 text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </td>
                      )}
                      <td className="py-4 px-6 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() =>
                                router.push(`/dashboard/users/${user.id}`)
                              }
                            >
                              <Eye size={16} />
                              View Details
                            </DropdownMenuItem>
                            {user.emailVerified ? (
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() =>
                                  toggleVerification(user.id, true)
                                }
                              >
                                <ShieldX size={16} />
                                Unverify Email
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() =>
                                  toggleVerification(user.id, false)
                                }
                              >
                                <ShieldCheck size={16} />
                                Verify Email
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <div className="flex items-center gap-2">
              <select
                className="bg-background border border-border rounded px-3 py-2 text-sm"
                value={rowsPerPage}
                onChange={(e) =>
                  handleRowsPerPageChange(Number(e.target.value))
                }
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
                Page {currentPage} of {totalPages || 1} ({totalUsers} total
                users)
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToFirstPage}
                  disabled={currentPage === 1 || loading}
                >
                  «
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevPage}
                  disabled={currentPage === 1 || loading}
                >
                  ‹
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  {currentPage}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages || loading}
                >
                  ›
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages || loading}
                >
                  »
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
