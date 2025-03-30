import React, {useState} from 'react';
import {ActivityIndicator, Alert, ScrollView, StyleSheet, View,} from 'react-native';
import {Button, Card, Dialog, Divider, List, Portal, Text, TextInput,} from 'react-native-paper';
import {useModel} from '../context/ModelContext';

// Preset model list
const PRESET_MODELS = [
  {
    name: 'TinyLlama-1.1B-Chat-v1.0',
    description: 'Lightweight chat model, suitable for mobile devices',
    url: 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf',
    size: '~670MB',
  },
  {
    name: 'Phi-2-GGUF',
    description: 'Microsoft 2.7B efficient model',
    url: 'https://huggingface.co/TheBloke/phi-2-GGUF/resolve/main/phi-2.Q4_K_M.gguf',
    size: '~1.6GB',
  },
  {
    name: 'Llama-2-7B-Chat-GGUF',
    description: 'Meta 7B chat model',
    url: 'https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.Q4_K_M.gguf',
    size: '~4.1GB',
  },
  // Add the following new models
  {
    name: 'TinyLlama-1.1B-1T-OpenOrca',
    description: 'Small model trained on OpenOrca dataset',
    url: 'https://huggingface.co/TheBloke/TinyLlama-1.1B-1T-OpenOrca-GGUF/resolve/main/tinyllama-1.1b-1t-openorca.Q4_K_M.gguf',
    size: '~670MB',
  },
  {
    name: 'Gemma-2B-GGUF',
    description: 'Google open-source small model',
    url: 'https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf',
    size: '~1.6GB',
  },
  {
    name: 'Phi-2-DPO-GGUF',
    description: 'DPO enhanced version of Microsoft Phi-2',
    url: 'https://huggingface.co/TheBloke/phi-2-dpo-GGUF/resolve/main/phi-2-dpo.Q4_K_M.gguf',
    size: '~1.6GB',
  },
  {
    name: 'MythoLogic-Mini-7B',
    description: 'High-performance 7B small inference model',
    url: 'https://huggingface.co/TheBloke/MythoLogic-Mini-7B-GGUF/resolve/main/mythologic-mini-7b.Q4_K_M.gguf',
    size: '~4GB',
  }
];

const ModelManagementScreen = () => {
  const {
    availableModels,
    selectedModel,
    isModelLoaded,
    loadModel,
    downloadModel,
    deleteModel,
    modelInfo,
  } = useModel();

  const [customUrl, setCustomUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<typeof PRESET_MODELS[0] | null>(null);

  const handleLoadModel = async (modelPath: string) => {
    try {
      await loadModel(availableModels, modelPath);
      Alert.alert('Success', 'Model loaded successfully');
    } catch (error) {
      console.error('Failed to load model:', error);
      Alert.alert('Error', 'Failed to load model');
    }
  };

  const handleCustomDownload = async () => {
    if (!customUrl.trim() || !customName.trim()) {
      Alert.alert('Error', 'Please enter a valid URL and model name');
      return;
    }

    try {
      setIsDownloading(true);
      await downloadModel(customUrl.trim(), customName.trim(), (progress) => setDownloadProgress(progress));
      setCustomUrl('');
      setCustomName('');
    } catch (error) {
      console.error('Failed to download model:', error);
      Alert.alert('Error', 'Failed to download model');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePresetDownload = async () => {
    if (!selectedPreset) return;

    setShowPresetDialog(false);
    try {
      setIsDownloading(true);
      await downloadModel(selectedPreset.url, selectedPreset.name, (progress) => setDownloadProgress(progress));
    } catch (error) {
      console.error('Failed to download preset model:', error);
      Alert.alert('Error', 'Failed to download preset model');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteModel = (modelName: string) => {
    // Check if this is the currently loaded model
    const isCurrentModel = selectedModel && selectedModel.name === modelName;

    Alert.alert(
      'Delete Model',
      `Are you sure you want to delete model "${modelName}"${isCurrentModel ? ' (currently loaded)' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteModel(modelName);
              Alert.alert('Success', `Model ${modelName} has been deleted`);
            } catch (error) {
              console.error('Failed to delete model:', error);
              Alert.alert('Error', 'Failed to delete model');
            }
          }
        }
      ]
    );
  };

  // Modify the PRESET_MODELS mapping to show either Download or Delete button
  const isModelDownloaded = (modelName: string) => {
    return availableModels.some(model => model.name === modelName);
  };

  const openPresetDialog = (preset: typeof PRESET_MODELS[0]) => {
    setSelectedPreset(preset);
    setShowPresetDialog(true);
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.section}>
        <Card.Title title="Current Model"/>
        <Card.Content>
          {selectedModel ? (
            <View>
              <Text>Name: {selectedModel.name}</Text>
              <Text>Status: {isModelLoaded ? 'Loaded' : 'Not Loaded'}</Text>

              {modelInfo && (
                <View style={styles.modelInfoSection}>
                  <Text style={styles.sectionTitle}>Model Details:</Text>
                  <Text>Architecture: {modelInfo['general.architecture'] || 'Unknown'}</Text>
                  <Text>Parameters: {
                    modelInfo.n_params ?
                      `${(modelInfo.n_params / 1000000000).toFixed(2)}B` :
                      'Unknown'
                  }</Text>
                  {modelInfo.vocab_size && <Text>Vocabulary Size: {modelInfo.vocab_size}</Text>}
                  {modelInfo['llama.context_length'] && <Text>Max Context: {modelInfo['llama.context_length']} tokens</Text>}
                </View>
              )}
            </View>
          ) : (
            <Text>No model selected</Text>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Title title="Available Models"/>
        <Card.Content>
          {availableModels.length === 0 ? (
            <Text>No available models, please download a model</Text>
          ) : (
            availableModels.map((model) => (
              <View key={model.path}>
                <List.Item
                  title={model.name}
                  right={() => (
                    <View style={styles.itemButtonContainer}>
                      <Button
                        mode="outlined"
                        onPress={() => handleLoadModel(model.path)}
                        disabled={isModelLoaded && selectedModel?.path === model.path}
                      >
                        {isModelLoaded && selectedModel?.path === model.path ? 'Loaded' : 'Load'}
                      </Button>
                    </View>
                  )}
                />
                <Divider/>
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Title title="Preset Models"/>
        <Card.Content>
          {PRESET_MODELS.map((preset) => {
            const downloaded = isModelDownloaded(preset.name);
            return (
              <View key={preset.name}>
                <List.Item
                  title={preset.name}
                  description={`${preset.description} (${preset.size})`}
                  right={() => (
                    <View style={styles.itemButtonContainer}>
                      {downloaded ? (
                        <Button
                          mode="outlined"
                          onPress={() => handleDeleteModel(preset.name)}
                          textColor="#d63031"
                          disabled={isDownloading}
                        >
                          Delete
                        </Button>
                      ) : (
                        <Button
                          mode="outlined"
                          onPress={() => openPresetDialog(preset)}
                          disabled={isDownloading}
                        >
                          Download
                        </Button>
                      )}
                    </View>
                  )}
                />
                <Divider/>
              </View>
            );
          })}
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Title title="Custom Download"/>
        <Card.Content>
          <TextInput
            label="Model Name"
            value={customName}
            onChangeText={setCustomName}
            style={styles.input}
            disabled={isDownloading}
          />
          <TextInput
            label="GGUF Model URL"
            value={customUrl}
            onChangeText={setCustomUrl}
            style={styles.input}
            disabled={isDownloading}
          />
          <Button
            mode="contained"
            onPress={handleCustomDownload}
            disabled={isDownloading || !customUrl.trim() || !customName.trim()}
            style={styles.downloadButton}
          >
            {isDownloading ? 'Downloading...' : 'Download Model'}
          </Button>
        </Card.Content>
      </Card>

      <Portal>
        <Dialog visible={isDownloading} dismissable={false}>
          <Dialog.Title>Download Progress</Dialog.Title>
          <Dialog.Content>
            <View style={styles.downloadingContainer}>
              <ActivityIndicator size="large" color="#6200ee"/>
              <Text style={styles.downloadingText}>
                Downloading model, please wait...
              </Text>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {width: `${downloadProgress}%`}
                  ]}
                />
              </View>
              <Text>{downloadProgress.toFixed(1)}%</Text>
            </View>
          </Dialog.Content>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog visible={showPresetDialog} onDismiss={() => setShowPresetDialog(false)}>
          <Dialog.Title>Download Preset Model</Dialog.Title>
          <Dialog.Content>
            {selectedPreset && (
              <View>
                <Text style={styles.dialogText}>Name: {selectedPreset.name}</Text>
                <Text style={styles.dialogText}>Description: {selectedPreset.description}</Text>
                <Text style={styles.dialogText}>Size: {selectedPreset.size}</Text>
                <Text style={styles.dialogWarning}>
                  Note: Please ensure you have enough storage space and a stable network connection. Do not close the app during download.
                </Text>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowPresetDialog(false)}>Cancel</Button>
            <Button onPress={handlePresetDownload}>Confirm Download</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  section: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  downloadButton: {
    marginTop: 8,
  },
  downloadingContainer: {
    alignItems: 'center',
    padding: 16,
  },
  downloadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  dialogText: {
    marginBottom: 8,
  },
  dialogWarning: {
    marginTop: 16,
    color: '#d32f2f',
  },
  modelInfoSection: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemButtonContainer: {
    marginLeft: 8,
    justifyContent: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    marginVertical: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6200ee',
  }
});

export default ModelManagementScreen;
