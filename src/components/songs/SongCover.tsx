"use client";

import { useState } from "react";
import { Music2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Song } from "@/types/song";

const fallbackClassNames = [
    "from-emerald-400 via-cyan-500 to-slate-950",
    "from-sky-200 via-teal-300 to-zinc-800",
    "from-amber-300 via-rose-400 to-teal-800",
    "from-stone-200 via-lime-300 to-zinc-900",
    "from-rose-300 via-red-400 to-slate-900",
    "from-lime-300 via-emerald-400 to-cyan-900",
];

interface SongCoverProps {
    song?: Song;
    size?: "compact" | "large";
    className?: string;
}

const SongCover = ({ song, size = "compact", className }: SongCoverProps) => {
    const rawCoverUrl = song?.imageUrl || song?.album?.imageUrl || "";
    const [failedCoverUrl, setFailedCoverUrl] = useState("");
    const showCover = Boolean(rawCoverUrl && rawCoverUrl !== failedCoverUrl);
    const seed = song?.id ?? "fallback";
    const index = [...seed].reduce((total, character) => total + character.charCodeAt(0), 0);

    return (
        <div
            className={cn(
                "artwork bg-gradient-to-br",
                size,
                fallbackClassNames[index % fallbackClassNames.length],
                showCover && "has-cover",
                className,
            )}
        >
            {showCover ? (
                <img
                    src={rawCoverUrl}
                    alt={`${song?.title ?? "Song"} cover art`}
                    loading={size === "large" ? "eager" : "lazy"}
                    onError={() => setFailedCoverUrl(rawCoverUrl)}
                />
            ) : (
                <Music2 />
            )}
        </div>
    );
};

export default SongCover;
