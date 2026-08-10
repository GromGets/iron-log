import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, space, type, radius } from '@/theme/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { AddStudentModal } from './AddStudentModal';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// A shortcut hub into flows that already exist elsewhere in the app — it
// never owns any of that logic itself, just jumps to it (navigating to the
// relevant tab and asking that screen to open its own "add" modal, or
// reusing the existing "Start Empty Workout" flow for logging a set).
export function QuickActionsFab() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);
  const [addStudentVisible, setAddStudentVisible] = useState(false);

  const runAction = (fn: () => void) => {
    setMenuVisible(false);
    fn();
  };

  return (
    <>
      <Pressable onPress={() => setMenuVisible(true)} style={[styles.fab, { bottom: 72 + insets.bottom }]}>
        <Text style={styles.fabIcon}>+</Text>
      </Pressable>

      <Modal visible={menuVisible} transparent animationType="fade">
        <Pressable style={styles.backdrop} onPress={() => setMenuVisible(false)}>
          <View style={[styles.sheet, { paddingBottom: space.lg + insets.bottom }]} onStartShouldSetResponder={() => true}>
            <Text style={type.title}>Quick add</Text>
            <View style={{ marginTop: space.md, gap: space.xs }}>
              <ActionRow label="Add Person" onPress={() => runAction(() => setAddStudentVisible(true))} />
              <ActionRow
                label="Add Exercise"
                onPress={() =>
                  runAction(() =>
                    navigation.navigate('MainTabs', { screen: 'Exercises', params: { openAdd: true } })
                  )
                }
              />
              <ActionRow label="Add Set" onPress={() => runAction(() => navigation.navigate('WorkoutSession', {}))} />
              <ActionRow
                label="Add Measurement"
                onPress={() =>
                  runAction(() => navigation.navigate('MainTabs', { screen: 'Body', params: { openAdd: true } }))
                }
              />
            </View>
          </View>
        </Pressable>
      </Modal>

      <AddStudentModal visible={addStudentVisible} onClose={() => setAddStudentVisible(false)} />
    </>
  );
}

function ActionRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Text style={type.body}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: space.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  fabIcon: {
    fontSize: 30,
    lineHeight: 32,
    color: colors.surfaceSunken,
    fontWeight: '700',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSunken,
  },
});
