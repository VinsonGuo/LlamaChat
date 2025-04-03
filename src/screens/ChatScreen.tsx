import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  NativeScrollEvent,
  Platform,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import {Button, Dialog, IconButton, Portal, Surface, Text, TextInput} from 'react-native-paper';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {useModel} from '../context/ModelContext';
import {addMessage, deleteMessage, getChat, updateUserPrompt} from '../services/ChatStorage';
import {Chat, Message} from '../types/chat';
import {RootStackParamList} from "../types/navigation-types";
import {NativeSyntheticEvent} from "react-native/Libraries/Types/CoreEventTypes";
import {useSettings} from "../context/SettingsContext";
import Markdown from "../components/Markdown";
import ContextMenu from "react-native-context-menu-view";
import Clipboard from '@react-native-clipboard/clipboard';


const ChatScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'Chat'>>();
  const navigation = useNavigation();
  const {chatId, mode} = route.params;
  const {generateResponse, isModelLoaded} = useModel();
  const {settings} = useSettings();

  const [chat, setChat] = useState<Chat | null>(null);
  const [inputText, setInputText] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const isAtBottomRef = useRef<boolean>(false);
  const [userPromptDialogVisible, setUserPromptDialogVisible] = useState(false);
  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToOffset({
      animated: true,
      offset: 0,
    });
  }, []);

  useEffect(() => {
    const loadedChat = getChat(chatId);
    if (loadedChat) {
      setChat(loadedChat);
    } else {
      navigation.goBack();
    }
    return () => {
      stopGeneration()
    }
  }, [chatId]);

  useEffect(() => {
    if (chat) {
      navigation.setOptions({
        title: chat.title,
        headerRight: () => (
          mode === 'singleInteractive' &&
          <IconButton icon={'pencil'} onPressOut={() => setUserPromptDialogVisible(true)}/>
        )
      });
      setUserPrompt(chat.userPrompt);
      if (mode === 'singleInteractive' && !chat.userPrompt) {
        setUserPromptDialogVisible(true);
      }
    }
  }, [chat]);

  const handleSend = async () => {
    if (!inputText.trim() || !isModelLoaded || !chat) return;

    const userMessage = inputText.trim();
    setInputText('');

    // Add user message
    const newUserMessage = addMessage(chatId, 'user', userMessage);

    // Update local state
    setChat(prevChat => {
      if (!prevChat) return null;
      return {
        ...prevChat,
        messages: [newUserMessage, ...prevChat.messages],
      };
    });

    // Generate assistant reply
    setIsGenerating(true);
    try {
      // Prepare message format
      const formattedMessages = [
        {
          role: 'system',
          content: settings.systemPrompt,
        }
      ];

      if (mode === 'conversation') {
        // Add history messages to formatted messages
        chat.messages.toReversed().forEach(msg => {
          formattedMessages.push({
            role: msg.role,
            content: msg.content,
          });
        });
      } else {
        formattedMessages.push({
          role: 'user',
          content: chat?.userPrompt,
        })
      }

      // Add user's latest message
      formattedMessages.push({
        role: 'user',
        content: userMessage,
      });

      abortControllerRef.current = new AbortController();
      let streamedContent = '';
      let streamedCount = 0;
      // Call model to generate response
      const response = await generateResponse(formattedMessages, (token) => {
        streamedContent += token;
        streamedCount++;
        if (streamedCount % 10 !== 0) {
          return;
        }
        setChat(prevChat => {
          if (!prevChat) return null;

          const messages = [...prevChat.messages];
          const lastMessage = messages[0];

          const streamMessage: Message = {
            id: 'streaming_id',
            content: streamedContent,
            timestamp: Date.now(),
            role: 'assistant'
          };

          // Use conditional operator to check the last message
          if (!lastMessage || lastMessage.role === 'user') {
            messages.unshift(streamMessage);
          } else {
            messages[0] = streamMessage;
          }
          return {...prevChat, messages};
        });
      }, abortControllerRef.current);

      // Add assistant message
      const assistantMessage = addMessage(chatId, 'assistant', response.trim());

      // Update local state
      setChat(prevChat => {
        if (!prevChat) return null;
        return {
          ...prevChat,
          messages: [assistantMessage, ...prevChat.messages.filter((e) => e.id !== 'streaming_id')],
        };
      });
    } catch (error) {
      console.error('Failed to generate response:', error);
      // Handle error, e.g., add error message
      addMessage(chatId, 'assistant', 'Sorry, an error occurred while generating a response.');
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

  const handleScroll = React.useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const {contentOffset} = event.nativeEvent;
    const isAtTop = contentOffset.y <= 0;
    setIsAtBottom(isAtTop);
    isAtBottomRef.current = isAtTop;
  }, []);

  const handleMessageItemContextMenuPress = (item: Message) => {
    return async (event: any) => {
      switch (event.nativeEvent.index) {
        case 0:
          Clipboard.setString(item.content);
          break
        case 1:
          await Share.share({
            message: item.content,
          });
          break
        case 2:
          setChat(prevChat => {
            if (!prevChat) return null;
            return {
              ...prevChat,
              messages: prevChat.messages.filter((e) => e.id !== item.id),
            };
          })
          deleteMessage(chatId, item.id)
          break
      }
    };
  }

  const MemoizedMessageItem = React.memo(({item}: { item: Message }) => (
    <Surface style={[
      styles.messageBubble,
      item.role === 'user' ? styles.userMessage : styles.assistantMessage,
    ]}>
      <ContextMenu
        actions={
          [
            {title: 'Copy', systemIcon: 'doc.on.doc'},
            {title: 'Share', systemIcon: 'square.and.arrow.up'},
            {title: 'Delete', systemIcon: 'trash', destructive: true, disabled: isGenerating}
          ]
        }
        onPress={handleMessageItemContextMenuPress(item)}>
        {item.role === 'user' ?
          <Text style={styles.messageText}>{item.content}</Text> :
          <Markdown>{item.content}</Markdown>}
        <Text style={styles.messageTime}>
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </ContextMenu>
    </Surface>
  ), (prevProps, nextProps) => {
    // Only re-render if the message content or ID changes
    return prevProps.item.id === nextProps.item.id &&
      prevProps.item.content === nextProps.item.content;
  });

  // If chat is not loaded or has no messages, show loading state
  if (!chat) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large"/>
      </View>
    );
  }

  // Render main interface
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.chatContainer}>
        <FlatList
          ref={flatListRef}
          data={chat.messages}
          renderItem={({item}: { item: Message }) => <MemoizedMessageItem item={item}/>}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          onScroll={handleScroll}
          inverted={true}
          scrollEventThrottle={16}
          keyboardDismissMode="interactive"
          maintainVisibleContentPosition={
            isAtBottom
              ? undefined
              : {
                minIndexForVisible: 1,
              }
          }
        />
        {!isAtBottom && (
          <IconButton
            style={styles.scrollButton}
            icon="chevron-down"
            size={24}
            onPress={() => scrollToBottom()}
          />
        )}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter message..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          right={
            isGenerating ? (
              <TextInput.Icon icon="stop" onPress={stopGeneration}/>
            ) : (
              <TextInput.Icon icon="send" onPress={handleSend} disabled={!inputText.trim() || !isModelLoaded}/>
            )
          }
        />
      </View>

      {isGenerating && (
        <View style={styles.generatingContainer}>
          <ActivityIndicator size="small"/>
          <Text style={styles.generatingText}>AI is thinking...</Text>
        </View>
      )}
      <Portal>
        <Dialog dismissable={false} visible={userPromptDialogVisible}
                onDismiss={() => setUserPromptDialogVisible(false)}>
          <Dialog.Title>Edit Instruction</Dialog.Title>
          <Dialog.Content>
            <TextInput
              value={userPrompt}
              onChangeText={setUserPrompt}
              placeholder={'Enter user prompt'}
              mode="outlined"
            />
          </Dialog.Content>

          <Dialog.Actions>
            <Button
              onPress={() => chat?.userPrompt ? setUserPromptDialogVisible(false) : navigation.goBack()}>Cancel</Button>
            <Button disabled={userPrompt.trim().length === 0} onPress={() => {
              const chat = updateUserPrompt(chatId, userPrompt);
              setChat(chat);
              setUserPromptDialogVisible(false);
            }}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  chatContainer: {
    flex: 1,
    position: 'relative', // Important: for correctly positioning the scroll button
  },
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  scrollButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 30,
    elevation: 2,
    // iOS shadow properties
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  inputContainer: {
    padding: 8,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    width: '85%',
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
