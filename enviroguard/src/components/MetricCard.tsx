/**
 * MetricCard Component - Displays environmental metrics with visual indicators
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@/theme/tokens';
import Card from './Card';

interface MetricCardProps {
  icon: string;
  title: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  severity?: 'low' | 'moderate' | 'high' | 'very_high';
  subtitle?: string;
}

export default function MetricCard({
  icon,
  title,
  value,
  unit,
  trend,
  severity,
  subtitle,
}: MetricCardProps) {
  const getSeverityColor = () => {
    switch (severity) {
      case 'low':
        return Colors.safe;
      case 'moderate':
        return Colors.warning;
      case 'high':
      case 'very_high':
        return Colors.danger;
      default:
        return Colors.textSecondary;
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      case 'stable':
        return '→';
    }
  };

  return (
    <Card style={styles.container} elevated>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        {trend && <Text style={styles.trend}>{getTrendIcon()}</Text>}
      </View>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.valueContainer}>
        <Text style={[styles.value, severity && { color: getSeverityColor() }]}>
          {value}
        </Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>

      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

      {severity && (
        <View style={[styles.severityBar, { backgroundColor: getSeverityColor() }]} />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 160,
    marginRight: Spacing.unit(2),
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.unit(1),
  },
  icon: {
    fontSize: 32,
  },
  trend: {
    fontSize: 24,
    color: Colors.textSecondary,
  },
  title: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.unit(0.5),
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.unit(0.5),
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginLeft: Spacing.unit(0.5),
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  severityBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
});
