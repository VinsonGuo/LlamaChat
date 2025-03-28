import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Divider, IconButton, Text, useTheme } from 'react-native-paper';
import { Chat } from "../types/chat";

interface ChatListItemProps {
  item: Chat;
  onOpenChat: (chat: Chat) => void;
  onEditChat: (chat: Chat) => void;
  onDeleteChat: (chatId: string) => void;
}

// 获取聊天的首字母作为头像
const getInitials = (title: string) => {
  return title.charAt(0).toUpperCase();
};

// 为模型名称生成稳定的颜色，基于名称的哈希值
const getModelColor = (modelName: string) => {
  // 科技感但不夸张的颜色数组
  const colors = [
    '#3498db',  // 蓝色
    '#2ecc71',  // 绿色
    '#9b59b6',  // 紫色
    '#1abc9c',  // 青绿色
    '#e74c3c',  // 红色
    '#f39c12',  // 橙色
    '#34495e',  // 深蓝灰色
    '#16a085',  // 深青色
    '#d35400',  // 深橙色
    '#8e44ad',  // 深紫色
    '#27ae60',  // 深绿色
    '#2980b9',  // 深蓝色
    '#c0392b',  // 深红色
    '#7f8c8d'   // 灰色
  ];

  // 简单的哈希函数，将模型名称映射到一个数字
  let hash = 0;
  for (let i = 0; i < modelName.length; i++) {
    // 使用字符编码生成哈希值
    hash = ((hash << 5) - hash) + modelName.charCodeAt(i);
    hash |= 0; // 转换为32位整数
  }

  // 取绝对值，然后对颜色数组的长度取模，确保它在数组范围内
  const colorIndex = Math.abs(hash) % colors.length;

  return colors[colorIndex];
};
// 生成头像背景和边框样式 - 更柔和的颜色
const getAvatarStyle = (modelName: string) => {
  const baseColor = getModelColor(modelName);

  return {
    backgroundColor: '#f5f6fa',  // 浅灰色背景，更柔和
    color: baseColor,  // 文字颜色仍使用模型颜色
    borderColor: baseColor + '40'  // 添加透明度的边框
  };
};

const ChatListItem = ({ item, onOpenChat, onEditChat, onDeleteChat }: ChatListItemProps) => {
  const theme = useTheme();
  const modelColor = getModelColor(item.modelName);
  const avatarStyle = getAvatarStyle(item.modelName);

  // 确保暗色模式下有正确的卡片背景色
  const cardBackgroundColor = theme.dark ? '#1e272e' : '#ffffff';
  const cardBorderColor = theme.dark ? '#2a3f54' : '#e0e0e0';
  const textColor = theme.dark ? '#f5f6fa' : '#2d3436';
  const secondaryTextColor = theme.dark ? '#b2bec3' : '#636e72';

  // 格式化日期
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();

    // 如果是今天
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // 如果是昨天
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return '昨天';
    }

    // 如果是本周
    const weekDiff = Math.round((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
    if (weekDiff < 7) {
      const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return days[date.getDay()];
    }

    // 其他情况显示完整日期
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const lastMessage = item.messages && item.messages.length > 0
    ? item.messages[item.messages.length - 1]
    : null;

  const getPreviewText = () => {
    if (lastMessage && lastMessage.content) {
      return lastMessage.content.trim();
    }
    return '新建的对话';
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
        {/* 第一行：头像和标题与时间 */}
        <View style={styles.headerRow}>

          {/* 标题 */}
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

          {/* 时间 - 移至最右侧 */}
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

        {/* 第二行：预览文本 */}
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

        {/* 分隔线 */}
        <Divider style={[
          styles.divider,
          { backgroundColor: theme.dark ? '#3d4852' : '#ecf0f1' }
        ]} />

        {/* 第三行：模型标签和操作按钮 */}
        <View style={styles.footerRow}>
          {/* 模型标签 */}
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

          {/* 操作按钮 */}
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
    borderRadius: 8,  // 方形圆角
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
