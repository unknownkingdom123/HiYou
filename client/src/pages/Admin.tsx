import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Upload, FileText, Users, Link2, Menu, LogOut, Plus, 
  Trash2, Pencil, Download, Search, X, Bot
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertPdfSchema, insertExternalLinkSchema } from "@shared/schema";
import type { Pdf, User, ExternalLink, DownloadWithPdf } from "@shared/schema";
import { z } from "zod";

type AdminTab = "upload" | "library" | "links" | "users";

const pdfFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  tags: z.string().optional(),
});

const linkFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Invalid URL"),
  description: z.string().optional(),
});

export default function Admin() {
  const [activeTab, setActiveTab] = useState<AdminTab>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingPdf, setEditingPdf] = useState<Pdf | null>(null);
  const [editingLink, setEditingLink] = useState<ExternalLink | null>(null);
  const [deletePdfId, setDeletePdfId] = useState<string | null>(null);
  const [deleteLinkId, setDeleteLinkId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [linksSearchQuery, setLinksSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { user, logout, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  // Queries
  const { data: pdfs, isLoading: pdfsLoading } = useQuery<Pdf[]>({
    queryKey: ["/api/admin/pdfs"],
    enabled: !!user?.isAdmin,
  });

  const { data: links, isLoading: linksLoading } = useQuery<ExternalLink[]>({
    queryKey: ["/api/admin/links"],
    enabled: !!user?.isAdmin,
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const token = localStorage.getItem("clgbooks-token");
      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
    enabled: !!user?.isAdmin,
  });

  const { data: userDownloads } = useQuery<DownloadWithPdf[]>({
    queryKey: ["/api/admin/users", selectedUser?.id, "downloads"],
    enabled: !!selectedUser,
  });

  // PDF Form
  const pdfForm = useForm<z.infer<typeof pdfFormSchema>>({
    resolver: zodResolver(pdfFormSchema),
    defaultValues: {
      title: "",
      author: "",
      category: "",
      description: "",
      tags: "",
    },
  });

  // Link Form
  const linkForm = useForm<z.infer<typeof linkFormSchema>>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: {
      title: "",
      url: "",
      description: "",
    },
  });

  // Mutations
  const uploadPdfMutation = useMutation({
    mutationFn: async (data: z.infer<typeof pdfFormSchema>) => {
      const formData = new FormData();
      if (selectedFile) {
        formData.append("file", selectedFile);
      }
      formData.append("title", data.title);
      if (data.author) formData.append("author", data.author);
      if (data.category) formData.append("category", data.category);
      if (data.description) formData.append("description", data.description);
      if (data.tags) formData.append("tags", data.tags);

      const token = localStorage.getItem("clgbooks-token");
      const response = await fetch("/api/admin/pdfs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pdfs"] });
      pdfForm.reset();
      setSelectedFile(null);
      toast({
        title: "Success",
        description: "PDF uploaded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Upload failed",
        variant: "destructive",
      });
    },
  });

  const updatePdfMutation = useMutation({
    mutationFn: async (data: { id: string; pdf: z.infer<typeof pdfFormSchema> }) => {
      return apiRequest("PATCH", `/api/admin/pdfs/${data.id}`, {
        ...data.pdf,
        tags: data.pdf.tags?.split(",").map((t) => t.trim()).filter(Boolean),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pdfs"] });
      setEditingPdf(null);
      pdfForm.reset();
      toast({
        title: "Success",
        description: "PDF updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Update failed",
        variant: "destructive",
      });
    },
  });

  const deletePdfMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/pdfs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pdfs"] });
      setDeletePdfId(null);
      toast({
        title: "Success",
        description: "PDF deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Delete failed",
        variant: "destructive",
      });
    },
  });

  const addLinkMutation = useMutation({
    mutationFn: async (data: z.infer<typeof linkFormSchema>) => {
      return apiRequest("POST", "/api/admin/links", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/links"] });
      linkForm.reset();
      toast({
        title: "Success",
        description: "Link added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add link",
        variant: "destructive",
      });
    },
  });

  const updateLinkMutation = useMutation({
    mutationFn: async (data: { id: string; link: z.infer<typeof linkFormSchema> }) => {
      return apiRequest("PATCH", `/api/admin/links/${data.id}`, data.link);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/links"] });
      setEditingLink(null);
      linkForm.reset();
      toast({
        title: "Success",
        description: "Link updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Update failed",
        variant: "destructive",
      });
    },
  });

  const deleteLinkMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/links/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/links"] });
      setDeleteLinkId(null);
      toast({
        title: "Success",
        description: "Link deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Delete failed",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredPdfs = pdfs?.filter((pdf) =>
    pdf.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pdf.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pdf.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users?.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user?.isAdmin) return null;

  const navItems = [
    { id: "upload", label: "Upload PDF", icon: Upload },
    { id: "library", label: "Manage Library", icon: FileText },
    { id: "links", label: "External Links", icon: Link2 },
    { id: "users", label: "Users", icon: Users },
  ];

  const NavContent = () => (
    <nav className="space-y-1 p-4">
      {navItems.map((item) => (
        <Button
          key={item.id}
          variant={activeTab === item.id ? "secondary" : "ghost"}
          className="w-full justify-start gap-3"
          onClick={() => {
            setActiveTab(item.id as AdminTab);
            setMobileMenuOpen(false);
          }}
          data-testid={`nav-${item.id}`}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Button>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" data-testid="button-mobile-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="p-4 border-b border-border">
                  <Logo size="sm" showLink={false} />
                </div>
                <NavContent />
              </SheetContent>
            </Sheet>
            <Logo size="md" />
            <Badge variant="secondary" className="hidden sm:inline-flex">Admin</Badge>
          </div>
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

      <div className="flex-1 flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 border-r border-border bg-card">
          <NavContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 max-w-6xl">
          {/* Upload PDF Tab */}
          {activeTab === "upload" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Upload PDF</h1>
                <p className="text-muted-foreground">Add new books to the library</p>
              </div>

              <Card>
                <CardContent className="p-6">
                  <Form {...pdfForm}>
                    <form onSubmit={pdfForm.handleSubmit((data) => uploadPdfMutation.mutate(data))} className="space-y-6">
                      {/* File Upload */}
                      <div className="border-2 border-dashed border-border rounded-lg p-4 sm:p-8 text-center">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          className="hidden"
                          id="pdf-upload"
                          data-testid="input-pdf-file"
                        />
                        <label
                          htmlFor="pdf-upload"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-lg font-medium mb-1">
                            {selectedFile ? selectedFile.name : "Click to upload PDF"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {selectedFile
                              ? formatFileSize(selectedFile.size)
                              : "PDF files only, max 50MB"}
                          </p>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={pdfForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title *</FormLabel>
                              <FormControl>
                                <Input placeholder="Book title" data-testid="input-title" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={pdfForm.control}
                          name="author"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Author</FormLabel>
                              <FormControl>
                                <Input placeholder="Author name" data-testid="input-author" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={pdfForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Physics, Programming" data-testid="input-category" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={pdfForm.control}
                          name="tags"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tags (comma-separated)</FormLabel>
                              <FormControl>
                                <Input placeholder="engineering, physics, notes" data-testid="input-tags" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={pdfForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Brief description of the book"
                                rows={3}
                                data-testid="input-description"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={!selectedFile || uploadPdfMutation.isPending}
                        data-testid="button-upload-pdf"
                      >
                        {uploadPdfMutation.isPending ? "Uploading..." : "Upload PDF"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Manage Library Tab */}
          {activeTab === "library" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">Manage Library</h1>
                  <p className="text-muted-foreground">{pdfs?.length || 0} PDFs in library</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search PDFs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-pdfs"
                  />
                </div>
              </div>

              {pdfsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-12 w-12 rounded-lg" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-1/2" />
                            <Skeleton className="h-4 w-1/3" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredPdfs && filteredPdfs.length > 0 ? (
                <div className="space-y-4">
                  {filteredPdfs.map((pdf) => (
                    <Card key={pdf.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold line-clamp-1">{pdf.title}</h3>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              {pdf.author && <span>{pdf.author}</span>}
                              {pdf.category && (
                                <Badge variant="outline" className="text-xs">{pdf.category}</Badge>
                              )}
                              <span className="font-mono">{formatFileSize(pdf.fileSize)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingPdf(pdf);
                                pdfForm.reset({
                                  title: pdf.title,
                                  author: pdf.author || "",
                                  category: pdf.category || "",
                                  description: pdf.description || "",
                                  tags: pdf.tags?.join(", ") || "",
                                });
                              }}
                              data-testid={`button-edit-pdf-${pdf.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletePdfId(pdf.id)}
                              data-testid={`button-delete-pdf-${pdf.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 sm:p-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No PDFs Found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery ? "No PDFs match your search" : "Upload your first PDF to get started"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* External Links Tab */}
          {activeTab === "links" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">External Links</h1>
                  <p className="text-muted-foreground">Add alternative book sources ({links?.length || 0} total)</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search links..."
                    value={linksSearchQuery}
                    onChange={(e) => setLinksSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-links"
                  />
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add New Link</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...linkForm}>
                    <form onSubmit={linkForm.handleSubmit((data) => addLinkMutation.mutate(data))} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={linkForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title *</FormLabel>
                              <FormControl>
                                <Input placeholder="Book title" data-testid="input-link-title" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={linkForm.control}
                          name="url"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL *</FormLabel>
                              <FormControl>
                                <Input placeholder="https://example.com/book" data-testid="input-link-url" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={linkForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Brief description"
                                rows={2}
                                data-testid="input-link-description"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit"
                        disabled={addLinkMutation.isPending}
                        data-testid="button-add-link"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {addLinkMutation.isPending ? "Adding..." : "Add Link"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {linksLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <Skeleton className="h-5 w-1/2 mb-2" />
                        <Skeleton className="h-4 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : links && links.length > 0 ? (
                <div className="space-y-4">
                  {links
                    .filter(
                      (link) =>
                        link.title.toLowerCase().includes(linksSearchQuery.toLowerCase()) ||
                        link.url.toLowerCase().includes(linksSearchQuery.toLowerCase()) ||
                        link.description?.toLowerCase().includes(linksSearchQuery.toLowerCase())
                    )
                    .map((link, index) => (
                    <Card key={link.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold line-clamp-1">{link.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-1 hover:line-clamp-none cursor-pointer" title={link.url}>
                              {link.url}
                            </p>
                            {link.description && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{link.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingLink(link);
                                linkForm.reset({
                                  title: link.title,
                                  url: link.url,
                                  description: link.description || "",
                                });
                              }}
                              data-testid={`button-edit-link-${link.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteLinkId(link.id)}
                              data-testid={`button-delete-link-${link.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 sm:p-12 text-center">
                    <Link2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No External Links</h3>
                    <p className="text-muted-foreground">Add external book sources for users</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">User Management</h1>
                  <p className="text-muted-foreground">{users?.length || 0} registered users</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-users"
                  />
                </div>
              </div>

              {usersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-1/3" />
                            <Skeleton className="h-4 w-1/2" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredUsers && filteredUsers.length > 0 ? (
                <div className="space-y-4">
                  {filteredUsers.map((u) => (
                    <Card key={u.id} className="hover-elevate cursor-pointer" onClick={() => setSelectedUser(u)}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {u.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{u.username}</h3>
                              {u.isAdmin && <Badge variant="secondary">Admin</Badge>}
                              {u.isVerified && (
                                <Badge variant="outline" className="text-green-500 border-green-500">Verified</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{u.email}</p>
                            <p className="text-sm font-mono text-muted-foreground">{u.mobile}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">{u.totalDownloads || 0}</p>
                            <p className="text-xs text-muted-foreground">Downloads</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 sm:p-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery ? "No users match your search" : "No users have registered yet"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Edit PDF Dialog */}
      <Dialog open={!!editingPdf} onOpenChange={() => setEditingPdf(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit PDF</DialogTitle>
            <DialogDescription>Update the PDF metadata</DialogDescription>
          </DialogHeader>
          <Form {...pdfForm}>
            <form 
              onSubmit={pdfForm.handleSubmit((data) => 
                editingPdf && updatePdfMutation.mutate({ id: editingPdf.id, pdf: data })
              )} 
              className="space-y-4"
            >
              <FormField
                control={pdfForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={pdfForm.control}
                name="author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Author</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={pdfForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={pdfForm.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingPdf(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updatePdfMutation.isPending}>
                  {updatePdfMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete PDF Confirmation */}
      <Dialog open={!!deletePdfId} onOpenChange={() => setDeletePdfId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete PDF</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this PDF? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePdfId(null)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => deletePdfId && deletePdfMutation.mutate(deletePdfId)}
              disabled={deletePdfMutation.isPending}
            >
              {deletePdfMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Link Dialog */}
      <Dialog open={!!editingLink} onOpenChange={() => setEditingLink(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Link</DialogTitle>
          </DialogHeader>
          <Form {...linkForm}>
            <form 
              onSubmit={linkForm.handleSubmit((data) => 
                editingLink && updateLinkMutation.mutate({ id: editingLink.id, link: data })
              )} 
              className="space-y-4"
            >
              <FormField
                control={linkForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={linkForm.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={linkForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingLink(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateLinkMutation.isPending}>
                  {updateLinkMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Link Confirmation */}
      <Dialog open={!!deleteLinkId} onOpenChange={() => setDeleteLinkId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Link</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this link? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteLinkId(null)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteLinkId && deleteLinkMutation.mutate(deleteLinkId)}
              disabled={deleteLinkMutation.isPending}
            >
              {deleteLinkMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {selectedUser.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.username}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <p className="text-sm font-mono text-muted-foreground">{selectedUser.mobile}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold">{selectedUser.totalDownloads || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Downloads</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold">{selectedUser.isVerified ? "Yes" : "No"}</p>
                    <p className="text-sm text-muted-foreground">Verified</p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Download History</h4>
                <ScrollArea className="h-48">
                  {userDownloads && userDownloads.length > 0 ? (
                    <div className="space-y-2">
                      {userDownloads.map((download) => (
                        <div key={download.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                          <FileText className="h-4 w-4 text-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-1">{download.pdf?.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {download.downloadedAt && new Date(download.downloadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No downloads yet</p>
                  )}
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
