"use client";

import { FormEvent, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
    ArrowDownUp,
    Eye,
    EyeOff,
    Heart,
    ListMusic,
    Lock,
    Music2,
    Palette,
    Pause,
    Play,
    Plus,
    Radio,
    Search,
    Sparkles,
    Trash2,
    User,
    X,
} from "lucide-react";
import AuthControls from "@/components/auth/AuthControls";
import AuthPromptButton from "@/components/auth/AuthPromptButton";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/services/audio.service";
import { WebMusicService } from "@/services/web-music.service";
import FreeSongsLoader from "@/components/songs/FreeSongsLoader";
import SongCover from "@/components/songs/SongCover";
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
    { value: "midnight", label: "Purple Blue" },
    { value: "light", label: "Light" },
    { value: "sunset", label: "Sunset" },
] as const;

type SortKey = "title" | "globalRank" | "plays" | "duration";
type SortDirection = "asc" | "desc";

const sortOptions: Array<{ value: SortKey; label: string }> = [
    { value: "title", label: "Name" },
    { value: "globalRank", label: "Global Rank" },
    { value: "plays", label: "Times Played" },
    { value: "duration", label: "Time Length" },
];

const VIRTUAL_ROW_HEIGHT = 82;
const VIRTUAL_LIST_HEIGHT = 620;
const VIRTUAL_OVERSCAN = 6;
const GUEST_PREVIEW_LIMIT = 12;

const AppLayout = () => {
    const {
        songs,
        currentSongId,
        isPlaying,
        progress,
        theme,
        mood,
        lyricsOpen,
        actionMessage,
        isLoadingWebSongs,
        webSongsError,
        user,
        playlists,
        startWebSongsLoad,
        applyWebSongs,
        failWebSongsLoad,
        playSong,
        pause,
        resume,
        tick,
        setTheme,
        setMood,
        toggleLyrics,
        toggleLike,
        dismissActionMessage,
        createPlaylist,
        togglePlaylistVisibility,
        addSongToPlaylist,
        removeSongFromPlaylist,
    } = usePlayerStore();
    const [playlistName, setPlaylistName] = useState("");
    const [playlistPublic, setPlaylistPublic] = useState(true);
    const [sortKey, setSortKey] = useState<SortKey>("globalRank");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
    const [searchQuery, setSearchQuery] = useState("");
    const [catalogScrollTop, setCatalogScrollTop] = useState(0);
    const catalogViewportRef = useRef<HTMLDivElement>(null);

    const currentSong = songs.find((song) => song.id === currentSongId) ?? songs[0];
    const catalogUnlocked = Boolean(user);
    const deferredSearchQuery = useDeferredValue(searchQuery);
    const normalizedSearchQuery = deferredSearchQuery.trim().toLowerCase();
    const moodFilteredSongs = useMemo(
        () => (mood === "all" ? songs : songs.filter((song) => song.mood === mood)),
        [mood, songs],
    );
    const searchableSongs = useMemo(
        () => (catalogUnlocked ? moodFilteredSongs : moodFilteredSongs.slice(0, GUEST_PREVIEW_LIMIT)),
        [catalogUnlocked, moodFilteredSongs],
    );
    const filteredSongs = useMemo(() => {
        if (!normalizedSearchQuery) {
            return searchableSongs;
        }

        return searchableSongs.filter((song) => {
            const searchableText = [
                song.title,
                song.artist.name,
                song.album?.title ?? "",
                song.mood,
                `rank ${song.globalRank}`,
                `#${song.globalRank}`,
                `${song.plays} plays`,
                formatDuration(song.duration),
            ]
                .join(" ")
                .toLowerCase();

            return searchableText.includes(normalizedSearchQuery);
        });
    }, [normalizedSearchQuery, searchableSongs]);
    const sortedSongs = useMemo(() => {
        const direction = sortDirection === "asc" ? 1 : -1;

        return [...filteredSongs].sort((first, second) => {
            let comparison = 0;

            if (sortKey === "title") {
                comparison = first.title.localeCompare(second.title);
            } else if (sortKey === "globalRank") {
                comparison = first.globalRank - second.globalRank;
            } else if (sortKey === "plays") {
                comparison = first.plays - second.plays;
            } else {
                comparison = first.duration - second.duration;
            }

            const fallback = first.globalRank - second.globalRank || first.title.localeCompare(second.title);

            return (comparison || fallback) * direction;
        });
    }, [filteredSongs, sortDirection, sortKey]);
    const visiblePlaylists = playlists.filter((playlist) => playlist.isPublic || playlist.ownerId === user?.id);
    const ownPlaylists = playlists.filter((playlist) => playlist.ownerId === user?.id);
    const catalogSongs = sortedSongs;
    const catalogLocked = !catalogUnlocked && moodFilteredSongs.length > GUEST_PREVIEW_LIMIT;
    const lockedSongCount = Math.max(0, moodFilteredSongs.length - GUEST_PREVIEW_LIMIT);
    const catalogContentHeight = catalogSongs.length * VIRTUAL_ROW_HEIGHT;
    const catalogSpacerHeight = catalogContentHeight + (catalogLocked ? 190 : 0);
    const queue = catalogSongs.map((song) => song.id);
    const virtualStartIndex = Math.max(0, Math.floor(catalogScrollTop / VIRTUAL_ROW_HEIGHT) - VIRTUAL_OVERSCAN);
    const virtualVisibleCount = Math.ceil(VIRTUAL_LIST_HEIGHT / VIRTUAL_ROW_HEIGHT) + VIRTUAL_OVERSCAN * 2;
    const virtualEndIndex = Math.min(catalogSongs.length, virtualStartIndex + virtualVisibleCount);
    const visibleCatalogSongs = catalogSongs.slice(virtualStartIndex, virtualEndIndex);

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

    const loadFreeSongs = async () => {
        startWebSongsLoad();

        try {
            const webSongs = await WebMusicService.getAudiusTrending(500);

            if (!webSongs.length) {
                throw new Error("Audius returned no tracks.");
            }

            applyWebSongs(webSongs);
        } catch (error) {
            failWebSongsLoad(error instanceof Error ? error.message : "Could not load free songs.");
        }
    };

    useEffect(() => {
        if (!actionMessage) {
            return;
        }

        const timeout = window.setTimeout(() => dismissActionMessage(), 2400);

        return () => window.clearTimeout(timeout);
    }, [actionMessage, dismissActionMessage]);

    const handleCurrentPlayback = () => {
        if (isPlaying) {
            pause();
            return;
        }

        if (progress === 0) {
            playSong(currentSong.id, queue);
            return;
        }

        resume();
    };

    const currentPlaybackLabel = isPlaying ? "Pause" : progress > 0 ? "Resume" : "Play";

    const handleCreatePlaylist = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        createPlaylist(playlistName, playlistPublic);
        setPlaylistName("");
    };

    const resetCatalogScroll = () => {
        setCatalogScrollTop(0);

        if (catalogViewportRef.current) {
            catalogViewportRef.current.scrollTop = 0;
        }
    };

    const handleMoodChange = (nextMood: SongMood | "all") => {
        setMood(nextMood);
        resetCatalogScroll();
    };

    const handleSortChange = (nextSortKey: SortKey) => {
        setSortKey(nextSortKey);
        resetCatalogScroll();
    };

    const handleSearchChange = (nextSearchQuery: string) => {
        setSearchQuery(nextSearchQuery);
        resetCatalogScroll();
    };

    const clearSearch = () => {
        setSearchQuery("");
        resetCatalogScroll();
    };

    const toggleSortDirection = () => {
        setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
        resetCatalogScroll();
    };

    return (
        <div className={appClassName}>
            <FreeSongsLoader />
            <aside className="music-sidebar">
                <div className="brand-lockup">
                    <div className="brand-mark">
                        <Music2 />
                    </div>
                    <div>
                        <h1 className="eyebrow">Musica</h1>
                        {/* <h1>The Music App</h1> */}
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
                    <AuthControls />
                </section>

                <section className="side-section">
                    <div className="section-label">
                        <Radio />
                        Free API
                    </div>
                    <div className="auth-panel">
                        <p>{webSongsError || (isLoadingWebSongs ? "Loading 500 Audius songs..." : "Streaming 500 songs from Audius")}</p>
                        <Button type="button" variant="secondary" onClick={() => void loadFreeSongs()} disabled={isLoadingWebSongs}>
                            <Radio />
                            {isLoadingWebSongs ? "Loading" : "Reload songs"}
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
                    <Button type="button" onClick={handleCurrentPlayback}>
                        {isPlaying ? <Pause /> : <Play />}
                        {currentPlaybackLabel}
                    </Button>
                </header>

                <main className="music-main">
                    <section className="hero-panel">
                        <SongCover song={currentSong} size="large" />
                        <div className="hero-copy">
                            <p className="eyebrow">{currentSong.mood} mood</p>
                            <h2>{currentSong.title}</h2>
                            <p>
                                {currentSong.artist.name} keeps the queue moving with {formatDuration(currentSong.duration)} of
                                immersive listening.
                            </p>
                            <div className="hero-actions">
                                <Button type="button" onClick={handleCurrentPlayback}>
                                    {isPlaying ? <Pause /> : <Play />}
                                    {currentPlaybackLabel}
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
                                <h2>Catalog</h2>
                                <p className="muted-copy">
                                    {catalogUnlocked
                                        ? `${sortedSongs.length.toLocaleString()} songs`
                                        : `${catalogSongs.length.toLocaleString()} preview songs`}
                                </p>
                            </div>
                            <div className="catalog-toolbar">
                                <label className="search-control">
                                    <Search aria-hidden="true" />
                                    <input
                                        value={searchQuery}
                                        onChange={(event) => handleSearchChange(event.target.value)}
                                        placeholder="Search songs, artists, albums"
                                        aria-label="Search songs"
                                    />
                                    {searchQuery && (
                                        <button type="button" onClick={clearSearch} aria-label="Clear search" title="Clear search">
                                            <X />
                                        </button>
                                    )}
                                </label>
                                <div className="mood-row">
                                    {moodOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            className={mood === option.value ? "active" : ""}
                                            onClick={() => handleMoodChange(option.value)}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                                <label className="sort-control">
                                    <span>Sort</span>
                                    <select value={sortKey} onChange={(event) => handleSortChange(event.target.value as SortKey)}>
                                        {sortOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <button
                                    type="button"
                                    className="sort-direction"
                                    onClick={toggleSortDirection}
                                    aria-label={`Sort ${sortDirection === "asc" ? "descending" : "ascending"}`}
                                    title={`Sort ${sortDirection === "asc" ? "descending" : "ascending"}`}
                                >
                                    <ArrowDownUp />
                                    {sortDirection === "asc" ? "Asc" : "Desc"}
                                </button>
                            </div>
                        </div>

                        <div
                            ref={catalogViewportRef}
                            className="song-list-viewport"
                            onScroll={(event) => setCatalogScrollTop(event.currentTarget.scrollTop)}
                        >
                            {catalogSongs.length === 0 ? (
                                <div className="empty-catalog">
                                    <Search aria-hidden="true" />
                                    <h3>No songs found</h3>
                                    <p>
                                        {catalogUnlocked
                                            ? "Try another song, artist, album, or mood."
                                            : "Sign in to search the full catalog."}
                                    </p>
                                    {!catalogUnlocked && <AuthPromptButton />}
                                </div>
                            ) : (
                                <div className="song-list-spacer" style={{ height: catalogSpacerHeight }}>
                                    {visibleCatalogSongs.map((song, visibleIndex) => {
                                        const index = virtualStartIndex + visibleIndex;

                                        return (
                                            <div
                                                key={song.id}
                                                className="virtual-song-row"
                                                style={{ transform: `translateY(${index * VIRTUAL_ROW_HEIGHT}px)` }}
                                            >
                                                <SongRow
                                                    song={song}
                                                    active={song.id === currentSong.id}
                                                    playing={song.id === currentSong.id && isPlaying}
                                                    onPlay={() => {
                                                        if (song.id === currentSong.id && isPlaying) {
                                                            pause();
                                                            return;
                                                        }

                                                        playSong(song.id, queue);
                                                    }}
                                                    onToggleLike={() => toggleLike(song.id)}
                                                    playlists={ownPlaylists}
                                                    onAdd={addSongToPlaylist}
                                                    userSignedIn={Boolean(user)}
                                                />
                                            </div>
                                        );
                                    })}
                                    {catalogLocked && (
                                        <div
                                            className="catalog-auth-mask"
                                            style={{ transform: `translateY(${Math.max(0, catalogContentHeight - 72)}px)` }}
                                        >
                                            <div>
                                                <p className="eyebrow">Members only</p>
                                                <h3>Sign in to unlock the full catalog</h3>
                                                <p>
                                                    {lockedSongCount.toLocaleString()} more songs are waiting behind your library pass.
                                                </p>
                                            </div>
                                            <AuthPromptButton />
                                        </div>
                                    )}
                                </div>
                            )}
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
                                        <div className="playlist-actions">
                                            {playlistSongs.length > 0 && (
                                                <Button
                                                    type="button"
                                                    onClick={() => playSong(playlistSongs[0].id, playlist.songIds)}
                                                >
                                                    <Play />
                                                    Play playlist
                                                </Button>
                                            )}
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
                                        </div>
                                        <div className="playlist-songs">
                                            {playlistSongs.length ? (
                                                playlistSongs.map((song) => (
                                                    <div key={song.id} className="playlist-song-row">
                                                        <button
                                                            type="button"
                                                            className="playlist-track-button"
                                                            onClick={() => playSong(song.id, playlist.songIds)}
                                                        >
                                                            <Play />
                                                            <SongCover song={song} className="playlist-song-cover" />
                                                            <span>{song.title}</span>
                                                        </button>
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
            {actionMessage && (
                <button type="button" className="action-toast" onClick={dismissActionMessage}>
                    {actionMessage}
                </button>
            )}
        </div>
    );
};

interface SongRowProps {
    song: Song;
    active: boolean;
    playing: boolean;
    onPlay: () => void;
    onToggleLike: () => void;
    playlists: Playlist[];
    onAdd: (playlistId: string, songId: string) => void;
    userSignedIn: boolean;
}

const SongRow = ({ song, active, playing, onPlay, onToggleLike, playlists, onAdd, userSignedIn }: SongRowProps) => {
    return (
        <article className={`song-row ${active ? "active" : ""}`}>
            <button
                type="button"
                className={`like-button ${song.liked ? "liked" : ""}`}
                onClick={onToggleLike}
                aria-label={`${song.liked ? "Unlike" : "Like"} ${song.title}`}
                title={song.liked ? "Unlike" : "Like"}
            >
                <Heart fill={song.liked ? "currentColor" : "none"} />
            </button>
            <button type="button" className="song-play" onClick={onPlay} aria-label={`${playing ? "Pause" : "Play"} ${song.title}`}>
                {playing ? <Pause /> : <Play />}
                <span>{playing ? "Pause" : "Play"}</span>
            </button>
            <SongCover song={song} />
            <div className="song-meta">
                <h3>{song.title}</h3>
                <p>{song.artist.name}</p>
            </div>
            <span className="song-rank">#{song.globalRank.toLocaleString()}</span>
            <span className="song-mood">{song.mood}</span>
            <span className="song-duration">{formatDuration(song.duration)}</span>
            <span className="song-plays">{song.plays.toLocaleString()} plays</span>
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
        </article>
    );
};

export default AppLayout;
