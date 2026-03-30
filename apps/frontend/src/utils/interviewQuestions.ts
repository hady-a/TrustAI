/**
 * Interview Questions Database
 * Contains curated questions for different analysis modes
 */

export const INTERVIEW_QUESTIONS = [
  "Tell us about yourself and your background.",
  "Describe your most recent professional experience.",
  "What motivated you to pursue this opportunity?",
  "Tell us about a challenge you overcame.",
  "How do you approach problem-solving?",
  "Describe a time you worked effectively in a team.",
  "What are your key strengths?",
  "How do you handle feedback and criticism?",
  "Where do you see yourself in the next 5 years?",
  "What questions do you have for us?"
];

export const BUSINESS_QUESTIONS = [
  "Describe your organization's current market position.",
  "What are your key business objectives for the next quarter?",
  "How do you differentiate your business from competitors?",
  "Tell us about your revenue model and profitability.",
  "What challenges is your business currently facing?",
  "Describe your customer acquisition strategy.",
  "How do you measure business success?",
  "Tell us about your team structure and key personnel.",
  "What is your funding status or capital requirement?",
  "What's your timeline for achieving your goals?"
];

/**
 * Get questions for a specific analysis mode
 */
export function getQuestionsForMode(mode: string): string[] {
  if (mode === 'business' || mode === 'Business Analysis') {
    return BUSINESS_QUESTIONS;
  }
  return INTERVIEW_QUESTIONS;
}

/**
 * Get total number of questions
 */
export function getTotalQuestions(mode: string): number {
  return getQuestionsForMode(mode).length;
}

/**
 * Get a specific question by index
 */
export function getQuestionByIndex(mode: string, index: number): string | null {
  const questions = getQuestionsForMode(mode);
  if (index >= 0 && index < questions.length) {
    return questions[index];
  }
  return null;
}
