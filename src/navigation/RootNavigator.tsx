import React from 'react';
import { NavigationContainer, DarkTheme, NavigatorScreenParams, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, Pressable } from 'react-native';
import { colors, space } from '@/theme/theme';
import { StudentSwitcherButton } from '@/components/StudentSwitcherButton';
import { QuickActionsFab } from '@/components/QuickActionsFab';

import HomeScreen from '@/screens/HomeScreen';
import RoutinesScreen from '@/screens/RoutinesScreen';
import ExerciseLibraryScreen from '@/screens/ExerciseLibraryScreen';
import BodyTrackingScreen from '@/screens/BodyTrackingScreen';
import RoutineEditorScreen from '@/screens/RoutineEditorScreen';
import WorkoutSessionScreen from '@/screens/WorkoutSessionScreen';
import ExerciseStatsScreen from '@/screens/ExerciseStatsScreen';
import HistoryScreen from '@/screens/HistoryScreen';
import SessionDetailScreen from '@/screens/SessionDetailScreen';
import LicenseScreen from '@/screens/LicenseScreen';

export type TabParamList = {
  Home: undefined;
  Routines: undefined;
  Exercises: { openAdd?: boolean } | undefined;
  Body: { openAdd?: boolean } | undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList> | undefined;
  RoutineEditor: { routineId?: string };
  WorkoutSession: { routineId?: string; routineName?: string; sessionId?: string };
  ExerciseStats: { exerciseId: string; exerciseName: string };
  History: undefined;
  SessionDetail: { sessionId: string };
  License: undefined;
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

function AboutButton() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <Pressable onPress={() => navigation.navigate('License')} style={{ marginRight: space.md }} hitSlop={8}>
      <Text style={{ fontSize: 20, color: colors.textSecondary }}>©</Text>
    </Pressable>
  );
}

function MainTabs() {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textSecondary,
          headerLeft: () => <StudentSwitcherButton />,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon symbol="●" focused={focused} />,
            title: 'Iron Log',
            headerRight: () => <AboutButton />,
          }}
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
      <QuickActionsFab />
    </View>
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
        <Stack.Screen name="License" component={LicenseScreen} options={{ title: 'Licencia' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
