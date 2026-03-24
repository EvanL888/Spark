import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, radius } from '../lib/theme';
import { formatWindow } from '../lib/calendar';
import type { Match } from '../types';

interface Props {
  match: Match;
  onSpark: () => void;
  onPass: () => void;
  onViewProfile: () => void;
}

function MatchScore({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  return (
    <View style={ss.scoreBadge}>
      <Text style={ss.scoreText}>{pct}% match</Text>
    </View>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <View style={ss.avatar}>
      <Text style={ss.avatarText}>{initials}</Text>
    </View>
  );
}

export default function MatchCard({ match, onSpark, onPass, onViewProfile }: Props) {
  const { user, shared_interests, overlap_start, overlap_end, match_score } = match;

  return (
    <View style={ss.card}>
      {/* Avatar area */}
      <TouchableOpacity style={ss.avatarArea} onPress={onViewProfile} activeOpacity={0.9}>
        <Avatar name={user.first_name} />
        <MatchScore score={match_score} />
      </TouchableOpacity>

      {/* Info */}
      <View style={ss.body}>
        <View style={ss.nameRow}>
          <Text style={ss.name}>{user.first_name}</Text>
          <TouchableOpacity onPress={onViewProfile}>
            <Text style={ss.viewProfile}>View profile -></Text>
          </TouchableOpacity>
        </View>

        {/* Shared interests */}
        <View style={ss.tags}>
          {shared_interests.slice(0, 3).map((tag) => (
            <View key={tag} style={ss.tag}>
              <Text style={ss.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* First prompt */}
        {user.prompts[0] && (
          <View style={ss.promptCard}>
            <Text style={ss.promptQ}>{user.prompts[0].question}</Text>
            <Text style={ss.promptA}>"{user.prompts[0].answer}"</Text>
          </View>
        )}

        {/* Free window */}
        <View style={ss.windowRow}>
          <View style={ss.windowDot} />
          <Text style={ss.windowTime}>
            Free {formatWindow(overlap_start, overlap_end)}
          </Text>
          <Text style={ss.windowDay}>today</Text>
        </View>

        {/* Actions */}
        <View style={ss.actions}>
          <TouchableOpacity style={ss.passBtn} onPress={onPass}>
            <Text style={ss.passBtnText}>Pass</Text>
          </TouchableOpacity>
          <TouchableOpacity style={ss.sparkBtn} onPress={onSpark}>
            <Text style={ss.sparkBtnText}>✦ Spark it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const ss = StyleSheet.create({
  card: {
    borderRadius: radius.xl, borderWidth: 0.5, borderColor: colors.border,
    backgroundColor: colors.white, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  avatarArea: {
    height: 220, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 30, fontWeight: '500', color: colors.white },
  scoreBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: colors.black, borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  scoreText: { fontSize: 11, fontWeight: '500', color: colors.white },
  body: { padding: spacing.lg },
  nameRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: spacing.sm,
  },
  name: { ...typography.h2 },
  viewProfile: { fontSize: 12, color: colors.textTertiary },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md },
  tag: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: radius.full, backgroundColor: colors.surface,
    borderWidth: 0.5, borderColor: colors.border,
  },
  tagText: { fontSize: 12, color: colors.textSecondary },
  promptCard: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.md,
    borderWidth: 0.5, borderColor: colors.border,
  },
  promptQ: {
    fontSize: 10, fontWeight: '500', color: colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5,
  },
  promptA: { fontSize: 14, color: colors.textPrimary, lineHeight: 20, fontStyle: 'italic' },
  windowRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.white, borderRadius: radius.sm,
    padding: spacing.sm, marginBottom: spacing.md,
    borderWidth: 0.5, borderColor: colors.border,
  },
  windowDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
  windowTime: { fontSize: 13, fontWeight: '500', color: colors.textPrimary, flex: 1 },
  windowDay: { fontSize: 11, color: colors.textTertiary },
  actions: { flexDirection: 'row', gap: 10 },
  passBtn: {
    flex: 1, padding: 13, borderRadius: radius.md,
    borderWidth: 0.5, borderColor: colors.border, alignItems: 'center',
  },
  passBtnText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  sparkBtn: {
    flex: 2, padding: 13, borderRadius: radius.md,
    backgroundColor: colors.black, alignItems: 'center',
  },
  sparkBtnText: { fontSize: 14, fontWeight: '500', color: colors.white },
});
