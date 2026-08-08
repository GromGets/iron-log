import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { Screen, Card, Eyebrow, StatBlock, EmptyState } from '@/components/UI';
import { space, type, colors } from '@/theme/theme';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { getExerciseHistory, getPersonalRecords, ExercisePoint, PersonalRecords } from '@/db/stats';
import { LineChart } from '@/components/LineChart';

type Route_ = RouteProp<RootStackParamList, 'ExerciseStats'>;

type Metric = 'maxWeight' | 'estOneRepMax' | 'totalVolume';

const METRIC_LABELS: Record<Metric, string> = {
  maxWeight: 'Max Weight (kg)',
  estOneRepMax: 'Est. 1RM (kg)',
  totalVolume: 'Total Volume',
};

export default function ExerciseStatsScreen() {
  const route = useRoute<Route_>();
  const { exerciseId } = route.params;
  const [history, setHistory] = useState<ExercisePoint[]>([]);
  const [prs, setPrs] = useState<PersonalRecords | null>(null);
  const [metric, setMetric] = useState<Metric>('maxWeight');

  const load = useCallback(async () => {
    const [h, p] = await Promise.all([getExerciseHistory(exerciseId), getPersonalRecords(exerciseId)]);
    setHistory(h);
    setPrs(p);
  }, [exerciseId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (history.length === 0) {
    return (
      <Screen>
        <EmptyState
          title="No history yet"
          body="Log a set for this exercise during a workout and your stats will show up here."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Eyebrow>Personal Records</Eyebrow>
          <View style={styles.prGrid}>
            <StatBlock label="Max weight" value={prs?.maxWeight?.value ?? '—'} unit="kg" />
            <StatBlock label="Max reps" value={prs?.maxReps?.value ?? '—'} unit="reps" />
            <StatBlock label="Est. 1RM" value={prs?.bestEstOneRepMax?.value ?? '—'} unit="kg" />
            <StatBlock label="Best session vol." value={prs?.bestSessionVolume?.value ?? '—'} unit="kg" />
          </View>
        </Card>

        <Card style={{ marginTop: space.lg }}>
          <View style={styles.metricTabs}>
            {(Object.keys(METRIC_LABELS) as Metric[]).map((m) => (
              <Pressable key={m} onPress={() => setMetric(m)} style={[styles.metricTab, metric === m && styles.metricTabActive]}>
                <Text style={[type.bodySecondary, metric === m && { color: colors.surfaceSunken, fontWeight: '700' }]}>
                  {METRIC_LABELS[m]}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={{ marginTop: space.md, alignItems: 'center' }}>
            <LineChart
              points={history.map((h, i) => ({ x: i, y: h[metric] }))}
              width={300}
              height={160}
              formatValue={(v) => Math.round(v * 10) / 10 + ''}
            />
          </View>
        </Card>

        <View style={{ marginTop: space.xl }}>
          <Eyebrow>Session Log</Eyebrow>
          <View style={{ marginTop: space.sm, gap: space.xs }}>
            {[...history].reverse().map((h) => (
              <View key={h.date} style={styles.historyRow}>
                <Text style={type.bodySecondary}>{formatDate(h.date)}</Text>
                <Text style={type.statMedium}>
                  {h.maxWeight}kg × {h.topReps}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function formatDate(dayKey: string): string {
  const d = new Date(dayKey + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  content: {
    padding: space.lg,
    paddingBottom: space.xxl * 2,
  },
  prGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.lg,
    marginTop: space.md,
  },
  metricTabs: {
    flexDirection: 'row',
    gap: space.xs,
  },
  metricTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.surfaceSunken,
    alignItems: 'center',
  },
  metricTabActive: {
    backgroundColor: colors.accent,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
