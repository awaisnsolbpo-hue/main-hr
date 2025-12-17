import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { publicApi } from "@/services/api";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const SESSION_STORAGE_KEY = "chatbot_session_id";

// Generate a unique session ID
const generateSessionId = (): string => {
  return `chat_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

// Get or create session ID from localStorage
const getSessionId = (): string => {
  if (typeof window === "undefined") return generateSessionId();
  
  let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }
  return sessionId;
};

export const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>(getSessionId());
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm here to help you learn about our HR recruitment platform. You can ask me about our features, tests, or how to use the platform. How can I assist you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize session ID and get user ID on mount
  useEffect(() => {
    const savedSessionId = getSessionId();
    setSessionId(savedSessionId);

    // Get current user if authenticated
    const getCurrentUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserId(session.user.id);
        }
      } catch (error) {
        console.error("Error getting user session:", error);
      }
    };

    getCurrentUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        setUserId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = inputMessage.trim();
    setInputMessage("");
    setIsLoading(true);

    try {
      // Build conversation history from existing messages (excluding the welcome message)
      const conversationHistory = messages
        .slice(1) // Skip welcome message
        .map((msg) => ({
          role: msg.isUser ? ('user' as const) : ('assistant' as const),
          content: msg.text,
        }));

      // Add current user message to history
      conversationHistory.push({
        role: 'user',
        content: messageText,
      });

      // Call the backend chatbot API with session_id and user_id
      const data = await publicApi.sendChatMessage(messageText, conversationHistory, sessionId, userId);

      // Update session_id if returned from backend
      if (data.session_id && data.session_id !== sessionId) {
        setSessionId(data.session_id);
        if (typeof window !== "undefined") {
          localStorage.setItem(SESSION_STORAGE_KEY, data.session_id);
        }
      }

      // Extract response (handle both 'response' and 'message' fields)
      const botResponse = data.response || data.message || "I'm sorry, I couldn't process that request. Please try again.";

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse.trim(),
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      console.error("Error sending message to chatbot:", error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: error.message || "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-4 right-4 sm:bottom-6 sm:right-6 h-14 w-14 rounded-full shadow-lg z-50",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "transition-all duration-300 hover:scale-110",
          isOpen && "bg-destructive hover:bg-destructive/90"
        )}
        size="icon"
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 h-[500px] sm:h-[600px] max-h-[calc(100vh-6rem)] shadow-2xl z-50 flex flex-col border-2">
          <CardContent className="flex flex-col h-full p-0">
            {/* Header */}
            <div className="p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  <h3 className="font-semibold">AI Assistant</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs mt-1 opacity-90">
                Ask me about the platform features and tests
              </p>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.isUser ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-4 py-2",
                        message.isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.text}
                      </p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  size="icon"
                  className="shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default Chatbot;
