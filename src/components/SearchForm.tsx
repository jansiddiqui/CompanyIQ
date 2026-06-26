"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowUpRight, Loader2 } from "lucide-react";

interface Suggestion {
  ticker: string;
  name: string;
  exchange?: string;
}

export function SearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch suggestions when query changes (debounced)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 1) {
      setSuggestions([]);
      setLoading(false);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/autocomplete?q=${encodeURIComponent(trimmedQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.results || []);
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Failed to fetch suggestions", err);
      } finally {
        setLoading(false);
      }
    }, 200); // 200ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  const handleSubmit = (tickerValue: string) => {
    const finalTicker = tickerValue.trim().toUpperCase();
    if (!finalTicker) return;
    setIsOpen(false);
    setIsNavigating(true);
    router.push(`/research/${finalTicker}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        handleSubmit(suggestions[activeIndex].ticker);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto">
      {/* Search Input Container */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isNavigating) return;
          if (activeIndex >= 0 && activeIndex < suggestions.length) {
            handleSubmit(suggestions[activeIndex].ticker);
          } else {
            handleSubmit(query);
          }
        }}
        className={`relative w-full flex items-center bg-card border border-border/60 rounded-full px-5 py-3.5 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-300 shadow-xl shadow-black/10 ${isNavigating ? "opacity-60 pointer-events-none" : ""}`}
      >
        <Search className="h-5 w-5 text-muted-foreground/45 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          disabled={isNavigating}
          autoFocus
          autoComplete="off"
          placeholder="Search any public company..."
          className="w-full pl-3 bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground/45 focus:outline-none"
          aria-label="Search public companies by ticker or name"
        />
        {(loading || isNavigating) && (
          <Loader2 className="h-4 w-4 text-muted-foreground/60 animate-spin shrink-0 ml-2" />
        )}
      </form>

      {/* Autocomplete Dropdown List */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 overflow-hidden rounded-2xl bg-secondary/95 backdrop-blur-md shadow-2xl shadow-black/50 border border-border/10 p-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
          <ul role="listbox" className="divide-y divide-border/10">
            {suggestions.map((item, index) => {
              const isActive = index === activeIndex;
              return (
                <li
                  key={item.ticker}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleSubmit(item.ticker)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex items-center justify-between px-5 py-3.5 cursor-pointer text-sm rounded-xl transition-all duration-150 active:scale-[0.99] ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "hover:bg-muted/30 text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded border ${
                        isActive 
                          ? "bg-primary/20 border-primary/45 text-primary" 
                          : "bg-muted border-border/80 text-muted-foreground"
                      }`}>
                        {item.ticker}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                        isActive
                          ? "bg-primary/10 border-primary/25 text-primary/80"
                          : "bg-muted/40 border-border/40 text-muted-foreground/60"
                      }`}>
                        {item.exchange || "NASDAQ"}
                      </span>
                    </div>
                    <span className="font-medium truncate max-w-[200px] sm:max-w-[280px] text-xs">
                      {item.name}
                    </span>
                  </div>
                  <ArrowUpRight className={`h-4 w-4 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground/35"
                  }`} />
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
