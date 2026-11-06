import { describe, expect, it } from 'vitest';
import { detectCeremony, downgradePrompt } from '../utils/downgrader';

const VERBOSE =
  'You are a Senior Principal Technical Support Engineer evaluating enterprise customer tickets. Please carefully analyze the incoming support ticket provided below step by step. Make sure to output a clean, structured response in valid JSON format. Do not include any conversational preamble or pleasantries.';

describe('downgradePrompt', () => {
  it('strips ceremony for the standard tier but keeps the task', () => {
    const { text, applied } = downgradePrompt(VERBOSE, 'standard');
    expect(text).toBe('Analyze the incoming support ticket provided below. Output JSON. No preamble.');
    expect(applied.length).toBeGreaterThan(0);
  });

  it('goes telegraphic for the bare tier', () => {
    expect(downgradePrompt(VERBOSE, 'bare').text).toBe('Analyze support ticket. JSON only.');
  });

  it('derives output from the input instead of a fixed template', () => {
    const a = downgradePrompt('You are an expert chef. Please write a recipe for {{dish}}.', 'bare').text;
    const b = downgradePrompt('You are an expert lawyer. Please summarize {{contract}}.', 'bare').text;
    expect(a).toBe('Write recipe for {{dish}}.');
    expect(b).toBe('Summarize {{contract}}.');
  });

  it('keeps placeholders intact', () => {
    const { text } = downgradePrompt('Kindly classify the following message step by step:\n{{input}}', 'standard');
    expect(text).toContain('{{input}}');
    expect(text).not.toMatch(/step by step/i);
  });

  it('leaves a lean prompt unchanged', () => {
    const lean = 'Classify as POSITIVE or NEGATIVE.\n{{input}}';
    expect(downgradePrompt(lean, 'standard')).toEqual({ text: lean, applied: [] });
  });

  it('never returns an empty prompt', () => {
    expect(downgradePrompt('You are a helpful assistant.', 'bare').text).toBe('You are a helpful assistant.');
  });

  it('is stable across repeated calls (global regex state)', () => {
    expect(downgradePrompt(VERBOSE, 'standard')).toEqual(downgradePrompt(VERBOSE, 'standard'));
  });
});

describe('detectCeremony', () => {
  it('lists ceremony found in a prompt', () => {
    const found = detectCeremony(VERBOSE);
    expect(found).toEqual(
      expect.arrayContaining([expect.stringMatching(/Persona/), expect.stringMatching(/step by step/), expect.stringMatching(/preamble/i)])
    );
    expect(detectCeremony(VERBOSE)).toEqual(found);
  });

  it('finds nothing in a clean prompt', () => {
    expect(detectCeremony('Summarize:\n{{text}}')).toEqual([]);
  });
});
