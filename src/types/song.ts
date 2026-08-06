import { Album } from "./album";
import { Artist } from "./artist";

export type SongMood = "focus" | "happy" | "chill" | "energy" | "romance";

export interface Song {
    id: string;
    title: string;
    artist: Artist;
    album?: Album;

    duration: number;

    imageUrl: string;
    audioUrl: string;

    plays: number;
    globalRank: number;

    liked: boolean;

    mood: SongMood;

    lyrics: string[];

    createdAt: string;
}
