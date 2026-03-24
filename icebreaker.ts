const FALLBACKS = [
  'Ask them about the last thing that genuinely surprised them.',
  'What are they most excited about this semester?',
  'Ask them what they wish more people on campus knew about.',
  "What's the best class they've ever taken - and why?",
  'Ask them about the last rabbit hole they fell down online.',
];

export async function generateIcebreaker(
  me: { first_name?: string; prompts?: Array<{ question: string; answer: string }> } | null,
  other: { first_name?: string; prompts?: Array<{ question: string; answer: string }> } | null
): Promise<string> {
  const theirPrompts = (other?.prompts || []).map((p) => p.question).filter(Boolean);
  if (theirPrompts.length > 0) {
    return `Ask them about "${theirPrompts[0]}".`;
  }

  return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
}
