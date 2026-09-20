export async function onRequest() {
  return new Response(
    JSON.stringify({
      success: true,
      message: "KabOnTV schedule API is working!"
    }),
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}
