import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Pressable, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Card, Eyebrow, Button, EmptyState } from '@/components/UI';
import { colors, space, type, radius } from '@/theme/theme';
import {
  addBodyWeight,
  listBodyWeights,
  addBodyMeasurement,
  listBodyMeasurements,
} from '@/db/repository';
import { BodyWeightEntry, BodyMeasurementEntry, MeasurementType } from '@/types';
import { LineChart } from '@/components/LineChart';

const MEASUREMENT_TYPES: MeasurementType[] = [
  'Waist',
  'Chest',
  'Left Arm',
  'Right Arm',
  'Left Thigh',
  'Right Thigh',
  'Hips',
  'Neck',
  'Shoulders',
];

export default function BodyTrackingScreen() {
  const [weights, setWeights] = useState<BodyWeightEntry[]>([]);
  const [measurementType, setMeasurementType] = useState<MeasurementType>('Waist');
  const [measurements, setMeasurements] = useState<BodyMeasurementEntry[]>([]);

  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [weightInput, setWeightInput] = useState('');

  const [measureModalVisible, setMeasureModalVisible] = useState(false);
  const [measureInput, setMeasureInput] = useState('');
  const [measureTypeInput, setMeasureTypeInput] = useState<MeasurementType>('Waist');

  const load = useCallback(async () => {
    const [w, m] = await Promise.all([listBodyWeights(60), listBodyMeasurements(measurementType, 60)]);
    setWeights(w);
    setMeasurements(m);
  }, [measurementType]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

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
    if (isNaN(v)) return;
    await addBodyMeasurement(measureTypeInput, v);
    setMeasureInput('');
    setMeasureModalVisible(false);
    if (measureTypeInput === measurementType) load();
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
            <View style={{ alignItems: 'center', marginTop: space.sm }}>
              <LineChart points={weightChartData} width={300} height={140} formatValue={(v) => `${v}kg`} />
            </View>
          )}
        </Card>

        <Card style={{ marginTop: space.lg }}>
          <View style={styles.cardHeader}>
            <Eyebrow>Measurements</Eyebrow>
            <Pressable onPress={() => setMeasureModalVisible(true)}>
              <Text style={styles.addLink}>+ Log</Text>
            </Pressable>
          </View>
          <View style={styles.typeTabs}>
            {MEASUREMENT_TYPES.map((t) => (
              <Pressable
                key={t}
                onPress={() => setMeasurementType(t)}
                style={[styles.typeChip, measurementType === t && styles.typeChipActive]}
              >
                <Text
                  style={[
                    type.bodySecondary,
                    { fontSize: 12 },
                    measurementType === t && { color: colors.surfaceSunken, fontWeight: '700' },
                  ]}
                >
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>
          {measurements.length === 0 ? (
            <EmptyState title="No entries yet" body={`Log your ${measurementType.toLowerCase()} measurement to see it change over time.`} />
          ) : (
            <View style={{ alignItems: 'center', marginTop: space.sm }}>
              <LineChart points={measurementChartData} width={300} height={140} formatValue={(v) => `${v}cm`} />
            </View>
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
              {MEASUREMENT_TYPES.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setMeasureTypeInput(t)}
                  style={[styles.typeChip, measureTypeInput === t && styles.typeChipActive]}
                >
                  <Text
                    style={[
                      type.bodySecondary,
                      { fontSize: 12 },
                      measureTypeInput === t && { color: colors.surfaceSunken, fontWeight: '700' },
                    ]}
                  >
                    {t}
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
