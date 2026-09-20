export async function onRequest(context) {
  const url = new URL(context.request.url);
  const query = (url.searchParams.get("q") || "").trim().toLowerCase();

  if (!query) {
    return Response.json({
      success: false,
      message: "Search something. Example: ?q=shinchan"
    });
  }

  const epgUrl =
    "https://iptv-org.github.io/epg/guides/in/dishtv.in.epg.xml";

  try {
    const response = await fetch(epgUrl);

    if (!response.ok) {
      throw new Error("EPG source unavailable");
    }

    const xml = await response.text();

    const programs = [];
    const blocks = xml.match(/<programme[\s\S]*?<\/programme>/g) || [];

    for (const block of blocks) {
      const titleMatch = block.match(/<title[^>]*>([\s\S]*?)<\/title>/);
      const channelMatch = block.match(/channel="([^"]+)"/);
      const startMatch = block.match(/start="([^"]+)"/);

      if (!titleMatch || !startMatch) continue;

      const title = titleMatch[1]
        .replace(/<!\[CDATA\[|\]\]>/g, "")
        .replace(/&amp;/g, "&")
        .trim();

      if (!title.toLowerCase().includes(query)) continue;

      programs.push({
        title,
        channel: channelMatch ? channelMatch[1] : "Unknown",
        start: startMatch[1]
      });

      if (programs.length >= 20) break;
    }

    return Response.json({
      success: true,
      query,
      results: programs
    });

  } catch (error) {
    return Response.json(
      {
        success: false,
        error: "TV schedule data could not be loaded."
      },
      { status: 500 }
    );
  }
}
