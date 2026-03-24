import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { colors, typography, spacing, radius } from '../lib/theme';
import { formatWindow } from '../lib/calendar';
import type { RootStackParamList } from '../App';
import type { Match } from '../types';
import MatchCard from '../components/MatchCard';
import EmptyState from '../components/EmptyState';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const {
    data: match,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<Match | null>({
    queryKey: ['todayMatch'],
    queryFn: () => api.getTodayMatch().catch(() => null),
    staleTime: 5 * 60 * 1000,
  });

  const passMutation = useMutation({
    mutationFn: (matchId: string) => api.respondToMatch(matchId, 'pass'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todayMatch'] }),
  });

  const handleSpark = (m: Match) => {
    navigation.navigate('ProfileDetail', { matchId: m.id });
  };

  const handlePass = (m: Match) => {
    passMutation.mutate(m.id);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning{user?.first_name ? `, ${user.first_name}` : ''}</Text>
            <Text style={styles.headerSub}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          <View style={styles.logoMark}>
            <Text style={{ color: colors.white, fontSize: 16 }}>✦</Text>
          </View>
        </View>

        {/* Match section */}
        <Text style={styles.sectionLabel}>Today's spark</Text>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.black} />
          </View>
        ) : match ? (
          <MatchCard
            match={match}
            onSpark={() => handleSpark(match)}
            onPass={() => handlePass(match)}
            onViewProfile={() => navigation.navigate('ProfileDetail', { matchId: match.id })}
          />
        ) : (
          <EmptyState
            icon="✦"
            title="No spark today"
            subtitle="Check back tomorrow - new matches generate every morning at 8am."
          />
        )}

        {/* How it works (shown until first spark) */}
        <View style={styles.howCard}>
          <Text style={styles.howTitle}>How Spark works</Text>
          {[
            { step: '1', text: 'We find someone with overlapping free time and shared interests' },
            { step: '2', text: 'Both of you must accept before anything is revealed' },
            { step: '3', text: 'Pick a low-stakes activity - coffee, a walk, a study session' },
            { step: '4', text: 'Meet, connect, and rate the experience to improve future matches' },
          ].map((item) => (
            <View key={item.step} style={styles.howRow}>
              <View style={styles.howNum}>
                <Text style={styles.howNumText}>{item.step}</Text>
              </View>
              <Text style={styles.howText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { padding: spacing.xl, paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: spacing.xl,
  },
  greeting: { ...typography.h2, marginBottom: 2 },
  headerSub: { ...typography.small },
  logoMark: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center',
  },
  sectionLabel: {
    ...typography.label, textTransform: 'uppercase', marginBottom: spacing.md,
  },
  loading: { height: 300, alignItems: 'center', justifyContent: 'center' },
  howCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.lg, marginTop: spacing.xl,
    borderWidth: 0.5, borderColor: colors.border,
  },
  howTitle: { ...typography.h3, marginBottom: spacing.md },
  howRow: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  howNum: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 0.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  howNumText: { fontSize: 11, fontWeight: '500', color: colors.textSecondary },
  howText: { fontSize: 13, color: colors.textSecondary, flex: 1, lineHeight: 20 },
});
