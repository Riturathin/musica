"use client";

import { CSSProperties } from "react";
import {
    Pause,
    Play,
    Repeat,
    Repeat1,
    Shuffle,
    SkipBack,
    SkipForward,
    Square,
    Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/services/audio.service";
import { usePlayerStore } from "@/store/player.store";

const BottomPlayer = () => {
    const {
        songs,
        currentSongId,
        isPlaying,
        progress,
        volume,
        shuffle,
        repeat,
        pause,
        resume,
        stop,
        next,
        previous,
        seek,
        setVolume,
        toggleShuffle,
        setRepeat,
    } = usePlayerStore();
    const currentSong = songs.find((song) => song.id === currentSongId) ?? songs[0];
    const progressPercent = currentSong ? (progress / currentSong.duration) * 100 : 0;

    return (
        <footer className="bottom-player">
            <div className="mini-song">
                <div className="mini-art">
                    <Volume2 />
                </div>
                <div>
                    <h3>{currentSong?.title}</h3>
                    <p>{currentSong?.artist.name}</p>
                </div>
            </div>

            <div className="transport">
                <div className="transport-buttons">
                    <Button
                        type="button"
                        variant={shuffle ? "default" : "secondary"}
                        size="icon"
                        onClick={toggleShuffle}
                        aria-label="Shuffle"
                        title="Shuffle"
                    >
                        <Shuffle />
                    </Button>
                    <Button type="button" variant="secondary" size="icon" onClick={previous} aria-label="Previous" title="Previous">
                        <SkipBack />
                    </Button>
                    <Button
                        type="button"
                        size="icon-lg"
                        onClick={isPlaying ? pause : resume}
                        aria-label={isPlaying ? "Pause" : "Resume"}
                        title={isPlaying ? "Pause" : "Resume"}
                    >
                        {isPlaying ? <Pause /> : <Play />}
                    </Button>
                    <Button type="button" variant="secondary" size="icon" onClick={stop} aria-label="Stop" title="Stop">
                        <Square />
                    </Button>
                    <Button type="button" variant="secondary" size="icon" onClick={next} aria-label="Next" title="Next">
                        <SkipForward />
                    </Button>
                    <Button
                        type="button"
                        variant={repeat === "off" ? "secondary" : "default"}
                        size="icon"
                        onClick={() => setRepeat(repeat === "off" ? "all" : repeat === "all" ? "one" : "off")}
                        aria-label={`Repeat ${repeat}`}
                        title={`Repeat ${repeat}`}
                    >
                        {repeat === "one" ? <Repeat1 /> : <Repeat />}
                    </Button>
                </div>
                <div className="progress-line">
                    <span>{formatDuration(progress)}</span>
                    <input
                        type="range"
                        min="0"
                        max={currentSong?.duration ?? 0}
                        value={progress}
                        onChange={(event) => seek(Number(event.target.value))}
                        aria-label="Song progress"
                        style={{ "--progress": `${progressPercent}%` } as CSSProperties}
                    />
                    <span>{formatDuration(currentSong?.duration ?? 0)}</span>
                </div>
            </div>

            <div className="volume-control">
                <Volume2 />
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(event) => setVolume(Number(event.target.value))}
                    aria-label="Volume"
                />
            </div>
        </footer>
    );
};

export default BottomPlayer;
