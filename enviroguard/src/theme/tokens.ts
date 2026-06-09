/**
 * Design tokens for EnviroGuard v2
 * Source: Approved UI/UX Design System Specification
 */

// ===== COLORS =====
export const Colors = {
  // Brand identity colors
  primary: '#0F6E56',         // Deep teal - CTAs, active states, map heatmap anchor
  primaryMid: '#1D9E75',      // Medium teal - secondary actions, success states
  primaryLight: '#E1F5EE',    // Soft mint - card backgrounds, selected rows
  purple: '#534AB7',          // Forecast page, ML/prediction UI, community mode
  amber: '#854F0B',           // Warnings, profile section, medium severity
  danger: '#D85A30',          // High risk, severity 4-5
  warning: '#EF9F27',         // Severity 3, moderate risk
  safe: '#639922',            // Severity 1-2, clean readings

  // Neutrals
  background: '#F1EFE8',      // Warm off-white app background (not pure white)
  surface: '#FFFFFF',         // Card/modal surfaces
  textPrimary: '#2C2C2A',     // Near-black text
  textSecondary: '#888780',   // Muted grey text
  border: '#D3D1C7',          // Subtle border grey

  // Category Colors
  categories: {
    noise: '#0F6E56',
    air: '#1A5F9E',
    litter: '#854F0B',
    pollen: '#639922',
    general: '#D85A30',
  }
} as const;

// ===== SPACING =====
export const Spacing = {
  base: 8,
  screenPadding: 16,
  cardPadding: 12,
  sectionGap: 24,

  // Helper function to get spacing in multiples of base unit
  unit: (multiplier: number) => multiplier * 8,
} as const;

// ===== TYPOGRAPHY =====
export const Typography = {
  // Screen titles
  title: {
    fontFamily: undefined, // System default
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },

  // Section headings
  subtitle: {
    fontFamily: undefined, // System default
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },

  // Body text
  body: {
    fontFamily: undefined, // System default
    fontSize: 15,
    fontWeight: '400' as const,
    color: Colors.textPrimary,
  },

  // Metadata / Caption
  caption: {
    fontFamily: undefined, // System default
    fontSize: 12,
    fontWeight: '400' as const,
    color: Colors.textSecondary,
  },

  // Numeric values
  tabularNums: {
    fontVariant: ['tabular-nums'] as const,
  },
} as const;

// ===== COMPONENT SIZES =====
export const ComponentSizes = {
  riskPillWidth: 44,
  riskPillHeight: 28,
  severityBadgeDiameter: 24,
  touchTarget: 44,
  borderRadius: 12,
} as const;
