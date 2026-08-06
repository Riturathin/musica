const AUDIUS_BASE_URL = "https://api.audius.co/v1";
const MAX_TRACKS = 500;
const PAGE_SIZE = 100;
const TRENDING_OFFSETS = [0, 100, 200];
const SEARCH_QUERIES = ["music", "electronic", "rock", "pop", "ambient", "hiphop"];

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AudiusTrack = {
    id?: string | number;
};

interface AudiusTracksResponse {
    data?: AudiusTrack[];
}

const fetchAudiusTracks = async (path: string, params: URLSearchParams) => {
    const response = await fetch(`${AUDIUS_BASE_URL}${path}?${params.toString()}`, {
        cache: "no-store",
        headers: {
            Accept: "application/json",
        },
    });

    if (!response.ok) {
        return [];
    }

    const payload = (await response.json()) as AudiusTracksResponse;

    return payload.data ?? [];
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const requestedLimit = Number(searchParams.get("limit") ?? MAX_TRACKS);
    const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : MAX_TRACKS, 1), MAX_TRACKS);
    const tracks = new Map<string, AudiusTrack>();
    const addTracks = (nextTracks: AudiusTrack[]) => {
        nextTracks.forEach((track) => {
            if (track.id !== undefined) {
                tracks.set(String(track.id), track);
            }
        });
    };

    for (const offset of TRENDING_OFFSETS) {
        if (tracks.size >= limit) {
            break;
        }

        addTracks(await fetchAudiusTracks("/tracks/trending", new URLSearchParams({
            limit: String(Math.min(PAGE_SIZE, limit - tracks.size)),
            offset: String(offset),
        })));
    }

    for (const query of SEARCH_QUERIES) {
        for (let offset = 0; tracks.size < limit && offset < MAX_TRACKS; offset += PAGE_SIZE) {
            addTracks(await fetchAudiusTracks("/tracks/search", new URLSearchParams({
                query,
                limit: String(Math.min(PAGE_SIZE, limit - tracks.size)),
                offset: String(offset),
                sort_method: "popular",
            })));
        }

        if (tracks.size >= limit) {
            break;
        }
    }

    if (!tracks.size) {
        return Response.json({ error: "Could not load Audius tracks." }, { status: 502 });
    }

    return Response.json({ data: Array.from(tracks.values()).slice(0, limit) }, {
        headers: {
            "Cache-Control": "no-store",
        },
    });
}
