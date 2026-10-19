import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function Layout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#141414' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: '#000' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'WodBuilder' }} />
        <Stack.Screen name="new" options={{ title: 'New WOD' }} />
        <Stack.Screen name="pick" options={{ title: 'Pick Exercises' }} />
        <Stack.Screen
          name="workout/[id]"
          options={{ title: 'Workout', headerBackTitle: 'Quit' }}
        />
      </Stack>
    </>
  );
}
