/* global Deno */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const getAuthUser = async (req: Request) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Missing Authorization Header");

  const token = authHeader.replace("Bearer ", "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: { user }, error } = await client.auth.getUser(token);
  if (error || !user) throw new Error("Invalid Auth Token");
  return user;
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    // Authenticate the user
    await getAuthUser(req);
    const { questions, answers, jobRole, tabSwitchCount, faceMissingDuration, faceVisibilityWarnings, cameraDisconnectedEvents, interviewId } = await req.json();

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) throw new Error('GEMINI_API_KEY not set');

    // Fallback: If jobRole is not passed, default to a generic technical role
    const roleName = jobRole || 'Technical Candidate';

    const prompt = `You are an expert technical interviewer. Grade the candidate's answers for the position of ${roleName}.
    Questions: ${JSON.stringify(questions)}
    Answers: ${JSON.stringify(answers)}

    Provide a JSON response with:
    1. "score": A number from 0-100
    2. "feedback": A brief summary of strengths and weaknesses
    3. "suggestions": 3 tips for improvement

    Return ONLY a valid JSON object.`;

    // UPDATED TO gemini-2.5-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
    });

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    let cleanJson = text.replace(/```json|```/g, "").trim();
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanJson = jsonMatch[0];
    }
    const result = JSON.parse(cleanJson);

    // Inject proctoring data into response
    const actualTabSwitches = tabSwitchCount ?? 0;
    const actualFaceMissingDuration = faceMissingDuration ?? 0;
    const actualFaceWarnings = faceVisibilityWarnings ?? 0;

    result.tab_switch_count = actualTabSwitches;
    result.face_missing_duration = actualFaceMissingDuration;
    result.face_visibility_warnings = actualFaceWarnings;
    result.is_suspicious = (actualTabSwitches >= 3) || (actualFaceMissingDuration >= 30);

    // Update database record with grade results
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (supabaseUrl && supabaseServiceRoleKey && interviewId) {
      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
      await supabase
        .from('interviews')
        .update({
          score: result.score,
          feedback: result.feedback,
          is_suspicious: result.is_suspicious,
          tab_switch_count: result.tab_switch_count,
          face_missing_duration: actualFaceMissingDuration,
          face_visibility_warnings: actualFaceWarnings,
          camera_disconnected_events: cameraDisconnectedEvents ?? [],
        })
        .eq('id', interviewId);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});