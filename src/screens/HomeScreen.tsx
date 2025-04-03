import React, {useCallback, useLayoutEffect, useState} from 'react';
import {Alert, FlatList, StyleSheet, View,} from 'react-native';
import {Button, Dialog, FAB, IconButton, Portal, Text, TextInput, Tooltip} from 'react-native-paper';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useModel} from '../context/ModelContext';
import {createChat, deleteChat, getChatHistory, setCurrentChat, updateChatTitle} from '../services/ChatStorage';
import {Chat, ChatMode} from '../types/chat';
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
  const [isFabOpen, setFabOpen] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <IconButton
          icon="cog"
          onPressOut={() => navigation.navigate('Settings')}
        />
      ),
    });
  }, [navigation]);
// With this:
  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused - loading chats');
      loadChats();

      // Optional: Return a cleanup function if needed
      return () => {
        // Any cleanup code can go here
      };
    }, [refreshKey]) // Keep refreshKey in the dependency array
  );

  const loadChats = () => {
    const history = getChatHistory();
    const chatList = Object.values(history.chats);
    chatList.sort((a, b) => b.updatedAt - a.updatedAt);
    setChats(chatList);
  };

  const handleNewChat = (mode: ChatMode) => {
    if (!isModelLoaded) {
      Alert.alert(
        'No Available Model',
        'Please download and load a model in Model Management first',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Go to Model Management', onPress: () => navigation.navigate('ModelManagement')}
        ]
      );
      return;
    }

    const newChat = createChat(selectedModel?.name || 'Unknown Model', mode);
    setRefreshKey(prev => prev + 1);
    navigation.navigate('Chat', {chatId: newChat.id, mode: mode});
  };

  const handleOpenChat = (chat: Chat) => {
    if (chat.modelName === selectedModel?.name) {
      setCurrentChat(chat.id);
      navigation.navigate('Chat', {chatId: chat.id, mode: chat.mode});
    } else {
      Alert.alert('Target model does not match current model', `Please select ${chat.modelName} model in Model Management page`);
    }
  };

  const handleDeleteChat = (chatId: string) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
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
          <Text>No chat history yet</Text>
          <Button
            mode="contained"
            onPress={() => handleNewChat('conversation')}
            style={styles.newChatButton}
          >
            Start New Chat
          </Button>
          <Button
            mode="contained"
            onPress={() => handleNewChat('singleInteractive')}
            style={styles.newChatButton}
          >
            Start Single Interactive
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

      <FAB.Group
        style={styles.fab}
        open={isFabOpen}
        visible={true}
        icon={isFabOpen ? 'close' : 'plus'}
        actions={[
          {
            icon: 'chat-plus',
            label: 'Start New Chat',
            onPress: () => handleNewChat('conversation'),
          },
          {
            icon: 'comment-plus',
            label: 'Start Single Interactive',
            onPress: () => handleNewChat('singleInteractive'),
          },
        ]}
        onStateChange={({open}) => setFabOpen(open)}
      />

      <Portal>
        <Dialog visible={editDialogVisible} onDismiss={() => setEditDialogVisible(false)}>
          <Dialog.Title>Edit Conversation Title</Dialog.Title>
          <Dialog.Content>
            <TextInput
              value={editTitle}
              onChangeText={setEditTitle}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditDialogVisible(false)}>Cancel</Button>
            <Button onPress={saveEditedTitle}>Save</Button>
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
    backgroundColor: '#2196F3', // Blue edit button
  },
  deleteButton: {
    backgroundColor: '#F44336', // Red delete button
  },
});

export default HomeScreen;
