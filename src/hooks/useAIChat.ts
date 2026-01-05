import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import type { AIMessage, AIConversation, AIChatResponse, UseAIChatReturn } from "@/types/ai";

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

export function useAIChat(): UseAIChatReturn {
    const { user, session } = useAuth();
    const [messages, setMessages] = useState<AIMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [conversations, setConversations] = useState<AIConversation[]>([]);

    // Load conversations for authenticated users
    const loadConversations = useCallback(async () => {
        if (!user) {
            setConversations([]);
            return;
        }

        const { data, error: fetchError } = await supabase.from("ai_conversations").select("*").eq("user_id", user.id).order("updated_at", { ascending: false });

        if (fetchError) {
            console.error("Error loading conversations:", fetchError);
            return;
        }

        setConversations((data as AIConversation[]) || []);
    }, [user]);

    // Load a specific conversation
    const loadConversation = useCallback(
        async (convId: string) => {
            if (!user) return;

            const { data, error: fetchError } = await supabase.from("ai_messages").select("*").eq("conversation_id", convId).order("created_at", { ascending: true });

            if (fetchError) {
                console.error("Error loading messages:", fetchError);
                setError("Gagal memuat percakapan");
                return;
            }

            setMessages((data as AIMessage[]) || []);
            setConversationId(convId);
            setError(null);
        },
        [user]
    );

    // Send a message
    const sendMessage = useCallback(
        async (message: string, imageBase64?: string) => {
            if (!message.trim() && !imageBase64) return;

            setIsLoading(true);
            setError(null);

            // Add user message to UI immediately
            const userMessage: AIMessage = {
                id: `temp-${Date.now()}`,
                role: "user",
                content: message,
                image_url: imageBase64 ? "image_attached" : null,
                created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, userMessage]);

            try {
                // Build history for context (last 10 messages)
                const history = messages.slice(-10).map((msg) => ({
                    role: msg.role as "user" | "assistant",
                    content: msg.content,
                    image_url: msg.image_url || undefined,
                }));

                // Call Edge Function
                const headers: Record<string, string> = {
                    "Content-Type": "application/json",
                };

                // Add auth header if logged in
                if (session?.access_token) {
                    headers["Authorization"] = `Bearer ${session.access_token}`;
                }

                const response = await fetch(EDGE_FUNCTION_URL, {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        message,
                        image_base64: imageBase64,
                        conversation_id: conversationId,
                        history,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Terjadi kesalahan");
                }

                const data: AIChatResponse = await response.json();

                // Add assistant message
                const assistantMessage: AIMessage = {
                    id: data.message_id || `temp-${Date.now()}-assistant`,
                    role: "assistant",
                    content: data.message,
                    created_at: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, assistantMessage]);

                // Update conversation ID if new conversation was created
                if (data.conversation_id && !conversationId) {
                    setConversationId(data.conversation_id);
                    // Refresh conversations list
                    if (user) {
                        loadConversations();
                    }
                }
            } catch (err) {
                console.error("Error sending message:", err);
                setError(err instanceof Error ? err.message : "Gagal mengirim pesan");
                // Remove the temp user message on error
                setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
            } finally {
                setIsLoading(false);
            }
        },
        [messages, conversationId, session, user, loadConversations]
    );

    // Clear chat
    const clearChat = useCallback(() => {
        setMessages([]);
        setConversationId(null);
        setError(null);
    }, []);

    // Create new conversation
    const createNewConversation = useCallback(() => {
        clearChat();
    }, [clearChat]);

    // Delete conversation
    const deleteConversation = useCallback(
        async (convId: string) => {
            if (!user) return;

            const { error: deleteError } = await supabase.from("ai_conversations").delete().eq("id", convId);

            if (deleteError) {
                console.error("Error deleting conversation:", deleteError);
                setError("Gagal menghapus percakapan");
                return;
            }

            // Clear current chat if deleted conversation was active
            if (convId === conversationId) {
                clearChat();
            }

            // Refresh conversations list
            loadConversations();
        },
        [user, conversationId, clearChat, loadConversations]
    );

    // Rename conversation
    const renameConversation = useCallback(
        async (convId: string, newTitle: string) => {
            if (!user || !newTitle.trim()) return;

            const { error: updateError } = await supabase.from("ai_conversations").update({ title: newTitle.trim(), updated_at: new Date().toISOString() }).eq("id", convId);

            if (updateError) {
                console.error("Error renaming conversation:", updateError);
                setError("Gagal mengubah nama percakapan");
                return;
            }

            // Refresh conversations list
            loadConversations();
        },
        [user, loadConversations]
    );

    // Load conversations on mount (for authenticated users)
    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    return {
        messages,
        isLoading,
        error,
        conversationId,
        conversations,
        sendMessage,
        clearChat,
        loadConversation,
        loadConversations,
        createNewConversation,
        deleteConversation,
        renameConversation,
    };
}
