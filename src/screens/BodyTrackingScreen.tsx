import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Pressable, Modal, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Card, Eyebrow, Button, EmptyState } from '@/components/UI';
import { colors, space, type, radius } from '@/theme/theme';
import {
  addBodyWeight,
  listBodyWeights,
  deleteBodyWeight,
  addBodyMeasurement,
  listBodyMeasurements,
  deleteBodyMeasurement,
  listMeasurementTypes,
  addMeasurementType,
  deleteMeasurementType,
} from '@/db/repository';
import { BodyWeightEntry, BodyMeasurementEntry, MeasurementTypeDef } from '@/types';
import { LineChart } from '@/components/LineChart';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function BodyTrackingScreen() {
  const [weights, setWeights] = useState<BodyWeightEntry[]>([]);
  const [types, setTypes] = useState<MeasurementTypeDef[]>([]);
  const [measurementType, setMeasurementType] = useState<string>('');
  const [measurements, setMeasurements] = useState<BodyMeasurementEntry[]>([]);

  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [weightInput, setWeightInput] = useState('');

  const [measureModalVisible, setMeasureModalVisible] = useState(false);
  const [measureInput, setMeasureInput] = useState('');
  const [measureTypeInput, setMeasureTypeInput] = useState<string>('');

  const [addTypeModalVisible, setAddTypeModalVisible] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');

  const loadTypes = useCallback(async () => {
    const t = await listMeasurementTypes();
    setTypes(t);
    setMeasurementType((cur) => (cur && t.some((x) => x.name === cur) ? cur : t[0]?.name ?? ''));
  }, []);

  const load = useCallback(async () => {
    const [w, m] = await Promise.all([
      listBodyWeights(60),
      measurementType ? listBodyMeasurements(measurementType, 60) : Promise.resolve([]),
    ]);
    setWeights(w);
    setMeasurements(m);
  }, [measurementType]);

  useFocusEffect(
    useCallback(() => {
      loadTypes();
    }, [loadTypes])
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleAddType = async () => {
    const name = newTypeName.trim();
    if (!name) return;
    if (types.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      Alert.alert('Already exists', `"${name}" is already a category.`);
      return;
    }
    const created = await addMeasurementType(name);
    setNewTypeName('');
    setAddTypeModalVisible(false);
    setTypes((prev) => [...prev, created]);
    setMeasurementType(created.name);
  };

  const handleDeleteType = (t: MeasurementTypeDef) => {
    Alert.alert(
      'Delete category',
      `Remove "${t.name}" from your measurement categories? Past entries logged under it won't be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMeasurementType(t.id);
            setTypes((prev) => {
              const remaining = prev.filter((x) => x.id !== t.id);
              if (measurementType === t.name) setMeasurementType(remaining[0]?.name ?? '');
              return remaining;
            });
          },
        },
      ]
    );
  };

  const handleAddWeight = async () => {
    const v = parseFloat(weightInput);
    if (isNaN(v)) return;
    await addBodyWeight(v);
    setWeightInput('');
    setWeightModalVisible(false);
    load();
  };

  const handleAddMeasurement = async () => {
    const v = parseFloat(measureInput);
    if (isNaN(v) || !measureTypeInput) return;
    await addBodyMeasurement(measureTypeInput, v);
    setMeasureInput('');
    setMeasureModalVisible(false);
    if (measureTypeInput === measurementType) load();
  };

  const handleDeleteWeight = (entry: BodyWeightEntry) => {
    Alert.alert('Delete entry', `Remove the ${entry.weightKg}kg entry from ${formatDate(entry.date)}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteBodyWeight(entry.id);
          setWeights((prev) => prev.filter((w) => w.id !== entry.id));
        },
      },
    ]);
  };

  const handleDeleteMeasurement = (entry: BodyMeasurementEntry) => {
    Alert.alert('Delete entry', `Remove the ${entry.valueCm}cm entry from ${formatDate(entry.date)}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteBodyMeasurement(entry.id);
          setMeasurements((prev) => prev.filter((m) => m.id !== entry.id));
        },
      },
    ]);
  };

  const weightChartData = [...weights].reverse().map((w, i) => ({ x: i, y: w.weightKg }));
  const measurementChartData = [...measurements].reverse().map((m, i) => ({ x: i, y: m.valueCm }));

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <View style={styles.cardHeader}>
            <Eyebrow>Body Weight</Eyebrow>
            <Pressable onPress={() => setWeightModalVisible(true)}>
              <Text style={styles.addLink}>+ Log</Text>
            </Pressable>
          </View>
          {weights.length === 0 ? (
            <EmptyState title="No entries yet" body="Log your body weight to see your trend over time." />
          ) : (
            <>
              <View style={{ alignItems: 'center', marginTop: space.sm }}>
                <LineChart points={weightChartData} width={300} height={140} formatValue={(v) => `${v}kg`} />
              </View>
              <View style={{ marginTop: space.md, gap: space.xs }}>
                {weights.map((w) => (
                  <View key={w.id} style={styles.entryRow}>
                    <Text style={type.bodySecondary}>{formatDate(w.date)}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                      <Text style={type.statMedium}>{w.weightKg}kg</Text>
                      <Pressable onPress={() => handleDeleteWeight(w)} hitSlop={8}>
                        <Text style={{ color: colors.danger, fontSize: 15 }}>✕</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </Card>

        <Card style={{ marginTop: space.lg }}>
          <View style={styles.cardHeader}>
            <Eyebrow>Measurements</Eyebrow>
            {types.length > 0 ? (
              <Pressable
                onPress={() => {
                  setMeasureTypeInput(measurementType);
                  setMeasureModalVisible(true);
                }}
              >
                <Text style={styles.addLink}>+ Log</Text>
              </Pressable>
            ) : null}
          </View>
          <View style={styles.typeTabs}>
            {types.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => setMeasurementType(t.name)}
                onLongPress={() => handleDeleteType(t)}
                style={[styles.typeChip, measurementType === t.name && styles.typeChipActive]}
              >
                <Text
                  style={[
                    type.bodySecondary,
                    { fontSize: 12 },
                    measurementType === t.name && { color: colors.surfaceSunken, fontWeight: '700' },
                  ]}
                >
                  {t.name}
                </Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setAddTypeModalVisible(true)} style={[styles.typeChip, styles.typeChipAdd]}>
              <Text style={[type.bodySecondary, { fontSize: 12, color: colors.accent, fontWeight: '700' }]}>
                + Add
              </Text>
            </Pressable>
          </View>
          {types.length > 0 ? (
            <Text style={styles.hint}>Long-press a category to remove it</Text>
          ) : null}
          {types.length === 0 ? (
            <EmptyState
              title="No categories yet"
              body="Add a category like 'Calf' to start tracking a measurement."
            />
          ) : measurements.length === 0 ? (
            <EmptyState title="No entries yet" body={`Log your ${measurementType.toLowerCase()} measurement to see it change over time.`} />
          ) : (
            <>
              <View style={{ alignItems: 'center', marginTop: space.sm }}>
                <LineChart points={measurementChartData} width={300} height={140} formatValue={(v) => `${v}cm`} />
              </View>
              <View style={{ marginTop: space.md, gap: space.xs }}>
                {measurements.map((m) => (
                  <View key={m.id} style={styles.entryRow}>
                    <Text style={type.bodySecondary}>{formatDate(m.date)}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                      <Text style={type.statMedium}>{m.valueCm}cm</Text>
                      <Pressable onPress={() => handleDeleteMeasurement(m)} hitSlop={8}>
                        <Text style={{ color: colors.danger, fontSize: 15 }}>✕</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </Card>
      </ScrollView>

      <Modal visible={weightModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={type.title}>Log body weight</Text>
            <TextInput
              value={weightInput}
              onChangeText={setWeightInput}
              placeholder="kg"
              placeholderTextColor={colors.textFaint}
              keyboardType="decimal-pad"
              style={styles.input}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.lg }}>
              <View style={{ flex: 1 }}>
                <Button label="Cancel" variant="secondary" onPress={() => setWeightModalVisible(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Save" onPress={handleAddWeight} />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={measureModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={type.title}>Log measurement</Text>
            <View style={styles.typeTabs}>
              {types.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => setMeasureTypeInput(t.name)}
                  style={[styles.typeChip, measureTypeInput === t.name && styles.typeChipActive]}
                >
                  <Text
                    style={[
                      type.bodySecondary,
                      { fontSize: 12 },
                      measureTypeInput === t.name && { color: colors.surfaceSunken, fontWeight: '700' },
                    ]}
                  >
                    {t.name}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={measureInput}
              onChangeText={setMeasureInput}
              placeholder="cm"
              placeholderTextColor={colors.textFaint}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.lg }}>
              <View style={{ flex: 1 }}>
                <Button label="Cancel" variant="secondary" onPress={() => setMeasureModalVisible(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Save" onPress={handleAddMeasurement} />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={addTypeModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={type.title}>New category</Text>
            <TextInput
              value={newTypeName}
              onChangeText={setNewTypeName}
              placeholder="e.g. Calf"
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
                    setAddTypeModalVisible(false);
                    setNewTypeName('');
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Add" onPress={handleAddType} />
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addLink: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.xs,
  },
  typeTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: space.sm,
  },
  typeChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  typeChipAdd: {
    borderColor: colors.accent,
    borderStyle: 'dashed',
  },
  hint: {
    color: colors.textFaint,
    fontSize: 11,
    marginTop: space.xs,
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
