// 首先，定义正确的导航类型
// 在项目根目录下创建一个navigation-types.ts文件

// src/types/navigation-types.ts
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ChatMode} from "./chat";

// 定义应用程序中所有屏幕及其参数
export type RootStackParamList = {
  Home: undefined;
  Chat: { chatId: string, mode: ChatMode };
  ModelManagement: undefined;
  Settings: undefined;
};

// 为每个屏幕创建导航属性类型
export type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;
export type ChatScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;
export type ModelManagementScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ModelManagement'>;
export type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;
