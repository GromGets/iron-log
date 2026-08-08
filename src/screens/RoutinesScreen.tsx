import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Modal, TextInput, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Card, Button, EmptyState, Title } from '@/components/UI';
import { colors, space, type, radius } from '@/theme/theme';
import { listRoutines, createRoutine, deleteRoutine, getRoutineExercises } from '@/db/repository';
import { Routine } from '@/types';
import { RootStackParamList } from '@/navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function RoutinesScreen() {
  const navigation = useNavigation<Nav>();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [exerciseCounts, setExerciseCounts] = useState<Record<string, number>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');

  const load = useCallback(async () => {
    const rs = await listRoutines();
    setRoutines(rs);
    const counts: Record<string, number> = {};
    await Promise.all(
      rs.map(async (r) => {
        const exs = await getRoutineExercises(r.id);
        counts[r.id] = exs.length;
      })
    );
    setExerciseCounts(counts);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const r = await createRoutine(newName);
    setNewName('');
    setModalVisible(false);
    await load();
    navigation.navigate('RoutineEditor', { routineId: r.id });
  };

  const handleDelete = (r: Routine) => {
    Alert.alert('Delete routine', `Delete "${r.name}"? This won't delete your logged workout history.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteRoutine(r.id);
          load();
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Button label="+ New Routine" onPress={() => setModalVisible(true)} />

        <View style={{ marginTop: space.xl, gap: space.md }}>
          {routines.length === 0 && (
            <EmptyState
              title="No routines yet"
              body="Create a routine like 'Push Day' to reuse it every time you train."
            />
          )}
          {routines.map((r) => (
            <Card key={r.id}>
              <Title>{r.name}</Title>
              <Text style={type.bodySecondary}>{exerciseCounts[r.id] ?? 0} exercises</Text>
              <View style={styles.actionsRow}>
                <Button
                  label="Start"
                  size="sm"
                  onPress={() => navigation.navigate('WorkoutSession', { routineId: r.id, routineName: r.name })}
                />
                <Button
                  label="Edit"
                  size="sm"
                  variant="secondary"
                  onPress={() => navigation.navigate('RoutineEditor', { routineId: r.id })}
                />
                <Button label="Delete" size="sm" variant="danger" onPress={() => handleDelete(r)} />
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={type.title}>New routine</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Push Day"
              placeholderTextColor={colors.textFaint}
              style={styles.input}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.lg }}>
              <View style={{ flex: 1 }}>
                <Button
                  label="Cancel"
                  variant="secondary"
                  onPress={() => {
                    setModalVisible(false);
                    setNewName('');
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Create" onPress={handleCreate} />
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
  actionsRow: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.md,
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
  },
  input: {
    marginTop: space.md,
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    color: colors.textPrimary,
    fontSize: 16,
  },
});
