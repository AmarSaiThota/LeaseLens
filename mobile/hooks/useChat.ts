import { useCallback, useRef, useState } from "react";
import { ChatMessage } from "../types/property";
import { sendMessageToAgent } from "../lib/aiAgent";

interface UseChatResult {
    messages: ChatMessage[];
    loading: boolean;
    error: string | null;
    sendMessage: (text: string) => Promise<void>;
    clearError: () => void;
}

let messageCounter = 0;

function createMessage(
    role: ChatMessage["role"],
    content: string
): ChatMessage {
    messageCounter += 1;
    return {
        id: `${Date.now()}-${messageCounter}`,
        role,
        content,
        timestamp: Date.now(),
    };
}

/**
 * Hook managing the AI chat state and message flow.
 * Maintains conversation history and sends it to the Gemini agent.
 */
export function useChat(): UseChatResult {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Keep a ref to the latest messages for building history
    const messagesRef = useRef<ChatMessage[]>([]);
    messagesRef.current = messages;

    const sendMessage = useCallback(async (text: string): Promise<void> => {
        const trimmed = text.trim();
        if (!trimmed || loading) return;

        const userMessage = createMessage("user", trimmed);
        setMessages((prev) => [...prev, userMessage]);
        setLoading(true);
        setError(null);

        try {
            // Build conversation history from existing messages (skip system)
            const history = messagesRef.current
                .filter((m) => m.role !== "system")
                .map((m) => ({ role: m.role, content: m.content }));

            const responseText = await sendMessageToAgent(trimmed, history);
            const assistantMessage = createMessage("assistant", responseText);
            setMessages((prev) => [...prev, assistantMessage]);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Failed to get a response";
            setError(errorMessage);

            // Add an error indicator message
            const errorMsg = createMessage(
                "assistant",
                "⚠️ Sorry, I couldn't process your request. Please try again."
            );
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    }, [loading]);

    const clearError = useCallback(() => setError(null), []);

    return { messages, loading, error, sendMessage, clearError };
}
