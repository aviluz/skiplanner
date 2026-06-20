import React, { useState, useEffect, useRef } from "react";
import { agentSDK } from "@/agents";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Plus, Trash2, Bot, ArrowRight, Menu, X } from "lucide-react";
import MessageBubble from "@/components/agent/MessageBubble";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const AGENT_NAME = "SkiPlanner";

const LoginPrompt = ({ onLogin }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Bot className="w-16 h-16 text-blue-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">שיחה עם סוכן AI</h2>
        <p className="text-slate-600 mb-6 max-w-sm">
            כדי להתחיל שיחה עם סוכן ה-AI שלנו לתכנון חופשת הסקי שלך, עליך להתחבר לחשבון.
        </p>
        <Button onClick={onLogin}>
            <ArrowRight className="w-4 h-4 ml-2" />
            התחברות / הרשמה
        </Button>
    </div>
);

export default function AgentChat() {
    const [user, setUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [conversationToDelete, setConversationToDelete] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { toast } = useToast();
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        const checkUserAndLoad = async () => {
            try {
                const currentUser = await User.me();
                setUser(currentUser);
                const convs = await agentSDK.listConversations({ agent_name: AGENT_NAME });
                const sortedConvs = convs.sort((a,b) => new Date(b.created_date) - new Date(a.created_date));
                setConversations(sortedConvs);
                if (sortedConvs.length > 0) {
                    setActiveConversation(sortedConvs[0]);
                    setMessages(sortedConvs[0].messages || []);
                }
            } catch (error) {
                setUser(null);
                console.log("User not logged in or error loading conversations.");
            } finally {
                setLoading(false);
            }
        };
        checkUserAndLoad();
    }, []);

    useEffect(() => {
        if (!activeConversation) return;

        setMessages(activeConversation.messages || []);
        const unsubscribe = agentSDK.subscribeToConversation(activeConversation.id, (data) => {
            setMessages(data.messages);
            if (data.status !== 'running') {
                setIsSending(false);
            }
        });

        return () => unsubscribe();
    }, [activeConversation]);

    const handleSendMessage = async () => {
        if (!input.trim() || !activeConversation || isSending) return;

        const userMessage = { role: "user", content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsSending(true);

        try {
            await agentSDK.addMessage(activeConversation, userMessage);
        } catch (error) {
            console.error("Error sending message:", error);
            toast({ title: "שגיאה בשליחת הודעה", variant: "destructive" });
            setIsSending(false);
            setMessages(prev => prev.slice(0, -1));
        }
    };
    
    const handleLogin = async () => {
        try {
            await User.login();
            window.location.reload();
        } catch(e) {
            toast({ title: "התחברות נכשלה", description: "אנא נסה שוב.", variant: "destructive"})
        }
    }

    const handleNewConversation = async () => {
        try {
            const newConv = await agentSDK.createConversation({
                agent_name: AGENT_NAME,
                metadata: { name: `שיחה חדשה ${new Date().toLocaleString('he-IL')}` }
            });
            setConversations(prev => [newConv, ...prev]);
            setActiveConversation(newConv);
            setMessages([]);
            setIsSidebarOpen(false);
        } catch (error) {
            console.error("Error creating new conversation:", error);
            toast({ title: "שגיאה ביצירת שיחה חדשה", variant: "destructive" });
        }
    };

    const handleDeleteConversation = async () => {
        if (!conversationToDelete) return;
        try {
            await agentSDK.deleteConversation(conversationToDelete.id);
            
            const updatedConversations = conversations.filter(c => c.id !== conversationToDelete.id);
            setConversations(updatedConversations);

            if (activeConversation?.id === conversationToDelete.id) {
                if (updatedConversations.length > 0) {
                    setActiveConversation(updatedConversations[0]);
                } else {
                    setActiveConversation(null);
                    setMessages([]);
                }
            }
            toast({ title: "השיחה נמחקה בהצלחה" });
        } catch (error) {
            console.error("Error deleting conversation:", error);
            toast({ title: "שגיאה במחיקת השיחה", variant: "destructive" });
        } finally {
            setShowDeleteDialog(false);
            setConversationToDelete(null);
        }
    };

    const openDeleteDialog = (conv) => {
        setConversationToDelete(conv);
        setShowDeleteDialog(true);
    };

    const handleConversationSelect = (conv) => {
        setActiveConversation(conv);
        setIsSidebarOpen(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
        );
    }
    
    if (!user) {
        return <LoginPrompt onLogin={handleLogin} />;
    }

    return (
        <div className="flex h-[calc(100vh-80px)] relative" dir="rtl">
            {/* Desktop Sidebar */}
            <div className="hidden md:block w-1/4 bg-slate-100 border-l border-slate-200 flex-col">
                <div className="p-4 border-b">
                    <Button className="w-full" onClick={handleNewConversation}>
                        <Plus className="w-4 h-4 ml-2" />
                        שיחה חדשה
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.map(conv => (
                        <div
                            key={conv.id}
                            onClick={() => setActiveConversation(conv)}
                            className={cn(
                                "p-4 border-b cursor-pointer flex justify-between items-start",
                                activeConversation?.id === conv.id ? "bg-blue-100" : "hover:bg-slate-200"
                            )}
                        >
                            <div className="flex-1 overflow-hidden">
                                <p className="font-semibold text-slate-800 truncate">
                                    {conv.metadata?.name || `שיחה מ-${new Date(conv.created_date).toLocaleDateString()}`}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                    {conv.messages?.[conv.messages.length - 1]?.content || "אין הודעות"}
                                </p>
                            </div>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-slate-400 hover:text-red-500 shrink-0"
                                onClick={(e) => { e.stopPropagation(); openDeleteDialog(conv); }}
                             >
                                <Trash2 className="w-4 h-4"/>
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <>
                    <div 
                        className="md:hidden fixed inset-0 bg-black/50 z-40"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                    <div className="md:hidden fixed top-0 right-0 bottom-0 w-80 bg-white shadow-2xl z-50 flex flex-col">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-800">השיחות שלי</h2>
                            <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setIsSidebarOpen(false)}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                        <div className="p-4 border-b">
                            <Button className="w-full" onClick={handleNewConversation}>
                                <Plus className="w-4 h-4 ml-2" />
                                שיחה חדשה
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {conversations.map(conv => (
                                <div
                                    key={conv.id}
                                    onClick={() => handleConversationSelect(conv)}
                                    className={cn(
                                        "p-4 border-b cursor-pointer flex justify-between items-start",
                                        activeConversation?.id === conv.id ? "bg-blue-100" : "hover:bg-slate-200"
                                    )}
                                >
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-semibold text-slate-800 truncate">
                                            {conv.metadata?.name || `שיחה מ-${new Date(conv.created_date).toLocaleDateString()}`}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">
                                            {conv.messages?.[conv.messages.length - 1]?.content || "אין הודעות"}
                                        </p>
                                    </div>
                                     <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 text-slate-400 hover:text-red-500 shrink-0"
                                        onClick={(e) => { e.stopPropagation(); openDeleteDialog(conv); }}
                                     >
                                        <Trash2 className="w-4 h-4"/>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
                {activeConversation ? (
                    <>
                        {/* Header with mobile menu button */}
                        <div className="flex items-center gap-3 p-4 border-b bg-white md:hidden">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsSidebarOpen(true)}
                                className="shrink-0"
                            >
                                <Menu className="w-5 h-5" />
                            </Button>
                            <div className="flex-1">
                                <h2 className="font-semibold text-slate-800 truncate">
                                    {activeConversation.metadata?.name || "שיחה"}
                                </h2>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
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

                        <div className="p-4 bg-slate-50 border-t">
                            <div className="relative">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="כתבו שאלה על תכנון חופשת הסקי שלכם..."
                                    className="pr-12 py-6 text-base"
                                    disabled={isSending}
                                />
                                <Button
                                    size="icon"
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                    onClick={handleSendMessage}
                                    disabled={!input.trim() || isSending}
                                >
                                    <Send className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <Button
                            className="md:hidden mb-4"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu className="w-5 h-5 ml-2" />
                            פתח רשימת שיחות
                        </Button>
                        <Bot className="w-16 h-16 text-slate-400 mb-4" />
                        <h2 className="text-2xl font-bold text-slate-700">ברוכים הבאים לסוכן ה-AI</h2>
                        <p className="text-slate-500">בחרו שיחה קיימת או צרו אחת חדשה כדי להתחיל.</p>
                    </div>
                )}
            </div>
             <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>מחיקת שיחה</AlertDialogTitle>
                        <AlertDialogDescription>
                            האם אתה בטוח שברצונך למחוק את השיחה? פעולה זו אינה הפיכה.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConversation} className="bg-red-500 hover:bg-red-600">מחק</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}