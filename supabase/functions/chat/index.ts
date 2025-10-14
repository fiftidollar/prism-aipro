import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationId, model, personaId } = await req.json();
    
    console.log('Chat request:', { conversationId, model, personaId, messageLength: message?.length });

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterApiKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    // Get conversation history
    const { data: messages } = await supabaseClient
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    const conversationHistory = messages || [];

    // Get persona instructions if personaId is provided
    let systemPrompt = null;
    if (personaId) {
      const { data: persona } = await supabaseClient
        .from('personas')
        .select('instructions')
        .eq('id', personaId)
        .single();
      
      if (persona) {
        systemPrompt = persona.instructions;
        console.log('Using persona instructions');
      }
    }

    // Prepare messages for API
    const apiMessages = systemPrompt 
      ? [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: message }
        ]
      : [
          ...conversationHistory,
          { role: 'user', content: message }
        ];

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('SUPABASE_URL') ?? '',
      },
      body: JSON.stringify({
        model: model || 'openai/gpt-3.5-turbo',
        messages: apiMessages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('No response from AI');
    }

    // Save user message
    await supabaseClient.from('messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: message,
    });

    // Save assistant message
    await supabaseClient.from('messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: assistantMessage,
      model: model,
    });

    // Check if this is the first message and generate title
    const { count } = await supabaseClient
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId);

    if (count === 2) { // First user message + first assistant response
      console.log('Generating conversation title...');
      
      // Generate title using AI
      const titleResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': Deno.env.get('SUPABASE_URL') ?? '',
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: [
            { 
              role: 'system', 
              content: 'Generate a short, concise title (3-5 words maximum) for a conversation based on the user\'s first message. Return ONLY the title, nothing else. The title should be in the same language as the user\'s message.' 
            },
            { role: 'user', content: message }
          ],
          max_tokens: 20,
          temperature: 0.7,
        }),
      });

      if (titleResponse.ok) {
        const titleData = await titleResponse.json();
        const generatedTitle = titleData.choices[0]?.message?.content?.trim();
        
        if (generatedTitle) {
          console.log('Generated title:', generatedTitle);
          await supabaseClient
            .from('conversations')
            .update({ 
              title: generatedTitle,
              updated_at: new Date().toISOString() 
            })
            .eq('id', conversationId);
        }
      } else {
        console.error('Failed to generate title');
        // Update only timestamp if title generation fails
        await supabaseClient
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);
      }
    } else {
      // Update conversation timestamp for subsequent messages
      await supabaseClient
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    }

    console.log('Chat response sent successfully');

    return new Response(
      JSON.stringify({ message: assistantMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
