const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const QLOO_BASE_URL = "https://hackathon.api.qloo.com";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("QLOO_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          status: "not_configured",
          message: "QLOO_API_KEY is not set on the server. Add it as an edge function secret to enable Qloo integration.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use the search endpoint for the health check — it only requires a query param
    // and validates both connectivity and authentication with a minimal request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let response: Response;
    try {
      response = await fetch(
        `${QLOO_BASE_URL}/search?query=culture&take=1`,
        {
          method: "GET",
          headers: {
            "X-Api-Key": apiKey,
            "Accept": "application/json",
          },
          signal: controller.signal,
        }
      );
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      const msg = fetchErr instanceof Error ? fetchErr.message : "Network error";
      const isTimeout = msg.includes("abort");
      return new Response(
        JSON.stringify({
          status: "error",
          message: isTimeout
            ? "Qloo API health check timed out. The API may be slow or unreachable."
            : `Cannot reach Qloo API: ${msg}`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    clearTimeout(timeoutId);

    if (response.status === 401) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Qloo API key is invalid. Verify QLOO_API_KEY is set to a valid hackathon API key.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (response.status === 429) {
      return new Response(
        JSON.stringify({
          status: "connected",
          message: "Qloo API is reachable and authenticated (rate limited).",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (response.ok) {
      return new Response(
        JSON.stringify({
          status: "connected",
          message: "Qloo API is connected and responding.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        status: "error",
        message: `Qloo API returned status ${response.status}. The API may be experiencing issues.`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return new Response(
      JSON.stringify({ status: "error", message: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
