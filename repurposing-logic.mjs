const PLATFORM_RULES = {
  LinkedIn: { limit: 3000, format: 'Professional post' },
  Instagram: { limit: 2200, format: 'Caption' },
  X: { limit: 280, format: 'Short post' },
  'Short video': { limit: 2200, format: 'Short-video script' },
};

function sentencesOf(text) {
  return String(text).replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/).map(value => value.trim()).filter(Boolean);
}

function fitSource(text, limit) {
  if (text.length <= limit) return text;
  const shortened = text.slice(0, limit);
  const boundary = shortened.lastIndexOf(' ');
  return `${shortened.slice(0, boundary > limit * 0.6 ? boundary : limit).trim()}…`;
}

function voiceLead(voice) {
  return {
    'Warm and approachable': 'A thought to take into your next conversation:',
    'Expert and analytical': 'Key point from the source:',
    'Bold but credible': 'A practical idea worth testing:',
    Educational: 'Here is one useful takeaway:',
    'Clear and practical': 'A practical takeaway:',
  }[voice] || 'A practical takeaway:';
}

function selectSourceSentences(source, platform, objective) {
  const sentences = sentencesOf(source);
  if (!sentences.length) return [];
  const ranked = sentences.map((text, index) => ({
    text,
    index,
    objectiveMatch: objective && text.toLowerCase().includes(objective.toLowerCase()) ? 1 : 0,
  }));
  ranked.sort((left, right) => right.objectiveMatch - left.objectiveMatch || left.index - right.index);
  const count = platform === 'X' ? 1 : platform === 'Instagram' ? 2 : 3;
  return ranked.slice(0, count).sort((left, right) => left.index - right.index).map(item => item.text);
}

function formatSource(sourceSentences, format) {
  if (format === 'Checklist') return sourceSentences.map(sentence => `• ${sentence}`).join('\n');
  if (format === 'Quick tip') return sourceSentences.map(sentence => `Tip: ${sentence}`).join('\n');
  if (format === 'Question-led' && sourceSentences.length) return `Question: What does this source suggest about ${sourceSentences[0].slice(0, 90)}?\n${sourceSentences.slice(1).join(' ')}`;
  if (format === 'Story-led' && sourceSentences.length) return `Context: ${sourceSentences[0]}\nTakeaway: ${sourceSentences.slice(1).join(' ')}`;
  return sourceSentences.join(' ');
}

export function createLocalDrafts(data) {
  const title = String(data.sourceTitle || '').trim();
  const audience = String(data.audience || 'your audience').trim();
  const voice = voiceLead(data.voice);
  const callToAction = String(data.callToAction || 'Read the full source for more details.').trim();
  const objective = String(data.objective || '').trim();
  const items = (data.platforms || []).filter(platform => PLATFORM_RULES[platform]).map(platform => {
    const rules = PLATFORM_RULES[platform];
    const sourceSentences = selectSourceSentences(data.sourceText, platform, objective);
    const formattedSource = formatSource(sourceSentences, data.contentFormat);
    const formatHeading = data.contentFormat && data.contentFormat !== 'Platform-native' ? `${data.contentFormat.toUpperCase()}\n` : '';
    let body;
    if (platform === 'Short video') {
      body = `HOOK\n${title}\n\n${formatHeading}SOURCE POINT\n${formattedSource}\n\nAUDIENCE\nFor ${audience}: ${voice.toLowerCase()} ${sourceSentences[0] || ''}\n\nCTA\n${callToAction}`;
    } else if (platform === 'X') {
      body = fitSource(`${formatHeading}${title}: ${formattedSource} ${callToAction}`, rules.limit);
    } else if (platform === 'Instagram') {
      body = `${formatHeading}${title}\n\n${voice} ${formattedSource}\n\nFor ${audience}: ${objective || 'Save this source for reference.'}\n\n${callToAction}`;
    } else {
      body = `${formatHeading}${title}\n\n${voice} ${formattedSource}\n\nFor ${audience}, consider how this connects to ${objective || 'your current priorities'}.\n\n${callToAction}`;
    }
    return {
      platform,
      format: rules.format,
      body: platform === 'X' ? body : fitSource(body, rules.limit),
      sources: sourceSentences,
      notes: 'Local template uses exact excerpts from the supplied source; framing and structure are editorial suggestions, not verified claims.',
    };
  });
  return {
    items,
    facts: [...new Set(items.flatMap(item => item.sources))],
    mode: 'LOCAL MODE — deterministic template',
  };
}

export function validateAiDrafts(candidate, data) {
  if (!candidate || !Array.isArray(candidate.items) || candidate.items.length !== data.platforms.length) return false;
  const seen = new Set();
  for (const item of candidate.items) {
    if (!item || !data.platforms.includes(item.platform) || seen.has(item.platform)) return false;
    if (typeof item.body !== 'string' || !item.body.trim() || item.body.length > PLATFORM_RULES[item.platform].limit) return false;
    if (typeof item.format !== 'string' || !item.format.trim() || !Array.isArray(item.sources)) return false;
    if (!item.sources.length || item.sources.some(source => typeof source !== 'string' || !source.trim() || !data.sourceText.includes(source))) return false;
    seen.add(item.platform);
  }
  return seen.size === data.platforms.length;
}

export function updateDraftBody(items, index, body) {
  if (!Number.isInteger(index) || !items[index] || typeof body !== 'string') return items;
  return items.map((item, itemIndex) => itemIndex === index ? { ...item, body } : item);
}
