import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Card, Eyebrow, Button } from '@/components/UI';
import { colors, space, type } from '@/theme/theme';
import { getSessionSets, deleteSession, deleteSet, listExercises } from '@/db/repository';
import { SetEntry, Exercise } from '@/types';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { formatSetLine } from '@/utils/format';
import { confirmAction } from '@/utils/alert';

type Route_ = RouteProp<RootStackParamList, 'SessionDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SessionDetailScreen() {
  const route = useRoute<Route_>();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { sessionId } = route.params;
  const [sets, setSets] = useState<SetEntry[]>([]);
  const [exercisesById, setExercisesById] = useState<Record<string, Exercise>>({});

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [s, exs] = await Promise.all([getSessionSets(sessionId), listExercises()]);
        setSets(s);
        const map: Record<string, Exercise> = {};
        exs.forEach((e) => (map[e.id] = e));
        setExercisesById(map);
      })();
    }, [sessionId])
  );

  const byExercise = new Map<string, SetEntry[]>();
  for (const s of sets) {
    if (!byExercise.has(s.exerciseId)) byExercise.set(s.exerciseId, []);
    byExercise.get(s.exerciseId)!.push(s);
  }

  const handleDelete = () => {
    confirmAction('Delete session', 'This will permanently remove this workout and its logged sets.', async () => {
      await deleteSession(sessionId);
      navigation.goBack();
    });
  };

  const handleDeleteSet = (set: SetEntry) => {
    confirmAction('Delete set', `Remove ${formatSetLine(set)} for good?`, async () => {
      await deleteSet(set.id);
      setSets((prev) => prev.filter((s) => s.id !== set.id));
    });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: space.xxl * 2 + insets.bottom }]}>
        {Array.from(byExercise.entries()).map(([exId, exSets]) => (
          <Card key={exId} style={{ marginBottom: space.md }}>
            <Eyebrow>{exercisesById[exId]?.name ?? 'Exercise'}</Eyebrow>
            <View style={{ marginTop: space.sm, gap: space.xs }}>
              {exSets.map((s) => (
                <View key={s.id} style={styles.setRow}>
                  <Text style={[type.statMedium, { flex: 1 }]}>
                    {s.setIndex}. {formatSetLine(s)}
                    {s.notes ? ` — ${s.notes}` : ''}
                  </Text>
                  <Pressable onPress={() => handleDeleteSet(s)} hitSlop={8}>
                    <Text style={{ color: colors.danger, fontSize: 15 }}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </Card>
        ))}
        <View style={{ marginTop: space.lg }}>
          <Button label="Delete Session" variant="danger" onPress={handleDelete} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space.lg,
    paddingBottom: space.xxl * 2,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
});
