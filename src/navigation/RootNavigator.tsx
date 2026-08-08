import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { colors } from '@/theme/theme';

import HomeScreen from '@/screens/HomeScreen';
import RoutinesScreen from '@/screens/RoutinesScreen';
import ExerciseLibraryScreen from '@/screens/ExerciseLibraryScreen';
import BodyTrackingScreen from '@/screens/BodyTrackingScreen';
import RoutineEditorScreen from '@/screens/RoutineEditorScreen';
import WorkoutSessionScreen from '@/screens/WorkoutSessionScreen';
import ExerciseStatsScreen from '@/screens/ExerciseStatsScreen';
import HistoryScreen from '@/screens/HistoryScreen';
import SessionDetailScreen from '@/screens/SessionDetailScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  RoutineEditor: { routineId?: string };
  WorkoutSession: { routineId?: string; routineName?: string; sessionId?: string };
  ExerciseStats: { exerciseId: string; exerciseName: string };
  History: undefined;
  SessionDetail: { sessionId: string };
};

export type TabParamList = {
  Home: undefined;
  Routines: undefined;
  Exercises: undefined;
  Body: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.surface,
    border: colors.border,
    text: colors.textPrimary,
    primary: colors.accent,
  },
};

function TabIcon({ symbol, focused }: { symbol: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.5, color: focused ? colors.accent : colors.textSecondary }}>
      {symbol}
    </Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon symbol="●" focused={focused} />, title: 'Iron Log' }}
      />
      <Tab.Screen
        name="Routines"
        component={RoutinesScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon symbol="▤" focused={focused} /> }}
      />
      <Tab.Screen
        name="Exercises"
        component={ExerciseLibraryScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon symbol="▲" focused={focused} /> }}
      />
      <Tab.Screen
        name="Body"
        component={BodyTrackingScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon symbol="◐" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
          headerTitleStyle: { color: colors.textPrimary },
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="RoutineEditor"
          component={RoutineEditorScreen}
          options={{ title: 'Edit Routine' }}
        />
        <Stack.Screen
          name="WorkoutSession"
          component={WorkoutSessionScreen}
          options={{ title: 'Workout', presentation: 'fullScreenModal' }}
        />
        <Stack.Screen
          name="ExerciseStats"
          component={ExerciseStatsScreen}
          options={({ route }) => ({ title: route.params.exerciseName })}
        />
        <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'History' }} />
        <Stack.Screen
          name="SessionDetail"
          component={SessionDetailScreen}
          options={{ title: 'Session' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
