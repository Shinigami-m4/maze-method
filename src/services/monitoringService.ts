type MonitoringEventName =
  | "app_boot_started"
  | "app_boot_completed"
  | "app_boot_failed"
  | "screen_retry"
  | "permission_denied"
  | "release_placeholder_selected";

type MonitoringMetadata = Record<string, string | number | boolean | undefined>;

/**
 * Version 3 analytics/monitoring placeholder.
 *
 * Production monitoring should be added only after a privacy review. Keep event
 * names generic, avoid free-form notes, and never send health, nutrition, photo,
 * body measurement, or workout details without explicit product/legal approval.
 */
export function initializeMonitoring() {
  if (__DEV__) {
    console.log("[monitoring] Privacy-first monitoring placeholder initialized.");
  }
}

export function trackAppEvent(eventName: MonitoringEventName, metadata: MonitoringMetadata = {}) {
  if (__DEV__) {
    console.log("[monitoring:event]", eventName, sanitizeMetadata(metadata));
  }
}

export function captureHandledError(area: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown handled error";

  if (__DEV__) {
    console.warn("[monitoring:error]", area, message);
  }
}

function sanitizeMetadata(metadata: MonitoringMetadata) {
  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => typeof value !== "undefined")
  );
}
