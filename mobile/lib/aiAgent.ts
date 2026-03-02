import { supabase } from "./supabase";
import { Property, Violation } from "../types/property";

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You are the LeaseLens AI, an expert housing advisor for UC Davis students searching for off-campus apartments in Davis, California.

You have access to a live database of apartment complexes with their city code violation history and aggregate risk scores. Use ONLY this data — never invent properties, prices, or violations.

## Davis Neighborhood Context
Use this local knowledge to help with location-based queries:
- **Russell Blvd / West Davis**: Close to west campus, Trader Joe's, bike paths. Complexes here are popular with upperclassmen.
- **Anderson Rd / South Davis**: Near the Unitrans bus lines, grocery stores. Mix of older and newer complexes.
- **Sycamore Ln / East Davis**: Close to the Davis Commons shopping area. Generally quieter.
- **Downtown / 3rd St area**: Walking distance to campus and restaurants. Older buildings, more urban feel.
- **North Davis**: Near North Star Park, more suburban. Farther from campus.

## How to Respond
When a user asks for recommendations:
1. Acknowledge what they're looking for (budget, location, priorities).
2. If the database lacks certain info (e.g., exact rent prices), say so upfront rather than guessing.
3. Present your top recommendations as a numbered list. For EACH property include:
   - **Property name**
   - **Risk Score** (0-10 scale; lower = safer) with a label (Low/Moderate/High)
   - **Total violations** and how many are still OPEN
   - **Specific warnings** about severe violation types (mold, structural, plumbing, electrical)
4. After the list, give a brief summary of your top pick and why.
5. Be honest and student-friendly — warn clearly about risky places even if they're popular.

## Formatting Rules
- Use clear headings and numbered lists
- Bold property names and risk labels
- Keep responses thorough but scannable
- End with a one-line suggestion to ask a follow-up question

If the user asks something unrelated to Davis housing, politely redirect them back to apartment searching.`;

/**
 * Fetches all properties and their violations from Supabase.
 * Returns a combined context string for the AI agent.
 */
async function fetchPropertyContext(): Promise<string> {
    const { data: properties, error: propError } = await supabase
        .from("properties")
        .select("id, name, location, risk_score");

    if (propError) {
        throw new Error(`Failed to fetch properties: ${propError.message}`);
    }

    const { data: violations, error: violError } = await supabase
        .from("violations")
        .select("id, property_id, case_number, type, status, date")
        .order("date", { ascending: false });

    if (violError) {
        throw new Error(`Failed to fetch violations: ${violError.message}`);
    }

    // Group violations by property_id
    const violationsByProperty: Record<number, Violation[]> = {};
    for (const v of (violations as Violation[]) ?? []) {
        if (!violationsByProperty[v.property_id]) {
            violationsByProperty[v.property_id] = [];
        }
        violationsByProperty[v.property_id].push(v);
    }

    // Build the context object with summary stats for better AI reasoning
    const enrichedProperties = ((properties as Property[]) ?? []).map((p) => {
        const propViolations = violationsByProperty[Number(p.id)] ?? [];
        const openViolations = propViolations.filter((v) => v.status === "open");
        const violationTypes = [...new Set(propViolations.map((v) => v.type))];

        return {
            name: p.name,
            risk_score: p.risk_score,
            risk_level: p.risk_score >= 7 ? "HIGH" : p.risk_score >= 4 ? "MODERATE" : "LOW",
            latitude: p.location.coordinates[1],
            longitude: p.location.coordinates[0],
            total_violations: propViolations.length,
            open_violations: openViolations.length,
            violation_types: violationTypes,
            violations: propViolations.map((v) => ({
                type: v.type,
                status: v.status,
                date: v.date,
                case_number: v.case_number,
            })),
        };
    });

    return JSON.stringify(enrichedProperties, null, 2);
}

/**
 * Sends a user message to the Gemini API with full property context.
 * Returns the AI's response text.
 */
export async function sendMessageToAgent(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }>
): Promise<string> {
    if (!GEMINI_API_KEY) {
        throw new Error(
            "Missing EXPO_PUBLIC_GEMINI_API_KEY. Add it to your .env file."
        );
    }

    const propertyContext = await fetchPropertyContext();

    const systemInstruction = `${SYSTEM_PROMPT}\n\nHere is the current property database:\n${propertyContext}`;

    // Build the Gemini request body
    const contents = [
        // Include conversation history for multi-turn context
        ...conversationHistory.map((msg) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
        })),
        // Current user message
        {
            role: "user" as const,
            parts: [{ text: userMessage }],
        },
    ];

    const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            system_instruction: {
                parts: [{ text: systemInstruction }],
            },
            contents,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8192,
            },
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();

    const candidate = data?.candidates?.[0];
    if (!candidate?.content?.parts?.[0]?.text) {
        throw new Error("No response from Gemini. The model returned empty content.");
    }

    return candidate.content.parts[0].text;
}
