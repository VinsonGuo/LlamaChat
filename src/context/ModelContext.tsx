import React, {createContext, useContext, useEffect, useState} from 'react';
import {MMKV} from 'react-native-mmkv';
import {Alert} from 'react-native';
import * as RNFS from 'react-native-fs';
import {initLlama, loadLlamaModelInfo} from 'llama.rn';
import {LlamaContext} from "llama.rn/src";
import {useSettings} from "./SettingsContext";

// 定义模型类型
export interface LlamaModel {
  name: string;
  path: string;
}

// 定义上下文类型
interface ModelContext {
  availableModels: LlamaModel[];
  selectedModel: LlamaModel | null;
  isModelLoaded: boolean;
  loadModel: (models: LlamaModel[], modelPath: string) => Promise<void>;
  generateResponse: (messages: any[], onToken: (token: string) => void, abortSignal?: AbortController) => Promise<string>;
  downloadModel: (url: string, modelName: string,
                  progressCallback: (progress: number) => void) => Promise<void>;
  deleteModel: (modelName: string)=> Promise<void>
  modelInfo: any | null;
}

const ModelContext = createContext<ModelContext | undefined>(undefined);

// 持久化存储
const storage = new MMKV();

export const ModelProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
  const [availableModels, setAvailableModels] = useState<LlamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<LlamaModel | null>(null);
  const [modelContext, setModelContext] = useState<LlamaContext | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [modelInfo, setModelInfo] = useState<any | null>(null);

  const {settings} = useSettings();

  // 按模型类型的常用停止词
  const stopWords = [
    // 通用停止词
    '</s>',
    '<|end|>',
    '<|eot_id|>',
    '<|end_of_text|>',
    '<|im_end|>',
    '<|EOT|>',
    '<|END_OF_TURN_TOKEN|>',
    '<|end_of_turn|>',
    '<|endoftext|>',

    // Llama专用停止词
    '[INST]',
    '[/INST]',
    '<|assistant|>',
    '<|user|>',
    '<|system|>',
    '<|im_start|>',

    // Phi专用停止词
    'Instruct:',
    'Output:',
    '### Human:',
    '### Assistant:',

    // Gemma专用停止词
    '<end_of_turn>',
    '<start_of_turn>'
  ];

  // 初始化时检查已有模型
  useEffect(() => {
    const checkExistingModels = async () => {
      try {
        const modelsDir = `${RNFS.DocumentDirectoryPath}/models`;

        // 确保模型目录存在
        const dirExists = await RNFS.exists(modelsDir);
        if (!dirExists) {
          await RNFS.mkdir(modelsDir);
        }

        // 读取模型目录
        const files = await RNFS.readDir(modelsDir);
        const modelFiles = files.filter(file => file.name.endsWith('.gguf'));

        // 创建模型列表
        const models: LlamaModel[] = modelFiles.map(file => ({
          name: file.name.replace('.gguf', ''),
          path: `file://${file.path}`,  // 注意这里使用file://前缀
        }));

        setAvailableModels(models);

        // 检查是否有上次使用的模型
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
        Alert.alert('错误', '检查模型失败');
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

      // 如果之前有加载的模型，先释放资源
      if (modelContext) {
        await modelContext.release();
      }

      // 找到对应的模型数据并设置为当前模型
      const model = models.find(m => m.path === modelPath) || {
        name: 'Unknown Model',
        path: modelPath
      };

      setSelectedModel(model);

      // 获取模型信息
      await loadModelInfo(modelPath);

      // 创建新的Llama上下文
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
      Alert.alert('错误', '加载模型失败');
    }
  };

  const generateResponse = async (
    messages: any[],
    onToken: (token: string) => void,
    abortSignal?: AbortController): Promise<string> => {
    if (!modelContext || !isModelLoaded) {
      throw new Error('模型未加载');
    }

    try {
      // 使用completion方法生成响应
      const result = await modelContext.completion({
        messages,
        temperature: settings.temperature,
        top_p: settings.top_p,
        n_predict: settings.n_predict,
        stop: stopWords,
      }, async (data) => {
        // 检查是否有取消信号
        if (abortSignal?.signal.aborted) {
          // 中断生成
          await modelContext.stopCompletion()
          return;
        }
        // 实时获取生成的tokens，可用于流式显示
        // 此处可以添加回调处理，用于实时更新UI
        console.log('Token:', data.token);
        onToken(data.token);
      });

      return result.text;
    } catch (error) {
      console.error('Failed to generate response:', error);
      throw new Error('生成响应失败');
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

      // 确保模型目录存在
      const dirExists = await RNFS.exists(modelsDir);
      if (!dirExists) {
        await RNFS.mkdir(modelsDir);
      }

      // 开始下载
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

      // 添加到可用模型列表
      const newModel = {
        name: modelName,
        path: `file://${modelPath}`,  // 注意这里添加file://前缀
      };

      setAvailableModels(prevModels => [...prevModels, newModel]);
      Alert.alert('下载完成', `模型 ${modelName} 已下载完成。`);
    } catch (error) {
      console.error('Failed to download model:', error);
      Alert.alert('错误', '下载模型失败');
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

  // 当组件卸载时释放资源
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
        modelInfo,
        deleteModel,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
};

// 自定义Hook以便在组件中使用
export const useModel = () => {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
};
