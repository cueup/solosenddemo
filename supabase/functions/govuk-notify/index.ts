import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { NotifyClient } from "npm:notifications-node-client@8.2.1";

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
    const apiKey = Deno.env.get("GOVUK_NOTIFY_API_KEY");
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GOV.UK Notify API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const notifyClient = new NotifyClient(apiKey);
    const { action, ...params } = await req.json();

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