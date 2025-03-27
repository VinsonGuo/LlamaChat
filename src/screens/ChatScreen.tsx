import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { TextInput, IconButton, Surface, Text } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useModel } from '../context/ModelContext';
import { getChat, addMessage } from '../services/ChatStorage';
import { Message, Chat } from '../types/chat';

interface ChatScreenProps {
    route: {
        params: {
            chatId: string;
        };
    };
}

const ChatScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { chatId } = route.params as { chatId: string };
    const { generateResponse, isModelLoaded } = useModel();

    const [chat, setChat] = useState<Chat | null>(null);
    const [inputText, setInputText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        loadChat();
    }, [chatId]);

    const loadChat = () => {
        const loadedChat = getChat(chatId);
        if (loadedChat) {
            setChat(loadedChat);

            // 更新导航栏标题
            navigation.setOptions({
                title: loadedChat.title
            });
        } else {
            // 如果找不到聊天，返回上一页
            navigation.goBack();
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() || !isModelLoaded || !chat) return;

        const userMessage = inputText.trim();
        setInputText('');

        // 添加用户消息
        const newUserMessage = addMessage(chatId, 'user', userMessage);

        // 更新本地状态
        setChat(prevChat => {
            if (!prevChat) return null;
            return {
                ...prevChat,
                messages: [...prevChat.messages, newUserMessage],
            };
        });

        // 滚动到底部
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);

        // 生成助手回复
        setIsGenerating(true);
        try {
            // 准备消息格式
            const formattedMessages = [
                {
                    role: 'system',
                    content: "你是一个有帮助的AI助手。",
                }
            ];

            // 将历史消息添加到格式化消息中
            chat.messages.forEach(msg => {
                formattedMessages.push({
                    role: msg.role,
                    content: msg.content,
                });
            });

            // 添加用户最新消息
            formattedMessages.push({
                role: 'user',
                content: userMessage,
            });

            // 调用模型生成回复
            const response = await generateResponse(formattedMessages);

            // 添加助手消息
            const assistantMessage = addMessage(chatId, 'assistant', response);

            // 更新本地状态
            setChat(prevChat => {
                if (!prevChat) return null;
                return {
                    ...prevChat,
                    messages: [...prevChat.messages, assistantMessage],
                };
            });

            // 再次滚动到底部
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (error) {
            console.error('Failed to generate response:', error);
            // 处理错误，例如添加错误消息
            addMessage(chatId, 'assistant', '抱歉，生成回复时出现错误。');
            loadChat(); // 重新加载聊天以获取最新状态
        } finally {
            setIsGenerating(false);
        }
    };

    // 渲染消息项目
    const renderMessage = ({ item }: { item: Message }) => (
        <Surface style={[
            styles.messageBubble,
            item.role === 'user' ? styles.userMessage : styles.assistantMessage,
        ]}>
            <Text style={styles.messageText}>{item.content}</Text>
            <Text style={styles.messageTime}>
                {new Date(item.timestamp).toLocaleTimeString()}
            </Text>
        </Surface>
    );

    // 如果聊天未加载或没有消息，显示加载状态
    if (!chat) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    // 渲染主界面
    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
            <FlatList
                ref={flatListRef}
                data={chat.messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.messageList}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            />

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="输入消息..."
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    disabled={isGenerating}
                    right={
                        isGenerating ? (
                            <TextInput.Icon icon="loading" disabled />
                        ) : (
                            <TextInput.Icon icon="send" onPress={handleSend} disabled={!inputText.trim()} />
                        )
                    }
                />
            </View>

            {isGenerating && (
                <View style={styles.generatingContainer}>
                    <ActivityIndicator size="small" />
                    <Text style={styles.generatingText}>AI正在思考...</Text>
                </View>
            )}
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageList: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    messageBubble: {
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
        maxWidth: '85%',
        elevation: 1,
    },
    userMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#e3f2fd',
    },
    assistantMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#ffffff',
    },
    messageText: {
        fontSize: 16,
    },
    messageTime: {
        fontSize: 12,
        color: '#757575',
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    inputContainer: {
        padding: 8,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    input: {
        backgroundColor: '#ffffff',
    },
    generatingContainer: {
        position: 'absolute',
        top: 8,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 8,
        borderRadius: 20,
        alignSelf: 'center',
        width: 'auto',
    },
    generatingText: {
        color: '#ffffff',
        marginLeft: 8,
    },
});

export default ChatScreen;