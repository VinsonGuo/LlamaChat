import React, {useState} from 'react';
import {ActivityIndicator, Alert, ScrollView, StyleSheet, View} from 'react-native';
import {Button, Card, Dialog, Divider, List, Portal, Text, TextInput, IconButton} from 'react-native-paper';
import {useModel} from '../context/ModelContext';
import DocumentPicker from 'react-native-document-picker';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

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
    importModel,
    deleteModel,
    modelInfo,
  } = useModel();

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<typeof PRESET_MODELS[0] | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const handleLoadModel = async (modelPath: string) => {
    try {
      await loadModel(availableModels, modelPath);
      Alert.alert('Success', 'Model loaded successfully');
    } catch (error) {
      console.error('Failed to load model:', error);
      Alert.alert('Error', 'Failed to load model');
    }
  };

  const handlePresetDownload = async () => {
    if (!selectedPreset) return;

    setShowPresetDialog(false);
    try {
      await activateKeepAwakeAsync('downloadModel');
      setIsDownloading(true);
      await downloadModel(selectedPreset.url, selectedPreset.name, (progress) => setDownloadProgress(progress));
    } catch (error) {
      console.error('Failed to download preset model:', error);
      Alert.alert('Error', 'Failed to download preset model');
    } finally {
      setIsDownloading(false);
      await deactivateKeepAwake('downloadModel');
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

  // Import model from file
  const importModelFromFile = async () => {
    try {
      // Select a single file
      setIsImporting(true);
      const result = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.allFiles],
        copyTo: 'cachesDirectory'
      });

      console.log('Selected file:', result);

      // Check if it's a GGUF file
      if (!result.name?.toLowerCase().endsWith('.gguf')) {
        Alert.alert('Invalid File', 'Please select a valid GGUF model file');
        setIsImporting(false);
        return;
      }

      // Get file name without extension for model name
      const modelName = result.name.replace('.gguf', '');

      // Check if model with this name already exists
      const modelExists = availableModels.some(model => model.name === modelName);
      if (modelExists) {
        Alert.alert(
          'Model Already Exists',
          `A model named "${modelName}" already exists. Do you want to overwrite it?`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setIsImporting(false) },
            {
              text: 'Overwrite',
              style: 'destructive',
              onPress: async () => {
                setIsImporting(true);
                await importModel(result.fileCopyUri!, modelName, (progress) => {
                  setImportProgress(Math.min(progress, 99));
                  console.log('Import progress:', progress.toFixed(2) + '%');
                })
                setIsImporting(false);
              }
            }
          ]
        );
      } else {
        await importModel(result.fileCopyUri!, modelName, (progress) => {
          setImportProgress(Math.min(progress, 99));
          console.log('Import progress:', progress.toFixed(2) + '%');
        })
      }
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled the picker
        console.log('User cancelled file picker');
      } else {
        console.error('Error picking file:', err);
        Alert.alert('Error', 'Failed to pick file');
      }
    } finally {
      setIsImporting(false);
    }
  };

  // Check if model is downloaded
  const isModelDownloaded = (modelName: string) => {
    return availableModels.some(model => model.name === modelName);
  };

  const openPresetDialog = (preset: typeof PRESET_MODELS[0]) => {
    setSelectedPreset(preset);
    setShowPresetDialog(true);
  };

  // Render model action buttons (icon only)
  const renderModelActions = (model: any, isCurrentlyLoaded: boolean) => (
    <View style={styles.actionButtonsContainer}>
      <IconButton
        icon={isCurrentlyLoaded ? "check-circle" : "play-circle-outline"}
        iconColor={isCurrentlyLoaded ? "#4CAF50" : "#2196F3"}
        size={24}
        onPress={() => handleLoadModel(model.path)}
        disabled={isCurrentlyLoaded}
        style={styles.iconButton}
      />
      <IconButton
        icon="delete-outline"
        iconColor="#d63031"
        size={24}
        onPress={() => handleDeleteModel(model.name)}
        style={styles.iconButton}
      />
    </View>
  );

  // Render preset model actions (icon only)
  const renderPresetActions = (preset: typeof PRESET_MODELS[0], isDownloaded: boolean) => (
    <View style={styles.actionButtonsContainer}>
      {isDownloaded ? (
        <IconButton
          icon="delete-outline"
          iconColor="#d63031"
          size={24}
          onPress={() => handleDeleteModel(preset.name)}
          disabled={isDownloading || isImporting}
          style={styles.iconButton}
        />
      ) : (
        <IconButton
          icon="download-outline"
          iconColor="#2196F3"
          size={24}
          onPress={() => openPresetDialog(preset)}
          disabled={isDownloading || isImporting}
          style={styles.iconButton}
        />
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.section}>
        <Card.Title title="Current Model"/>
        <Card.Content>
          {selectedModel ? (
            <View>
              <Text style={styles.modelName}>Name: {selectedModel.name}</Text>
              <Text style={styles.modelStatus}>Status: {isModelLoaded ? 'Loaded' : 'Not Loaded'}</Text>

              {modelInfo && (
                <View style={styles.modelInfoSection}>
                  <Text style={styles.sectionTitle}>Model Details:</Text>
                  <Text>Architecture: {modelInfo['general.architecture'] || 'Unknown'}</Text>
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
            <Text>No available models, please download or import a model</Text>
          ) : (
            availableModels.map((model) => (
              <View key={model.path}>
                <List.Item
                  title={() => <Text style={styles.modelListTitle}>{model.name}</Text>}
                  titleNumberOfLines={2}
                  style={styles.modelListItem}
                  right={() => renderModelActions(
                    model,
                    isModelLoaded && selectedModel?.path === model.path
                  )}
                />
                <Divider style={styles.divider}/>
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
                  title={() => <Text style={styles.modelListTitle}>{preset.name}</Text>}
                  description={() => (
                    <Text style={styles.presetDescription}>
                      {preset.description} ({preset.size})
                    </Text>
                  )}
                  descriptionNumberOfLines={2}
                  style={styles.modelListItem}
                  right={() => renderPresetActions(preset, downloaded)}
                />
                <Divider style={styles.divider}/>
              </View>
            );
          })}
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Title title="Import Model from File"/>
        <Card.Content>
          <Text style={styles.description}>
            Import a GGUF model file from your device storage
          </Text>
          <Button
            mode="contained"
            onPress={importModelFromFile}
            disabled={isImporting || isDownloading}
            style={styles.importButton}
            icon="file-import"
          >
            Select and Import Model File
          </Button>

          {isImporting && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                Importing model: {importProgress.toFixed(1)}%
              </Text>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {width: `${importProgress}%`}
                  ]}
                />
              </View>
            </View>
          )}
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
    borderRadius: 8,
    overflow: 'hidden',
  },
  modelName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  modelStatus: {
    fontSize: 15,
    marginBottom: 8,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  customDownloadButtonContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  customDownloadButton: {
    backgroundColor: '#2196F3',
    margin: 0,
    borderRadius: 30,
    width: 48,
    height: 48,
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
    padding: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 6,
    fontSize: 15,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  iconButton: {
    margin: 0,
    marginHorizontal: 2,
  },
  progressBarContainer: {
    width: '100%',
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    marginVertical: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6200ee',
  },
  importButton: {
    marginTop: 8,
  },
  description: {
    marginBottom: 12,
    color: '#555',
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: 16,
  },
  progressText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  modelListItem: {
    paddingVertical: 8,
  },
  modelListTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  presetDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
});

export default ModelManagementScreen;
