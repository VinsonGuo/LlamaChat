import React, {createContext, useContext, useEffect, useState} from 'react';
import {MMKV} from 'react-native-mmkv';
import {Alert} from 'react-native';
import * as RNFS from 'react-native-fs';
import {initLlama, loadLlamaModelInfo} from 'llama.rn';
import {LlamaContext} from "llama.rn/src";
import {useSettings} from "./SettingsContext";

// Define model type
export interface LlamaModel {
  name: string;
  path: string;
}

// Define context type
interface ModelContext {
  availableModels: LlamaModel[];
  selectedModel: LlamaModel | null;
  isModelLoaded: boolean;
  loadModel: (models: LlamaModel[], modelPath: string) => Promise<void>;
  generateResponse: (messages: any[], onToken: (token: string) => void, abortSignal?: AbortController) => Promise<string>;
  downloadModel: (url: string, modelName: string,
                  progressCallback: (progress: number) => void) => Promise<void>;
  importModel: (sourceUri: string, modelName: string,
                  progressCallback: (progress: number) => void) => Promise<void>;
  deleteModel: (modelName: string)=> Promise<void>
  modelInfo: any | null;
}

const ModelContext = createContext<ModelContext | undefined>(undefined);

// Persistent storage
const storage = new MMKV();

export const ModelProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
  const [availableModels, setAvailableModels] = useState<LlamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<LlamaModel | null>(null);
  const [modelContext, setModelContext] = useState<LlamaContext | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [modelInfo, setModelInfo] = useState<any | null>(null);

  const {settings} = useSettings();

  // Common stop words by model type
  const stopWords = [
    // General stop words
    '</s>',
    '<|end|>',
    '<|eot_id|>',
    '<|end_of_text|>',
    '<|im_end|>',
    '<|EOT|>',
    '<|END_OF_TURN_TOKEN|>',
    '<|end_of_turn|>',
    '<|endoftext|>',

    // Llama-specific stop words
    '[INST]',
    '[/INST]',
    '<|assistant|>',
    '<|user|>',
    '<|system|>',
    '<|im_start|>',

    // Phi-specific stop words
    'Instruct:',
    'Output:',
    '### Human:',
    '### Assistant:',

    // Gemma-specific stop words
    '<end_of_turn>',
    '<start_of_turn>'
  ];

  // Check existing models on initialization
  useEffect(() => {
    const checkExistingModels = async () => {
      try {
        const modelsDir = `${RNFS.DocumentDirectoryPath}/models`;

        // Ensure model directory exists
        const dirExists = await RNFS.exists(modelsDir);
        if (!dirExists) {
          await RNFS.mkdir(modelsDir);
        }

        // Read model directory
        const files = await RNFS.readDir(modelsDir);
        const modelFiles = files.filter(file => file.name.endsWith('.gguf'));

        // Create model list
        const models: LlamaModel[] = modelFiles.map(file => ({
          name: file.name.replace('.gguf', ''),
          path: `file://${file.path}`,  // Note: using file:// prefix here
        }));

        setAvailableModels(models);

        // Check if there's a previously used model
        const lastModelPath = storage.getString('lastModelPath');
        console.log('lastModelPath', lastModelPath);
        if (lastModelPath) {
          const lastModel = models.find(model => model.path === lastModelPath);
          if (lastModel) {
            await loadModel(models, lastModel.path);
          }
        }
      } catch (error) {
        console.error('Failed to check existing models:', error);
        Alert.alert('Error', 'Failed to check models');
      }
    };

    checkExistingModels();
  }, []);

  const loadModelInfo = async (modelPath: string) => {
    try {
      const info = await loadLlamaModelInfo(modelPath);
      console.log('loadLlamaModelInfo', info);
      setModelInfo(info);
      return info;
    } catch (error) {
      console.error('Failed to load model info:', error);
      throw error;
    }
  };

  const loadModel = async (models: LlamaModel[], modelPath: string) => {
    try {
      setIsModelLoaded(false);

      // If there's a previously loaded model, release resources first
      if (modelContext) {
        await modelContext.release();
      }

      // Find corresponding model data and set as current model
      const model = models.find(m => m.path === modelPath) || {
        name: 'Unknown Model',
        path: modelPath
      };

      setSelectedModel(model);

      // Get model information
      await loadModelInfo(modelPath);

      // Create new Llama context
      const context = await initLlama({
        model: modelPath,
        use_mlock: true,
        n_ctx: settings.n_ctx,
        n_batch: settings.n_batch,
        n_threads: settings.n_threads,
        n_gpu_layers: settings.n_gpu_layers,
      });

      setModelContext(context);

      storage.set('lastModelPath', modelPath);
      setIsModelLoaded(true);
    } catch (error) {
      console.error('Failed to load model:', error);
      Alert.alert('Error', 'Failed to load model');
    }
  };

  const generateResponse = async (
    messages: any[],
    onToken: (token: string) => void,
    abortSignal?: AbortController): Promise<string> => {
    if (!modelContext || !isModelLoaded) {
      throw new Error('Model not loaded');
    }

    try {
      // Use completion method to generate response
      const result = await modelContext.completion({
        messages,
        temperature: settings.temperature,
        top_p: settings.top_p,
        n_predict: settings.n_predict,
        stop: stopWords,
      }, async (data) => {
        // Check if there's a cancel signal
        if (abortSignal?.signal.aborted) {
          // Interrupt generation
          await modelContext.stopCompletion()
          return;
        }
        // Get generated tokens in real-time, can be used for streaming display
        // Callback handling can be added here for real-time UI updates
        console.log('Token:', data.token);
        onToken(data.token);
      });

      return result.text;
    } catch (error) {
      console.error('Failed to generate response:', error);
      throw new Error('Failed to generate response');
    }
  };

  const downloadModel = async (
    url: string,
    modelName: string,
    progressCallback: (progress: number) => void)
    : Promise<void> => {
    try {
      const modelsDir = `${RNFS.DocumentDirectoryPath}/models`;
      const modelPath = `${modelsDir}/${modelName}.gguf`;

      // Ensure model directory exists
      const dirExists = await RNFS.exists(modelsDir);
      if (!dirExists) {
        await RNFS.mkdir(modelsDir);
      }

      // Start download
      const downloadOptions = {
        fromUrl: url,
        toFile: modelPath,
        background: true,
        progressDivider: 5,
        begin: (res: any) => {
          console.log(`Started downloading model. Expected size: ${res.contentLength}`);
        },
        progress: (res: any) => {
          const progress = (res.bytesWritten / res.contentLength) * 100;
          progressCallback(progress)
          console.log(`Downloaded ${progress.toFixed(2)}%`);
        },
      };

      const result = await RNFS.downloadFile(downloadOptions).promise;
      if (result.statusCode !== 200) {
        throw new Error(`statusCode: ${result.statusCode}`);
      }

      // Add to available models list
      const newModel = {
        name: modelName,
        path: `file://${modelPath}`,  // Note: adding file:// prefix here
      };

      setAvailableModels(prevModels => [...prevModels, newModel]);
      Alert.alert('Download Complete', `Model ${modelName} has been downloaded.`);
    } catch (error) {
      console.error('Failed to download model:', error);
      Alert.alert('Error', 'Failed to download model');
    }
  };

  const importModel = async (
    sourceUri: string,
    modelName: string,
    progressCallback: (progress: number) => void)
    : Promise<void> => {
    try {
      // Prepare destination path
      const modelsDir = `${RNFS.DocumentDirectoryPath}/models`;
      const destPath = `${modelsDir}/${modelName}.gguf`;

      // Ensure models directory exists
      const dirExists = await RNFS.exists(modelsDir);
      if (!dirExists) {
        await RNFS.mkdir(modelsDir);
      }

      console.log('Source URI:', sourceUri);
      console.log('Destination path:', destPath);

      try {
        const fileInfo = await RNFS.stat(sourceUri);
        const totalSize = fileInfo.size;
        console.log('Source file size:', totalSize);

        // 使用copyFile函数复制文件
        const copyJob = RNFS.copyFile(sourceUri, destPath);

        // 手动设置进度更新的间隔
        const progressInterval = setInterval(async () => {
          try {
            if (await RNFS.exists(destPath)) {
              const currentFileInfo = await RNFS.stat(destPath);
              const progressPercentage = (currentFileInfo.size / totalSize) * 100;
              progressCallback(Math.min(progressPercentage, 99)); // 最多显示99%，直到完成
              console.log('Import progress:', progressPercentage.toFixed(2) + '%');
            }
          } catch (e) {
            console.log('Progress check error:', e);
            // 如果文件还不存在，忽略错误
          }
        }, 500); // 每500毫秒检查一次

        // 等待复制完成
        await copyJob;
        clearInterval(progressInterval);
        progressCallback(100);

        // Add file to model list using the downloadModel function which will update the UI
        const modelPath = `file://${destPath}`;
        const newModel = {
          name: modelName,
          path: modelPath,  // Note: adding file:// prefix here
        };

        setAvailableModels(prevModels => [...prevModels, newModel]);

        Alert.alert('Success', `Model "${modelName}" has been imported successfully`);
      } catch (statError) {
        console.error('Error getting source file information:', statError);
        Alert.alert('Error', 'Failed to access source file information');
      }
    } catch (error) {
      console.error('Error copying model file:', error);
      Alert.alert('Error', 'Failed to import model file');
    } finally {
      progressCallback(0);
    }
  };

  const deleteModel = async (modelName: string): Promise<void> => {
    try {
      const modelPath = `${RNFS.DocumentDirectoryPath}/models/${modelName}.gguf`;

      // Check if file exists
      const exists = await RNFS.exists(modelPath);
      if (!exists) {
        throw new Error('Model file does not exist');
      }

      // If this is the currently loaded model, release it first
      if (selectedModel && selectedModel.name === modelName) {
        if (modelContext) {
          await modelContext.release();
        }
        setSelectedModel(null);
        setIsModelLoaded(false);
        setModelContext(null);
        storage.delete('lastModelPath');
      }

      // Delete the file
      await RNFS.unlink(modelPath);

      // Update available models list
      setAvailableModels(prevModels =>
        prevModels.filter(model => model.name !== modelName)
      );

      return Promise.resolve();
    } catch (error) {
      console.error('Failed to delete model:', error);
      throw error;
    }
  };

  // Release resources when component unmounts
  useEffect(() => {
    return () => {
      if (modelContext) {
        modelContext.release().catch(console.error);
      }
    };
  }, [modelContext]);

  return (
    <ModelContext.Provider
      value={{
        availableModels,
        selectedModel,
        isModelLoaded,
        loadModel,
        generateResponse,
        downloadModel,
        importModel,
        modelInfo,
        deleteModel,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
};

// Custom Hook for use in components
export const useModel = () => {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
};
