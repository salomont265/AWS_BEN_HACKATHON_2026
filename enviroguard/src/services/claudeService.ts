import { ANTHROPIC_API_KEY } from '../constants/env';

const CLAUDE_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';
const HEADERS = {
  'Content-Type': 'application/json',
  'x-api-key': ANTHROPIC_API_KEY,
  'anthropic-version': '2023-06-01',
};

// 1 — Map zone summary (MapScreen bottom sheet)
// Returns 2-3 plain English sentences about the zone's current risk
export async function getZoneSummary(zone: {
  name: string;
  noise_index: number;
  aqi: number;
  health_category: string;
  pollen_index: number;
  litter_count: number;
  mode: string;
}): Promise<string> {
  const res = await fetch(CLAUDE_URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 256,
      system: 'You are an environmental health advisor. Be direct and plain. 2-3 sentences max. No jargon.',
      messages: [{
        role: 'user',
        content: `Neighborhood: ${zone.name}. Noise: ${zone.noise_index}/100. AQI: ${zone.aqi} (${zone.health_category}). ` +
          `Pollen: ${zone.pollen_index}/100. Litter reports: ${zone.litter_count} in last 24h. ` +
          `Mode: ${zone.mode}. Explain the current risk to a resident in plain English.`
      }]
    })
  });

  const data = await res.json();
  return data.content[0].text;
}

// 2 — Forecast personal briefing (ForecastScreen Generate button)
// Streaming — pass onToken callback to display text as it arrives
export async function getForecastBriefing(
  forecast: {
    peak_db: number;
    peak_hour: string;
    peak_aqi: number;
    aqi_hour: string;
    pollen: number;
  },
  health: {
    conditions: string[];
    neighborhood: string;
  },
  mode: string,
  onToken: (token: string) => void
): Promise<void> {
  const res = await fetch(CLAUDE_URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 512,
      stream: true,
      system: 'You are a personal health advisor for environmental risk. Be specific, not generic. Address the user directly.',
      messages: [{
        role: 'user',
        content: `Health profile: ${health.conditions.join(', ')}. Neighborhood: ${health.neighborhood}. Mode: ${mode}. ` +
          `Forecast: noise peaks at ${forecast.peak_db}dB at ${forecast.peak_hour}, ` +
          `AQI reaches ${forecast.peak_aqi} at ${forecast.aqi_hour}, pollen count: ${forecast.pollen}. ` +
          `Give a personalized briefing for today.`
      }]
    })
  });

  // Stream handling — call onToken for each text chunk
  const reader = res.body?.getReader();
  const decoder = new TextDecoder();

  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

    for (const line of lines) {
      try {
        const json = JSON.parse(line.slice(6));
        const token = json.delta?.text;
        if (token) onToken(token);
      } catch {
        /* skip non-JSON lines */
      }
    }
  }
}

// 3 — Photo hazard analysis (SubmitReportScreen — litter category only)
// Called BEFORE createPost. Returns structured JSON — Lambda also runs Vision server-side.
// This gives the user a preview before they confirm submission.
export async function analyzePhoto(base64Image: string): Promise<{
  type: string;
  severity: number;
  description: string;
  health_impact: string;
  agency: string;
  action: string;
}> {
  const res = await fetch(CLAUDE_URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 256,
      system: 'Analyze this photo for environmental issues. Respond ONLY in valid JSON, no other text.',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: base64Image
            }
          },
          {
            type: 'text',
            text: 'Identify: type, severity 1-5, plain description, health_impact, agency, action.'
          }
        ]
      }]
    })
  });

  const data = await res.json();
  return JSON.parse(data.content[0].text);
}

// 4 — Petition drafting (PostDetailScreen → PetitionScreen)
// Streaming — displays petition text token by token in editable TextInput
export async function draftPetition(
  petition: {
    category: string;
    neighborhood: string;
    agreeing_user_count: number;
    report_texts: string[];
    official_name: string;
    district: string;
  },
  onToken: (token: string) => void
): Promise<void> {
  const res = await fetch(CLAUDE_URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      stream: true,
      system: 'You are drafting a formal civic petition. Tone: serious, factual, urgent but respectful. Use the reports as evidence. Address the official by name.',
      messages: [{
        role: 'user',
        content: `Issue: ${petition.category} in ${petition.neighborhood}. ` +
          `${petition.agreeing_user_count} residents affected. ` +
          `Their reports: [${petition.report_texts.join(', ')}]. ` +
          `Official: ${petition.official_name}, ${petition.district}. Draft a petition demanding action.`
      }]
    })
  });

  // Same streaming pattern as getForecastBriefing
  const reader = res.body?.getReader();
  const decoder = new TextDecoder();

  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

    for (const line of lines) {
      try {
        const json = JSON.parse(line.slice(6));
        const token = json.delta?.text;
        if (token) onToken(token);
      } catch {
        /* skip */
      }
    }
  }
}
