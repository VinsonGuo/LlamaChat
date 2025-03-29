import React from 'react';
import {StyleSheet, View, ViewStyle} from 'react-native';
import {Button, Card, Chip, Icon, Text, useTheme} from 'react-native-paper';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useNavigation} from "@react-navigation/native";
import {HomeScreenNavigationProp} from "../types/navigation-types";

interface ModelInfoProps {
  selectedModel: {
    name: string;
    path?: string;
  } | null;
  isModelLoaded: boolean;
  style?: ViewStyle;
}

const ModelInfoPanel = ({selectedModel, isModelLoaded, style}: ModelInfoProps) => {
  const theme = useTheme();
  const navigation = useNavigation<HomeScreenNavigationProp>();

  // 获取状态颜色
  const getStatusColor = () => {
    if (!selectedModel) return '#9e9e9e'; // 灰色 - 无模型
    return isModelLoaded ? '#4caf50' : '#ff9800'; // 绿色 - 已加载，橙色 - 未加载
  };

  // 获取状态文本
  const getStatusText = () => {
    if (!selectedModel) return '未选择模型';
    return isModelLoaded ? '已加载' : '未加载';
  };

  // 获取状态图标
  const getStatusIcon = () => {
    if (!selectedModel) return 'cancel';
    return isModelLoaded ? 'check-circle' : 'clock-outline';
  };

  return (
    <View style={style}>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.headerContainer}>
            <MaterialCommunityIcons
              name="tools"
              size={24}
              color={theme.colors.primary}
              style={styles.icon}
            />
            <Text variant="titleMedium" style={styles.headerText}>模型状态</Text>

            <Button onPress={()=>navigation.navigate('ModelManagement')}>管理</Button>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>当前模型:</Text>
              <View style={styles.valueContainer}>
                {selectedModel ? (
                  <Text style={styles.valueText}>{selectedModel.name}</Text>
                ) : (
                  <Text style={styles.placeholderText}>未选择</Text>
                )}
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>状态:</Text>
              <Chip
                mode="outlined"
                style={{borderColor: getStatusColor()}}
                textStyle={{color: getStatusColor()}}
                icon={() => (
                  <MaterialCommunityIcons
                    name={getStatusIcon()}
                    size={16}
                    color={getStatusColor()}
                  />
                )}
              >
                {getStatusText()}
              </Chip>
            </View>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 10,
    borderRadius: 8,
    elevation: 2,
  },
  cardContent: {
    padding: 12,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    marginRight: 8,
  },
  headerText: {
    fontWeight: '600',
  },
  infoContainer: {
    marginLeft: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    width: 80,
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  valueContainer: {
    flex: 1,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#9e9e9e',
  },
  pathText: {
    fontSize: 12,
    color: '#616161',
  },
});

export default ModelInfoPanel;
