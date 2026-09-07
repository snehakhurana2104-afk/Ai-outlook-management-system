import React, { memo } from "react";

import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";
import EmptyState from "./EmptyState";

const SectionWrapper = ({
  loading = false,
  error = "",
  empty = false,

  loadingVariant = "cards",

  loadingRows = 5,
  loadingColumns = 4,

  emptyTitle = "No Data Available",
  emptyDescription = "There is currently nothing to display.",
  emptyType = "folder",

  emptyActionLabel,
  onEmptyAction,

  errorTitle = "Something went wrong",
  errorMessage,
  onRetry,

  children,
}) => {
  // =====================================================
  // Loading
  // =====================================================

  if (loading) {
    return (
      <LoadingState
        variant={loadingVariant}
        rows={loadingRows}
        columns={loadingColumns}
      />
    );
  }

  // =====================================================
  // Error
  // =====================================================

  if (error) {
    return (
      <ErrorState
        title={errorTitle}
        message={errorMessage || error}
        onRetry={onRetry}
      />
    );
  }

  // =====================================================
  // Empty
  // =====================================================

  if (empty) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        type={emptyType}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  // =====================================================
  // Success
  // =====================================================

  return <>{children}</>;
};

SectionWrapper.displayName = "SectionWrapper";

export default memo(SectionWrapper);