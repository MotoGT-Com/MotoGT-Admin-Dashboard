"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TrimAssignmentSummary } from "@/lib/services/trim-assignments.service";

export function TrimsSummaryCards({
  summary,
}: {
  summary: TrimAssignmentSummary;
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{summary.assignmentCount}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Unique trims
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{summary.uniqueTrimCount}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{summary.productCount}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Year span
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{summary.yearSpanLabel}</p>
        </CardContent>
      </Card>
    </div>
  );
}
