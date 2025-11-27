import { FileText, Download, User, Tag, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Pdf } from "@shared/schema";

interface BookCardProps {
  pdf: Pdf;
  downloadDate?: Date;
  onDownload?: (pdf: Pdf) => void;
  showDownloadDate?: boolean;
}

export function BookCard({ pdf, downloadDate, onDownload, showDownloadDate = false }: BookCardProps) {
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  return (
    <Card className="overflow-visible hover-elevate transition-all duration-200">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg leading-tight line-clamp-2 mb-1" data-testid={`text-book-title-${pdf.id}`}>
              {pdf.title}
            </h3>
            {pdf.author && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                <User className="h-3.5 w-3.5" />
                <span>{pdf.author}</span>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {pdf.category && (
                <Badge variant="secondary" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {pdf.category}
                </Badge>
              )}
              <span className="text-xs font-mono text-muted-foreground">
                {formatFileSize(pdf.fileSize)}
              </span>
            </div>
            {showDownloadDate && downloadDate && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                <Calendar className="h-3 w-3" />
                <span>Downloaded {formatDate(downloadDate)}</span>
              </div>
            )}
            <Button
              onClick={() => onDownload?.(pdf)}
              className="w-full"
              size="sm"
              data-testid={`button-download-${pdf.id}`}
            >
              <Download className="h-4 w-4 mr-2" />
              {showDownloadDate ? "Download Again" : "Download"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
