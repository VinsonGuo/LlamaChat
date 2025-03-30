import React, {useEffect, useState} from 'react';
import {StatusBar} from 'expo-status-bar';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Provider as PaperProvider} from 'react-native-paper';
import {SafeAreaProvider} from 'react-native-safe-area-context';

// Import application screens
import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import ModelManagementScreen from './src/screens/ModelManagementScreen';

// Import model management context
import {ModelProvider} from './src/context/ModelContext';

// Import navigation types
import {RootStackParamList} from './src/types/navigation-types';
import { SettingsProvider } from './src/context/SettingsContext';
import SettingsScreen from "./src/screens/SettingsScreen";
import {Appearance, useColorScheme} from "react-native";
import setColorScheme = Appearance.setColorScheme;

// Create navigator with the correct generic type
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  setColorScheme('light')

  useEffect(() => {
    // Application initialization code, such as checking if models are downloaded
    const prepareApp = async () => {
      try {
        // You can add code that needs to be executed when the app starts here
        // For example: initializing models, checking storage permissions, etc.
      } catch (error) {
        console.error('Application initialization failed:', error);
      } finally {
        setIsReady(true);
      }
    };

    prepareApp();
  }, []);

  if (!isReady) {
    // You can display a loading screen here
    return null;
  }

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <SettingsProvider>
          <ModelProvider>
            <NavigationContainer>
              <Stack.Navigator initialRouteName="Home">
                <Stack.Screen
                  name="Home"
                  component={HomeScreen}
                  options={{title: 'LlamaChat'}}
                />
                <Stack.Screen
                  name="Chat"
                  component={ChatScreen}
                  options={{title: 'Chat'}}
                />
                <Stack.Screen
                  name="ModelManagement"
                  component={ModelManagementScreen}
                  options={{title: 'Model Management'}}
                />
                <Stack.Screen
                  name="Settings"
                  component={SettingsScreen}
                  options={{title: 'Settings'}}
                />
              </Stack.Navigator>
            </NavigationContainer>
            <StatusBar style="auto"/>
          </ModelProvider>
        </SettingsProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
