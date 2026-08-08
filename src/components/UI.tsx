import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, radius, space, type } from '@/theme/theme';

export function Screen({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <Text style={type.caption}>{children}</Text>;
}

export function Title({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <Text style={[type.title, style]}>{children}</Text>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  size = 'md',
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  size?: 'sm' | 'md';
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        size === 'sm' && styles.btnSm,
        variant === 'primary' && styles.btnPrimary,
        variant === 'secondary' && styles.btnSecondary,
        variant === 'ghost' && styles.btnGhost,
        variant === 'danger' && styles.btnDanger,
        disabled && styles.btnDisabled,
        pressed && !disabled && styles.btnPressed,
      ]}
    >
      <Text
        style={[
          styles.btnText,
          variant === 'primary' && styles.btnTextPrimary,
          variant === 'ghost' && styles.btnTextGhost,
          variant === 'danger' && styles.btnTextDanger,
          size === 'sm' && styles.btnTextSm,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function StatBlock({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <View style={styles.statBlock}>
      <Text style={type.caption}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        <Text style={type.statLarge}>{value}</Text>
        {unit ? <Text style={[type.bodySecondary]}>{unit}</Text> : null}
      </View>
    </View>
  );
}

export function Pill({ label, tone = 'default' }: { label: string; tone?: 'default' | 'accent' | 'positive' }) {
  return (
    <View
      style={[
        styles.pill,
        tone === 'accent' && { backgroundColor: colors.accentSoft },
        tone === 'positive' && { backgroundColor: colors.positiveSoft },
      ]}
    >
      <Text
        style={[
          styles.pillText,
          tone === 'accent' && { color: colors.accent },
          tone === 'positive' && { color: colors.positive },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <Text style={[type.subtitle, { marginBottom: space.xs }]}>{title}</Text>
      <Text style={[type.bodySecondary, { textAlign: 'center' }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: space.lg,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSm: {
    paddingVertical: 8,
    paddingHorizontal: space.md,
  },
  btnPrimary: {
    backgroundColor: colors.accent,
  },
  btnSecondary: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnGhost: {
    backgroundColor: 'transparent',
  },
  btnDanger: {
    backgroundColor: colors.dangerSoft,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnPressed: {
    opacity: 0.75,
  },
  btnText: {
    fontFamily: type.subtitle.fontFamily,
    fontWeight: '700',
    fontSize: 15,
    color: colors.textPrimary,
  },
  btnTextPrimary: {
    color: colors.surfaceSunken,
  },
  btnTextGhost: {
    color: colors.accent,
  },
  btnTextDanger: {
    color: colors.danger,
  },
  btnTextSm: {
    fontSize: 13,
  },
  statBlock: {
    gap: 6,
  },
  pill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceElevated,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  empty: {
    padding: space.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
