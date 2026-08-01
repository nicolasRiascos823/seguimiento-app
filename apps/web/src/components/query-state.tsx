"use client";

import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonRows } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface QueryStateProps<T> {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  data: T | undefined;
  isEmpty?: (data: T) => boolean;
  emptyIcon?: LucideIcon;
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  loadingLabel?: string;
  loadingFallback?: React.ReactNode;
  children: (data: T) => React.ReactNode;
}

export function QueryState<T>({
  isLoading,
  isError,
  error,
  data,
  isEmpty,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
  loadingFallback,
  children,
}: QueryStateProps<T>) {
  if (isLoading) {
    return <>{loadingFallback ?? <SkeletonRows rows={6} />}</>;
  }
  if (isError) {
    return (
      <Alert variant="destructive" title="No se pudieron cargar los datos">
        {getApiErrorMessage(error)}
      </Alert>
    );
  }
  if (!data || (isEmpty && isEmpty(data))) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }
  return <>{children(data)}</>;
}
