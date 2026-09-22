export async function onRequest(context) {
  const url = new URL(context.request.url);
  const query = (url.searchParams.get("q") || "").trim().toLowerCase();

  if (!query) {
    return Response.json({
      success: false,
      message: "Search something. Example: ?q=animal"
    });
  }

  const api =
    "https://epg.pw/api/epg.json?channel_id=410431";

  try {
    const response = await fetch(api);

    if (!response.ok) {
      throw new Error("EPG request failed");
    }

    const data = await response.json();

    const results = (data.epg_list || [])
      .filter(program =>
        program.title.toLowerCase().includes(query)
      )
      .map(program => ({
        title: program.title.trim(),
        channel: data.name,
        start: program.start_date
      }));

    return Response.json({
      success: true,
      query,
      results
    });

  } catch (error) {
    return Response.json(
      {
        success: false,
        error: "Schedule data could not be loaded."
      },
      { status: 500 }
    );
  }
        }
