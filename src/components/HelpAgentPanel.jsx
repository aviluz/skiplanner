
import React, { useState, useEffect, useRef } from "react";
import { agentSDK } from "@/agents";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, Loader2, X, Plane, MountainSnow, Bed } from "lucide-react";
import MessageBubble from "@/components/agent/MessageBubble";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

const AGENT_NAME = "SkiPlanner";

const quickPrompts = [
    { text: "תכנון חופשה", icon: Plane, prompt: "אני רוצה לתכנן חופשת סקי. תוכל לעזור לי?" },
    { text: "ציוד", icon: MountainSnow, prompt: "מה הציוד שאני צריך לחופשת סקי?" },
    { text: "הזמנות", icon: Bed, prompt: "אני צריך עזרה עם הזמנת מלון לחופשה שלי." },
];

export default function HelpAgentPanel({ isOpen, onClose, user }) {
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const { toast } = useToast();
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);
    
    // Create or load a conversation when the panel opens and user is available
    useEffect(() => {
        if (isOpen && !conversation && user) { // Added 'user' to the condition
            const loadOrCreateConversation = async () => {
                try {
                    // Let's try to find an existing conversation first
                    const convs = await agentSDK.listConversations({ agent_name: AGENT_NAME });
                    if (convs.length > 0) {
                        const sortedConvs = convs.sort((a,b) => new Date(b.created_date) - new Date(a.created_date));
                        setConversation(sortedConvs[0]);
                        setMessages(sortedConvs[0].messages || []);
                    } else {
                        // If no conversation exists, create a new one
                        const newConversation = await agentSDK.createConversation({
                            agent_name: AGENT_NAME,
                            metadata: { name: `שיחת עזרה ${new Date().toLocaleString('he-IL')}` },
                        });
                        setConversation(newConversation);
                        setMessages(newConversation.messages || []);
                    }
                } catch (error) {
                    console.error("Error managing conversation:", error);
                    toast({ title: "שגיאה בטעינת הסוכן החכם", variant: "destructive" });
                }
            };
            loadOrCreateConversation();
        }
    }, [isOpen, conversation, toast, user]); // Added 'user' to the dependency array

    // Subscribe to conversation updates
    useEffect(() => {
        if (!conversation) return;

        const unsubscribe = agentSDK.subscribeToConversation(conversation.id, (data) => {
            setMessages(data.messages);
            if (data.status !== 'running') {
                setIsSending(false);
            }
        });

        return () => unsubscribe();
    }, [conversation]);

    const handleSendMessage = async (messageContent) => {
        const content = messageContent || input;
        if (!content.trim() || !conversation || isSending) return;

        const userMessage = { role: "user", content };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsSending(true);

        try {
            await agentSDK.addMessage(conversation, userMessage);
        } catch (error) {
            console.error("Error sending message:", error);
            toast({ title: "שגיאה בשליחת הודעה", variant: "destructive" });
            setIsSending(false);
            setMessages(prev => prev.slice(0, -1));
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div
            className={cn(
                "fixed bottom-0 left-0 h-[80vh] max-h-[600px] w-full max-w-[400px] bg-slate-50 border-r border-slate-200 shadow-2xl z-[100] transform transition-transform duration-300 ease-in-out",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}
            dir="rtl"
        >
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-white">
                    <div className="flex items-center gap-2">
                        <Bot className="w-6 h-6 text-blue-600" />
                        <h3 className="text-lg font-semibold text-slate-800">סוכן העזרה החכם</h3>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, index) => (
                        <MessageBubble key={index} message={msg} />
                    ))}
                    {isSending && messages[messages.length-1]?.role === 'user' && (
                         <div className="flex gap-3 justify-start">
                             <div className="h-8 w-8 rounded-lg bg-slate-200 flex items-center justify-center mt-0.5 shrink-0">
                                <Bot className="h-5 w-5 text-slate-600" />
                            </div>
                            <div className="rounded-2xl px-4 py-2.5 bg-white border border-slate-200 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-slate-500"/>
                                <span className="text-sm text-slate-600">חושב...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Prompts */}
                {messages.length <= 1 && (
                     <div className="p-4 border-t">
                        <p className="text-sm text-slate-500 mb-2 text-center">או בחרו נושא לשיחה:</p>
                        <div className="grid grid-cols-3 gap-2">
                            {quickPrompts.map(p => {
                                const Icon = p.icon;
                                return (
                                <Button key={p.text} variant="outline" className="flex-col h-16" onClick={() => handleSendMessage(p.prompt)}>
                                    <Icon className="w-5 h-5 mb-1" />
                                    <span className="text-xs">{p.text}</span>
                                </Button>
                            )})}
                        </div>
                    </div>
                )}

                {/* Input Area */}
                <div className="p-4 bg-white border-t">
                    <div className="relative">
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="כתבו שאלה כאן..."
                            className="pr-10 py-2 resize-none"
                            rows={1}
                            disabled={isSending}
                        />
                        <Button
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7"
                            onClick={() => handleSendMessage()}
                            disabled={!input.trim() || isSending}
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
