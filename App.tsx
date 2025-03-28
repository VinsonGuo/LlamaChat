import React, {useEffect, useState} from 'react';
import {StatusBar} from 'expo-status-bar';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Provider as PaperProvider} from 'react-native-paper';
import {SafeAreaProvider} from 'react-native-safe-area-context';

// 导入应用屏幕
import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import ModelManagementScreen from './src/screens/ModelManagementScreen';

// 导入模型管理上下文
import {ModelProvider} from './src/context/ModelContext';

// 导入导航类型
import {RootStackParamList} from './src/types/navigation-types';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

// 使用正确的泛型类型创建导航器
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 应用初始化代码，例如检查模型是否已下载等
    const prepareApp = async () => {
      try {
        // 可以在这里添加应用启动时需要执行的代码
        // 例如：初始化模型，检查存储权限等
      } catch (error) {
        console.error('Application initialization failed:', error);
      } finally {
        setIsReady(true);
      }
    };

    prepareApp();
  }, []);

  if (!isReady) {
    // 可以在这里显示加载屏幕
    return null;
  }

  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>
        <PaperProvider>
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
                  options={{title: '聊天'}}
                />
                <Stack.Screen
                  name="ModelManagement"
                  component={ModelManagementScreen}
                  options={{title: '模型管理'}}
                />
              </Stack.Navigator>
            </NavigationContainer>
            <StatusBar style="auto"/>
          </ModelProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
