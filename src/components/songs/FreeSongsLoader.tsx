"use client";

import { useEffect } from "react";
import { WebMusicService } from "@/services/web-music.service";
import { usePlayerStore } from "@/store/player.store";

const FreeSongsLoader = () => {
    const startWebSongsLoad = usePlayerStore((state) => state.startWebSongsLoad);
    const applyWebSongs = usePlayerStore((state) => state.applyWebSongs);
    const failWebSongsLoad = usePlayerStore((state) => state.failWebSongsLoad);

    useEffect(() => {
        const loadSongs = async () => {
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

        void loadSongs();
    }, [applyWebSongs, failWebSongsLoad, startWebSongsLoad]);

    return null;
};

export default FreeSongsLoader;
