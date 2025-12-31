"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Filter,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  promoCodeService,
  PromoCode,
  CreatePromoCodeRequest,
  DiscountType,
} from "@/lib/services/promo-code.service";

interface PromoCodeFormData {
  code: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
  discountType: DiscountType;
  discountValue: string;
  currency: string;
  maxDiscountAmount: string;
  minOrderSubtotal: string;
  usageLimitTotal: string;
}

const initialFormData: PromoCodeFormData = {
  code: "",
  isActive: true,
  startsAt: "",
  endsAt: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  currency: "",
  maxDiscountAmount: "",
  minOrderSubtotal: "",
  usageLimitTotal: "",
};

export default function PromoCodesPage() {
  const { toast } = useToast();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingPromoCode, setEditingPromoCode] = useState<PromoCode | null>(
    null
  );
  const [deletingPromoCodeId, setDeletingPromoCodeId] = useState<string | null>(
    null
  );
  const [formData, setFormData] = useState<PromoCodeFormData>(initialFormData);

  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filterActive, setFilterActive] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const limit = 20;

  useEffect(() => {
    fetchPromoCodes();
  }, [currentPage, filterActive]);

  const fetchPromoCodes = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: limit,
      };

      if (filterActive !== "all") {
        params.isActive = filterActive === "active";
      }

      const response = await promoCodeService.getPromoCodes(params);
      setPromoCodes(response.promoCodes);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.totalCount);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.error?.message || "Failed to fetch promo codes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (promoCode?: PromoCode) => {
    if (promoCode) {
      setEditingPromoCode(promoCode);
      setFormData({
        code: promoCode.code,
        isActive: promoCode.isActive,
        startsAt: promoCode.startsAt
          ? new Date(promoCode.startsAt).toISOString().slice(0, 16)
          : "",
        endsAt: promoCode.endsAt
          ? new Date(promoCode.endsAt).toISOString().slice(0, 16)
          : "",
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue.toString(),
        currency: promoCode.currency || "",
        maxDiscountAmount: promoCode.maxDiscountAmount?.toString() || "",
        minOrderSubtotal: promoCode.minOrderSubtotal?.toString() || "",
        usageLimitTotal: promoCode.usageLimitTotal?.toString() || "",
      });
    } else {
      setEditingPromoCode(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPromoCode(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload: any = {
        code: formData.code,
        isActive: formData.isActive,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
      };

      // Add optional fields only if they have values
      if (formData.startsAt) {
        payload.startsAt = new Date(formData.startsAt).toISOString();
      }
      if (formData.endsAt) {
        payload.endsAt = new Date(formData.endsAt).toISOString();
      }
      if (formData.currency) {
        payload.currency = formData.currency;
      }
      if (formData.maxDiscountAmount) {
        payload.maxDiscountAmount = parseFloat(formData.maxDiscountAmount);
      }
      if (formData.minOrderSubtotal) {
        payload.minOrderSubtotal = parseFloat(formData.minOrderSubtotal);
      }
      if (formData.usageLimitTotal) {
        payload.usageLimitTotal = parseInt(formData.usageLimitTotal);
      }

      if (editingPromoCode) {
        await promoCodeService.updatePromoCode(editingPromoCode.id, payload);
        toast({
          title: "Success",
          description: "Promo code updated successfully",
        });
      } else {
        await promoCodeService.createPromoCode(payload);
        toast({
          title: "Success",
          description: "Promo code created successfully",
        });
      }

      handleCloseDialog();
      fetchPromoCodes();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.error?.message || "Failed to save promo code",
        variant: "destructive",
      });
    }
  };

  const handleDisablePromoCode = async (promoCodeId: string) => {
    try {
      await promoCodeService.disablePromoCode(promoCodeId);
      toast({
        title: "Success",
        description: "Promo code disabled successfully",
      });
      fetchPromoCodes();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.error?.message ||
          "Failed to disable promo code",
        variant: "destructive",
      });
    }
  };

  const handleEnablePromoCode = async (promoCodeId: string) => {
    try {
      await promoCodeService.enablePromoCode(promoCodeId);
      toast({
        title: "Success",
        description: "Promo code enabled successfully",
      });
      fetchPromoCodes();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.error?.message || "Failed to enable promo code",
        variant: "destructive",
      });
    }
  };

  const handleDeletePromoCode = async () => {
    if (!deletingPromoCodeId) return;

    try {
      await promoCodeService.deletePromoCode(deletingPromoCodeId);
      toast({
        title: "Success",
        description: "Promo code deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setDeletingPromoCodeId(null);
      fetchPromoCodes();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.error?.message || "Failed to delete promo code",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDiscount = (promoCode: PromoCode) => {
    if (promoCode.discountType === "PERCENTAGE") {
      return `${promoCode.discountValue}%`;
    }
    return `${promoCode.currency || "$"}${promoCode.discountValue}`;
  };

  const getStatusBadge = (promoCode: PromoCode) => {
    if (!promoCode.isActive) {
      return <Badge variant="destructive">Inactive</Badge>;
    }

    const now = new Date();
    const startsAt = promoCode.startsAt ? new Date(promoCode.startsAt) : null;
    const endsAt = promoCode.endsAt ? new Date(promoCode.endsAt) : null;

    if (startsAt && now < startsAt) {
      return <Badge variant="outline">Scheduled</Badge>;
    }

    if (endsAt && now > endsAt) {
      return <Badge variant="destructive">Expired</Badge>;
    }

    return (
      <Badge variant="default" className="bg-green-500">
        Active
      </Badge>
    );
  };

  const filteredPromoCodes = promoCodes.filter((promoCode) => {
    if (searchQuery) {
      return promoCode.code.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Promo Codes</h1>
          <p className="text-muted-foreground">
            Manage promotional discount codes
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Create Promo Code
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filterActive} onValueChange={setFilterActive}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Promo Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Promo Codes ({totalCount})</CardTitle>
          <CardDescription>
            View and manage all promotional codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading...
            </div>
          ) : filteredPromoCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No promo codes found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Code</th>
                    <th className="text-left p-4 font-medium">Discount</th>
                    <th className="text-left p-4 font-medium">Usage</th>
                    <th className="text-left p-4 font-medium">Valid From</th>
                    <th className="text-left p-4 font-medium">Valid Until</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPromoCodes.map((promoCode) => (
                    <tr
                      key={promoCode.id}
                      className="border-b hover:bg-muted/50"
                    >
                      <td className="p-4">
                        <span className="font-mono font-semibold">
                          {promoCode.code}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {formatDiscount(promoCode)}
                          </span>
                          {promoCode.maxDiscountAmount && (
                            <span className="text-xs text-muted-foreground">
                              Max: ${promoCode.maxDiscountAmount}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span>{promoCode.usageCount} used</span>
                          {promoCode.usageLimitTotal && (
                            <span className="text-xs text-muted-foreground">
                              / {promoCode.usageLimitTotal} limit
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        {formatDate(promoCode.startsAt)}
                      </td>
                      <td className="p-4 text-sm">
                        {formatDate(promoCode.endsAt)}
                      </td>
                      <td className="p-4">{getStatusBadge(promoCode)}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(promoCode)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {promoCode.isActive ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleDisablePromoCode(promoCode.id)
                              }
                              title="Disable promo code"
                            >
                              <Power className="h-4 w-4 text-red-500" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleEnablePromoCode(promoCode.id)
                              }
                              title="Enable promo code"
                            >
                              <PowerOff className="h-4 w-4 text-green-500" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeletingPromoCodeId(promoCode.id);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPromoCode ? "Edit Promo Code" : "Create New Promo Code"}
            </DialogTitle>
            <DialogDescription>
              {editingPromoCode
                ? "Update the promo code details"
                : "Fill in the details to create a new promo code"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="code">
                  Promo Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="SUMMER2025"
                  required
                />
              </div>

              <div>
                <Label htmlFor="discountType">
                  Discount Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value: DiscountType) =>
                    setFormData({ ...formData, discountType: value })
                  }
                  disabled={!!editingPromoCode}
                >
                  <SelectTrigger id="discountType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="discountValue">
                  Discount Value <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  step="0.01"
                  value={formData.discountValue}
                  onChange={(e) =>
                    setFormData({ ...formData, discountValue: e.target.value })
                  }
                  placeholder={
                    formData.discountType === "PERCENTAGE" ? "20" : "50.00"
                  }
                  required
                />
              </div>

              {formData.discountType === "FIXED" && (
                <div>
                  <Label htmlFor="currency">
                    Currency <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="currency"
                    value={formData.currency}
                    onChange={(e) =>
                      setFormData({ ...formData, currency: e.target.value })
                    }
                    placeholder="USD"
                    required
                    disabled={!!editingPromoCode}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="maxDiscountAmount">Max Discount Amount</Label>
                <Input
                  id="maxDiscountAmount"
                  type="number"
                  step="0.01"
                  value={formData.maxDiscountAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxDiscountAmount: e.target.value,
                    })
                  }
                  placeholder="100.00"
                />
              </div>

              <div>
                <Label htmlFor="minOrderSubtotal">Min Order Subtotal</Label>
                <Input
                  id="minOrderSubtotal"
                  type="number"
                  step="0.01"
                  value={formData.minOrderSubtotal}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minOrderSubtotal: e.target.value,
                    })
                  }
                  placeholder="50.00"
                />
              </div>

              <div>
                <Label htmlFor="usageLimitTotal">Total Usage Limit</Label>
                <Input
                  id="usageLimitTotal"
                  type="number"
                  value={formData.usageLimitTotal}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      usageLimitTotal: e.target.value,
                    })
                  }
                  placeholder="1000"
                />
              </div>

              <div>
                <Label htmlFor="startsAt">Start Date & Time</Label>
                <Input
                  id="startsAt"
                  type="datetime-local"
                  value={formData.startsAt}
                  onChange={(e) =>
                    setFormData({ ...formData, startsAt: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="endsAt">End Date & Time</Label>
                <Input
                  id="endsAt"
                  type="datetime-local"
                  value={formData.endsAt}
                  onChange={(e) =>
                    setFormData({ ...formData, endsAt: e.target.value })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingPromoCode ? "Update" : "Create"} Promo Code
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              promo code.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingPromoCodeId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePromoCode}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
