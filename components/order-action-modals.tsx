"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { orderService } from "@/lib/services/order.service";
import { toast } from "sonner";

interface ShipOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onSuccess: () => void;
}

export function ShipOrderModal({
  isOpen,
  onClose,
  orderId,
  onSuccess,
}: ShipOrderModalProps) {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [shipmentNotes, setShipmentNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      await orderService.shipOrder(orderId, {
        trackingNumber: trackingNumber.trim() || undefined,
        carrier: carrier.trim() || undefined,
        shipmentNotes: shipmentNotes.trim() || undefined,
      });
      toast.success("Order shipped successfully");
      onSuccess();
      onClose();
      // Reset form
      setTrackingNumber("");
      setCarrier("");
      setShipmentNotes("");
    } catch (error: any) {
      toast.error(error.message || "Failed to ship order");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ship Order</DialogTitle>
          <DialogDescription>
            Mark this order as shipped. You can optionally add shipping details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="trackingNumber">Tracking Number (Optional)</Label>
              <Input
                id="trackingNumber"
                placeholder="e.g., 1Z999AA10123456784"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carrier">Carrier (Optional)</Label>
              <Input
                id="carrier"
                placeholder="e.g., UPS, FedEx, DHL"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipmentNotes">Shipment Notes (Optional)</Label>
              <Textarea
                id="shipmentNotes"
                placeholder="Any additional notes about the shipment"
                value={shipmentNotes}
                onChange={(e) => setShipmentNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Shipping..." : "Ship Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeliverOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onSuccess: () => void;
}

export function DeliverOrderModal({
  isOpen,
  onClose,
  orderId,
  onSuccess,
}: DeliverOrderModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      await orderService.deliverOrder(orderId, {});
      toast.success("Order marked as delivered successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to mark order as delivered");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Mark as Delivered</DialogTitle>
          <DialogDescription>
            Confirm that this order has been delivered to the customer. For COD
            orders, a payment record will be automatically created.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Processing..." : "Mark as Delivered"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onSuccess: () => void;
}

export function CancelOrderModal({
  isOpen,
  onClose,
  orderId,
  onSuccess,
}: CancelOrderModalProps) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error("Please provide a cancellation reason");
      return;
    }

    try {
      setIsLoading(true);
      await orderService.cancelOrder(orderId, {
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      });
      toast.success("Order cancelled successfully");
      onSuccess();
      onClose();
      setReason("");
      setNotes("");
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel order");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cancel Order</DialogTitle>
          <DialogDescription>
            This will cancel the order and restore stock to inventory. For
            prepaid orders, a refund will be initiated.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">
                Cancellation Reason <span className="text-red-500">*</span>
              </Label>
              <Input
                id="reason"
                placeholder="e.g., Customer request, Out of stock"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information about the cancellation"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isLoading}>
              {isLoading ? "Cancelling..." : "Cancel Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface RefundOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderTotal: number;
  onSuccess: () => void;
}

export function RefundOrderModal({
  isOpen,
  onClose,
  orderId,
  orderTotal,
  onSuccess,
}: RefundOrderModalProps) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [refundDescription, setRefundDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim() || !refundDescription.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const refundAmount = amount ? parseFloat(amount) : undefined;
    if (refundAmount && (refundAmount <= 0 || refundAmount > orderTotal)) {
      toast.error(`Refund amount must be between 0 and ${orderTotal}`);
      return;
    }

    try {
      setIsLoading(true);
      await orderService.refundOrder(orderId, {
        amount: refundAmount,
        reason: reason.trim(),
        refundDescription: refundDescription.trim(),
      });
      toast.success("Refund processed successfully");
      onSuccess();
      onClose();
      setAmount("");
      setReason("");
      setRefundDescription("");
    } catch (error: any) {
      toast.error(error.message || "Failed to process refund");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Process Refund</DialogTitle>
          <DialogDescription>
            Process a refund for this order via PayTabs. Leave amount empty for
            full refund.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                Refund Amount (Optional - defaults to full amount: $
                {orderTotal.toFixed(2)})
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={orderTotal}
                placeholder={`Max: ${orderTotal.toFixed(2)}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason <span className="text-red-500">*</span>
              </Label>
              <Input
                id="reason"
                placeholder="e.g., Defective product, Customer dissatisfaction"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refundDescription">
                Refund Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="refundDescription"
                placeholder="Detailed description of the refund"
                value={refundDescription}
                onChange={(e) => setRefundDescription(e.target.value)}
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isLoading}>
              {isLoading ? "Processing..." : "Process Refund"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
