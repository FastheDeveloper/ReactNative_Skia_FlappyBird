import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Audio } from 'expo-av';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [sound, setSound] = useState<Audio.Sound>();


  async function playBg() {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/audio/gameMusic.mp3"),
        { isLooping: true,
          volume: 0.3 }
      );
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing background music:', error);
    }
  }

  useEffect(() => {
    playBg();
    
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, []);

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="home" options={{ headerShown: false }} />

        <Stack.Screen name="index" options={{headerShown:false}} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}
