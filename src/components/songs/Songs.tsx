import SongCard from "./SongCard";
import { SongService } from "@/services/song.service";

const Songs = () => {
    const songs = SongService.getAll();

    return (
        <>
            {songs.map(song => (
                <SongCard key={song.id} song={song} />
            ))}
        </>
    )
};

export default Songs;