import { Song } from "./song";

export interface Playlist {
    id: string;

    name: string;

    ownerId: string;

    ownerName: string;

    isPublic: boolean;

    songIds: string[];

    songs?: Song[];

    createdAt: string;
}
