import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Modal, TextInput, Pressable } from 'react-native';
import { useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { Screen, Card, Button, EmptyState, Eyebrow } from '@/components/UI';
import { colors, space, type, radius } from '@/theme/theme';
import {
  getRoutineExercises,
  addExerciseToRoutine,
  removeExerciseFromRoutine,
  listExercises,
} from '@/db/repository';
import { Exercise, RoutineExercise } from '@/types';
import { RootStackParamList } from '@/navigation/RootNavigator';

type Route_ = RouteProp<RootStackParamList, 'RoutineEditor'>;

type RoutineExerciseRow = RoutineExercise & { exercise: Exercise };

export default function RoutineEditorScreen() {
  const route = useRoute<Route_>();
  const routineId = route.params.routineId!;
  const [items, setItems] = useState<RoutineExerciseRow[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    const exs = await getRoutineExercises(routineId);
    setItems(exs);
  }, [routineId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openPicker = async () => {
    const all = await listExercises();
    setAllExercises(all);
    setPickerVisible(true);
  };

  const handleAdd = async (exerciseId: string) => {
    await addExerciseToRoutine(routineId, exerciseId);
    setPickerVisible(false);
    setSearch('');
    load();
  };

  const handleRemove = async (routineExerciseId: string) => {
    await removeExerciseFromRoutine(routineExerciseId);
    load();
  };

  const filtered = allExercises.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Eyebrow>Exercises in this routine</Eyebrow>
        <View style={{ marginTop: space.md, gap: space.sm }}>
          {items.length === 0 && (
            <EmptyState title="No exercises yet" body="Add exercises below to build out this routine." />
          )}
          {items.map((item, idx) => (
            <Card key={item.id} style={styles.exerciseRow}>
              <View style={{ flex: 1 }}>
                <Text style={type.subtitle}>
                  {idx + 1}. {item.exercise.name}
                </Text>
                <Text style={type.bodySecondary}>{item.exercise.muscleGroup}</Text>
              </View>
              <Button label="Remove" size="sm" variant="danger" onPress={() => handleRemove(item.id)} />
            </Card>
          ))}
        </View>

        <View style={{ marginTop: space.lg }}>
          <Button label="+ Add Exercise" variant="secondary" onPress={openPicker} />
        </View>
      </ScrollView>

      <Modal visible={pickerVisible} animationType="slide">
        <Screen style={{ paddingTop: 60 }}>
          <View style={{ paddingHorizontal: space.lg }}>
            <Text style={type.title}>Add exercise</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search exercises"
              placeholderTextColor={colors.textFaint}
              style={styles.input}
            />
          </View>
          <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.xs }}>
            {filtered.map((ex) => (
              <Pressable key={ex.id} style={styles.pickRow} onPress={() => handleAdd(ex.id)}>
                <Text style={type.body}>{ex.name}</Text>
                <Text style={type.bodySecondary}>{ex.muscleGroup}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={{ padding: space.lg }}>
            <Button label="Close" variant="secondary" onPress={() => setPickerVisible(false)} />
          </View>
        </Screen>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space.lg,
    paddingBottom: space.xxl * 2,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    marginTop: space.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    color: colors.textPrimary,
    fontSize: 16,
  },
  pickRow: {
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
