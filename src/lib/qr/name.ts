export const ADJECTIVES = [
  'happy', 'brave', 'clever', 'cozy', 'swift', 'lucky', 'sunny', 'jolly', 'gentle', 'brisk',
  'calm', 'cheerful', 'bright', 'bubbly', 'charming', 'curious', 'daring', 'dapper', 'eager',
  'fancy', 'fearless', 'fluffy', 'friendly', 'funny', 'golden', 'graceful', 'great', 'handy',
  'honest', 'kind', 'lively', 'lovely', 'merry', 'mighty', 'nimble', 'noble', 'peppy', 'playful',
  'polite', 'quick', 'quiet', 'radiant', 'ready', 'restless', 'robust', 'rosy', 'shiny', 'silly',
  'smart', 'sparkly', 'speedy', 'spunky', 'steady', 'strong', 'sweet', 'tidy', 'tiny', 'witty',
  'zippy', 'zesty',
];

export const ANIMALS = [
  'otter', 'panda', 'fox', 'badger', 'lemur', 'owl', 'raccoon', 'hedgehog', 'ferret', 'squirrel',
  'bunny', 'puppy', 'kitten', 'hamster', 'guinea-pig', 'chinchilla', 'dolphin', 'seal', 'penguin',
  'koala', 'kangaroo', 'wombat', 'platypus', 'echidna', 'wallaby', 'sloth', 'capybara', 'alpaca',
  'llama', 'yak', 'moose', 'caribou', 'deer', 'elk', 'zebra', 'gazelle', 'antelope', 'giraffe',
  'hippo', 'rhino', 'elephant', 'tiger', 'lion', 'leopard', 'cheetah', 'jaguar', 'lynx', 'puma',
  'wolf', 'coyote', 'jackal', 'weasel', 'marten', 'beaver', 'porcupine', 'skunk', 'bat', 'mole',
  'shrew', 'vole', 'rabbit', 'hare', 'gopher', 'marmot', 'prairie-dog',
];

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;

export function isValidSlug(name: string): boolean {
  return SLUG_RE.test(name);
}

export function generateCodeName(existing: Set<string>): string {
  const used = new Set(existing);
  for (let attempt = 0; attempt < 30; attempt++) {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const name = `${adj}-${animal}`;
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
  }
  const fallback = `qr-${Math.floor(Math.random() * 1_000_000)}`;
  return fallback;
}