import React, {useEffect, useLayoutEffect, useState} from 'react';
import {Alert, FlatList, StyleSheet, View,} from 'react-native';
import {Button, Dialog, FAB, IconButton, Portal, Text, TextInput} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {useModel} from '../context/ModelContext';
import {createChat, deleteChat, getChatHistory, setCurrentChat, updateChatTitle} from '../services/ChatStorage';
import {Chat} from '../types/chat';
import {HomeScreenNavigationProp} from "../types/navigation-types";
import ChatListItem from "../components/ChatListItem";
import ModelInfoPanel from "../components/ModelInfoPanel";


const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const {isModelLoaded, selectedModel, availableModels} = useModel();
  const [chats, setChats] = useState<Chat[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [currentEditChat, setCurrentEditChat] = useState<Chat | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useLayoutEffect(() => {
    const navigateToSettings = () => {
      console.log('test')
    };
    navigation.setOptions({
      headerRight: () => (
        <IconButton
          icon="cog"
          onPressOut={() => navigation.navigate('ModelManagement')}
        />
      ),
    });
  }, [navigation]);
  // 加载聊天历史
  useEffect(() => {
    loadChats();
  }, [refreshKey]);

  const loadChats = () => {
    const history = getChatHistory();
    const chatList = Object.values(history.chats);
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


  return (
    <View style={styles.container}>
      {chats.length === 0 ? <ModelInfoPanel
          style={styles.modelInfo}
          selectedModel={selectedModel}
          isModelLoaded={isModelLoaded}/>
        : <View/>}

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
          renderItem={({item}: { item: Chat }) => (
            <ChatListItem
              item={item}
              onOpenChat={handleOpenChat}
              onEditChat={handleEditChat}
              onDeleteChat={handleDeleteChat}
            />
          )}
          ListHeaderComponent={
            <ModelInfoPanel
              style={styles.modelInfo}
              selectedModel={selectedModel}
              isModelLoaded={isModelLoaded}/>
          }
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
    backgroundColor: '#f5f5f5',
  },
  modelInfo: {
    marginHorizontal: 16,
    marginVertical: 0,
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
    marginHorizontal: 16,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  rightActions: {
    flexDirection: 'row',
    width: 160,
    height: '100%',
  },
  actionContainer: {
    width: 80,
    height: '100%',
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#2196F3', // 蓝色编辑按钮
  },
  deleteButton: {
    backgroundColor: '#F44336', // 红色删除按钮
  },
});

export default HomeScreen;
