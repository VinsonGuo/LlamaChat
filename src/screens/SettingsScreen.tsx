// src/screens/SettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Platform } from 'react-native';
import { Button, Card, Divider, HelperText, TextInput, Text } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { useSettings } from '../context/SettingsContext';

// Define interface for input values
interface InputValues {
  n_ctx: string;
  n_batch: string;
  n_threads: string;
  n_gpu_layers: string;
  n_predict: string;
}

// Define interface for errors
interface ErrorValues {
  n_ctx: string;
  n_batch: string;
  n_threads: string;
  n_gpu_layers: string;
  n_predict: string;
}

const SettingsScreen = () => {
  const { settings, updateSettings, resetSettings } = useSettings();

  // Local state for input values with proper typing
  const [inputValues, setInputValues] = useState<InputValues>({
    n_ctx: settings.n_ctx.toString(),
    n_batch: settings.n_batch.toString(),
    n_threads: settings.n_threads.toString(),
    n_gpu_layers: settings.n_gpu_layers.toString(),
    n_predict: settings.n_predict.toString(),
  });

  // Effect to sync inputValues with settings when settings change
  useEffect(() => {
    setInputValues({
      n_ctx: settings.n_ctx.toString(),
      n_batch: settings.n_batch.toString(),
      n_threads: settings.n_threads.toString(),
      n_gpu_layers: settings.n_gpu_layers.toString(),
      n_predict: settings.n_predict.toString(),
    });
  }, [settings]);

  // Local state for form validation with proper typing
  const [errors, setErrors] = useState<ErrorValues>({
    n_ctx: '',
    n_batch: '',
    n_threads: '',
    n_gpu_layers: '',
    n_predict: '',
  });

  // Type guard for key
  const isValidKey = (key: string): key is keyof InputValues => {
    return ['n_ctx', 'n_batch', 'n_threads', 'n_gpu_layers', 'n_predict'].includes(key);
  };

  // Handle input changes with better empty-state handling
  const handleInputChange = (key: string, value: string) => {
    if (!isValidKey(key)) return;

    // Update the local input value immediately
    setInputValues(prev => ({ ...prev, [key]: value }));

    // If value is empty, just set error but don't commit yet
    if (value === '') {
      setErrors(prev => ({ ...prev, [key]: 'Please enter a valid number' }));
      return;
    }

    const numValue = parseInt(value, 10);

    // Validation logic
    let error = '';
    if (isNaN(numValue)) {
      error = 'Please enter a valid number';
    } else {
      // Specific validations based on the parameter
      switch (key) {
        case 'n_ctx':
          if (numValue < 512 || numValue > 8192) {
            error = 'Context window should be between 512-8192';
          }
          break;
        case 'n_batch':
          if (numValue < 32 || numValue > 2048) {
            error = 'Batch size should be between 32-2048';
          }
          break;
        case 'n_threads':
          if (numValue < 1 || numValue > 12) {
            error = 'Thread count should be between 1-12';
          }
          break;
        case 'n_gpu_layers':
          if (numValue < 0) {
            error = 'GPU layers cannot be negative';
          }
          break;
        case 'n_predict':
          if (numValue < 128 || numValue > 4096) {
            error = 'Generation length should be between 128-4096';
          }
          break;
      }
    }

    // Update error state
    setErrors(prev => ({ ...prev, [key]: error }));

    // If no error, update the setting
    if (!error) {
      updateSettings({ [key]: numValue });
    }
  };

  // Handle input blur (when user finishes editing)
  const handleInputBlur = (key: string) => {
    if (!isValidKey(key)) return;

    if (inputValues[key] === '') {
      // If the field is left empty, revert to the previous valid value
      setInputValues(prev => ({ ...prev, [key]: settings[key].toString() }));
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  // Update decimal values (temperature, top_p)
  const updateDecimalSetting = (key: 'temperature' | 'top_p', value: number) => {
    updateSettings({ [key]: value });
  };

  // Handle system prompt change
  const handleSystemPromptChange = (value: string) => {
    updateSettings({ systemPrompt: value });
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.section}>
        <Card.Title title="Model Parameter Settings" />
        <Card.Content>
          <Text style={styles.description}>
            These parameters affect the model's performance and memory usage, please adjust them carefully according to your device's capabilities
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              label="Context Window Size (n_ctx)"
              value={inputValues.n_ctx}
              onChangeText={(value) => handleInputChange('n_ctx', value)}
              onBlur={() => handleInputBlur('n_ctx')}
              keyboardType="number-pad"
              mode="outlined"
              style={styles.input}
              error={!!errors.n_ctx}
            />
            {errors.n_ctx ? (
              <HelperText type="error">{errors.n_ctx}</HelperText>
            ) : (
              <HelperText type="info">Determines how much context history the model can "remember", larger values increase memory usage</HelperText>
            )}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              label="Batch Size (n_batch)"
              value={inputValues.n_batch}
              onChangeText={(value) => handleInputChange('n_batch', value)}
              onBlur={() => handleInputBlur('n_batch')}
              keyboardType="number-pad"
              mode="outlined"
              style={styles.input}
              error={!!errors.n_batch}
            />
            {errors.n_batch ? (
              <HelperText type="error">{errors.n_batch}</HelperText>
            ) : (
              <HelperText type="info">Larger batch sizes may improve performance but increase memory usage</HelperText>
            )}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              label="Thread Count (n_threads)"
              value={inputValues.n_threads}
              onChangeText={(value) => handleInputChange('n_threads', value)}
              onBlur={() => handleInputBlur('n_threads')}
              keyboardType="number-pad"
              mode="outlined"
              style={styles.input}
              error={!!errors.n_threads}
            />
            {errors.n_threads ? (
              <HelperText type="error">{errors.n_threads}</HelperText>
            ) : (
              <HelperText type="info">Recommended to set to half or fewer of your device's CPU cores</HelperText>
            )}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              label="GPU Acceleration Layers (n_gpu_layers)"
              value={inputValues.n_gpu_layers}
              onChangeText={(value) => handleInputChange('n_gpu_layers', value)}
              onBlur={() => handleInputBlur('n_gpu_layers')}
              keyboardType="number-pad"
              mode="outlined"
              style={styles.input}
              error={!!errors.n_gpu_layers}
            />
            {errors.n_gpu_layers ? (
              <HelperText type="error">{errors.n_gpu_layers}</HelperText>
            ) : (
              <HelperText type="info">Set values greater than 0 on iOS devices to enable Metal acceleration</HelperText>
            )}
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Title title="Generation Parameter Settings" />
        <Card.Content>
          <Text style={styles.description}>
            These parameters affect the creativity and diversity of AI responses
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.sliderLabel}>
              Temperature: {settings.temperature.toFixed(2)}
            </Text>
            <Slider
              value={settings.temperature}
              minimumValue={0.1}
              maximumValue={2.0}
              step={0.05}
              onValueChange={(value) => updateDecimalSetting('temperature', value)}
              style={styles.slider}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor="#bdc3c7"
              thumbTintColor="#2980b9"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderRangeLabel}>Precise</Text>
              <Text style={styles.sliderRangeLabel}>Creative</Text>
            </View>
            <HelperText type="info">
              Lower values make responses more deterministic and precise, higher values make responses more diverse and creative
            </HelperText>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.sliderLabel}>
              Top-P: {settings.top_p.toFixed(2)}
            </Text>
            <Slider
              value={settings.top_p}
              minimumValue={0.1}
              maximumValue={1.0}
              step={0.05}
              onValueChange={(value) => updateDecimalSetting('top_p', value)}
              style={styles.slider}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor="#bdc3c7"
              thumbTintColor="#2980b9"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderRangeLabel}>Focused</Text>
              <Text style={styles.sliderRangeLabel}>Diverse</Text>
            </View>
            <HelperText type="info">
              Controls the range of vocabulary considered during generation, smaller values make output more predictable
            </HelperText>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              label="Maximum Generation Length (n_predict)"
              value={inputValues.n_predict}
              onChangeText={(value) => handleInputChange('n_predict', value)}
              onBlur={() => handleInputBlur('n_predict')}
              keyboardType="number-pad"
              mode="outlined"
              style={styles.input}
              error={!!errors.n_predict}
            />
            {errors.n_predict ? (
              <HelperText type="error">{errors.n_predict}</HelperText>
            ) : (
              <HelperText type="info">Maximum number of tokens to generate per response</HelperText>
            )}
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Title title="System Prompt" />
        <Card.Content>
          <TextInput
            label="System Prompt"
            value={settings.systemPrompt}
            onChangeText={handleSystemPromptChange}
            mode="outlined"
            multiline
            numberOfLines={6}
            style={styles.textArea}
          />
          <HelperText type="info">
            The system prompt defines the AI assistant's personality and behavior
          </HelperText>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={resetSettings}
          style={styles.resetButton}
        >
          Restore Default Settings
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  description: {
    marginBottom: 16,
    color: '#555',
  },
  inputContainer: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#fff',
  },
  textArea: {
    backgroundColor: '#fff',
    height: 120,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  slider: {
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -12,
  },
  sliderRangeLabel: {
    fontSize: 12,
    color: '#666',
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  resetButton: {
    width: '80%',
  },
});

export default SettingsScreen;
