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

async function getChannelResults(channel, query) {
  try {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 5000);

    const response = await fetch(
      `https://epg.pw/api/epg.json?channel_id=${channel.id}`,
      {
        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    if (!response.ok) return [];

    const data = await response.json();

    return (data.epg_list || [])
      .filter(program =>
        String(program.title || "")
          .toLowerCase()
          .includes(query)
      )
      .map(program => {
        const start = new Date(program.start_date);

        return {
          title: String(program.title || "").trim(),
          channel: channel.name,

          date: new Intl.DateTimeFormat("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "long",
            year: "numeric"
          }).format(start),

          time: new Intl.DateTimeFormat("en-IN", {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
          }).format(start),

          start: program.start_date
        };
      });

  } catch (error) {
    return [];
  }
}

export async function onRequest(context) {

  const url = new URL(context.request.url);

  const query = (url.searchParams.get("q") || "")
    .trim()
    .toLowerCase();

  if (!query) {
    return Response.json({
      success: false,
      results: []
    });
  }

  const results = [];

  // Search channels in small batches
  for (let i = 0; i < CHANNELS.length; i += 3) {

    const batch = CHANNELS.slice(i, i + 3);

    const batchResults = await Promise.all(
      batch.map(channel =>
        getChannelResults(channel, query)
      )
    );

    for (const items of batchResults) {
      results.push(...items);
    }

    // Stop early if we already found something
    if (results.length > 0) {
      break;
    }
  }

  results.sort(
    (a, b) =>
      new Date(a.start).getTime() -
      new Date(b.start).getTime()
  );

  return Response.json({
    success: true,
    query,
    results
  });
}
