export async function GET({ platform, params, url, request }) {
  const keys = platform ? Object.keys(platform) : [];
  const envKeys = platform?.env ? Object.keys(platform.env) : [];
  return new Response(JSON.stringify({
    hasPlatform: !!platform,
    platformKeys: keys,
    hasEnv: !!platform?.env,
    envKeys,
  }), { headers: { 'Content-Type': 'application/json' } });
}
