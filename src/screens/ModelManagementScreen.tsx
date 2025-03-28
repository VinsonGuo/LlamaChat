import React, {useState} from 'react';
import {ActivityIndicator, Alert, ScrollView, StyleSheet, View,} from 'react-native';
import {Button, Card, Dialog, Divider, List, Portal, Text, TextInput,} from 'react-native-paper';
import {useModel} from '../context/ModelContext';

// 预设模型列表
const PRESET_MODELS = [
  {
    name: 'TinyLlama-1.1B-Chat-v1.0',
    description: '轻量级聊天模型，适合移动设备',
    url: 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf',
    size: '~670MB',
  },
  {
    name: 'Phi-2-GGUF',
    description: '微软2.7B高效模型',
    url: 'https://huggingface.co/TheBloke/phi-2-GGUF/resolve/main/phi-2.Q4_K_M.gguf',
    size: '~1.6GB',
  },
  {
    name: 'Llama-2-7B-Chat-GGUF',
    description: 'Meta 7B聊天模型',
    url: 'https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.Q4_K_M.gguf',
    size: '~4.1GB',
  },
  // 添加以下新模型
  {
    name: 'TinyLlama-1.1B-1T-OpenOrca',
    description: '基于OpenOrca数据集训练的小型模型',
    url: 'https://huggingface.co/TheBloke/TinyLlama-1.1B-1T-OpenOrca-GGUF/resolve/main/tinyllama-1.1b-1t-openorca.Q4_K_M.gguf',
    size: '~670MB',
  },
  {
    name: 'Gemma-2B-GGUF',
    description: 'Google开源小型模型',
    url: 'https://huggingface.co/google/gemma-2b-GGUF/resolve/main/gemma-2b.Q4_K_M.gguf',
    size: '~1.2GB',
  },
  {
    name: 'Phi-2-DPO-GGUF',
    description: '微软Phi-2的DPO增强版本',
    url: 'https://huggingface.co/TheBloke/phi-2-dpo-GGUF/resolve/main/phi-2-dpo.Q4_K_M.gguf',
    size: '~1.6GB',
  },
  {
    name: 'MythoLogic-Mini-7B',
    description: '高性能7B小型推理模型',
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
      Alert.alert('成功', '模型加载成功');
    } catch (error) {
      console.error('Failed to load model:', error);
      Alert.alert('错误', '模型加载失败');
    }
  };

  const handleCustomDownload = async () => {
    if (!customUrl.trim() || !customName.trim()) {
      Alert.alert('错误', '请输入有效的URL和模型名称');
      return;
    }

    try {
      setIsDownloading(true);
      await downloadModel(customUrl.trim(), customName.trim(), (progress) => setDownloadProgress(progress));
      setCustomUrl('');
      setCustomName('');
    } catch (error) {
      console.error('Failed to download model:', error);
      Alert.alert('错误', '模型下载失败');
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
      Alert.alert('错误', '预设模型下载失败');
    } finally {
      setIsDownloading(false);
    }
  };

  const openPresetDialog = (preset: typeof PRESET_MODELS[0]) => {
    setSelectedPreset(preset);
    setShowPresetDialog(true);
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.section}>
        <Card.Title title="当前模型"/>
        <Card.Content>
          {selectedModel ? (
            <View>
              <Text>名称: {selectedModel.name}</Text>
              <Text>路径: {selectedModel.path}</Text>
              <Text>状态: {isModelLoaded ? '已加载' : '未加载'}</Text>

              {modelInfo && (
                <View style={styles.modelInfoSection}>
                  <Text style={styles.sectionTitle}>模型详情:</Text>
                  <Text>架构: {modelInfo['general.architecture'] || '未知'}</Text>
                  <Text>参数量: {
                    modelInfo.n_params ?
                      `${(modelInfo.n_params / 1000000000).toFixed(2)}B` :
                      '未知'
                  }</Text>
                  {modelInfo.vocab_size && <Text>词汇量: {modelInfo.vocab_size}</Text>}
                  {modelInfo['llama.context_length'] && <Text>最大上下文: {modelInfo['llama.context_length']} tokens</Text>}
                </View>
              )}
            </View>
          ) : (
            <Text>未选择模型</Text>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Title title="可用模型"/>
        <Card.Content>
          {availableModels.length === 0 ? (
            <Text>没有可用模型，请下载模型</Text>
          ) : (
            availableModels.map((model) => (
              <View key={model.path}>
                <List.Item
                  title={model.name}
                  description={model.path}
                  right={() => (
                    <View style={styles.itemButtonContainer}>
                      <Button
                        mode="outlined"
                        onPress={() => handleLoadModel(model.path)}
                        disabled={isModelLoaded && selectedModel?.path === model.path}
                      >
                        {isModelLoaded && selectedModel?.path === model.path ? '已加载' : '加载'}
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
        <Card.Title title="预设模型"/>
        <Card.Content>
          {PRESET_MODELS.map((preset) => (
            <View key={preset.name}>
              <List.Item
                title={preset.name}
                description={`${preset.description} (${preset.size})`}
                right={() => (
                  <View style={styles.itemButtonContainer}>
                    <Button
                      mode="outlined"
                      onPress={() => openPresetDialog(preset)}
                      disabled={isDownloading}
                    >
                      下载
                    </Button>
                  </View>
                )}
              />
              <Divider/>
            </View>
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Title title="自定义下载"/>
        <Card.Content>
          <TextInput
            label="模型名称"
            value={customName}
            onChangeText={setCustomName}
            style={styles.input}
            disabled={isDownloading}
          />
          <TextInput
            label="GGUF模型URL"
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
            {isDownloading ? '下载中...' : '下载模型'}
          </Button>
        </Card.Content>
      </Card>

      <Portal>
        <Dialog visible={isDownloading} dismissable={false}>
          <Dialog.Title>下载进度</Dialog.Title>
          <Dialog.Content>
            <View style={styles.downloadingContainer}>
              <ActivityIndicator size="large" color="#6200ee"/>
              <Text style={styles.downloadingText}>
                正在下载模型，请稍候...
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
          <Dialog.Title>下载预设模型</Dialog.Title>
          <Dialog.Content>
            {selectedPreset && (
              <View>
                <Text style={styles.dialogText}>名称: {selectedPreset.name}</Text>
                <Text style={styles.dialogText}>描述: {selectedPreset.description}</Text>
                <Text style={styles.dialogText}>大小: {selectedPreset.size}</Text>
                <Text style={styles.dialogWarning}>
                  注意: 请确保您有足够的存储空间和稳定的网络连接。下载过程中请勿关闭应用。
                </Text>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowPresetDialog(false)}>取消</Button>
            <Button onPress={handlePresetDownload}>确认下载</Button>
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
