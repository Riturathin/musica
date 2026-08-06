import Image from "next/image";
import { Song } from "@/types/song";
interface SongCardProps {
    song: Song;
}


const SongCard = ({ song }: SongCardProps) => {
    return (
        <div className="song-card">
            <Image src={song.imageUrl} alt={song.title} width={200} height={200} />
            <h3>{song.title}</h3>
            <p>{song.artist.name}</p>
        </div>
    );
};

export default SongCard;