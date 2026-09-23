const CHANNELS = [
  { name: "Sony MAX", id: 410431 },
  { name: "Sony TV", id: 410430 },
  { name: "Sony WAH", id: 543352 },
  { name: "Cartoon Network", id: 543449 },
  { name: "Movies Now", id: 543174 },
  { name: "MNX", id: 463999 },
  { name: "Star Movies Select", id: 543316 },
  { name: "Mega TV", id: 411728 },
  { name: "Sony Sports Ten 1", id: 543109 },
  { name: "Sony Sports Ten 5", id: 543047 },
  { name: "DD Kashir", id: 543500 }
];

export async function onRequest(context) {
  const url = new URL(context.request.url);

  const query = (url.searchParams.get("q") || "")
    .trim()
    .toLowerCase();

  if (!query) {
    return Response.json({
      success: false,
      message: "Search something"
    });
  }

  try {
    const responses = await Promise.allSettled(
      CHANNELS.map(async (channel) => {

        const api =
          `https://epg.pw/api/epg.json?channel_id=${channel.id}`;

        const response = await fetch(api);

        if (!response.ok) return [];

        const data = await response.json();

        return (data.epg_list || [])
          .filter(program => {

            const title = String(
              program.title || ""
            ).toLowerCase();

            return title.includes(query);
          })
          .map(program => {

            const start = new Date(program.start_date);

            const indiaTime =
              new Intl.DateTimeFormat("en-IN", {
                timeZone: "Asia/Kolkata",
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
              }).format(start);

            return {
              title: String(program.title || "").trim(),
              channel: channel.name,
              start: program.start_date,
              indiaTime: indiaTime
            };
          });
      })
    );

    let results = [];

    for (const response of responses) {
      if (response.status === "fulfilled") {
        results.push(...response.value);
      }
    }

    results.sort(
      (a, b) =>
        new Date(a.start).getTime() -
        new Date(b.start).getTime()
    );

    return Response.json({
      success: true,
      query: query,
      results: results
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
