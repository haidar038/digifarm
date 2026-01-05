import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-toast";

interface ArticleSearchProps {
    onSearch: (query: string) => void;
    placeholder?: string;
    initialValue?: string;
}

// Simple debounce hook
function useSearchDebounce(value: string, delay: number = 300) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

export function ArticleSearch({ onSearch, placeholder = "Cari artikel...", initialValue = "" }: ArticleSearchProps) {
    const [query, setQuery] = useState(initialValue);
    const debouncedQuery = useSearchDebounce(query, 300);

    useEffect(() => {
        onSearch(debouncedQuery);
    }, [debouncedQuery, onSearch]);

    const handleClear = () => {
        setQuery("");
    };

    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="text" placeholder={placeholder} value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9 pr-9" />
            {query && (
                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={handleClear}>
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
