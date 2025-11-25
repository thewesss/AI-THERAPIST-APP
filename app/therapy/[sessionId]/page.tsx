"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  PlusCircle,
  MessageSquare,
  Trophy,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BreathingGame } from "@/components/games/BreathingGame";
import { ZenGarden } from "@/components/games/ZenGarden";
import { ForestGame } from "@/components/games/ForestGame";
import { OceanWaves } from "@/components/games/OceanWaves";
import { Badge } from "@/components/ui/badge";
import {
  createChatSession,
  sendChatMessage,
  getChatHistory,
  ChatMessage,
  getAllChatSessions,
  ChatSession,
} from "@/lib/api/chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

// Types needed for the component
interface SuggestedQuestion {
  id: string;
  text: string;
}

interface StressPrompt {
  trigger: string;
  activity: {
    type: "breathing" | "garden" | "forest" | "waves";
    title: string;
    description: string;
  };
}

const SUGGESTED_QUESTIONS = [
  { text: "How can I manage my anxiety better?" },
  { text: "I've been feeling overwhelmed lately" },
  { text: "Can we talk about improving sleep?" },
  { text: "I need help with work-life balance" },
];

const glowAnimation = {
  initial: { opacity: 0.5, scale: 1 },
  animate: {
    opacity: [0.5, 1, 0.5],
    scale: [1, 1.05, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const COMPLETION_THRESHOLD = 5;

export default function TherapyPage() {
  const params = useParams();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Game & Stress State
  const [stressPrompt, setStressPrompt] = useState<StressPrompt | null>(null);
  const [showActivity, setShowActivity] = useState(false);
  const [isChatPaused, setIsChatPaused] = useState(false);
  const [showNFTCelebration, setShowNFTCelebration] = useState(false);
  const [isCompletingSession, setIsCompletingSession] = useState(false);
  
  const [sessionId, setSessionId] = useState<string | null>(
    params.sessionId as string
  );
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  const handleNewSession = async () => {
    try {
      setIsLoading(true);
      const newSessionId = await createChatSession();
      console.log("New session created:", newSessionId);

      const newSession: ChatSession = {
        sessionId: newSessionId,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setSessions((prev) => [newSession, ...prev]);
      setSessionId(newSessionId);
      setMessages([]);
      setStressPrompt(null);
      window.history.pushState({}, "", `/therapy/${newSessionId}`);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to create new session:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initChat = async () => {
      try {
        setIsLoading(true);
        if (!sessionId || sessionId === "new") {
          const newSessionId = await createChatSession();
          setSessionId(newSessionId);
          window.history.pushState({}, "", `/therapy/${newSessionId}`);
        } else {
          try {
            const history = await getChatHistory(sessionId);
            if (Array.isArray(history)) {
              const formattedHistory = history.map((msg) => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
              }));
              setMessages(formattedHistory);
            } else {
              setMessages([]);
            }
          } catch (historyError) {
            console.error("Error loading chat history:", historyError);
            setMessages([]);
          }
        }
      } catch (error) {
        console.error("Failed to initialize chat:", error);
        setMessages([
          {
            role: "assistant",
            content: "I apologize, but I'm having trouble loading the chat session.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    initChat();
  }, [sessionId]);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const allSessions = await getAllChatSessions();
        setSessions(allSessions);
      } catch (error) {
        console.error("Failed to load sessions:", error);
      }
    };
    loadSessions();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  useEffect(() => {
    if (!isTyping) {
      scrollToBottom();
    }
  }, [messages, isTyping, stressPrompt]);

  // Stress Detection Logic
  const detectStressSignals = (message: string): StressPrompt | null => {
    const stressKeywords = [
      "stress", "anxiety", "worried", "panic", "overwhelmed",
      "nervous", "tense", "pressure", "can't cope", "exhausted",
    ];

    const lowercaseMsg = message.toLowerCase();
    const foundKeyword = stressKeywords.find((keyword) =>
      lowercaseMsg.includes(keyword)
    );

    if (foundKeyword) {
      const activities = [
        {
          type: "breathing" as const,
          title: "Breathing Exercise",
          description: "Follow calming breathing exercises with visual guidance",
        },
        {
          type: "garden" as const,
          title: "Zen Garden",
          description: "Create and maintain your digital peaceful space",
        },
        {
          type: "forest" as const,
          title: "Mindful Forest",
          description: "Take a peaceful walk through a virtual forest",
        },
        {
          type: "waves" as const,
          title: "Ocean Waves",
          description: "Match your breath with gentle ocean waves",
        },
      ];

      return {
        trigger: foundKeyword,
        activity: activities[Math.floor(Math.random() * activities.length)],
      };
    }
    return null;
  };

  // ✅ CORE LOGIC: New isolated function to handle sending messages
  const processMessage = async (content: string) => {
    // Basic validation
    if (!content || isTyping || isChatPaused || !sessionId) return;

    // Clear UI Input immediately
    setMessage("");
    setIsTyping(true);

    try {
      // 1. Add User Message to UI
      const userMessage: ChatMessage = {
        role: "user",
        content: content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // 2. Check for Stress Signals
      const stressCheck = detectStressSignals(content);
      if (stressCheck) {
        setStressPrompt(stressCheck);
        setIsTyping(false);
        return; // Stop here if we trigger a game
      }

      // 3. Send to API
      const response = await sendChatMessage(sessionId, content);
      const aiResponse = typeof response === "string" ? JSON.parse(response) : response;

      // 4. Add AI Message to UI
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: aiResponse.response || aiResponse.message || "I'm here to support you.",
        timestamp: new Date(),
        metadata: {
          analysis: aiResponse.analysis,
          technique: aiResponse.metadata?.technique,
          goal: aiResponse.metadata?.currentGoal,
          progress: aiResponse.metadata?.progress,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
      scrollToBottom();
    } catch (error) {
      console.error("Error in chat:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I apologize, but I'm having trouble connecting right now.",
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    }
  };

  // ✅ Updated Form Handler: Uses processMessage
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentMessage = message.trim();
    await processMessage(currentMessage);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ Updated Suggestion Handler: Calls processMessage directly
  const handleSuggestedQuestion = async (text: string) => {
    let currentSessionId = sessionId;
    
    // Ensure we have a session ID
    if (!currentSessionId) {
      currentSessionId = await createChatSession();
      setSessionId(currentSessionId);
      router.push(`/therapy/${currentSessionId}`);
    }

    // Call logic directly with the text (bypassing state delay)
    await processMessage(text);
  };

  const handleCompleteSession = async () => {
    if (isCompletingSession) return;
    setIsCompletingSession(true);
    try {
      setShowNFTCelebration(true);
    } catch (error) {
      console.error("Error completing session:", error);
    } finally {
      setIsCompletingSession(false);
    }
  };

  const handleSessionSelect = async (selectedSessionId: string) => {
    if (selectedSessionId === sessionId) return;

    try {
      setIsLoading(true);
      const history = await getChatHistory(selectedSessionId);
      if (Array.isArray(history)) {
        const formattedHistory = history.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(formattedHistory);
        setSessionId(selectedSessionId);
        setStressPrompt(null);
        window.history.pushState({}, "", `/therapy/${selectedSessionId}`);
      }
    } catch (error) {
      console.error("Failed to load session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 top-16 z-50 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto h-full px-4 pb-4 pt-2">
        <div className="flex h-full gap-6">
          
          {/* Sidebar */}
          <div className="hidden md:flex w-80 flex-col h-full border rounded-xl bg-muted/30 overflow-hidden">
            {/* Header (Non-scrolling) */}
            <div className="p-4 border-b bg-background/50 flex-none">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Chat Sessions</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNewSession}
                  className="hover:bg-primary/10"
                  disabled={isLoading}
                >
                  <PlusCircle className="w-5 h-5" />
                </Button>
              </div>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={handleNewSession}
                disabled={isLoading}
              >
                <MessageSquare className="w-4 h-4" />
                New Session
              </Button>
            </div>

            {/* Scrollable List */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.sessionId}
                    className={cn(
                      "p-3 rounded-lg text-sm cursor-pointer hover:bg-primary/5 transition-colors border border-transparent",
                      session.sessionId === sessionId
                        ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
                        : "bg-background border-border/50"
                    )}
                    onClick={() => handleSessionSelect(session.sessionId)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-4 h-4 opacity-70" />
                      <span className="font-medium truncate">
                        {session.messages[0]?.content.slice(0, 30) || "New Chat"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>{session.messages.length} msgs</span>
                      <span>
                        {(() => {
                          try {
                            const date = new Date(session.updatedAt);
                            return isNaN(date.getTime())
                              ? "Now"
                              : formatDistanceToNow(date, { addSuffix: true });
                          } catch {
                            return "Now";
                          }
                        })()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Main chat area */}
          <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-background rounded-xl border shadow-sm relative">
            
            {/* NFT Celebration Overlay */}
            <AnimatePresence>
              {showNFTCelebration && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center"
                >
                  <motion.div
                    initial={{ scale: 0.8, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="text-center p-8 max-w-md"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="w-32 h-32 mx-auto mb-6 bg-gradient-to-tr from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center"
                    >
                      <Trophy className="w-16 h-16 text-white" />
                    </motion.div>
                    <h2 className="text-3xl font-bold mb-4">Session Completed!</h2>
                    <p className="text-muted-foreground mb-8">
                      Congratulations! You've taken a great step for your mental
                      well-being. A commemorative NFT badge has been added to your
                      profile.
                    </p>
                    <Button
                      size="lg"
                      onClick={() => setShowNFTCelebration(false)}
                      className="w-full"
                    >
                      Awesome!
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat header */}
            <div className="p-4 border-b flex items-center justify-between bg-background/95 backdrop-blur z-10 flex-none">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-semibold flex items-center gap-2">
                    AI Therapist
                    <Badge variant="secondary" className="text-[10px] h-5">
                      Beta
                    </Badge>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Always here to listen • {messages.length} messages
                  </p>
                </div>
              </div>
              
              {messages.length >= COMPLETION_THRESHOLD && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 hidden sm:flex"
                  onClick={handleCompleteSession}
                >
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  Complete Session
                </Button>
              )}
            </div>

            {/* Content Area */}
            {stressPrompt ? (
              <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
                <Card className="max-w-2xl w-full border-primary/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <span>I noticed you're feeling {stressPrompt.trigger}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setStressPrompt(null);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Let's take a moment to pause. Would you like to try this activity?
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-6 bg-muted/30 rounded-xl text-center space-y-4">
                      <h3 className="text-xl font-semibold">
                        {stressPrompt.activity.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {stressPrompt.activity.description}
                      </p>
                      
                      {!showActivity ? (
                        <div className="flex gap-3 justify-center pt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => setStressPrompt(null)}
                          >
                            No thanks, keep chatting
                          </Button>
                          <Button 
                            onClick={() => setShowActivity(true)}
                            className="gap-2"
                          >
                            <Sparkles className="w-4 h-4" />
                            Start Activity
                          </Button>
                        </div>
                      ) : (
                        <div className="pt-4 animate-in fade-in zoom-in duration-300">
                          {stressPrompt.activity.type === "breathing" && <BreathingGame />}
                          {stressPrompt.activity.type === "garden" && <ZenGarden />}
                          {stressPrompt.activity.type === "forest" && <ForestGame />}
                          {stressPrompt.activity.type === "waves" && <OceanWaves />}
                          
                          <Button 
                            variant="ghost" 
                            className="mt-6"
                            onClick={() => {
                              setShowActivity(false);
                              setStressPrompt(null);
                            }}
                          >
                            End Activity
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center bg-muted/5">
                <div className="max-w-xl w-full space-y-8">
                  <div className="text-center space-y-4">
                    <div className="relative inline-flex flex-col items-center">
                      <motion.div
                        className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"
                        initial="initial"
                        animate="animate"
                        variants={glowAnimation}
                      />
                      <div className="relative p-4 rounded-full bg-background border shadow-sm mb-4">
                        <Sparkles className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold">
                        How can I help you?
                      </h3>
                      <p className="text-muted-foreground max-w-md">
                        I'm your personal mental health companion. Pick a topic
                        below or start typing to begin.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {SUGGESTED_QUESTIONS.map((q, index) => (
                      <motion.div
                        key={q.text}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Button
                          variant="outline"
                          className="w-full h-auto py-4 px-6 justify-between hover:border-primary/50 hover:bg-primary/5 group"
                          onClick={() => handleSuggestedQuestion(q.text)}
                        >
                          <span className="text-left">{q.text}</span>
                          <Send className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto scroll-smooth p-4">
                <div className="max-w-3xl mx-auto space-y-6">
                  <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.timestamp.toISOString()}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "flex gap-4",
                          msg.role === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        {msg.role === "assistant" && (
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-1">
                            <Bot className="w-5 h-5" />
                          </div>
                        )}

                        <div
                          className={cn(
                            "max-w-[85%] px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-muted/50 border rounded-bl-sm"
                          )}
                        >
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>

                        {msg.role === "user" && (
                          <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shrink-0 mt-1">
                            <User className="w-5 h-5" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {isTyping && (
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                      <div className="bg-muted/50 px-4 py-3 rounded-2xl rounded-bl-sm">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
                          <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}

            {/* Input area - Always visible at bottom */}
            {!stressPrompt && (
              <div className="p-4 bg-background border-t flex-none">
                <div className="max-w-3xl mx-auto relative">
                  <form onSubmit={handleSubmit} className="relative">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={
                        isChatPaused
                          ? "Complete the activity to continue..."
                          : "Type your message..."
                      }
                      className={cn(
                        "w-full resize-none rounded-xl border bg-muted/30 px-4 py-3 pr-12",
                        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                        "min-h-[52px] max-h-[200px] transition-all"
                      )}
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                      disabled={isChatPaused}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className={cn(
                        "absolute right-2 bottom-2 h-9 w-9 transition-all",
                        message.trim()
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted"
                      )}
                      disabled={!message.trim() || isTyping || isChatPaused}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                  <div className="text-[10px] text-center text-muted-foreground mt-2">
                    AI can make mistakes. Please consult a professional for medical advice.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}