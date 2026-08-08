import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Card, EmptyState } from '@/components/UI';
import { space, type } from '@/theme/theme';
import { listSessions } from '@/db/repository';
import { WorkoutSession } from '@/types';
import { RootStackParamList } from '@/navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HistoryScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);

  useFocusEffect(
    useCallback(() => {
      listSessions(200).then(setSessions);
    }, [])
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: space.xxl * 2 + insets.bottom }]}>
        {sessions.length === 0 && (
          <EmptyState title="No sessions yet" body="Finished workouts will show up here." />
        )}
        <View style={{ gap: space.sm }}>
          {sessions.map((s) => (
            <Pressable key={s.id} onPress={() => navigation.navigate('SessionDetail', { sessionId: s.id })}>
              <Card style={styles.row}>
                <View>
                  <Text style={type.subtitle}>{s.routineName ?? 'Freestyle Workout'}</Text>
                  <Text style={type.bodySecondary}>{formatDate(s.startedAt)}</Text>
                </View>
                <Text style={{ color: '#8D9199', fontSize: 18 }}>›</Text>
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

const styles = StyleSheet.create({
  content: {
    padding: space.lg,
    paddingBottom: space.xxl * 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
