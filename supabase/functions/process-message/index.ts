import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Helper to parse variables in content
function parseVariables(content: string, contact: any) {
    if (!content) return "";
    let parsed = content;

    // 1. Create a flat map of all available properties from the contact
    const data: Record<string, any> = { ...contact };
    if (contact.metadata && typeof contact.metadata === 'object') {
        Object.assign(data, contact.metadata);
    }

    // 2. Add some common aliases
    if (data.first_name && !data.firstName) data.firstName = data.first_name;
    if (data.last_name && !data.lastName) data.lastName = data.last_name;
    if (!data.full_name && (data.first_name || data.last_name)) {
        data.full_name = `${data.first_name || ''} ${data.last_name || ''}`.trim();
    }

    // 3. Regex to find all {{variable}} occurrences
    return parsed.replace(/{{(.*?)}}/g, (match, variableName) => {
        const key = variableName.trim();

        // Exact match
        if (data[key] !== undefined && data[key] !== null) return String(data[key]);

        // snake_case
        const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");
        if (data[snakeKey] !== undefined && data[snakeKey] !== null) return String(data[snakeKey]);

        // camelCase
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        if (data[camelKey] !== undefined && data[camelKey] !== null) return String(data[camelKey]);

        // lowercase match
        const lowerKey = key.toLowerCase();
        const foundKey = Object.keys(data).find(k => k.toLowerCase() === lowerKey);
        if (foundKey) return String(data[foundKey]);

        return match;
    });
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? "";

    // --- DIAGNOSTIC LOGGING ---
    console.log("[DIAG] SUPABASE_URL:", supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : "MISSING!");
    console.log("[DIAG] SUPABASE_SERVICE_ROLE_KEY present:", !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    console.log("[DIAG] SERVICE_ROLE_KEY present:", !!Deno.env.get("SERVICE_ROLE_KEY"));
    console.log("[DIAG] Resolved key length:", supabaseKey.length);
    console.log("[DIAG] Key starts with:", supabaseKey ? supabaseKey.substring(0, 10) + "..." : "EMPTY");
    // --- END DIAGNOSTIC LOGGING ---

    if (!supabaseKey) {
        console.error("CRITICAL: Service role key is missing from environment. Using anon key might fail RLS.");
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        }
    });

    try {
        const { messageId } = await req.json();

        if (!messageId) {
            throw new Error("messageId is required");
        }

        console.log(`[DIAG] Processing message ID: ${messageId}`);
        console.log(`[DIAG] messageId type: ${typeof messageId}`);

        // 1. Fetch message details
        const { data: message, error: messageError, status: msgStatus } = await supabase
            .from("messages")
            .select("*, templates(*)")
            .eq("id", messageId)
            .single();

        console.log(`[DIAG] Message fetch HTTP status: ${msgStatus}`);
        console.log(`[DIAG] Message data received: ${!!message}`);
        if (message) {
            console.log(`[DIAG] Returned message ID: ${message.id}`);
            console.log(`[DIAG] Returned message service_id: ${message.service_id}`);
        }

        if (messageError) {
            console.error("[DIAG] Message fetch error code:", messageError.code);
            console.error("[DIAG] Message fetch error hint:", messageError.hint);
            console.error("[DIAG] Message fetch error details:", messageError.details);
            console.error("Message fetch error full:", JSON.stringify(messageError));
            throw new Error(`Permission denied or message not found: ${messageError.message} (HTTP ${msgStatus}, code: ${messageError.code})`);
        }

        if (!message) {
            throw new Error("Message record not found or returned empty");
        }

        // Update status to sending
        await supabase.from("messages").update({ status: "sending" }).eq("id", messageId);

        // 2. Fetch recipients
        const { data: recipients, error: recipientsError } = await supabase
            .from("message_recipients")
            .select("*, contacts(*)")
            .eq("message_id", messageId)
            .eq("status", "pending");

        if (recipientsError) {
            console.error("Recipients fetch error:", JSON.stringify(recipientsError));
            throw new Error(`Failed to fetch recipients: ${recipientsError.message}`);
        }

        const results = {
            success: 0,
            failed: 0,
        };

        // 3. Process each recipient
        for (const recipient of recipients) {
            try {
                const contact = recipient.contacts;
                if (!contact) {
                    throw new Error(`Contact data missing for recipient ${recipient.id}`);
                }

                // Merge recipient's specific personalisation data with contact fields
                const parsingData = {
                    ...contact,
                    ...(recipient.personalised_content || {})
                };

                const parsedContent = parseVariables(message.content_preview, parsingData);
                const parsedSubject = parseVariables(message.subject || "", parsingData);

                // PERSIST PARSED CONTENT: Update the recipient record so the user can see it in the DB
                await supabase
                    .from("message_recipients")
                    .update({
                        personalised_content: {
                            ...(recipient.personalised_content || {}),
                            parsed_content: parsedContent,
                            parsed_subject: parsedSubject,
                            processed_at: new Date().toISOString()
                        }
                    })
                    .eq("id", recipient.id);

                const externalTemplateId = message.templates?.notify_template_id;

                if (!externalTemplateId) {
                    throw new Error("No external template ID (GOV.UK Notify) found for this message. This is required for GOV.UK Notify.");
                }

                // Call govuk-notify function
                const notifyResponse = await fetch(`${supabaseUrl}/functions/v1/govuk-notify`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${supabaseKey}`,
                    },
                    body: JSON.stringify({
                        action: message.message_type === "email" ? "sendEmail" : (message.message_type === "sms" ? "sendSms" : "sendLetter"),
                        serviceId: message.service_id,
                        templateId: externalTemplateId,
                        ...(message.message_type === "email" ? { emailAddress: contact.email } : {}),
                        ...(message.message_type === "sms" ? { phoneNumber: contact.phone } : {}),
                        options: {
                            personalisation: {
                                subject: parsedSubject,
                                content: parsedContent,
                                // Add common letter fields if applicable
                                ...(message.message_type === "letter" ? {
                                    address_line_1: contact.address_line_1,
                                    address_line_2: contact.address_line_2 || "",
                                    address_line_3: contact.address_line_3 || "",
                                    address_line_4: contact.address_line_4 || "",
                                    address_line_5: contact.address_line_5 || "",
                                    address_line_6: contact.address_line_6 || "",
                                    address_line_7: contact.address_line_7 || "",
                                    postcode: contact.postcode,
                                } : {})
                            },
                            reference: `${message.message_type}-${messageId}-${recipient.id}`
                        }
                    }),
                });

                const notifyData = await notifyResponse.json();

                if (notifyResponse.ok && notifyData.success) {
                    await supabase
                        .from("message_recipients")
                        .update({
                            status: "delivered",
                            delivered_at: new Date().toISOString(),
                            delivery_response: notifyData.data
                        })
                        .eq("id", recipient.id);
                    results.success++;
                } else {
                    throw new Error(notifyData.error || `Notify API returned status ${notifyResponse.status}`);
                }
            } catch (err: any) {
                console.error(`Error processing recipient ${recipient.id}:`, err);
                await supabase
                    .from("message_recipients")
                    .update({
                        status: "failed",
                        error_message: err.message
                    })
                    .eq("id", recipient.id);
                results.failed++;
            }
        }

        // 4. Update final message status
        const finalStatus = results.failed === 0 ? "sent" : (results.success === 0 ? "failed" : "sent"); // "sent" if at least some worked? Or maybe "failed" if any failed? Let's go with "sent" but record errors.
        await supabase.from("messages").update({
            status: finalStatus,
            sent_at: new Date().toISOString(),
            error_details: results.failed > 0 ? `Completed with ${results.failed} failures.` : null
        }).eq("id", messageId);

        return new Response(JSON.stringify({ success: true, results }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("Critical processing error:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
