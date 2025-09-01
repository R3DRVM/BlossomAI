/**
 * Shared types and constants for conversation system
 */

export type SmallTalk =
  | 'greeting' | 'help' | 'thanks'
  | 'affirm'   | 'deny' | 'unknown' | 'reset' | null;

export type ParseResult = {
  smallTalk: SmallTalk;
  // Other fields will be spread from ConvContext parser
};

// Small-talk patterns - normalized phrases
export const SMALL_TALK_PATTERNS = {
  greeting: ['hi','hey','hello','yo','gm','good morning','good evening','whats up','sup'],
  help: ['help','what can you do','how do you work','what can i ask'],
  thanks: ['thanks','thank you','ty','appreciate it'],
  affirm: ['yes','y','yeah','yup','ok','okay','sure','sounds good','hmm ok','fine'],
  deny: ['no','n','nope','nah'],
  reset: ['reset','start over','clear','new conversation','begin again'],
};
