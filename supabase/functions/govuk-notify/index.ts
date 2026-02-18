import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { NotifyClient } from "npm:notifications-node-client@8.2.1";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { action, serviceId, apiKey: providedApiKey, ...params } = await req.json();

    let apiKey = providedApiKey;

    // If no API key provided, try to fetch from database if serviceId is present
    if (!apiKey && serviceId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: apiKeys, error } = await supabase
        .from("api_keys")
        .select("key_hash")
        .eq("service_id", serviceId)
        .eq("is_active", true)
        .limit(1);

      if (!error && apiKeys && apiKeys.length > 0) {
        apiKey = apiKeys[0].key_hash;
      }
    }

    // Fallback to environment variable
    if (!apiKey) {
      apiKey = Deno.env.get("GOVUK_NOTIFY_API_KEY");
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GOV.UK Notify API key not configured or provided" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const notifyClient = new NotifyClient(apiKey);

    let result;

    switch (action) {
      case "sendEmail":
        result = await notifyClient.sendEmail(
          params.templateId,
          params.emailAddress,
          params.options || {}
        );
        break;

      case "sendSms":
        result = await notifyClient.sendSms(
          params.templateId,
          params.phoneNumber,
          params.options || {}
        );
        break;

      case "sendLetter":
        result = await notifyClient.sendLetter(
          params.templateId,
          params.options
        );
        break;

      case "getNotificationById":
        result = await notifyClient.getNotificationById(params.notificationId);
        break;

      case "getNotifications":
        result = await notifyClient.getNotifications(
          params.templateType,
          params.status,
          params.reference,
          params.olderThan
        );
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }

    return new Response(
      JSON.stringify({ success: true, data: result.data }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error:", error);

    const errorMessage = error.response?.data?.errors?.[0]?.message || error.message || "Unknown error";
    const errorType = error.response?.data?.errors?.[0]?.error || "Error";
    const statusCode = error.response?.data?.status_code || error.response?.status || 500;

    return new Response(
      JSON.stringify({
        success: false,
        error: `${errorType}: ${errorMessage}`,
        details: error.response?.data || null
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
