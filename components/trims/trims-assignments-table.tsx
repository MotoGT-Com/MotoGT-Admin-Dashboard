"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit2, ExternalLink, Settings2, Trash2 } from "lucide-react";
import type { TrimAssignmentRow } from "@/lib/services/trim-assignments.service";

export type TrimsAssignmentsTableProps = {
  rows: TrimAssignmentRow[];
  formatYearRange: (yearFrom: number, yearTo: number | null) => string;
  deleteTargetId: string | null;
  busy?: boolean;
  onEdit: (row: TrimAssignmentRow) => void;
  onRequestDelete: (row: TrimAssignmentRow) => void;
  onManageProductTrims: (row: TrimAssignmentRow) => void;
};

function formatUpdated(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function TrimsAssignmentsTable({
  rows,
  formatYearRange,
  deleteTargetId,
  busy,
  onEdit,
  onRequestDelete,
  onManageProductTrims,
}: TrimsAssignmentsTableProps) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10 border rounded-lg">
        No trim assignments match the current filters.
      </p>
    );
  }

  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vehicle</TableHead>
            <TableHead>Trim</TableHead>
            <TableHead>Years</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="w-[140px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.compatibilityId}
              className={
                deleteTargetId === row.compatibilityId
                  ? "bg-destructive/10"
                  : undefined
              }
            >
              <TableCell>
                <span className="font-medium">
                  {row.carBrand} {row.carModel}
                </span>
              </TableCell>
              <TableCell>
                {row.trim || (
                  <span className="text-muted-foreground">All trims</span>
                )}
              </TableCell>
              <TableCell>{formatYearRange(row.yearFrom, row.yearTo)}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <Link
                    href={`/dashboard/products/${row.productId}`}
                    className="font-medium hover:underline inline-flex items-center gap-1"
                  >
                    {row.productName}
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {row.itemCode}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatUpdated(row.updatedAt)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    title="Edit assignment"
                    disabled={busy}
                    onClick={() => onEdit(row)}
                  >
                    <Edit2 size={14} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    title="Manage all trims for product"
                    disabled={busy}
                    onClick={() => onManageProductTrims(row)}
                  >
                    <Settings2 size={14} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    title="Delete assignment"
                    disabled={busy}
                    onClick={() => onRequestDelete(row)}
                  >
                    <Trash2 size={14} className="text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
