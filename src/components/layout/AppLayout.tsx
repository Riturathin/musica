"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
    Eye,
    EyeOff,
    ListMusic,
    Lock,
    LogIn,
    LogOut,
    Music2,
    Palette,
    Play,
    Plus,
    Radio,
    Sparkles,
    Trash2,
    User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/services/audio.service";
import { usePlayerStore } from "@/store/player.store";
import { Playlist } from "@/types/playlist";
import { Song, SongMood } from "@/types/song";
import BottomPlayer from "./BottomPlayer";

const moodOptions: Array<{ value: SongMood | "all"; label: string }> = [
    { value: "all", label: "All" },
    { value: "focus", label: "Focus" },
    { value: "happy", label: "Happy" },
    { value: "chill", label: "Chill" },
    { value: "energy", label: "Energy" },
    { value: "romance", label: "Romance" },
];

const themeOptions = [
    { value: "midnight", label: "Midnight" },
    { value: "light", label: "Light" },
    { value: "sunset", label: "Sunset" },
] as const;

const artworkClassNames = [
    "from-emerald-400 via-cyan-500 to-slate-950",
    "from-sky-200 via-teal-300 to-zinc-800",
    "from-amber-300 via-rose-400 to-teal-800",
    "from-stone-200 via-lime-300 to-zinc-900",
    "from-rose-300 via-red-400 to-slate-900",
    "from-lime-300 via-emerald-400 to-cyan-900",
];

const AppLayout = () => {
    const {
        songs,
        currentSongId,
        isPlaying,
        theme,
        mood,
        lyricsOpen,
        user,
        playlists,
        playSong,
        tick,
        setTheme,
        setMood,
        toggleLyrics,
        signIn,
        signOut,
        createPlaylist,
        togglePlaylistVisibility,
        addSongToPlaylist,
        removeSongFromPlaylist,
    } = usePlayerStore();
    const [playlistName, setPlaylistName] = useState("");
    const [playlistPublic, setPlaylistPublic] = useState(true);

    const currentSong = songs.find((song) => song.id === currentSongId) ?? songs[0];
    const filteredSongs = mood === "all" ? songs : songs.filter((song) => song.mood === mood);
    const visiblePlaylists = playlists.filter((playlist) => playlist.isPublic || playlist.ownerId === user?.id);
    const ownPlaylists = playlists.filter((playlist) => playlist.ownerId === user?.id);
    const queue = filteredSongs.map((song) => song.id);

    const appClassName = useMemo(() => {
        const themeClass = {
            midnight: "theme-midnight",
            light: "theme-light",
            sunset: "theme-sunset",
        }[theme];

        return `music-app ${themeClass}`;
    }, [theme]);

    useEffect(() => {
        const interval = window.setInterval(() => tick(), 1000);

        return () => window.clearInterval(interval);
    }, [tick]);

    const handleCreatePlaylist = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        createPlaylist(playlistName, playlistPublic);
        setPlaylistName("");
    };

    return (
        <div className={appClassName}>
            <aside className="music-sidebar">
                <div className="brand-lockup">
                    <div className="brand-mark">
                        <Music2 />
                    </div>
                    <div>
                        <p className="eyebrow">Spotify clone</p>
                        <h1>Musica</h1>
                    </div>
                </div>

                <nav className="side-nav" aria-label="Main navigation">
                    <a href="#songs">
                        <Radio />
                        Discover
                    </a>
                    <a href="#playlists">
                        <ListMusic />
                        Playlists
                    </a>
                    <a href="#lyrics">
                        <Sparkles />
                        Lyrics
                    </a>
                </nav>

                <section className="side-section">
                    <div className="section-label">
                        <Palette />
                        Theme
                    </div>
                    <div className="segmented">
                        {themeOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={theme === option.value ? "active" : ""}
                                onClick={() => setTheme(option.value)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="side-section">
                    <div className="section-label">
                        <User />
                        Account
                    </div>
                    <div className="auth-panel">
                        <p>{user ? `Signed in as ${user.name}` : "Browsing as guest"}</p>
                        <Button type="button" variant="secondary" onClick={user ? signOut : signIn}>
                            {user ? <LogOut /> : <LogIn />}
                            {user ? "Sign out" : "Sign in"}
                        </Button>
                    </div>
                </section>
            </aside>

            <div className="music-shell">
                <header className="music-header">
                    <div>
                        <p className="eyebrow">Now playing</p>
                        <h2>{currentSong.title}</h2>
                        <p>{currentSong.artist.name} - {currentSong.album?.title}</p>
                    </div>
                    <Button type="button" onClick={() => playSong(currentSong.id, queue)}>
                        <Play />
                        {isPlaying ? "Playing" : "Play"}
                    </Button>
                </header>

                <main className="music-main">
                    <section className="hero-panel">
                        <Artwork song={currentSong} size="large" />
                        <div className="hero-copy">
                            <p className="eyebrow">{currentSong.mood} mood</p>
                            <h2>{currentSong.title}</h2>
                            <p>
                                {currentSong.artist.name} keeps the queue moving with {formatDuration(currentSong.duration)} of
                                immersive listening.
                            </p>
                            <div className="hero-actions">
                                <Button type="button" onClick={() => playSong(currentSong.id, queue)}>
                                    <Play />
                                    Play
                                </Button>
                                <Button type="button" variant="secondary" onClick={toggleLyrics}>
                                    {lyricsOpen ? <EyeOff /> : <Eye />}
                                    Lyrics
                                </Button>
                            </div>
                        </div>
                    </section>

                    <section id="songs" className="content-section">
                        <div className="section-heading">
                            <div>
                                <p className="eyebrow">Discover</p>
                                <h2>Change Mood</h2>
                            </div>
                            <div className="mood-row">
                                {moodOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        className={mood === option.value ? "active" : ""}
                                        onClick={() => setMood(option.value)}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="song-list">
                            {filteredSongs.map((song, index) => (
                                <SongRow
                                    key={song.id}
                                    song={song}
                                    index={index}
                                    active={song.id === currentSong.id}
                                    onPlay={() => playSong(song.id, queue)}
                                    playlists={ownPlaylists}
                                    onAdd={addSongToPlaylist}
                                    userSignedIn={Boolean(user)}
                                />
                            ))}
                        </div>
                    </section>

                    <section id="lyrics" className="content-section lyrics-section">
                        <div className="section-heading">
                            <div>
                                <p className="eyebrow">Lyrics</p>
                                <h2>{lyricsOpen ? currentSong.title : "Click Lyrics to View"}</h2>
                            </div>
                            <Button type="button" variant="secondary" onClick={toggleLyrics}>
                                {lyricsOpen ? <EyeOff /> : <Eye />}
                                {lyricsOpen ? "Hide" : "Show"}
                            </Button>
                        </div>
                        {lyricsOpen ? (
                            <div className="lyrics-lines">
                                {currentSong.lyrics.map((line) => (
                                    <p key={line}>{line}</p>
                                ))}
                            </div>
                        ) : (
                            <p className="muted-copy">Lyrics stay tucked away until the listener asks for them.</p>
                        )}
                    </section>

                    <section id="playlists" className="content-section">
                        <div className="section-heading">
                            <div>
                                <p className="eyebrow">Library</p>
                                <h2>Playlists</h2>
                            </div>
                            <p className="privacy-note">
                                Private playlists are visible only to their owner.
                            </p>
                        </div>

                        {user ? (
                            <form className="playlist-form" onSubmit={handleCreatePlaylist}>
                                <input
                                    value={playlistName}
                                    onChange={(event) => setPlaylistName(event.target.value)}
                                    placeholder="Create a playlist"
                                    aria-label="Playlist name"
                                />
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={playlistPublic}
                                        onChange={(event) => setPlaylistPublic(event.target.checked)}
                                    />
                                    Public
                                </label>
                                <Button type="submit">
                                    <Plus />
                                    Create
                                </Button>
                            </form>
                        ) : (
                            <p className="muted-copy">Sign in to create playlists and manage private libraries.</p>
                        )}

                        <div className="playlist-grid">
                            {visiblePlaylists.map((playlist) => {
                                const playlistSongs = playlist.songIds
                                    .map((songId) => songs.find((song) => song.id === songId))
                                    .filter((song): song is Song => Boolean(song));
                                const owned = playlist.ownerId === user?.id;

                                return (
                                    <article key={playlist.id} className="playlist-panel">
                                        <div className="playlist-topline">
                                            <div>
                                                <h3>{playlist.name}</h3>
                                                <p>By {playlist.ownerName} - {playlistSongs.length} songs</p>
                                            </div>
                                            <span className={playlist.isPublic ? "visibility public" : "visibility private"}>
                                                {playlist.isPublic ? <Eye /> : <Lock />}
                                                {playlist.isPublic ? "Public" : "Private"}
                                            </span>
                                        </div>
                                        {owned && (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={() => togglePlaylistVisibility(playlist.id)}
                                            >
                                                {playlist.isPublic ? <EyeOff /> : <Eye />}
                                                Make {playlist.isPublic ? "private" : "public"}
                                            </Button>
                                        )}
                                        <div className="playlist-songs">
                                            {playlistSongs.length ? (
                                                playlistSongs.map((song) => (
                                                    <div key={song.id} className="playlist-song-row">
                                                        <span>{song.title}</span>
                                                        {owned && (
                                                            <button
                                                                type="button"
                                                                aria-label={`Remove ${song.title}`}
                                                                onClick={() => removeSongFromPlaylist(playlist.id, song.id)}
                                                            >
                                                                <Trash2 />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="muted-copy">No songs yet.</p>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                </main>
            </div>

            <BottomPlayer />
        </div>
    );
};

interface ArtworkProps {
    song: Song;
    size?: "compact" | "large";
}

const Artwork = ({ song, size = "compact" }: ArtworkProps) => {
    const index = Number(song.id) - 1;

    return (
        <div className={`artwork ${size} bg-gradient-to-br ${artworkClassNames[index % artworkClassNames.length]}`}>
            <Music2 />
        </div>
    );
};

interface SongRowProps {
    song: Song;
    index: number;
    active: boolean;
    onPlay: () => void;
    playlists: Playlist[];
    onAdd: (playlistId: string, songId: string) => void;
    userSignedIn: boolean;
}

const SongRow = ({ song, index, active, onPlay, playlists, onAdd, userSignedIn }: SongRowProps) => {
    return (
        <article className={`song-row ${active ? "active" : ""}`}>
            <button type="button" className="song-play" onClick={onPlay} aria-label={`Play ${song.title}`}>
                <Play />
            </button>
            <Artwork song={song} />
            <div className="song-meta">
                <h3>{song.title}</h3>
                <p>{song.artist.name}</p>
            </div>
            <span className="song-mood">{song.mood}</span>
            <span>{formatDuration(song.duration)}</span>
            <span>{song.plays.toLocaleString()} plays</span>
            <select
                aria-label={`Add ${song.title} to playlist`}
                defaultValue=""
                disabled={!userSignedIn || playlists.length === 0}
                onChange={(event) => {
                    if (event.target.value) {
                        onAdd(event.target.value, song.id);
                        event.target.value = "";
                    }
                }}
            >
                <option value="">Add to playlist</option>
                {playlists.map((playlist) => (
                    <option key={playlist.id} value={playlist.id}>
                        {playlist.name}
                    </option>
                ))}
            </select>
            <span className="row-index">{String(index + 1).padStart(2, "0")}</span>
        </article>
    );
};

export default AppLayout;
