const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const QLOO_BASE_URL = "https://hackathon.api.qloo.com";
const REQUEST_TIMEOUT_MS = 20000;

const MAX_PARAMS = 20;
const MAX_PARAM_LENGTH = 300;

function validateParam(value: string): boolean {
  if (value.length > MAX_PARAM_LENGTH) return false;
  return true;
}

function sanitizeParams(searchParams: URLSearchParams): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  let count = 0;
  for (const [key, value] of searchParams.entries()) {
    if (count >= MAX_PARAMS) break;
    if (!validateParam(key) || !validateParam(value)) continue;
    if (key === "endpoint") continue;
    if (!result[key]) result[key] = [];
    result[key].push(value);
    count++;
  }
  return result;
}

async function extractQlooError(qlooResponse: Response): Promise<string> {
  const body = await qlooResponse.text().catch(() => "");
  if (!body) return `Qloo API returned status ${qlooResponse.status} with no response body`;
  try {
    const j = JSON.parse(body);
    return j.message || j.error || j.detail || `Qloo API returned status ${qlooResponse.status}: ${body.slice(0, 200)}`;
  } catch {
    return `Qloo API returned status ${qlooResponse.status}: ${body.slice(0, 200)}`;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("QLOO_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "QLOO_API_KEY is not configured on the server. Add it as an edge function secret.",
          code: "NOT_CONFIGURED",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const endpoint = searchParams.get("endpoint");

    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: "Missing 'endpoint' parameter. Use 'search', 'tags', or 'insights'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let path = "";
    switch (endpoint) {
      case "search":
        path = "/search";
        break;
      case "tags":
        path = "/v2/tags";
        break;
      case "insights":
        path = "/v2/insights";
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Unknown endpoint: ${endpoint}. Supported: search, tags, insights.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const params = sanitizeParams(searchParams);

    // Validate required parameters for insights
    if (endpoint === "insights") {
      const hasFilterType = params["filter.type"] && params["filter.type"].length > 0;
      if (!hasFilterType) {
        return new Response(
          JSON.stringify({ error: "The 'filter.type' parameter is required for insights queries." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Qloo /v2/insights requires at least one valid signal or filter beyond filter.type
      const hasSignal =
        (params["signal.interests.entities"] && params["signal.interests.entities"].length > 0) ||
        (params["signal.interests.tags"] && params["signal.interests.tags"].length > 0) ||
        (params["signal.demographics.audiences"] && params["signal.demographics.audiences"].length > 0) ||
        (params["signal.demographics.age"] && params["signal.demographics.age"].length > 0) ||
        (params["filter.tags"] && params["filter.tags"].length > 0) ||
        (params["filter.location"] && params["filter.location"].length > 0) ||
        (params["filter.location.metro"] && params["filter.location.metro"].length > 0);
      if (!hasSignal) {
        return new Response(
          JSON.stringify({
            error: "At least one signal or filter parameter is required for insights queries (e.g., signal.interests.entities, signal.interests.tags, signal.demographics.audiences, or filter.location). The Qloo API rejects requests that only specify filter.type.",
            code: "MISSING_SIGNAL",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (endpoint === "search") {
      const hasQuery = params["query"] && params["query"].length > 0;
      if (!hasQuery) {
        return new Response(
          JSON.stringify({ error: "The 'query' parameter is required for search." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Build the Qloo API URL
    const qlooUrl = new URL(QLOO_BASE_URL + path);
    for (const [key, values] of Object.entries(params)) {
      for (const v of values) {
        qlooUrl.searchParams.append(key, v);
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let qlooResponse: Response;
    try {
      qlooResponse = await fetch(qlooUrl.toString(), {
        method: "GET",
        headers: {
          "X-Api-Key": apiKey,
          "Accept": "application/json",
        },
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      const msg = fetchErr instanceof Error ? fetchErr.message : "Network error";
      const isTimeout = msg.includes("abort");
      return new Response(
        JSON.stringify({
          error: isTimeout ? "Qloo API request timed out after 20 seconds." : `Failed to reach Qloo API: ${msg}`,
          code: isTimeout ? "TIMEOUT" : "NETWORK_ERROR",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    clearTimeout(timeoutId);

    if (qlooResponse.status === 401) {
      return new Response(
        JSON.stringify({
          error: "Qloo API rejected the server-side API key. Verify QLOO_API_KEY is set to a valid hackathon key.",
          code: "AUTH_ERROR",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (qlooResponse.status === 403) {
      const detail = await extractQlooError(qlooResponse);
      return new Response(
        JSON.stringify({
          error: detail,
          code: "FORBIDDEN",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (qlooResponse.status === 429) {
      return new Response(
        JSON.stringify({
          error: "Qloo API rate limit exceeded. Please wait a moment and try again.",
          code: "RATE_LIMITED",
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!qlooResponse.ok) {
      const detail = await extractQlooError(qlooResponse);
      return new Response(
        JSON.stringify({ error: detail, code: "QLOO_ERROR", status: qlooResponse.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await qlooResponse.json();
    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: msg, code: "INTERNAL_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
