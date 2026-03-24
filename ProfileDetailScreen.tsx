import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, RouteProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { colors, typography, spacing, radius } from '../lib/theme';
import { formatWindow } from '../lib/calendar';
import type { RootStackParamList } from '../App';
import type { Match } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'ProfileDetail'>;

export default function ProfileDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const qc = useQueryClient();

  const { data: match, isLoading } = useQuery<Match>({
    queryKey: ['match', params.matchId],
    queryFn: () => api.getTodayMatch(),
  });

  const acceptMutation = useMutation({
    mutationFn: () => api.respondToMatch(params.matchId, 'accept'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['todayMatch'] });
      navigation.navigate('ActivityPick', {
        matchId: params.matchId,
        matchName: match?.user.first_name || 'them',
      });
    },
  });

  const passMutation = useMutation({
    mutationFn: () => api.respondToMatch(params.matchId, 'pass'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['todayMatch'] });
      navigation.goBack();
    },
  });

  if (isLoading || !match) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.black} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 18, color: colors.textPrimary }}>x</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{match.user.first_name}'s profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{match.user.first_name.slice(0, 2).toUpperCase()}</Text>
          </View>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{Math.round(match.match_score * 100)}% match</Text>
          </View>
        </View>

        <Text style={styles.name}>{match.user.first_name}</Text>

        {/* Shared interests */}
        <View style={styles.tags}>
          {match.shared_interests.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Free window */}
        <View style={styles.windowCard}>
          <View style={styles.windowDot} />
          <View>
            <Text style={styles.windowLabel}>Shared free window</Text>
            <Text style={styles.windowTime}>
              {formatWindow(match.overlap_start, match.overlap_end)} today
            </Text>
          </View>
        </View>

        {/* Prompts */}
        {match.user.prompts.map((p, i) => (
          <View key={i} style={styles.promptCard}>
            <Text style={styles.promptQ}>{p.question}</Text>
            <Text style={styles.promptA}>"{p.answer}"</Text>
          </View>
        ))}

        {/* All their interests */}
        <Text style={styles.sectionLabel}>Interests</Text>
        <View style={styles.tags}>
          {match.user.interests.map((tag) => (
            <View key={tag} style={[styles.tag, match.shared_interests.includes(tag) && styles.tagShared]}>
              <Text style={[styles.tagText, match.shared_interests.includes(tag) && styles.tagTextShared]}>
                {tag}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.passBtn}
          onPress={() => passMutation.mutate()}
          disabled={passMutation.isPending}
        >
          <Text style={styles.passBtnText}>Pass</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sparkBtn, acceptMutation.isPending && { opacity: 0.7 }]}
          onPress={() => acceptMutation.mutate()}
          disabled={acceptMutation.isPending}
        >
          {acceptMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sparkBtnText}>✦ Spark it</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.lg, borderBottomWidth: 0.5, borderBottomColor: colors.border,
  },
  headerTitle: { ...typography.h3 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 0.5,
    borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  scroll: { padding: spacing.xl },
  avatarWrap: { alignItems: 'center', marginBottom: spacing.md, position: 'relative' },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 34, fontWeight: '500', color: colors.white },
  scoreBadge: {
    position: 'absolute', bottom: -8, right: '50%', transform: [{ translateX: 60 }],
    backgroundColor: colors.black, borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  scoreText: { fontSize: 11, fontWeight: '500', color: colors.white },
  name: { ...typography.h1, textAlign: 'center', marginBottom: spacing.md },
  sectionLabel: { ...typography.label, textTransform: 'uppercase', marginBottom: spacing.sm, marginTop: spacing.lg },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.lg },
  tag: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full,
    backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.border,
  },
  tagShared: { backgroundColor: colors.black, borderColor: colors.black },
  tagText: { fontSize: 12, color: colors.textSecondary },
  tagTextShared: { color: colors.white, fontWeight: '500' },
  windowCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.lg,
    borderWidth: 0.5, borderColor: colors.border,
  },
  windowDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  windowLabel: { fontSize: 11, color: colors.textTertiary, marginBottom: 2 },
  windowTime: { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  promptCard: {
    borderWidth: 0.5, borderColor: colors.border, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: 10, backgroundColor: colors.surface,
  },
  promptQ: { fontSize: 10, fontWeight: '500', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5 },
  promptA: { fontSize: 15, color: colors.textPrimary, lineHeight: 22, fontStyle: 'italic' },
  actions: {
    flexDirection: 'row', gap: 10, padding: spacing.lg,
    borderTopWidth: 0.5, borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  passBtn: {
    flex: 1, padding: 14, borderRadius: radius.md,
    borderWidth: 0.5, borderColor: colors.border, alignItems: 'center',
  },
  passBtnText: { fontSize: 15, fontWeight: '500', color: colors.textSecondary },
  sparkBtn: {
    flex: 2, padding: 14, borderRadius: radius.md,
    backgroundColor: colors.black, alignItems: 'center',
  },
  sparkBtnText: { fontSize: 15, fontWeight: '500', color: colors.white },
});
