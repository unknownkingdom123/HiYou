import { Link } from "wouter";
import { Bot, BookOpen, Search, Download, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user } = useAuth();

  const features = [
    {
      icon: Search,
      title: "AI-Powered Search",
      description: "Find any book or PDF using natural language. Our AI understands what you're looking for.",
    },
    {
      icon: BookOpen,
      title: "Vast Library",
      description: "Access a comprehensive collection of educational PDFs and books for your studies.",
    },
    {
      icon: Download,
      title: "Easy Downloads",
      description: "Download PDFs instantly and keep track of your download history.",
    },
    {
      icon: Shield,
      title: "Secure Access",
      description: "Your account and downloads are protected with secure authentication.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Logo size="md" showLink={false} />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Link href={user.isAdmin ? "/admin" : "/dashboard"}>
                <Button data-testid="button-dashboard">
                  <Users className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" data-testid="button-login">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button data-testid="button-signup">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary mb-6">
              <Bot className="h-10 w-10 text-primary-foreground" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Your Intelligent
              <span className="text-primary"> College Library</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl">
              ClgBooksAI Bot helps you find and download educational PDFs instantly. 
              Just ask for what you need, and our AI will find the best matches for you.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              {user ? (
                <Link href="/chat">
                  <Button size="lg" data-testid="button-start-chat">
                    <Bot className="h-5 w-5 mr-2" />
                    Start Chatting
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/signup">
                    <Button size="lg" data-testid="button-hero-signup">
                      Get Started Free
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline" data-testid="button-hero-login">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Everything You Need
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover-elevate">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Ready to Find Your Books?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Join thousands of students who use ClgBooksAI Bot to find and download their study materials.
              </p>
              {!user && (
                <Link href="/signup">
                  <Button size="lg" data-testid="button-cta-signup">
                    Create Free Account
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}
