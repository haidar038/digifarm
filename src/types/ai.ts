// AI Assistant Types

// Message role
export type AIMessageRole = "user" | "assistant" | "system";

// Single message in conversation
export interface AIMessage {
    id: string;
    conversation_id?: string;
    role: AIMessageRole;
    content: string;
    image_url?: string | null;
    created_at: string;
}

// Conversation metadata
export interface AIConversation {
    id: string;
    user_id: string;
    title: string;
    created_at: string;
    updated_at: string;
}

// Request to Edge Function
export interface AIChatRequest {
    message: string;
    image_base64?: string;
    conversation_id?: string;
    history?: AIMessage[];
}

// Response from Edge Function
export interface AIChatResponse {
    message: string;
    conversation_id?: string;
    message_id?: string;
}

// Groq API - Chat Completion Message
export interface GroqMessage {
    role: "user" | "assistant" | "system";
    content: string | GroqMessageContent[];
}

// Groq API - Message content for vision
export interface GroqMessageContent {
    type: "text" | "image_url";
    text?: string;
    image_url?: {
        url: string;
        detail?: "auto" | "low" | "high";
    };
}

// Groq API - Chat Completion Response
export interface GroqChatCompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: {
        index: number;
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }[];
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

// Hook state
export interface UseAIChatState {
    messages: AIMessage[];
    isLoading: boolean;
    error: string | null;
    conversationId: string | null;
}

// Hook return type
export interface UseAIChatReturn extends UseAIChatState {
    sendMessage: (message: string, imageBase64?: string) => Promise<void>;
    clearChat: () => void;
    loadConversation: (conversationId: string) => Promise<void>;
    conversations: AIConversation[];
    loadConversations: () => Promise<void>;
    createNewConversation: () => void;
    deleteConversation: (conversationId: string) => Promise<void>;
    renameConversation: (conversationId: string, newTitle: string) => Promise<void>;
}
