import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, View,} from 'react-native';
import {Surface, Text, TextInput} from 'react-native-paper';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {useModel} from '../context/ModelContext';
import {addMessage, getChat} from '../services/ChatStorage';
import {Chat, Message} from '../types/chat';
import {RootStackParamList} from "../types/navigation-types";


const ChatScreen = () => {
    const route = useRoute<RouteProp<RootStackParamList, 'Chat'>>();
    const navigation = useNavigation();
    const {chatId} = route.params;
    const {generateResponse, isModelLoaded} = useModel();

    const [chat, setChat] = useState<Chat | null>(null);
    const [inputText, setInputText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        console.log('ChatScreen', chatId);
        loadChat();
        return () => {
            stopGeneration()
        }
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
            flatListRef.current?.scrollToEnd({animated: true});
        }, 100);

        // 生成助手回复
        setIsGenerating(true);
        try {
            // 准备消息格式
            const formattedMessages = [
                {
                    role: 'system',
                    content: "You are an AI assistant running locally on the user's device. Provide brief, helpful responses. Acknowledge limitations when uncertain. Focus on being accurate and useful.",
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

            abortControllerRef.current = new AbortController();
            let streamedContent = '';
            let streamedCount = 0;
            // 调用模型生成回复
            const response = await generateResponse(formattedMessages, (token) => {
                streamedContent += token;
                streamedCount++;
                setChat(prevChat => {
                    if (!prevChat) return null;

                    const messages = [...prevChat.messages];
                    const lastMessage = messages[messages.length - 1];

                    const streamMessage: Message = {
                        id: 'streaming_id',
                        content: streamedContent,
                        timestamp: Date.now(),
                        role: 'assistant'
                    };

                    // 使用条件操作符检查最后一条消息
                    if (!lastMessage || lastMessage.role === 'user') {
                        // 如果没有最后一条消息或最后一条是用户消息，添加新的流式消息
                        messages.push(streamMessage);
                        setTimeout(() => {
                            flatListRef.current?.scrollToEnd({animated: true});
                        }, 100);
                    } else {
                        // 否则，替换最后一条消息（假设是助手消息）
                        messages[messages.length - 1] = streamMessage;
                        if (streamedCount % 10 === 0) {
                            setTimeout(() => {
                                flatListRef.current?.scrollToEnd({animated: true});
                            }, 100);
                        }
                    }

                    return {...prevChat, messages};
                });
            }, abortControllerRef.current);

            // 添加助手消息
            const assistantMessage = addMessage(chatId, 'assistant', response);

            // 更新本地状态
            setChat(prevChat => {
                if (!prevChat) return null;
                return {
                    ...prevChat,
                    messages: [...prevChat.messages.filter((e) => e.id !== 'streaming_id'), assistantMessage],
                };
            });

            // 再次滚动到底部
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({animated: true});
            }, 100);
        } catch (error) {
            console.error('Failed to generate response:', error);
            // 处理错误，例如添加错误消息
            addMessage(chatId, 'assistant', '抱歉，生成回复时出现错误。');
            loadChat(); // 重新加载聊天以获取最新状态
        } finally {
            abortControllerRef.current = null;
            setIsGenerating(false);
        }
    };

    const stopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsGenerating(false);
        }
    };

    // 渲染消息项目
    const renderMessage = ({item}: { item: Message }) => (
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
                <ActivityIndicator size="large"/>
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
                onLayout={() => flatListRef.current?.scrollToEnd({animated: false})}
            />

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="输入消息..."
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    right={
                        isGenerating ? (
                            <TextInput.Icon icon="stop" onPress={stopGeneration} />
                        ) : (
                            <TextInput.Icon icon="send" onPress={handleSend} disabled={!inputText.trim()}/>
                        )
                    }
                />
            </View>

            {isGenerating && (
                <View style={styles.generatingContainer}>
                    <ActivityIndicator size="small"/>
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
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        alignSelf: 'center',
    },
    generatingText: {
        color: '#ffffff',
        marginLeft: 8,
    },
});

export default ChatScreen;