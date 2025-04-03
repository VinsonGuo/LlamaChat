import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import {Card, Divider, Icon, IconButton, Text, useTheme} from 'react-native-paper';
import { Chat } from "../types/chat";

interface ChatListItemProps {
  item: Chat;
  onOpenChat: (chat: Chat) => void;
  onEditChat: (chat: Chat) => void;
  onDeleteChat: (chatId: string) => void;
}

// Get the first letter of the chat title as an avatar
const getInitials = (title: string) => {
  return title.charAt(0).toUpperCase();
};

// Generate a stable color for the model name, based on the hash value of the name
const getModelColor = (modelName: string) => {
  // Tech-inspired but not exaggerated color array
  const colors = [
    '#3498db',  // Blue
    '#2ecc71',  // Green
    '#9b59b6',  // Purple
    '#1abc9c',  // Teal
    '#e74c3c',  // Red
    '#f39c12',  // Orange
    '#34495e',  // Dark blue-gray
    '#16a085',  // Dark teal
    '#d35400',  // Dark orange
    '#8e44ad',  // Dark purple
    '#27ae60',  // Dark green
    '#2980b9',  // Dark blue
    '#c0392b',  // Dark red
    '#7f8c8d'   // Gray
  ];

  // Simple hash function to map model name to a number
  let hash = 0;
  for (let i = 0; i < modelName.length; i++) {
    // Generate hash value using character code
    hash = ((hash << 5) - hash) + modelName.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }

  // Take the absolute value, then modulo by the length of the colors array to ensure it's within range
  const colorIndex = Math.abs(hash) % colors.length;

  return colors[colorIndex];
};
// Generate avatar background and border style - softer colors
const getAvatarStyle = (modelName: string) => {
  const baseColor = getModelColor(modelName);

  return {
    backgroundColor: '#f5f6fa',  // Light gray background, softer
    color: baseColor,  // Text color still uses model color
    borderColor: baseColor + '40'  // Border with transparency
  };
};

const ChatListItem = ({ item, onOpenChat, onEditChat, onDeleteChat }: ChatListItemProps) => {
  const theme = useTheme();
  const modelColor = getModelColor(item.modelName);
  const avatarStyle = getAvatarStyle(item.modelName);

  // Ensure correct card background color in dark mode
  const cardBackgroundColor = theme.dark ? '#1e272e' : '#ffffff';
  const cardBorderColor = theme.dark ? '#2a3f54' : '#e0e0e0';
  const textColor = theme.dark ? '#f5f6fa' : '#2d3436';
  const secondaryTextColor = theme.dark ? '#b2bec3' : '#636e72';

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();

    // If today
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // If yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    // If this week
    const weekDiff = Math.round((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
    if (weekDiff < 7) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[date.getDay()];
    }

    // For other cases show the full date
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const lastMessage = item.messages && item.messages.length > 0
    ? item.messages[item.messages.length - 1]
    : null;

  const getPreviewText = () => {
    if (lastMessage && lastMessage.content) {
      return lastMessage.content.trim();
    }
    return 'New conversation';
  };

  return (
    <Card
      style={[
        styles.chatCard,
        {
          backgroundColor: cardBackgroundColor,
          borderColor: cardBorderColor
        }
      ]}
      elevation={2}
    >
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => onOpenChat(item)}
        activeOpacity={0.7}
      >
        {/* First row: Avatar and title with time */}
        <View style={styles.headerRow}>

          <Icon size={18} source={item.mode === 'conversation' ? 'chat' : 'comment'}/>
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text
              variant="titleMedium"
              style={[
                styles.title,
                { color: textColor }
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
          </View>

          <Text
            variant="bodySmall"
            style={[
              styles.date,
              { color: secondaryTextColor }
            ]}
          >
            {formatDate(item.updatedAt)}
          </Text>
        </View>

        {/* Second row: Preview text */}
        <View style={styles.previewContainer}>
          <Text
            style={[
              styles.preview,
              { color: secondaryTextColor }
            ]}
            numberOfLines={1}
          >
            {getPreviewText()}
          </Text>
        </View>

        {/* Divider */}
        <Divider style={[
          styles.divider,
          { backgroundColor: theme.dark ? '#3d4852' : '#ecf0f1' }
        ]} />

        {/* Third row: Model label and action buttons */}
        <View style={styles.footerRow}>
          {/* Model label */}
          <View style={[
            styles.modelBadge,
            {
              backgroundColor: theme.dark ? '#2d3436' : '#f5f6fa',
              borderLeftColor: modelColor,
            }
          ]}>
            <Text
              style={[
                styles.modelBadgeText,
                { color: modelColor }
              ]}
            >
              {item.modelName}
            </Text>
          </View>

          {/* Action buttons */}
          <View style={styles.actionButtons}>
            <IconButton
              icon="pencil-outline"
              iconColor={theme.dark ? '#dfe6e9' : '#636e72'}
              size={18}
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                onEditChat(item);
              }}
            />
            <IconButton
              icon="trash-can-outline"
              iconColor={theme.dark ? '#ff7675' : '#d63031'}
              size={18}
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                onDeleteChat(item.id);
              }}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  chatCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,  // Rounded square
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    lineHeight: 30,
    fontWeight: '600',
  },
  titleContainer: {
    marginLeft: 8,
    flex: 1,
  },
  title: {
    fontWeight: '600',
    fontSize: 16,
  },
  date: {
    fontSize: 12,
    marginLeft: 8,
  },
  previewContainer: {
    marginBottom: 10,
  },
  preview: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderLeftWidth: 3,
    maxWidth: '70%',
  },
  modelBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    margin: 0,
    width: 32,
    height: 32,
  }
});

export default ChatListItem;
