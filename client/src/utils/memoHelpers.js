import { memo } from "react";

/**
 * Enterprise Memo Wrapper
 */

export const withMemo = (Component) => {
  return memo(Component);
};

/**
 * Deep Compare
 */

export const deepEqual = (prevProps, nextProps) => {
  return JSON.stringify(prevProps) === JSON.stringify(nextProps);
};

/**
 * Memo With Deep Compare
 */

export const withDeepMemo = (Component) => {
  return memo(Component, deepEqual);
};