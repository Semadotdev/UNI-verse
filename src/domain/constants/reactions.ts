export const REACTION_TYPES = ['like', 'love', 'haha', 'wow', 'sad', 'angry'] as const;

export type ReactionType = (typeof REACTION_TYPES)[number];

export interface ReactionOption {
  type: ReactionType;
  emoji: string;
  label: string;
}

export const REACTIONS: ReactionOption[] = [
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'haha', emoji: '😂', label: 'Haha' },
  { type: 'wow', emoji: '😮', label: 'Wow' },
  { type: 'sad', emoji: '😢', label: 'Sad' },
  { type: 'angry', emoji: '😡', label: 'Angry' },
];

export function isReactionType(value: unknown): value is ReactionType {
  return typeof value === 'string' && (REACTION_TYPES as readonly string[]).includes(value);
}

export function reactionEmoji(type: ReactionType): string {
  return REACTIONS.find((r) => r.type === type)?.emoji ?? '👍';
}
