/**
 * Theme utility functions
 *
 * CHANGEABLE: All utilities can be extended for new use cases
 */

import { Colors } from './tokens';

/**
 * Get color based on severity level (1-5)
 *
 * WHY: Consistent color mapping for severity badges across the app
 *
 * @fixed Color mappings - Based on PRD severity scale
 * @param severity - Severity level from 1 (low) to 5 (critical)
 * @returns Hex color string
 */
export function getSeverityColor(severity: 1 | 2 | 3 | 4 | 5): string {
  switch (severity) {
    case 1:
    case 2:
      return Colors.safe;       // Green for low risk
    case 3:
      return Colors.warning;    // Orange for medium risk
    case 4:
    case 5:
      return Colors.danger;     // Red for high risk
  }
}

/**
 * Get color based on risk score (0-100)
 *
 * WHY: Visual feedback for numeric risk scores
 *
 * @param riskScore - Risk score from 0 (safe) to 100 (critical)
 * @returns Hex color string
 */
export function getRiskColor(riskScore: number): string {
  if (riskScore < 30) return Colors.safe;
  if (riskScore < 60) return Colors.warning;
  return Colors.danger;
}

/**
 * Get opacity for disabled states
 *
 * @param disabled - Whether the element is disabled
 * @returns Opacity value (1 for enabled, 0.5 for disabled)
 */
export function getDisabledOpacity(disabled: boolean): number {
  return disabled ? 0.5 : 1;
}

/**
 * Format sensor value with unit
 *
 * @param value - Numeric value
 * @param unit - Unit string (e.g., "dB", "%", "μg/m³")
 * @returns Formatted string
 */
export function formatSensorValue(value: number, unit: string): string {
  return `${value.toFixed(1)}${unit}`;
}
