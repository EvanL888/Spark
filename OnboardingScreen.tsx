import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';
import { colors, typography, spacing, radius } from '../lib/theme';
import { syncCalendarAvailability } from '../lib/calendar';
import { INTEREST_TAGS, PROMPT_QUESTIONS } from '../types';

type Step = 'email' | 'verify' | 'name' | 'interests' | 'prompts' | 'calendar';

export default function OnboardingScreen() {
  const { signInWithEmail, loading } = useAuthStore();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [prompts, setPrompts] = useState<Array<{ question_id: string; question: string; answer: string }>>([]);
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [promptAnswer, setPromptAnswer] = useState('');
  const [saving, setSaving] = useState(false);

  const TOTAL_STEPS = 5;
  const stepIndex: Record<Step, number> = {
    email: 1, verify: 1, name: 2, interests: 3, prompts: 4, calendar: 5,
  };

  const handleEmailSubmit = async () => {
    if (!email.endsWith('.edu')) {
      Alert.alert('University email required', 'Please use your .edu email address to verify you\'re a student.');
      return;
    }
    try {
      await signInWithEmail(email);
      setStep('verify');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleNameNext = () => {
    if (firstName.trim().length < 2) return;
    setStep('interests');
  };

  const toggleInterest = (tag: string) => {
    setSelectedInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 6 ? [...prev, tag] : prev
    );
  };

  const addPrompt = (q: typeof PROMPT_QUESTIONS[number]) => {
    setActivePrompt(q.id);
    setPromptAnswer('');
  };

  const savePrompt = () => {
    if (!activePrompt || promptAnswer.trim().length < 5) return;
    const question = PROMPT_QUESTIONS.find((q) => q.id === activePrompt);
    if (!question) return;
    setPrompts((prev) => {
      const filtered = prev.filter((p) => p.question_id !== activePrompt);
      return [...filtered, { question_id: activePrompt, question: question.text, answer: promptAnswer.trim() }];
    });
    setActivePrompt(null);
  };

  const handleProfileSave = async () => {
    if (prompts.length < 2) {
      Alert.alert('Add 2 prompts', 'Prompts help your matches understand you before you meet.');
      return;
    }
    setSaving(true);
    try {
      await api.createProfile({
        first_name: firstName.trim(),
        interests: selectedInterests,
        prompts,
      });
      setStep('calendar');
    } catch (e: any) {
      Alert.alert('Error saving profile', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCalendarSync = async () => {
    setSaving(true);
    await syncCalendarAvailability();
    setSaving(false);
    // Auth state change listener in authStore will update user -> navigate to Main
  };

  const progress = stepIndex[step] / TOTAL_STEPS;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Progress bar */}
        {step !== 'verify' && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* LOGO */}
          <View style={styles.logoRow}>
            <Text style={styles.logoIcon}>✦</Text>
            <Text style={styles.logoText}>spark</Text>
          </View>

          {/* -- EMAIL -- */}
          {step === 'email' && (
            <View style={styles.stepWrap}>
              <Text style={styles.stepTitle}>What's your university email?</Text>
              <Text style={styles.stepSub}>We verify you're a student. No spam, ever.</Text>
              <TextInput
                style={styles.input}
                placeholder="you@university.edu"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
              />
              <TouchableOpacity
                style={[styles.btn, (!email.includes('.edu')) && styles.btnDisabled]}
                onPress={handleEmailSubmit}
                disabled={!email.includes('.edu') || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Send magic link</Text>
                )}
              </TouchableOpacity>
              <Text style={styles.footnote}>We'll send a one-click sign-in link - no password needed.</Text>
            </View>
          )}

          {/* -- VERIFY -- */}
          {step === 'verify' && (
            <View style={styles.stepWrap}>
              <Text style={[styles.logoIcon, { fontSize: 48, marginBottom: 16 }]}>✉</Text>
              <Text style={styles.stepTitle}>Check your inbox</Text>
              <Text style={styles.stepSub}>
                We sent a magic link to{'\n'}
                <Text style={{ color: colors.textPrimary, fontWeight: '500' }}>{email}</Text>
              </Text>
              <Text style={styles.footnote}>Tap the link and you'll be signed in automatically. Check spam if you don't see it.</Text>
              <TouchableOpacity onPress={() => setStep('email')}>
                <Text style={styles.linkText}>Use a different email</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* -- NAME -- */}
          {step === 'name' && (
            <View style={styles.stepWrap}>
              <Text style={styles.stepTitle}>What's your first name?</Text>
              <Text style={styles.stepSub}>Only your first name is shown to matches. No last names.</Text>
              <TextInput
                style={styles.input}
                placeholder="First name"
                placeholderTextColor={colors.textTertiary}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                autoFocus
              />
              <TouchableOpacity
                style={[styles.btn, firstName.trim().length < 2 && styles.btnDisabled]}
                onPress={handleNameNext}
                disabled={firstName.trim().length < 2}
              >
                <Text style={styles.btnText}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* -- INTERESTS -- */}
          {step === 'interests' && (
            <View style={styles.stepWrap}>
              <Text style={styles.stepTitle}>What are you into?</Text>
              <Text style={styles.stepSub}>Pick 3 to 6 - these power your matches.</Text>
              <View style={styles.chipGrid}>
                {INTEREST_TAGS.map((tag) => {
                  const selected = selectedInterests.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[styles.chip, selected && styles.chipSelected]}
                      onPress={() => toggleInterest(tag)}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                style={[styles.btn, selectedInterests.length < 3 && styles.btnDisabled]}
                onPress={() => setStep('prompts')}
                disabled={selectedInterests.length < 3}
              >
                <Text style={styles.btnText}>
                  Continue {selectedInterests.length > 0 ? `(${selectedInterests.length} selected)` : ''}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* -- PROMPTS -- */}
          {step === 'prompts' && (
            <View style={styles.stepWrap}>
              <Text style={styles.stepTitle}>Tell us a bit more</Text>
              <Text style={styles.stepSub}>Answer 2 prompts - they show on your card so matches can spark a conversation.</Text>

              {/* Active prompt input */}
              {activePrompt && (
                <View style={styles.promptInput}>
                  <Text style={styles.promptQ}>
                    {PROMPT_QUESTIONS.find((q) => q.id === activePrompt)?.text}
                  </Text>
                  <TextInput
                    style={styles.promptAnswer}
                    placeholder="Your answer..."
                    placeholderTextColor={colors.textTertiary}
                    value={promptAnswer}
                    onChangeText={setPromptAnswer}
                    multiline
                    autoFocus
                    maxLength={120}
                  />
                  <TouchableOpacity
                    style={[styles.btn, { marginTop: 8 }, promptAnswer.trim().length < 5 && styles.btnDisabled]}
                    onPress={savePrompt}
                  >
                    <Text style={styles.btnText}>Save answer</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Saved prompts */}
              {prompts.map((p) => (
                <View key={p.question_id} style={styles.savedPrompt}>
                  <Text style={styles.promptQLabel}>{p.question}</Text>
                  <Text style={styles.promptAText}>"{p.answer}"</Text>
                </View>
              ))}

              {/* Question picker */}
              {!activePrompt && prompts.length < 3 && (
                <>
                  <Text style={[styles.label, { marginTop: 16, marginBottom: 8 }]}>
                    {prompts.length === 0 ? 'Choose a prompt' : 'Add another prompt (optional)'}
                  </Text>
                  {PROMPT_QUESTIONS.filter((q) => !prompts.find((p) => p.question_id === q.id)).map((q) => (
                    <TouchableOpacity key={q.id} style={styles.promptOption} onPress={() => addPrompt(q)}>
                      <Text style={styles.promptOptionText}>{q.text}</Text>
                      <Text style={{ color: colors.textTertiary, fontSize: 18 }}>+</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {prompts.length >= 2 && !activePrompt && (
                <TouchableOpacity
                  style={[styles.btn, saving && styles.btnDisabled]}
                  onPress={handleProfileSave}
                  disabled={saving}
                >
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save profile</Text>}
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* -- CALENDAR -- */}
          {step === 'calendar' && (
            <View style={styles.stepWrap}>
              <Text style={[styles.logoIcon, { fontSize: 48, marginBottom: 16 }]}>📅</Text>
              <Text style={styles.stepTitle}>Connect your calendar</Text>
              <Text style={styles.stepSub}>
                Spark reads only your <Text style={{ fontWeight: '500', color: colors.textPrimary }}>free/busy times</Text> - never your event names or details.
              </Text>
              <View style={styles.privacyCard}>
                {['Event names are never read', 'Data never shared with matches', 'Deleted after 48 hours', 'Revoke access any time'].map((item) => (
                  <View key={item} style={styles.privacyRow}>
                    <View style={styles.checkDot} />
                    <Text style={styles.privacyText}>{item}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.btn, saving && styles.btnDisabled]}
                onPress={handleCalendarSync}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Connect calendar</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {}} style={{ marginTop: 12 }}>
                <Text style={styles.linkText}>Skip for now - I'll add times manually</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  progressTrack: { height: 2, backgroundColor: colors.border, marginHorizontal: spacing.lg },
  progressFill: { height: 2, backgroundColor: colors.black, borderRadius: 1, transition: 'width 0.3s' as any },
  scroll: { padding: spacing.xl, paddingBottom: 40 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.xxl },
  logoIcon: { fontSize: 22, color: colors.black },
  logoText: { fontSize: 20, fontWeight: '500', letterSpacing: -0.5, color: colors.black },
  stepWrap: { flex: 1 },
  stepTitle: { ...typography.h1, marginBottom: spacing.sm },
  stepSub: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
  input: {
    borderWidth: 0.5, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing.md, fontSize: 15, color: colors.textPrimary,
    backgroundColor: colors.surface, marginBottom: spacing.lg,
  },
  btn: {
    backgroundColor: colors.black, borderRadius: radius.md,
    padding: 14, alignItems: 'center', marginBottom: spacing.md,
  },
  btnDisabled: { opacity: 0.35 },
  btnText: { color: colors.white, fontSize: 15, fontWeight: '500' },
  footnote: { ...typography.small, textAlign: 'center', marginBottom: spacing.md },
  linkText: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', textDecorationLine: 'underline' },
  label: { ...typography.label, textTransform: 'uppercase' as const },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.xl },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full,
    borderWidth: 0.5, borderColor: colors.border, backgroundColor: colors.white,
  },
  chipSelected: { backgroundColor: colors.black, borderColor: colors.black },
  chipText: { fontSize: 13, color: colors.textSecondary },
  chipTextSelected: { color: colors.white, fontWeight: '500' },
  promptInput: {
    borderWidth: 0.5, borderColor: colors.border, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.md, backgroundColor: colors.surface,
  },
  promptQ: { fontSize: 11, fontWeight: '500', color: colors.textTertiary, textTransform: 'uppercase' as const, letterSpacing: 0.4, marginBottom: 6 },
  promptAnswer: { fontSize: 14, color: colors.textPrimary, minHeight: 60, lineHeight: 22 },
  savedPrompt: {
    borderWidth: 0.5, borderColor: colors.border, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: 8, backgroundColor: colors.surface,
  },
  promptQLabel: { fontSize: 10, fontWeight: '500', color: colors.textTertiary, textTransform: 'uppercase' as const, letterSpacing: 0.4, marginBottom: 4 },
  promptAText: { fontSize: 14, color: colors.textPrimary, lineHeight: 20, fontStyle: 'italic' },
  promptOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md, borderRadius: radius.md, borderWidth: 0.5,
    borderColor: colors.border, marginBottom: 8, backgroundColor: colors.white,
  },
  promptOptionText: { fontSize: 13, color: colors.textPrimary, flex: 1, marginRight: 8 },
  privacyCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.xl, gap: 10,
  },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  privacyText: { fontSize: 13, color: colors.textSecondary },
});
