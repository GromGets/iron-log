import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Card, Eyebrow, Title, Button, StatBlock, EmptyState } from '@/components/UI';
import { colors, space, type } from '@/theme/theme';
import { getStreakInfo, StreakInfo, getWeeklyVolume, WeeklyVolume } from '@/db/stats';
import { listSessions } from '@/db/repository';
import { WorkoutSession } from '@/types';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { LineChart } from '@/components/LineChart';
import { useActiveStudent } from '@/context/StudentContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { activeStudentId } = useActiveStudent();
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [weekly, setWeekly] = useState<WeeklyVolume[]>([]);
  const [recent, setRecent] = useState<WorkoutSession[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [s, w, r] = await Promise.all([getStreakInfo(), getWeeklyVolume(8), listSessions(5)]);
    setStreak(s);
    setWeekly(w);
    setRecent(r);
  }, [activeStudentId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        <View style={{ gap: space.sm }}>
          <Button label="Start Empty Workout" onPress={() => navigation.navigate('WorkoutSession', {})} />
          <Button
            label="View History"
            variant="secondary"
            onPress={() => navigation.navigate('History')}
          />
        </View>

        <Card style={{ marginTop: space.xl }}>
          <Eyebrow>Streak</Eyebrow>
          <View style={styles.row}>
            <StatBlock label="Current" value={streak?.currentStreakDays ?? 0} unit="days" />
            <StatBlock label="This week" value={streak?.workoutsLast7Days ?? 0} unit="sessions" />
            <StatBlock label="This month" value={streak?.workoutsLast30Days ?? 0} unit="sessions" />
          </View>
        </Card>

        <Card style={{ marginTop: space.lg }}>
          <Eyebrow>Weekly Volume (kg × reps)</Eyebrow>
          <View style={{ marginTop: space.sm, alignItems: 'center' }}>
            <LineChart
              points={weekly.map((w, i) => ({ x: i, y: w.totalVolume }))}
              width={300}
              height={140}
              formatValue={(v) => Math.round(v).toLocaleString()}
            />
          </View>
        </Card>

        <View style={{ marginTop: space.xl }}>
          <Title>Recent sessions</Title>
          <View style={{ marginTop: space.md, gap: space.sm }}>
            {recent.length === 0 && (
              <EmptyState
                title="No sessions yet"
                body="Start a workout above and it'll show up here once you finish it."
              />
            )}
            {recent.map((s) => (
              <Card
                key={s.id}
                style={styles.sessionCard}
              >
                <View style={{ flex: 1 }}>
                  <Text style={type.subtitle}>{s.routineName ?? 'Freestyle Workout'}</Text>
                  <Text style={type.bodySecondary}>{formatDate(s.startedAt)}</Text>
                </View>
                <Button
                  label="View"
                  size="sm"
                  variant="ghost"
                  onPress={() => navigation.navigate('SessionDetail', { sessionId: s.id })}
                />
              </Card>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  content: {
    padding: space.lg,
    paddingBottom: space.xxl * 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.md,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
