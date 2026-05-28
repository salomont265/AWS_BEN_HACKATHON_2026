/**
 * Design tokens for EnviroGuard
 * Source: PRD page 8 - Design Language section
 *
 * WHY: Centralized design system ensures visual consistency
 *
 * @fixed Colors - Brand identity colors from PRD, changes require design approval
 * @changeable Spacing multipliers - Can adjust for accessibility needs
 * @fixed Typography sizes - Based on PRD specifications
 */

// ===== COLORS =====
// @fixed Brand colors from PRD
export const Colors = {
  // Primary brand color
  primary: '#0F6E56',           // Teal - CTAs, active states
  primaryMid: '#1D9E75',        // Lighter teal - secondary actions
  primaryLight: '#E1F5EE',      // Very light teal - backgrounds

  // Semantic colors
  danger: '#D85A30',            // Red - High risk alerts, severity 4-5
  warning: '#EF9F27',           // Orange - Medium risk, severity 3
  safe: '#639922',              // Green - Low risk, severity 1-2

  // Neutrals
  textPrimary: '#2C2C2A',       // Almost black - body text
  textSecondary: '#888780',     // Gray - metadata, helper text
  border: '#D3D1C7',            // Light gray - card outlines
  background: '#F1EFE8',        // Warm white - app background
  surface: '#FFFFFF',           // Pure white - card surfaces
} as const;

// ===== SPACING =====
// WHY: 8px base unit creates consistent spacing rhythm
// CHANGEABLE: Can adjust base unit for different screen densities
export const Spacing = {
  base: 8,
  screenPadding: 16,            // Horizontal padding for screens
  cardPadding: 12,              // Internal card padding (12-16px range)
  sectionGap: 24,               // Vertical gap between sections

  // Helper function to get spacing in multiples of base unit
  unit: (multiplier: number) => multiplier * 8,
} as const;

// ===== TYPOGRAPHY =====
// WHY: System fonts for native feel, defined sizes for hierarchy
// @fixed Font sizes - Based on PRD page 8 specifications
export const Typography = {
  // Screen titles
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
  },

  // Section headings
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500' as const,
  },

  // Body text
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },

  // Small text (metadata, captions)
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
  },

  // For data values (prevents layout shift with number changes)
  tabularNums: {
    fontVariant: ['tabular-nums'] as const,
  },
} as const;

// ===== COMPONENT SIZES =====
// @fixed Sizes for consistent component dimensions
export const ComponentSizes = {
  riskPillWidth: 80,
  riskPillHeight: 28,
  severityBadgeDiameter: 32,
  touchTarget: 44,              // Minimum touch target (iOS HIG)
  kioskTouchTarget: 56,         // Larger for kiosk mode
  borderRadius: 12,             // Default card border radius
} as const;
