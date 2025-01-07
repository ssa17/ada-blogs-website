// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const apiKey = Deno.env.get('TINYMCE_API_KEY')
  
  if (!apiKey) {
    console.error('TINYMCE_API_KEY not found in environment variables')
    return new Response(
      JSON.stringify({ error: 'API key not configured' }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  console.log('Successfully retrieved TinyMCE API key')
  
  return new Response(
    JSON.stringify({ apiKey }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    },
  )
})