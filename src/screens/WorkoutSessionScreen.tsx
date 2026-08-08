import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Pressable, Modal, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Button, EmptyState } from '@/components/UI';
import { colors, space, type, radius } from '@/theme/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';
import {
  startSession,
  finishSession,
  getRoutineExercises,
  listExercises,
} from '@/db/repository';
import { Exercise } from '@/types';
import { ExerciseLogCard } from '@/components/ExerciseLogCard';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route_ = RouteProp<RootStackParamList, 'WorkoutSession'>;

export default function WorkoutSessionScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route_>();
  const { routineId, routineName } = route.params ?? {};

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const session = await startSession(routineId, routineName);
      setSessionId(session.id);
      if (routineId) {
        const routineExs = await getRoutineExercises(routineId);
        setExercises(routineExs.map((r) => r.exercise));
      }
    })();
  }, [routineId, routineName]);

  const openPicker = async () => {
    const all = await listExercises();
    setAllExercises(all);
    setPickerVisible(true);
  };

  const handleAddExercise = (ex: Exercise) => {
    if (!exercises.find((e) => e.id === ex.id)) {
      setExercises((prev) => [...prev, ex]);
    }
    setPickerVisible(false);
    setSearch('');
  };

  const handleRemoveExercise = (id: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== id));
  };

  const handleFinish = () => {
    Alert.alert('Finish workout', 'Save and end this session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        onPress: async () => {
          if (sessionId) await finishSession(sessionId);
          navigation.goBack();
        },
      },
    ]);
  };

  const filtered = allExercises.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  if (!sessionId) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={type.bodySecondary}>Starting workout…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={type.title}>{routineName ?? 'Freestyle Workout'}</Text>
        <Text style={[type.bodySecondary, { marginTop: 2, marginBottom: space.lg }]}>
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>

        {exercises.length === 0 && (
          <EmptyState title="No exercises yet" body="Add an exercise below to start logging sets." />
        )}

        {exercises.map((ex) => (
          <ExerciseLogCard
            key={ex.id}
            exercise={ex}
            sessionId={sessionId}
            onRemove={() => handleRemoveExercise(ex.id)}
          />
        ))}

        <Button label="+ Add Exercise" variant="secondary" onPress={openPicker} />
        <View style={{ marginTop: space.lg }}>
          <Button label="Finish Workout" onPress={handleFinish} />
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
              <Pressable key={ex.id} style={styles.pickRow} onPress={() => handleAddExercise(ex)}>
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
