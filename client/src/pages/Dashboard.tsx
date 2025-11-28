import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Bot, Download, FileText, User, LogOut, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";
import { BookCard } from "@/components/BookCard";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { DownloadWithPdf, Pdf } from "@shared/schema";

export default function Dashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  const { data: downloads, isLoading: downloadsLoading } = useQuery<DownloadWithPdf[]>({
    queryKey: ["/api/downloads"],
    enabled: !!user,
  });

  const handleDownload = async (pdf: Pdf) => {
    try {
      const token = localStorage.getItem("clgbooks-token");
      
      // Record download
      const recordResponse = await fetch(`/api/pdfs/${pdf.id}/download`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!recordResponse.ok) {
        throw new Error("Download failed");
      }

      // Fetch file with auth header
      const fileResponse = await fetch(`/api/pdfs/${pdf.id}/file`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!fileResponse.ok) {
        throw new Error("File download failed");
      }

      // Create blob and download
      const blob = await fileResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${pdf.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  const stats = [
    {
      icon: Download,
      label: "Total Downloads",
      value: user.totalDownloads || 0,
    },
    {
      icon: FileText,
      label: "PDFs Available",
      value: "100+",
    },
    {
      icon: BookOpen,
      label: "Categories",
      value: "15+",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <Link href="/chat">
              <Button data-testid="button-open-chat">
                <Bot className="h-4 w-4 mr-2" />
                Ask Bot
              </Button>
            </Link>
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

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Profile Section */}
        <section className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl font-bold mb-1" data-testid="text-username">
                    Welcome, {user.username}
                  </h1>
                  <p className="text-muted-foreground mb-1" data-testid="text-email">
                    {user.email}
                  </p>
                  <p className="text-sm font-mono text-muted-foreground" data-testid="text-mobile">
                    {user.mobile}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Stats Section */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <stat.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold" data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
                        {stat.value}
                      </p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Previous Downloads Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Previous Downloads</h2>
            <Link href="/chat">
              <Button variant="outline" size="sm" data-testid="button-find-more">
                Find More Books
              </Button>
            </Link>
          </div>

          {downloadsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-14 w-14 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : downloads && downloads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {downloads.map((download) => (
                <BookCard
                  key={download.id}
                  pdf={download.pdf}
                  downloadDate={download.downloadedAt ? new Date(download.downloadedAt) : undefined}
                  onDownload={handleDownload}
                  showDownloadDate
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 sm:p-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Downloads Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start exploring our library by chatting with the AI bot
                </p>
                <Link href="/chat">
                  <Button data-testid="button-start-exploring">
                    <Bot className="h-4 w-4 mr-2" />
                    Start Exploring
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
