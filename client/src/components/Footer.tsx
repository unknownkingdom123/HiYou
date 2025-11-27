import { Lightbulb } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border py-6">
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <span>Created By</span>
        <span className="font-semibold text-foreground">AVISHKAR</span>
        <Lightbulb className="h-4 w-4 text-yellow-500" />
        <span className="font-medium text-foreground">[ EE ]</span>
      </div>
    </footer>
  );
}
