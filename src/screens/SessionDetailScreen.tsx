import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Card, Eyebrow, Button } from '@/components/UI';
import { space, type } from '@/theme/theme';
import { getSessionSets, deleteSession, listExercises } from '@/db/repository';
import { SetEntry, Exercise } from '@/types';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { formatSetLine } from '@/utils/format';

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
    Alert.alert('Delete session', 'This will permanently remove this workout and its logged sets.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteSession(sessionId);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: space.xxl * 2 + insets.bottom }]}>
        {Array.from(byExercise.entries()).map(([exId, exSets]) => (
          <Card key={exId} style={{ marginBottom: space.md }}>
            <Eyebrow>{exercisesById[exId]?.name ?? 'Exercise'}</Eyebrow>
            <View style={{ marginTop: space.sm, gap: space.xs }}>
              {exSets.map((s) => (
                <Text key={s.id} style={type.statMedium}>
                  {s.setIndex}. {formatSetLine(s)}
                  {s.notes ? ` — ${s.notes}` : ''}
                </Text>
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
});
