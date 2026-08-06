import { Song, SongMood } from "@/types/song";

interface AudiusTrack {
    id: string;
    title: string;
    duration: number;
    genre?: string | null;
    mood?: string | null;
    play_count?: number | null;
    created_at?: string | null;
    release_date?: string | null;
    user?: {
        id?: string | number;
        name?: string;
        handle?: string;
        profile_picture?: Artwork;
    };
    artwork?: Artwork;
}

interface AudiusTracksResponse {
    data?: AudiusTrack[];
}

interface Artwork {
    "150x150"?: string;
    "480x480"?: string;
    "1000x1000"?: string;
}

const moodKeywords: Record<SongMood, string[]> = {
    chill: ["chill", "calm", "cool", "sleep", "ambient", "lofi"],
    energy: ["energy", "energetic", "hype", "trap", "bass", "dance", "workout"],
    focus: ["focus", "study", "deep", "instrumental", "minimal"],
    happy: ["happy", "fun", "upbeat", "pop", "summer"],
    romance: ["romance", "love", "r&b", "soul", "slow"],
};

const inferMood = (track: AudiusTrack): SongMood => {
    const text = `${track.mood ?? ""} ${track.genre ?? ""} ${track.title}`.toLowerCase();

    for (const [mood, keywords] of Object.entries(moodKeywords) as Array<[SongMood, string[]]>) {
        if (keywords.some((keyword) => text.includes(keyword))) {
            return mood;
        }
    }

    return "chill";
};

const getArtworkUrl = (artwork?: Artwork) => {
    return artwork?.["1000x1000"] ?? artwork?.["480x480"] ?? artwork?.["150x150"] ?? "";
};

export const WebMusicService = {
    async getAudiusTrending(limit = 12): Promise<Song[]> {
        const response = await fetch(`/api/music/audius/trending?limit=${limit}`, {
            cache: "no-store",
            headers: {
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            throw new Error("Could not load Audius tracks.");
        }

        const payload = (await response.json()) as AudiusTracksResponse;

        return (payload.data ?? []).map((track) => {
            const artistName = track.user?.name ?? track.user?.handle ?? "Audius Artist";
            const mood = inferMood(track);
            const artworkUrl = getArtworkUrl(track.artwork);

            return {
                id: `audius-${track.id}`,
                title: track.title,
                artist: {
                    id: String(track.user?.id ?? `artist-${track.id}`),
                    name: artistName,
                    avatarUrl: getArtworkUrl(track.user?.profile_picture),
                },
                album: {
                    id: `audius-album-${track.id}`,
                    title: track.genre ?? "Audius",
                    imageUrl: artworkUrl,
                    releaseYear: new Date(track.release_date ?? track.created_at ?? Date.now()).getFullYear(),
                },
                duration: track.duration,
                imageUrl: artworkUrl,
                audioUrl: `/api/audio/audius/${encodeURIComponent(track.id)}`,
                plays: track.play_count ?? 0,
                liked: false,
                mood,
                lyrics: [
                    "Lyrics are not provided by Audius for this track.",
                    "Streaming audio comes from the public Audius catalog.",
                ],
                createdAt: track.created_at ?? new Date().toISOString(),
            };
        });
    },
};
