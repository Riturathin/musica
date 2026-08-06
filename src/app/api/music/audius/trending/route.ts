const AUDIUS_BASE_URL = "https://api.audius.co/v1";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ?? "12";
    const response = await fetch(`${AUDIUS_BASE_URL}/tracks/trending?limit=${encodeURIComponent(limit)}`, {
        cache: "no-store",
        headers: {
            Accept: "application/json",
        },
    });

    if (!response.ok) {
        return Response.json({ error: "Could not load Audius tracks." }, { status: 502 });
    }

    return Response.json(await response.json(), {
        headers: {
            "Cache-Control": "no-store",
        },
    });
}
