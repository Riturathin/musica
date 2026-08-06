import songs from "@/mocks/songs";

export const SongService = {
    getAll() {
        return songs;
    },

    getById(id: string) {
        return songs.find((song) => song.id === id);
    },
};