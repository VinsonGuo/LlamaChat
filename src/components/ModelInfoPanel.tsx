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

  // Get status color
  const getStatusColor = () => {
    if (!selectedModel) return '#9e9e9e'; // Gray - No model
    return isModelLoaded ? '#4caf50' : '#ff9800'; // Green - Loaded, Orange - Not loaded
  };

  // Get status text
  const getStatusText = () => {
    if (!selectedModel) return 'No Model Selected';
    return isModelLoaded ? 'Loaded' : 'Not Loaded';
  };

  // Get status icon
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
            <Text variant="titleMedium" style={styles.headerText}>Model Status</Text>

            <Button onPress={()=>navigation.navigate('ModelManagement')}>Manage</Button>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Current Model:</Text>
              <View style={styles.valueContainer}>
                {selectedModel ? (
                  <Text style={styles.valueText}>{selectedModel.name}</Text>
                ) : (
                  <Text style={styles.placeholderText}>Not Selected</Text>
                )}
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Status:</Text>
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
