import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { colors, space, type, radius } from '@/theme/theme';
import { useActiveStudent } from '@/context/StudentContext';
import { AddStudentModal } from './AddStudentModal';
import { confirmAction } from '@/utils/alert';

// Only rendered (by the header) when there's something to switch between —
// a single-student user never sees this at all.
export function StudentSwitcherButton() {
  const { students, activeStudentId, activeStudent, switchStudent, deleteStudent } = useActiveStudent();
  const [visible, setVisible] = useState(false);
  const [addVisible, setAddVisible] = useState(false);

  if (students.length <= 1) return null;

  const handleDelete = (id: string, name: string) => {
    confirmAction(
      'Delete person',
      `Remove ${name} and all of their routines, workout history, and body tracking? This can't be undone.`,
      async () => {
        await deleteStudent(id);
        if (students.length - 1 <= 1) setVisible(false);
      }
    );
  };

  return (
    <>
      <Pressable onPress={() => setVisible(true)} style={styles.trigger} hitSlop={8}>
        <Text style={styles.triggerText} numberOfLines={1}>
          {activeStudent?.name ?? 'Switch'} ▾
        </Text>
      </Pressable>

      <Modal visible={visible} transparent animationType="fade">
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <View style={styles.card} onStartShouldSetResponder={() => true}>
            <Text style={type.title}>Switch student</Text>
            <View style={{ marginTop: space.md, gap: space.xs }}>
              {students.map((s) => (
                <View key={s.id} style={[styles.row, styles.studentRow, s.id === activeStudentId && styles.rowActive]}>
                  <Pressable
                    style={{ flex: 1 }}
                    onPress={async () => {
                      await switchStudent(s.id);
                      setVisible(false);
                    }}
                  >
                    <Text
                      style={[type.body, s.id === activeStudentId && { color: colors.accent, fontWeight: '700' }]}
                    >
                      {s.name}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => handleDelete(s.id, s.name)} hitSlop={8}>
                    <Text style={{ color: colors.danger, fontSize: 15 }}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
            <Pressable
              onPress={() => {
                setVisible(false);
                setAddVisible(true);
              }}
              style={[styles.row, { marginTop: space.sm }]}
            >
              <Text style={{ color: colors.accent, fontWeight: '700' }}>+ Add person</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <AddStudentModal visible={addVisible} onClose={() => setAddVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    marginLeft: space.md,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 130,
  },
  triggerText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    width: '100%',
    maxWidth: 360,
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSunken,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  rowActive: {
    backgroundColor: colors.accentSoft,
  },
});
