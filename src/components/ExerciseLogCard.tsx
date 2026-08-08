import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { Card, Eyebrow, Button, Pill } from '@/components/UI';
import { colors, space, type, radius } from '@/theme/theme';
import { Exercise, SetEntry } from '@/types';
import { addSet, deleteSet, getLastTimeForExercise } from '@/db/repository';
import { formatSetLine } from '@/utils/format';

export function ExerciseLogCard({
  exercise,
  sessionId,
  onRemove,
}: {
  exercise: Exercise;
  sessionId: string;
  onRemove?: () => void;
}) {
  const [sets, setSets] = useState<SetEntry[]>([]);
  const [lastTime, setLastTime] = useState<{ date: string; sets: SetEntry[] } | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rir, setRir] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    const last = await getLastTimeForExercise(exercise.id, sessionId);
    setLastTime(last);
  }, [exercise.id, sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  // Pre-fill weight/reps from the last set of the same exercise last time, to
  // save typing — user just needs to try to match or beat it.
  useEffect(() => {
    if (lastTime && lastTime.sets.length > 0 && sets.length === 0) {
      const suggestion = lastTime.sets[lastTime.sets.length - 1];
      setWeight(String(suggestion.weight));
      setReps(String(suggestion.reps));
    }
  }, [lastTime]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddSet = async () => {
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    if (isNaN(w) || isNaN(r) || r <= 0) return;
    const rirVal = rir.trim() === '' ? null : parseInt(rir, 10);
    const newSet = await addSet(sessionId, exercise.id, w, r, rirVal, notes.trim() || null);
    setSets((prev) => [...prev, newSet]);
    setNotes('');
  };

  const handleDeleteSet = async (id: string) => {
    await deleteSet(id);
    setSets((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <Card style={{ marginBottom: space.md }}>
      <View style={styles.header}>
        <Text style={type.subtitle}>{exercise.name}</Text>
        {onRemove ? (
          <Pressable onPress={onRemove}>
            <Text style={{ color: colors.danger, fontSize: 13, fontWeight: '700' }}>Remove</Text>
          </Pressable>
        ) : null}
      </View>

      {lastTime ? (
        <View style={styles.lastTimeBox}>
          <Eyebrow>Last time — {formatRelativeDate(lastTime.date)}</Eyebrow>
          <Text style={styles.lastTimeText}>
            {lastTime.sets.map((s) => formatSetLine(s)).join(',  ')}
          </Text>
        </View>
      ) : (
        <Text style={[type.bodySecondary, { marginTop: space.xs }]}>First time logging this exercise</Text>
      )}

      {sets.length > 0 && (
        <View style={{ marginTop: space.md, gap: space.xs }}>
          {sets.map((s, idx) => (
            <View key={s.id} style={styles.setRow}>
              <Text style={type.statMedium}>
                {idx + 1}. {formatSetLine(s)}
              </Text>
              <Pressable onPress={() => handleDeleteSet(s.id)}>
                <Text style={{ color: colors.danger, fontSize: 13 }}>✕</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          value={weight}
          onChangeText={setWeight}
          placeholder="kg"
          placeholderTextColor={colors.textFaint}
          keyboardType="decimal-pad"
          style={[styles.input, { flex: 1 }]}
        />
        <TextInput
          value={reps}
          onChangeText={setReps}
          placeholder="reps"
          placeholderTextColor={colors.textFaint}
          keyboardType="number-pad"
          style={[styles.input, { flex: 1 }]}
        />
        <TextInput
          value={rir}
          onChangeText={setRir}
          placeholder="RIR"
          placeholderTextColor={colors.textFaint}
          keyboardType="number-pad"
          style={[styles.input, { flex: 0.7 }]}
        />
      </View>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Notes (optional)"
        placeholderTextColor={colors.textFaint}
        style={[styles.input, { marginTop: space.sm }]}
      />
      <View style={{ marginTop: space.sm }}>
        <Button label={`Add Set ${sets.length + 1}`} size="sm" onPress={handleAddSet} />
      </View>
    </Card>
  );
}

function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.round((now.setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86400000);
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastTimeBox: {
    marginTop: space.sm,
    padding: space.sm,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.sm,
  },
  lastTimeText: {
    fontFamily: type.statMedium.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    marginTop: 4,
    lineHeight: 18,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  inputRow: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.md,
  },
  input: {
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.sm,
    color: colors.textPrimary,
    fontSize: 15,
  },
});
