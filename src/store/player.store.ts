import { create } from "zustand";
import songs from "@/mocks/songs";
import { Playlist } from "@/types/playlist";
import { Song, SongMood } from "@/types/song";
import { audioEngine, clampProgress } from "@/services/audio.service";

type RepeatMode = "off" | "all" | "one";
type ThemeMode = "midnight" | "light" | "sunset";

export interface User {
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
    actionMessage: string;
    isLoadingWebSongs: boolean;
    webSongsError: string;
    user: User | null;
    playlists: Playlist[];
    playSong: (songId: string, queue?: string[]) => void;
    startWebSongsLoad: () => void;
    applyWebSongs: (webSongs: Song[]) => void;
    failWebSongsLoad: (message: string) => void;
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
    toggleLike: (songId: string) => void;
    dismissActionMessage: () => void;
    setAuthenticatedUser: (user: User | null) => void;
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

const announce = (message: string) => ({ actionMessage: message });

export const usePlayerStore = create<PlayerState>((set, get) => {
    const playAudio = (song: Song, volume = get().volume) => {
        audioEngine.play(song, volume, {
            onDurationChange: (duration) => {
                if (!Number.isFinite(duration) || duration <= 0) {
                    return;
                }

                set((state) => ({
                    songs: state.songs.map((item) =>
                        item.id === song.id ? { ...item, duration: Math.round(duration) } : item,
                    ),
                }));
            },
            onEnded: () => {
                const state = get();
                const endedSong = state.songs.find((item) => item.id === state.currentSongId);

                if (!endedSong) {
                    audioEngine.stop();
                    set({ isPlaying: false, progress: 0 });
                    return;
                }

                if (state.repeat === "one") {
                    set({ progress: 0, isPlaying: true });
                    playAudio(endedSong, state.volume);
                    return;
                }

                const nextSongId = getNextSongId(state, 1);
                const reachedEnd = nextSongId === state.currentSongId && state.repeat === "off";

                if (reachedEnd) {
                    audioEngine.stop();
                    set({ isPlaying: false, progress: 0, ...announce("Reached end of queue") });
                    return;
                }

                const nextSong = state.songs.find((item) => item.id === nextSongId);

                if (!nextSong) {
                    audioEngine.stop();
                    set({ isPlaying: false, progress: 0 });
                    return;
                }

                set({
                    currentSongId: nextSong.id,
                    progress: 0,
                    isPlaying: true,
                    ...announce(`Next: ${nextSong.title}`),
                });
                playAudio(nextSong, state.volume);
            },
            onError: (message) => set(announce(message)),
            onTimeUpdate: (time) => {
                const currentSong = get().songs.find((item) => item.id === song.id);

                if (get().currentSongId === song.id) {
                    set({ progress: clampProgress(time, currentSong?.duration ?? song.duration) });
                }
            },
        });
    };

    return {
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
    actionMessage: "",
    isLoadingWebSongs: false,
    webSongsError: "",
    user: null,
    playlists: demoPlaylists,
    startWebSongsLoad: () => {
        set({ isLoadingWebSongs: true, webSongsError: "", ...announce("Loading 500 free songs from Audius") });
    },
    applyWebSongs: (webSongs) =>
        set((state) => {
            const likedSongIds = new Set(state.songs.filter((song) => song.liked).map((song) => song.id));
            const nextWebSongs = webSongs.map((song) => ({
                ...song,
                liked: song.liked || likedSongIds.has(song.id),
            }));
            const localSongs = state.songs
                .filter((song) => !song.id.startsWith("audius-"))
                .map((song, index) => ({
                    ...song,
                    globalRank: nextWebSongs.length + index + 1,
                }));
            const nextSongs = [...nextWebSongs, ...localSongs];

            return {
                songs: nextSongs,
                queue: nextSongs.map((song) => song.id),
                currentSongId: webSongs[0]?.id ?? state.currentSongId,
                progress: 0,
                isPlaying: false,
                isLoadingWebSongs: false,
                webSongsError: "",
                ...announce(`Loaded ${webSongs.length} free Audius songs`),
            };
        }),
    failWebSongsLoad: (message) =>
        set({
            isLoadingWebSongs: false,
            webSongsError: message,
            ...announce("Could not load Audius songs. Using demo tracks."),
        }),
    playSong: (songId, queue) => {
        const song = get().songs.find((item) => item.id === songId);

        if (song) {
            playAudio(song);
        }

        set({
            currentSongId: songId,
            queue: queue ?? get().queue,
            progress: 0,
            isPlaying: true,
            ...announce(song ? `Playing ${song.title}` : "Playing selected song"),
        });
    },
    pause: () => {
        audioEngine.pause();
        set({ isPlaying: false, ...announce("Paused") });
    },
    resume: () => set((state) => {
        const song = state.songs.find((item) => item.id === state.currentSongId);

        if (song && state.progress === 0) {
            playAudio(song, state.volume);
        } else {
            audioEngine.resume();
        }

        return {
            isPlaying: true,
            ...announce(song ? `Resumed ${song.title}` : "Resumed"),
        };
    }),
    stop: () => {
        audioEngine.stop();
        set({ isPlaying: false, progress: 0, ...announce("Stopped playback") });
    },
    next: () => {
        const state = get();
        const nextSongId = getNextSongId(state, 1);
        const nextSong = state.songs.find((song) => song.id === nextSongId);
        const sameSong = nextSongId === state.currentSongId;
        const shouldPlay = nextSongId !== state.currentSongId || state.repeat === "all";

        if (nextSong && shouldPlay) {
            playAudio(nextSong, state.volume);
        }

        set({
            currentSongId: nextSongId,
            progress: 0,
            isPlaying: shouldPlay ? true : state.isPlaying,
            ...announce(sameSong ? "End of queue" : `Next: ${nextSong?.title ?? "song"}`),
        });
    },
    previous: () => {
        const state = get();
        const previousSongId = getNextSongId(state, -1);
        const previousSong = state.songs.find((song) => song.id === previousSongId);
        const sameSong = previousSongId === state.currentSongId;
        const shouldPlay = !sameSong || state.repeat === "all";

        if (previousSong && shouldPlay) {
            playAudio(previousSong, state.volume);
        }

        set({
            currentSongId: previousSongId,
            progress: 0,
            isPlaying: shouldPlay ? true : state.isPlaying,
            ...announce(sameSong ? "Start of queue" : `Previous: ${previousSong?.title ?? "song"}`),
        });
    },
    seek: (value) => {
        const song = get().songs.find((item) => item.id === get().currentSongId);
        const nextProgress = clampProgress(value, song?.duration ?? 0);

        audioEngine.seek(nextProgress);
        set({ progress: nextProgress, ...announce("Moved playback position") });
    },
    tick: () => {
        const state = get();
        const song = state.songs.find((item) => item.id === state.currentSongId);

        if (!state.isPlaying || !song) {
            return;
        }

        if (audioEngine.isNativeAudioActive()) {
            return;
        }

        const nextProgress = state.progress + 1;

        if (nextProgress < song.duration) {
            set({ progress: nextProgress });
            return;
        }

        if (state.repeat === "one") {
            playAudio(song, state.volume);
            set({ progress: 0, isPlaying: true });
            return;
        }

        const nextSongId = getNextSongId(state, 1);
        const nextSong = state.songs.find((item) => item.id === nextSongId);
        const reachedEnd = nextSongId === state.currentSongId && state.repeat === "off";

        if (nextSong && !reachedEnd) {
            playAudio(nextSong, state.volume);
        } else {
            audioEngine.stop();
        }

        set({
            currentSongId: nextSongId,
            progress: 0,
            isPlaying: !reachedEnd,
        });
    },
    setVolume: (volume) => {
        audioEngine.setVolume(volume);
        set({ volume, ...announce(`Volume ${volume}%`) });
    },
    toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle, ...announce(!state.shuffle ? "Shuffle on" : "Shuffle off") })),
    setRepeat: (repeat) => set({ repeat, ...announce(repeat === "off" ? "Repeat off" : repeat === "all" ? "Repeat all" : "Repeat one") }),
    setTheme: (theme) =>
        set({
            theme,
            ...announce(theme === "midnight" ? "Purple Blue theme applied" : `${theme[0].toUpperCase()}${theme.slice(1)} theme applied`),
        }),
    setMood: (mood) => {
        const filteredSongs = mood === "all" ? get().songs : get().songs.filter((song) => song.mood === mood);
        const currentSongStillVisible = filteredSongs.some((song) => song.id === get().currentSongId);

        set({
            mood,
            queue: filteredSongs.map((song) => song.id),
            currentSongId: currentSongStillVisible ? get().currentSongId : filteredSongs[0]?.id ?? get().currentSongId,
            progress: currentSongStillVisible ? get().progress : 0,
            ...announce(mood === "all" ? "Showing all moods" : `Mood changed to ${mood}`),
        });
    },
    toggleLyrics: () => set((state) => ({ lyricsOpen: !state.lyricsOpen, ...announce(!state.lyricsOpen ? "Lyrics opened" : "Lyrics hidden") })),
    toggleLike: (songId) =>
        set((state) => {
            const song = state.songs.find((item) => item.id === songId);

            return {
                songs: state.songs.map((item) =>
                    item.id === songId ? { ...item, liked: !item.liked } : item,
                ),
                ...announce(song?.liked ? "Removed from liked songs" : "Added to liked songs"),
            };
        }),
    dismissActionMessage: () => set({ actionMessage: "" }),
    setAuthenticatedUser: (user) =>
        set((state) => {
            if (!user && !state.user) {
                return { user: null };
            }

            if (user && state.user?.id === user.id && state.user.name === user.name) {
                return { user };
            }

            return {
                user,
                ...announce(user ? `Signed in as ${user.name}` : "Signed out. Private playlists are hidden."),
            };
        }),
    createPlaylist: (name, isPublic) => {
        const user = get().user;

        if (!user || !name.trim()) {
            set(announce(!user ? "Sign in to create playlists" : "Enter a playlist name"));
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
            ...announce(`Created ${name.trim()}`),
        }));
    },
    togglePlaylistVisibility: (playlistId) =>
        set((state) => {
            const playlist = state.playlists.find((item) => item.id === playlistId);

            if (!playlist || playlist.ownerId !== state.user?.id) {
                return announce("Only the playlist owner can change visibility");
            }

            return {
                playlists: state.playlists.map((item) =>
                    item.id === playlistId ? { ...item, isPublic: !item.isPublic } : item,
                ),
                ...announce("Playlist visibility updated"),
            };
        }),
    addSongToPlaylist: (playlistId, songId) =>
        set((state) => ({
            playlists: state.playlists.map((playlist) => {
                if (playlist.id !== playlistId || playlist.ownerId !== state.user?.id || playlist.songIds.includes(songId)) {
                    return playlist;
                }

                return { ...playlist, songIds: [...playlist.songIds, songId] };
            }),
            ...announce("Song added to playlist"),
        })),
    removeSongFromPlaylist: (playlistId, songId) =>
        set((state) => ({
            playlists: state.playlists.map((playlist) =>
                playlist.id === playlistId && playlist.ownerId === state.user?.id
                    ? { ...playlist, songIds: playlist.songIds.filter((id) => id !== songId) }
                    : playlist,
            ),
            ...announce("Song removed from playlist"),
        })),
    };
});
