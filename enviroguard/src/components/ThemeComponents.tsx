import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import { Colors, Spacing, Typography, ComponentSizes } from '@/theme/tokens';

// Helper to get category-specific colors
export function getCategoryColor(category: string): string {
  const cat = category?.toLowerCase();
  return Colors.categories[cat as keyof typeof Colors.categories] || Colors.danger;
}

// Helper to get severity-specific colors
export function getSeverityColor(severity: number): string {
  if (severity >= 4) return Colors.danger;
  if (severity === 3) return Colors.warning;
  return Colors.safe;
}

// ===== RISK PILL =====
interface RiskPillProps {
  score: number;
}
export function RiskPill({ score }: RiskPillProps) {
  const severityColor = score >= 60 ? Colors.danger : score >= 30 ? Colors.warning : Colors.safe;
  return (
    <View style={[styles.riskPill, { backgroundColor: severityColor }]}>
      <Text style={styles.riskPillText}>{score}</Text>
    </View>
  );
}

// ===== SEVERITY BADGE =====
interface SeverityBadgeProps {
  severity: number;
  style?: any;
}
export function SeverityBadge({ severity, style }: SeverityBadgeProps) {
  const bgColor = getSeverityColor(severity);
  return (
    <View style={[styles.severityBadge, { backgroundColor: bgColor }, style]}>
      <Text style={styles.severityBadgeText}>{severity}</Text>
    </View>
  );
}

// ===== CATEGORY BADGE =====
interface CategoryBadgeProps {
  category: string;
  style?: any;
}
export function CategoryBadge({ category, style }: CategoryBadgeProps) {
  const color = getCategoryColor(category);
  return (
    <View style={[styles.categoryBadge, { backgroundColor: `${color}26`, borderColor: color }, style]}>
      <Text style={[styles.categoryBadgeText, { color }]}>
        {category.toUpperCase()}
      </Text>
    </View>
  );
}

// ===== COMMUNITY DATA BADGE =====
export function CommunityDataBadge() {
  return (
    <View style={styles.communityBadge}>
      <Text style={styles.communityBadgeText}>👥 COMMUNITY MODE</Text>
    </View>
  );
}

// ===== MODE TOGGLE =====
interface ModeToggleProps {
  activeOption: 'api' | 'community';
  onChange: (option: 'api' | 'community') => void;
}
export function ModeToggle({ activeOption, onChange }: ModeToggleProps) {
  const activeIndex = useSharedValue(activeOption === 'api' ? 0 : 1);

  useEffect(() => {
    activeIndex.value = withSpring(activeOption === 'api' ? 0 : 1, {
      damping: 18,
      stiffness: 200,
    });
  }, [activeOption]);

  const activePillStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: activeIndex.value * 108, // option width (108)
        },
      ],
    };
  });

  const apiTextStyle = useAnimatedStyle(() => {
    return {
      color: interpolateColor(
        activeIndex.value,
        [0, 1],
        [Colors.primary, Colors.textSecondary]
      ),
    };
  });

  const communityTextStyle = useAnimatedStyle(() => {
    return {
      color: interpolateColor(
        activeIndex.value,
        [0, 1],
        [Colors.textSecondary, Colors.primary]
      ),
    };
  });

  return (
    <View style={styles.toggleContainer}>
      <Animated.View style={[styles.toggleActivePill, activePillStyle]} />
      <TouchableOpacity
        style={styles.toggleOption}
        onPress={() => onChange('api')}
        activeOpacity={0.8}
      >
        <Animated.Text style={[styles.toggleText, apiTextStyle]}>
          📡 API Data
        </Animated.Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.toggleOption}
        onPress={() => onChange('community')}
        activeOpacity={0.8}
      >
        <Animated.Text style={[styles.toggleText, communityTextStyle]}>
          👥 Community
        </Animated.Text>
      </TouchableOpacity>
    </View>
  );
}

// ===== I HAVE THIS TOO BUTTON =====
interface IHaveThisTooButtonProps {
  agreed: boolean;
  count: number;
  onPress: () => void;
  disabled?: boolean;
}
export function IHaveThisTooButton({ agreed, count, onPress, disabled }: IHaveThisTooButtonProps) {
  const scale = useSharedValue(1);
  const countScale = useSharedValue(1);
  const agreedVal = useSharedValue(agreed ? 1 : 0);

  useEffect(() => {
    agreedVal.value = withTiming(agreed ? 1 : 0, { duration: 150 });
  }, [agreed]);

  // Bounce count if it crosses threshold (10)
  useEffect(() => {
    if (count >= 10) {
      countScale.value = withSequence(
        withTiming(1.4, { duration: 100 }),
        withSpring(1.0, { damping: 10, stiffness: 100 })
      );
    }
  }, [count]);

  const handlePress = () => {
    if (disabled) return;
    scale.value = withSequence(
      withTiming(0.92, { duration: 80 }),
      withSpring(1.0, { damping: 12, stiffness: 200 }, (finished) => {
        if (finished) {
          runOnJS(onPress)();
        }
      })
    );
  };

  const buttonStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      agreedVal.value,
      [0, 1],
      ['#E8E6DE', Colors.primary]
    );
    return {
      transform: [{ scale: scale.value }],
      backgroundColor,
    };
  });

  const iconColorStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      agreedVal.value,
      [0, 1],
      [Colors.textSecondary, '#FFFFFF']
    );
    return { color };
  });

  const textStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      agreedVal.value,
      [0, 1],
      [Colors.primary, '#FFFFFF']
    );
    return { color };
  });

  const animatedCountStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: countScale.value }],
    };
  });

  return (
    <View style={styles.agreeWrapper}>
      <Pressable onPress={handlePress} disabled={disabled}>
        <Animated.View style={[styles.agreeBtn, buttonStyle]}>
          <Animated.Text style={iconColorStyle}>
            <Ionicons name="hand-left" size={16} />
          </Animated.Text>
          <Animated.Text style={[styles.agreeBtnText, textStyle]}>
            {agreed ? 'Agreed' : 'I Have This Too'}
          </Animated.Text>
        </Animated.View>
      </Pressable>
      <Animated.View style={[styles.agreeCountContainer, animatedCountStyle]}>
        <Text style={[styles.agreeCountText, Typography.tabularNums]}>
          {count}
        </Text>
      </Animated.View>
    </View>
  );
}

// ===== SKELETON LOADER =====
export function SkeletonLoader({ width = '100%', height = 20, style }: { width?: any, height?: number, style?: any }) {
  const translateX = useSharedValue(-1);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value * 200 }],
    };
  });

  return (
    <View style={[styles.skeletonContainer, { width, height }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle]}>
        <LinearGradient
          colors={['#E8E6DE', '#F4F2EB', '#E8E6DE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

// ===== REPORT CARD =====
interface ReportCardProps {
  category: string;
  severity: number;
  description: string;
  location: string;
  timeAgo: string;
  photoUrl?: string;
  agreed: boolean;
  agreementCount: number;
  onAgree: () => void;
  onCommentPress: () => void;
  onSharePress: () => void;
  onDelete?: () => void;
  commentCount?: number;
  petitionReady?: boolean;
  isMyPost?: boolean;
}
export function ReportCard({
  category,
  severity,
  description,
  location,
  timeAgo,
  photoUrl,
  agreed,
  agreementCount,
  onAgree,
  onCommentPress,
  onSharePress,
  onDelete,
  commentCount,
  petitionReady,
  isMyPost,
}: ReportCardProps) {
  const cardScale = useSharedValue(1);

  const handleAgreePress = () => {
    cardScale.value = withSequence(
      withTiming(1.02, { duration: 100 }),
      withSpring(1.0, { damping: 10, stiffness: 100 })
    );
    onAgree();
  };

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: cardScale.value }],
    };
  });

  return (
    <Animated.View style={[styles.reportCard, animatedCardStyle]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <CategoryBadge category={category} />
        <SeverityBadge severity={severity} />
      </View>

      {/* Description */}
      <Text style={styles.cardDescription}>{description}</Text>

      {/* Optional Photo */}
      {photoUrl && (
        <View style={styles.photoContainer}>
          <Animated.Image
            source={{ uri: photoUrl }}
            style={styles.cardPhoto}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Meta Row */}
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>📍 {location}</Text>
        <Text style={styles.metaText}>• {timeAgo}</Text>
      </View>

      {/* Action Footer */}
      <View style={styles.cardFooter}>
        <IHaveThisTooButton
          agreed={agreed}
          count={agreementCount}
          onPress={handleAgreePress}
        />

        <TouchableOpacity style={styles.footerActionBtn} onPress={onCommentPress}>
          <Ionicons name="chatbubble-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.footerActionText}>
            Comment {commentCount ? `(${commentCount})` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerActionBtn} onPress={onSharePress}>
          <Ionicons name="share-social-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.footerActionText}>Share</Text>
        </TouchableOpacity>

        {isMyPost && onDelete && (
          <TouchableOpacity style={styles.footerActionBtn} onPress={onDelete}>
            <Ionicons name="trash-outline" size={16} color="#FF3B30" />
            <Text style={[styles.footerActionText, { color: '#FF3B30' }]}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

// ===== STYLES =====
const styles = StyleSheet.create({
  // RiskPill
  riskPill: {
    width: ComponentSizes.riskPillWidth,
    height: ComponentSizes.riskPillHeight,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riskPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  // SeverityBadge
  severityBadge: {
    width: ComponentSizes.severityBadgeDiameter,
    height: ComponentSizes.severityBadgeDiameter,
    borderRadius: ComponentSizes.severityBadgeDiameter / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  severityBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // CategoryBadge
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // CommunityBadge
  communityBadge: {
    backgroundColor: '#854F0B1A', // Amber 10% opacity
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  communityBadgeText: {
    color: '#854F0B',
    fontSize: 10,
    fontWeight: '700',
  },

  // ModeToggle
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8E6DE',
    borderRadius: 24,
    padding: 4,
    width: 224,
    position: 'relative',
    height: 40,
    alignItems: 'center',
  },
  toggleActivePill: {
    position: 'absolute',
    left: 4,
    width: 108,
    height: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 3px rgba(0,0,0,0.1)',
      },
    }),
  },
  toggleOption: {
    width: 108,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // IHaveThisTooButton / Agree Section
  agreeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agreeBtn: {
    flexDirection: 'row',
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  agreeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  agreeCountContainer: {
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  agreeCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // Skeleton Loader
  skeletonContainer: {
    backgroundColor: '#E8E6DE',
    borderRadius: 4,
    overflow: 'hidden',
  },

  // ReportCard
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D3D1C7',
    padding: 12,
    marginBottom: Spacing.unit(2),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 8px rgba(0,0,0,0.06)',
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardDescription: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginBottom: 10,
  },
  photoContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
    height: 180,
    backgroundColor: Colors.background,
  },
  cardPhoto: {
    width: '100%',
    height: '100%',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#D3D1C7',
    paddingTop: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  footerActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
