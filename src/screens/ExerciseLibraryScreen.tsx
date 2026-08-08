import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Pressable, Modal } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Button, Eyebrow, Pill } from '@/components/UI';
import { colors, space, type, radius } from '@/theme/theme';
import { listExercises, createCustomExercise } from '@/db/repository';
import { Exercise, MuscleGroup } from '@/types';
import { RootStackParamList } from '@/navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Legs',
  'Glutes',
  'Core',
  'Full Body',
  'Other',
];

export default function ExerciseLibraryScreen() {
  const navigation = useNavigation<Nav>();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState<MuscleGroup>('Other');

  const load = useCallback(async () => {
    setExercises(await listExercises());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = exercises.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));
  const grouped = MUSCLE_GROUPS.map((g) => ({
    group: g,
    items: filtered.filter((e) => e.muscleGroup === g),
  })).filter((g) => g.items.length > 0);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createCustomExercise(newName, newGroup);
    setNewName('');
    setNewGroup('Other');
    setAddModalVisible(false);
    load();
  };

  return (
    <Screen>
      <View style={{ padding: space.lg, paddingBottom: 0 }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search exercises"
          placeholderTextColor={colors.textFaint}
          style={styles.input}
        />
        <View style={{ marginTop: space.sm }}>
          <Button label="+ Add Custom Exercise" variant="secondary" onPress={() => setAddModalVisible(true)} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {grouped.map(({ group, items }) => (
          <View key={group} style={{ marginBottom: space.lg }}>
            <Eyebrow>{group}</Eyebrow>
            <View style={{ marginTop: space.sm, gap: space.xs }}>
              {items.map((ex) => (
                <Pressable
                  key={ex.id}
                  style={styles.row}
                  onPress={() => navigation.navigate('ExerciseStats', { exerciseId: ex.id, exerciseName: ex.name })}
                >
                  <Text style={type.body}>{ex.name}</Text>
                  {ex.isCustom ? <Pill label="Custom" tone="accent" /> : null}
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={addModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={type.title}>New exercise</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Cable Y-Raise"
              placeholderTextColor={colors.textFaint}
              style={styles.input}
              autoFocus
            />
            <Eyebrow>Muscle group</Eyebrow>
            <View style={styles.groupWrap}>
              {MUSCLE_GROUPS.map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setNewGroup(g)}
                  style={[styles.groupChip, newGroup === g && styles.groupChipActive]}
                >
                  <Text style={[type.bodySecondary, newGroup === g && { color: colors.surfaceSunken, fontWeight: '700' }]}>
                    {g}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.lg }}>
              <View style={{ flex: 1 }}>
                <Button
                  label="Cancel"
                  variant="secondary"
                  onPress={() => {
                    setAddModalVisible(false);
                    setNewName('');
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Add" onPress={handleCreate} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space.lg,
    paddingBottom: space.xxl * 2,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    color: colors.textPrimary,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  modalCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    width: '100%',
    gap: space.sm,
  },
  groupWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
  },
  groupChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
});
