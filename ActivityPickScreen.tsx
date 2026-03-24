import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, RouteProp } from '@react-navigation/native-stack';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { colors, typography, spacing, radius } from '../lib/theme';
import type { RootStackParamList } from '../App';
import type { Activity, Venue } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'ActivityPick'>;

interface ActivityOption {
  activity: Activity;
  venue: Venue;
}

const ACTIVITY_ICONS: Record<string, string> = {
  Coffee: '☕',
  'Study session': '📚',
  Walk: '🚶',
  Lunch: '🥗',
  'Campus tour': '🏛',
};

export default function ActivityPickScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const [selected, setSelected] = useState<string | null>(null);

  const { data: options = [], isLoading } = useQuery<ActivityOption[]>({
    queryKey: ['activities', params.matchId],
    queryFn: () => api.getSparkActivities(params.matchId),
  });

  const selectMutation = useMutation({
    mutationFn: (activityId: string) => api.selectActivity(params.matchId, activityId),
    onSuccess: (data) => {
      navigation.navigate('Confirmed', { sparkId: data.spark_id });
    },
  });

  const handleSelect = (id: string) => {
    setSelected(id);
    setTimeout(() => selectMutation.mutate(id), 300);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 18, color: colors.textSecondary }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pick an activity</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.desc}>
          Both you and {params.matchName} pick independently. You only meet if you choose the same thing.
        </Text>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.black} />
          </View>
        ) : options.length > 0 ? (
          options.map(({ activity, venue }) => {
            const isSelected = selected === activity.id;
            return (
              <TouchableOpacity
                key={activity.id}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => handleSelect(activity.id)}
                disabled={selectMutation.isPending}
                activeOpacity={0.7}
              >
                <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
                  <Text style={{ fontSize: 18 }}>{ACTIVITY_ICONS[activity.name] || '✦'}</Text>
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionName, isSelected && styles.optionNameSelected]}>
                    {activity.name}
                  </Text>
                  <Text style={styles.venueName}>{venue.name}</Text>
                  <Text style={styles.venueDetail}>{venue.address} · {venue.walk_minutes} min walk</Text>
                </View>
                {isSelected && (
                  <View style={styles.checkMark}>
                    <Text style={{ color: colors.white, fontSize: 12, fontWeight: '500' }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        ) : (
          // Fallback hardcoded options while API loads
          [
            { id: 'coffee', name: 'Coffee', venue: 'Campus cafe', detail: '5 min walk' },
            { id: 'study', name: 'Study session', venue: 'Main library, floor 2', detail: '3 min walk' },
            { id: 'walk', name: 'Walk', venue: 'Campus quad loop', detail: '~20 min' },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.id}
              style={[styles.option, selected === opt.id && styles.optionSelected]}
              onPress={() => handleSelect(opt.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, selected === opt.id && styles.iconWrapSelected]}>
                <Text style={{ fontSize: 18 }}>{ACTIVITY_ICONS[opt.name] || '✦'}</Text>
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionName, selected === opt.id && styles.optionNameSelected]}>
                  {opt.name}
                </Text>
                <Text style={styles.venueName}>{opt.venue}</Text>
                <Text style={styles.venueDetail}>{opt.detail}</Text>
              </View>
              {selected === opt.id && (
                <View style={styles.checkMark}>
                  <Text style={{ color: colors.white, fontSize: 12, fontWeight: '500' }}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}

        <View style={styles.footNote}>
          <Text style={styles.footText}>
            If you choose the same activity, you're confirmed. If not, each person gets one re-pick.
          </Text>
        </View>
      </ScrollView>
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
  backBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 0.5,
    borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  scroll: { padding: spacing.xl },
  desc: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl, lineHeight: 22 },
  loading: { height: 200, alignItems: 'center', justifyContent: 'center' },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, borderRadius: radius.lg,
    borderWidth: 0.5, borderColor: colors.border,
    marginBottom: 10, backgroundColor: colors.white,
  },
  optionSelected: { borderWidth: 1.5, borderColor: colors.black },
  iconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  iconWrapSelected: { backgroundColor: colors.black },
  optionText: { flex: 1 },
  optionName: { fontSize: 15, fontWeight: '500', color: colors.textPrimary, marginBottom: 2 },
  optionNameSelected: { color: colors.textPrimary },
  venueName: { fontSize: 12, color: colors.textSecondary, marginBottom: 1 },
  venueDetail: { fontSize: 11, color: colors.textTertiary },
  checkMark: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center',
  },
  footNote: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.md, marginTop: spacing.lg,
    borderWidth: 0.5, borderColor: colors.border,
  },
  footText: { fontSize: 12, color: colors.textSecondary, lineHeight: 18, textAlign: 'center' },
});
