import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Send, Bot, User, FileText, Download, ExternalLink, ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { ChatMessage, Pdf, ExternalLink as ExtLink } from "@shared/schema";

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "bot",
      content: "Hello! I'm ClgBooksAI Bot. Ask me for any book or PDF you need, and I'll find it for you. For example, try asking: \"I need Engineering Physics book\" or \"Give me C programming notes\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("clgbooks-token");
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: input.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to get response");
      }

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: result.message,
        pdfResults: result.pdfs,
        externalLinks: result.externalLinks,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast({
        title: "Error",
        description: "Failed to process your request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (pdf: Pdf) => {
    try {
      const token = localStorage.getItem("clgbooks-token");
      const response = await fetch(`/api/pdfs/${pdf.id}/download`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Download failed");
      }

      // Trigger actual download
      window.open(`/api/pdfs/${pdf.id}/file`, "_blank");
      
      toast({
        title: "Download Started",
        description: `Downloading ${pdf.title}`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to download the file",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <Logo size="md" />
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 pb-24">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex gap-3 max-w-[85%] ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      message.role === "user"
                        ? "bg-primary"
                        : "bg-secondary"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="h-4 w-4 text-primary-foreground" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div className="space-y-3">
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-border"
                      }`}
                      data-testid={`message-${message.id}`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>

                    {/* PDF Results */}
                    {message.pdfResults && message.pdfResults.length > 0 && (
                      <div className="space-y-2">
                        {message.pdfResults.map((pdf, index) => (
                          <Card key={pdf.id} className="overflow-visible">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                  <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <h4 className="font-semibold text-sm line-clamp-1">
                                        {index === 0 && (
                                          <Badge variant="secondary" className="mr-2 text-xs">Best Match</Badge>
                                        )}
                                        {pdf.title}
                                      </h4>
                                      {pdf.author && (
                                        <p className="text-xs text-muted-foreground mt-0.5">{pdf.author}</p>
                                      )}
                                    </div>
                                    <span className="text-xs font-mono text-muted-foreground shrink-0">
                                      {formatFileSize(pdf.fileSize)}
                                    </span>
                                  </div>
                                  {pdf.category && (
                                    <Badge variant="outline" className="mt-2 text-xs">
                                      {pdf.category}
                                    </Badge>
                                  )}
                                  <Button
                                    onClick={() => handleDownload(pdf)}
                                    size="sm"
                                    className="w-full mt-3"
                                    data-testid={`button-download-${pdf.id}`}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* External Links */}
                    {message.externalLinks && message.externalLinks.length > 0 && (
                      <div className="space-y-2">
                        {message.externalLinks.map((link) => (
                          <Card key={link.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <ExternalLink className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm line-clamp-2">
                                    {link.title}
                                  </h4>
                                  {link.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                      {link.description}
                                    </p>
                                  )}
                                  <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline mt-2 inline-flex items-center gap-1"
                                    data-testid={`link-external-${link.id}`}
                                  >
                                    Open Link
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Single External Link (for compatibility) */}
                    {message.externalLink && (
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <ExternalLink className="h-5 w-5 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm">{message.externalLink.title}</h4>
                              {message.externalLink.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {message.externalLink.description}
                                </p>
                              )}
                              <a
                                href={message.externalLink.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline mt-2 inline-block"
                                data-testid="link-external"
                              >
                                Open Link
                              </a>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl px-4 py-3 bg-card border border-border">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur p-4">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Ask for a book or PDF..."
              className="flex-1 rounded-full px-6"
              disabled={isLoading}
              data-testid="input-chat"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="rounded-full shrink-0"
              data-testid="button-send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
