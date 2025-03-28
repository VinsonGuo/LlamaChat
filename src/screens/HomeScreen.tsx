import React, {useEffect, useState} from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
} from 'react-native';
import {Button, Text, Card, IconButton, FAB, Dialog, Portal, TextInput} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {useModel} from '../context/ModelContext';
import {
    getChatHistory,
    createChat,
    deleteChat,
    updateChatTitle,
    getChat,
    setCurrentChat
} from '../services/ChatStorage';
import {Chat} from '../types/chat';
import {HomeScreenNavigationProp} from "../types/navigation-types";

const HomeScreen = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const {isModelLoaded, selectedModel, availableModels} = useModel();
    const [chats, setChats] = useState<Chat[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [editDialogVisible, setEditDialogVisible] = useState(false);
    const [currentEditChat, setCurrentEditChat] = useState<Chat | null>(null);
    const [editTitle, setEditTitle] = useState('');

    // 加载聊天历史
    useEffect(() => {
        loadChats();
    }, [refreshKey]);

    const loadChats = () => {
        const history = getChatHistory();
        const chatList = Object.values(history.chats);
        // 按更新时间降序排序
        chatList.sort((a, b) => b.updatedAt - a.updatedAt);
        setChats(chatList);
    };

    const handleNewChat = () => {
        if (!isModelLoaded) {
            Alert.alert(
                '无可用模型',
                '请先在模型管理中下载并加载模型',
                [
                    {text: '取消', style: 'cancel'},
                    {text: '前往模型管理', onPress: () => navigation.navigate('ModelManagement')}
                ]
            );
            return;
        }

        const newChat = createChat(selectedModel?.name || '未知模型');
        setRefreshKey(prev => prev + 1);
        navigation.navigate('Chat', {chatId: newChat.id});
    };

    const handleOpenChat = (chat: Chat) => {
        setCurrentChat(chat.id);
        navigation.navigate('Chat', {chatId: chat.id});
    };

    const handleDeleteChat = (chatId: string) => {
        Alert.alert(
            '删除对话',
            '确定要删除这个对话吗？此操作不可撤销。',
            [
                {text: '取消', style: 'cancel'},
                {
                    text: '删除',
                    onPress: () => {
                        deleteChat(chatId);
                        setRefreshKey(prev => prev + 1);
                    },
                    style: 'destructive'
                }
            ]
        );
    };

    const handleEditChat = (chat: Chat) => {
        setCurrentEditChat(chat);
        setEditTitle(chat.title);
        setEditDialogVisible(true);
    };

    const saveEditedTitle = () => {
        if (currentEditChat && editTitle.trim()) {
            updateChatTitle(currentEditChat.id, editTitle.trim());
            setEditDialogVisible(false);
            setCurrentEditChat(null);
            setEditTitle('');
            setRefreshKey(prev => prev + 1);
        }
    };

    const renderChatItem = ({item}: { item: Chat }) => (
        <Card style={styles.chatCard}>
            <TouchableOpacity onPress={() => handleOpenChat(item)}>
                <Card.Title
                    title={item.title}
                    subtitle={`${new Date(item.updatedAt).toLocaleString()} · ${item.modelName}`}
                    right={(props) => (
                        <View style={styles.cardActions}>
                            <IconButton
                                {...props}
                                icon="pencil"
                                onPress={() => handleEditChat(item)}
                            />
                            <IconButton
                                {...props}
                                icon="delete"
                                onPress={() => handleDeleteChat(item.id)}
                            />
                        </View>
                    )}
                />
            </TouchableOpacity>
        </Card>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>LlamaChat</Text>
                <Button
                    mode="outlined"
                    onPress={() => navigation.navigate('ModelManagement' as never)}
                >
                    模型管理
                </Button>
            </View>

            <View style={styles.modelInfo}>
                <Text>当前模型: {selectedModel ? selectedModel.name : '无'}</Text>
                <Text>状态: {isModelLoaded ? '已加载' : '未加载'}</Text>
            </View>

            {chats.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text>还没有聊天记录</Text>
                    <Button
                        mode="contained"
                        onPress={handleNewChat}
                        style={styles.newChatButton}
                    >
                        开始新对话
                    </Button>
                </View>
            ) : (
                <FlatList
                    data={chats}
                    renderItem={renderChatItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.chatList}
                />
            )}

            <FAB
                style={styles.fab}
                icon="plus"
                onPress={handleNewChat}
            />

            <Portal>
                <Dialog visible={editDialogVisible} onDismiss={() => setEditDialogVisible(false)}>
                    <Dialog.Title>编辑对话标题</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            value={editTitle}
                            onChangeText={setEditTitle}
                            mode="outlined"
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setEditDialogVisible(false)}>取消</Button>
                        <Button onPress={saveEditedTitle}>保存</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    modelInfo: {
        backgroundColor: '#e0e0e0',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    newChatButton: {
        marginTop: 16,
    },
    chatList: {
        paddingBottom: 80,
    },
    chatCard: {
        marginBottom: 12,
    },
    cardActions: {
        flexDirection: 'row',
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
});

export default HomeScreen;