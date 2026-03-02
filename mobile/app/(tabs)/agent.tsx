import React, { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useChat } from "../../hooks/useChat";
import { ChatMessage } from "../../types/property";

const SUGGESTED_PROMPTS = [
    "I want to live near Russell Blvd for under $1200",
    "What are the safest apartments in Davis?",
    "Which complexes have mold violations?",
    "Compare the top 3 lowest risk properties",
];

/** Renders a single chat message bubble. */
function MessageBubble({ message }: { message: ChatMessage }): React.ReactElement {
    const isUser = message.role === "user";

    return (
        <View
            style={[
                styles.bubbleRow,
                isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant,
            ]}
        >
            {!isUser && (
                <View style={styles.avatarContainer}>
                    <View style={styles.aiAvatar}>
                        <Ionicons name="sparkles" size={14} color="#89B4FA" />
                    </View>
                </View>
            )}
            <View
                style={[
                    styles.bubble,
                    isUser ? styles.bubbleUser : styles.bubbleAssistant,
                ]}
            >
                <Text
                    style={[
                        styles.bubbleText,
                        isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant,
                    ]}
                    selectable
                >
                    {message.content}
                </Text>
                <Text style={styles.timestamp}>
                    {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </Text>
            </View>
        </View>
    );
}

/** AI Agent chat screen. */
export default function AgentScreen(): React.ReactElement {
    const { messages, loading, sendMessage } = useChat();
    const [inputText, setInputText] = useState("");
    const flatListRef = useRef<FlatList<ChatMessage>>(null);

    const handleSend = useCallback(() => {
        if (!inputText.trim() || loading) return;
        const text = inputText;
        setInputText("");
        sendMessage(text);
    }, [inputText, loading, sendMessage]);

    const handlePromptPress = useCallback(
        (prompt: string) => {
            setInputText("");
            sendMessage(prompt);
        },
        [sendMessage]
    );

    const renderMessage = useCallback(
        ({ item }: { item: ChatMessage }) => <MessageBubble message={item} />,
        []
    );

    const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerIcon}>
                    <Ionicons name="sparkles" size={20} color="#89B4FA" />
                </View>
                <View>
                    <Text style={styles.headerTitle}>AI Leasing Agent</Text>
                    <Text style={styles.headerSubtitle}>
                        Powered by LeaseLens data
                    </Text>
                </View>
            </View>

            {/* Messages or Welcome */}
            {messages.length === 0 ? (
                <View style={styles.welcomeContainer}>
                    <View style={styles.welcomeIconContainer}>
                        <Ionicons name="chatbubbles" size={48} color="#45475A" />
                    </View>
                    <Text style={styles.welcomeTitle}>
                        Ask me about housing in Davis
                    </Text>
                    <Text style={styles.welcomeSubtitle}>
                        I can recommend apartments based on safety, location, budget,
                        and code violation history.
                    </Text>

                    <View style={styles.promptsContainer}>
                        <Text style={styles.promptsLabel}>Try asking:</Text>
                        {SUGGESTED_PROMPTS.map((prompt, index) => (
                            <Pressable
                                key={index}
                                style={({ pressed }) => [
                                    styles.promptChip,
                                    pressed && styles.promptChipPressed,
                                ]}
                                onPress={() => handlePromptPress(prompt)}
                            >
                                <Ionicons
                                    name="chatbubble-outline"
                                    size={14}
                                    color="#89B4FA"
                                />
                                <Text style={styles.promptText}>{prompt}</Text>
                            </Pressable>
                        ))}
                    </View>
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={keyExtractor}
                    style={styles.messageList}
                    contentContainerStyle={styles.messageListContent}
                    onContentSizeChange={() =>
                        flatListRef.current?.scrollToEnd({ animated: true })
                    }
                    onLayout={() =>
                        flatListRef.current?.scrollToEnd({ animated: false })
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Typing indicator */}
            {loading && (
                <View style={styles.typingContainer}>
                    <View style={styles.aiAvatar}>
                        <Ionicons name="sparkles" size={14} color="#89B4FA" />
                    </View>
                    <View style={styles.typingBubble}>
                        <ActivityIndicator size="small" color="#89B4FA" />
                        <Text style={styles.typingText}>Analyzing properties…</Text>
                    </View>
                </View>
            )}

            {/* Input bar */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Ask about housing in Davis…"
                    placeholderTextColor="#6C7086"
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    maxLength={500}
                    editable={!loading}
                    onSubmitEditing={handleSend}
                    blurOnSubmit={false}
                />
                <Pressable
                    style={({ pressed }) => [
                        styles.sendButton,
                        (!inputText.trim() || loading) && styles.sendButtonDisabled,
                        pressed && styles.sendButtonPressed,
                    ]}
                    onPress={handleSend}
                    disabled={!inputText.trim() || loading}
                >
                    <Ionicons
                        name="send"
                        size={18}
                        color={
                            inputText.trim() && !loading ? "#1E1E2E" : "#6C7086"
                        }
                    />
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1E1E2E",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#313244",
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "rgba(137, 180, 250, 0.1)",
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#CDD6F4",
    },
    headerSubtitle: {
        fontSize: 12,
        color: "#6C7086",
        marginTop: 1,
    },
    welcomeContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
        paddingBottom: 40,
    },
    welcomeIconContainer: {
        marginBottom: 16,
    },
    welcomeTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#CDD6F4",
        textAlign: "center",
        marginBottom: 8,
    },
    welcomeSubtitle: {
        fontSize: 14,
        color: "#6C7086",
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 32,
    },
    promptsContainer: {
        width: "100%",
        gap: 8,
    },
    promptsLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#6C7086",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    promptChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: "#313244",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: "#45475A",
    },
    promptChipPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
    promptText: {
        fontSize: 14,
        color: "#CDD6F4",
        flex: 1,
    },
    messageList: {
        flex: 1,
    },
    messageListContent: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 12,
    },
    bubbleRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 8,
    },
    bubbleRowUser: {
        justifyContent: "flex-end",
    },
    bubbleRowAssistant: {
        justifyContent: "flex-start",
    },
    avatarContainer: {
        marginBottom: 4,
    },
    aiAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "rgba(137, 180, 250, 0.1)",
        alignItems: "center",
        justifyContent: "center",
    },
    bubble: {
        maxWidth: "78%",
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    bubbleUser: {
        backgroundColor: "#89B4FA",
        borderBottomRightRadius: 4,
    },
    bubbleAssistant: {
        backgroundColor: "#313244",
        borderBottomLeftRadius: 4,
    },
    bubbleText: {
        fontSize: 15,
        lineHeight: 22,
    },
    bubbleTextUser: {
        color: "#1E1E2E",
    },
    bubbleTextAssistant: {
        color: "#CDD6F4",
    },
    timestamp: {
        fontSize: 10,
        color: "rgba(108, 112, 134, 0.7)",
        marginTop: 6,
        alignSelf: "flex-end",
    },
    typingContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    typingBubble: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#313244",
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    typingText: {
        fontSize: 13,
        color: "#6C7086",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: Platform.OS === "ios" ? 28 : 12,
        borderTopWidth: 1,
        borderTopColor: "#313244",
        backgroundColor: "#1E1E2E",
    },
    input: {
        flex: 1,
        backgroundColor: "#313244",
        borderRadius: 20,
        paddingHorizontal: 18,
        paddingVertical: 12,
        fontSize: 15,
        color: "#CDD6F4",
        maxHeight: 100,
        borderWidth: 1,
        borderColor: "#45475A",
    },
    sendButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#89B4FA",
        alignItems: "center",
        justifyContent: "center",
    },
    sendButtonDisabled: {
        backgroundColor: "#313244",
    },
    sendButtonPressed: {
        opacity: 0.85,
        transform: [{ scale: 0.95 }],
    },
});
