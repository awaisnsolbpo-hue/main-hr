import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface SearchButtonProps {
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const SearchButton = ({ 
  variant = "outline", 
  size = "default",
  className = ""
}: SearchButtonProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search query required",
        description: "Please enter a search term",
        variant: "destructive",
      });
      return;
    }

    navigate(`/search-candidates?q=${encodeURIComponent(searchQuery.trim())}`);
    setOpen(false);
    setSearchQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={`gap-2 ${className}`}
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Search Candidates</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, skills, or job title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 pr-10"
                autoFocus
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button onClick={handleSearch} className="gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SearchButton;

