import { create } from "zustand";
import songs from "@/mocks/songs";
import { Playlist } from "@/types/playlist";
import { Song, SongMood } from "@/types/song";
import { clampProgress } from "@/services/audio.service";

type RepeatMode = "off" | "all" | "one";
type ThemeMode = "midnight" | "light" | "sunset";

interface User {
    id: string;
    name: string;
}

interface PlayerState {
    songs: Song[];
    queue: string[];
    currentSongId: string;
    isPlaying: boolean;
    progress: number;
    volume: number;
    shuffle: boolean;
    repeat: RepeatMode;
    theme: ThemeMode;
    mood: SongMood | "all";
    lyricsOpen: boolean;
    user: User | null;
    playlists: Playlist[];
    playSong: (songId: string, queue?: string[]) => void;
    pause: () => void;
    resume: () => void;
    stop: () => void;
    next: () => void;
    previous: () => void;
    seek: (value: number) => void;
    tick: () => void;
    setVolume: (volume: number) => void;
    toggleShuffle: () => void;
    setRepeat: (repeat: RepeatMode) => void;
    setTheme: (theme: ThemeMode) => void;
    setMood: (mood: SongMood | "all") => void;
    toggleLyrics: () => void;
    signIn: () => void;
    signOut: () => void;
    createPlaylist: (name: string, isPublic: boolean) => void;
    togglePlaylistVisibility: (playlistId: string) => void;
    addSongToPlaylist: (playlistId: string, songId: string) => void;
    removeSongFromPlaylist: (playlistId: string, songId: string) => void;
}

const demoPlaylists: Playlist[] = [
    {
        id: "playlist-public",
        name: "Open Road Mix",
        ownerId: "demo-user",
        ownerName: "Ritu",
        isPublic: true,
        songIds: ["3", "6", "1"],
        createdAt: "2026-08-01T10:00:00.000Z",
    },
    {
        id: "playlist-private",
        name: "Late Night Drafts",
        ownerId: "demo-user",
        ownerName: "Ritu",
        isPublic: false,
        songIds: ["2", "4", "5"],
        createdAt: "2026-08-02T10:00:00.000Z",
    },
    {
        id: "playlist-friend",
        name: "Friends Can See This",
        ownerId: "friend-user",
        ownerName: "Asha",
        isPublic: true,
        songIds: ["1", "2", "5"],
        createdAt: "2026-08-03T10:00:00.000Z",
    },
    {
        id: "playlist-hidden",
        name: "Asha Private",
        ownerId: "friend-user",
        ownerName: "Asha",
        isPublic: false,
        songIds: ["4", "6"],
        createdAt: "2026-08-04T10:00:00.000Z",
    },
];

const demoUser = {
    id: "demo-user",
    name: "Ritu",
};

const getNextSongId = (state: PlayerState, direction: 1 | -1) => {
    const queue = state.queue.length ? state.queue : state.songs.map((song) => song.id);

    if (state.shuffle && direction === 1) {
        const choices = queue.filter((songId) => songId !== state.currentSongId);
        return choices[Math.floor(Math.random() * choices.length)] ?? state.currentSongId;
    }

    const currentIndex = queue.indexOf(state.currentSongId);
    const nextIndex = currentIndex + direction;

    if (nextIndex >= 0 && nextIndex < queue.length) {
        return queue[nextIndex];
    }

    if (state.repeat === "all") {
        return direction === 1 ? queue[0] : queue[queue.length - 1];
    }

    return state.currentSongId;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
    songs,
    queue: songs.map((song) => song.id),
    currentSongId: songs[0]?.id ?? "",
    isPlaying: false,
    progress: 0,
    volume: 80,
    shuffle: false,
    repeat: "off",
    theme: "midnight",
    mood: "all",
    lyricsOpen: false,
    user: demoUser,
    playlists: demoPlaylists,
    playSong: (songId, queue) =>
        set({
            currentSongId: songId,
            queue: queue ?? get().queue,
            progress: 0,
            isPlaying: true,
        }),
    pause: () => set({ isPlaying: false }),
    resume: () => set({ isPlaying: true }),
    stop: () => set({ isPlaying: false, progress: 0 }),
    next: () => {
        const state = get();
        const nextSongId = getNextSongId(state, 1);

        set({
            currentSongId: nextSongId,
            progress: 0,
            isPlaying: nextSongId !== state.currentSongId || state.repeat === "all" ? true : state.isPlaying,
        });
    },
    previous: () => {
        const state = get();
        const previousSongId = getNextSongId(state, -1);

        set({
            currentSongId: previousSongId,
            progress: 0,
            isPlaying: true,
        });
    },
    seek: (value) => {
        const song = get().songs.find((item) => item.id === get().currentSongId);

        set({ progress: clampProgress(value, song?.duration ?? 0) });
    },
    tick: () => {
        const state = get();
        const song = state.songs.find((item) => item.id === state.currentSongId);

        if (!state.isPlaying || !song) {
            return;
        }

        const nextProgress = state.progress + 1;

        if (nextProgress < song.duration) {
            set({ progress: nextProgress });
            return;
        }

        if (state.repeat === "one") {
            set({ progress: 0, isPlaying: true });
            return;
        }

        const nextSongId = getNextSongId(state, 1);
        const reachedEnd = nextSongId === state.currentSongId && state.repeat === "off";

        set({
            currentSongId: nextSongId,
            progress: 0,
            isPlaying: !reachedEnd,
        });
    },
    setVolume: (volume) => set({ volume }),
    toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),
    setRepeat: (repeat) => set({ repeat }),
    setTheme: (theme) => set({ theme }),
    setMood: (mood) => {
        const filteredSongs = mood === "all" ? get().songs : get().songs.filter((song) => song.mood === mood);

        set({
            mood,
            queue: filteredSongs.map((song) => song.id),
        });
    },
    toggleLyrics: () => set((state) => ({ lyricsOpen: !state.lyricsOpen })),
    signIn: () => set({ user: demoUser }),
    signOut: () => set({ user: null }),
    createPlaylist: (name, isPublic) => {
        const user = get().user;

        if (!user || !name.trim()) {
            return;
        }

        set((state) => ({
            playlists: [
                {
                    id: `playlist-${Date.now()}`,
                    name: name.trim(),
                    ownerId: user.id,
                    ownerName: user.name,
                    isPublic,
                    songIds: [],
                    createdAt: new Date().toISOString(),
                },
                ...state.playlists,
            ],
        }));
    },
    togglePlaylistVisibility: (playlistId) =>
        set((state) => ({
            playlists: state.playlists.map((playlist) =>
                playlist.id === playlistId ? { ...playlist, isPublic: !playlist.isPublic } : playlist,
            ),
        })),
    addSongToPlaylist: (playlistId, songId) =>
        set((state) => ({
            playlists: state.playlists.map((playlist) => {
                if (playlist.id !== playlistId || playlist.songIds.includes(songId)) {
                    return playlist;
                }

                return { ...playlist, songIds: [...playlist.songIds, songId] };
            }),
        })),
    removeSongFromPlaylist: (playlistId, songId) =>
        set((state) => ({
            playlists: state.playlists.map((playlist) =>
                playlist.id === playlistId
                    ? { ...playlist, songIds: playlist.songIds.filter((id) => id !== songId) }
                    : playlist,
            ),
        })),
}));
