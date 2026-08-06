const AUDIUS_BASE_URL = "https://api.audius.co/v1";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: RouteContext<"/api/audio/audius/[trackId]">) {
    const { trackId } = await context.params;
    const response = await fetch(`${AUDIUS_BASE_URL}/tracks/${encodeURIComponent(trackId)}/stream`, {
        cache: "no-store",
        redirect: "follow",
    });

    if (!response.ok || !response.body) {
        return new Response("Audio stream unavailable", { status: 502 });
    }

    return new Response(response.body, {
        status: 200,
        headers: {
            "Accept-Ranges": response.headers.get("accept-ranges") ?? "bytes",
            "Cache-Control": "no-store",
            "Content-Length": response.headers.get("content-length") ?? "",
            "Content-Type": response.headers.get("content-type") ?? "audio/mpeg",
        },
    });
}
