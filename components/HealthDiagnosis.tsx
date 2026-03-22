import React from 'react';
import { StyleSheet, View as RNView } from 'react-native';
import { Text } from '@/components/Themed';
import { DiagnosisResult } from '@/models/DiagnosisResult';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface HealthDiagnosisProps {
  diagnosis: Omit<DiagnosisResult, 'plantId' | 'photoUri' | 'timestamp'>;
}

const healthColors: Record<DiagnosisResult['overallHealth'], string> = {
  healthy: '#4CAF50',
  mild_issues: '#FF9800',
  needs_attention: '#F44336',
  critical: '#B71C1C',
};

const healthLabels: Record<DiagnosisResult['overallHealth'], string> = {
  healthy: 'Healthy',
  mild_issues: 'Mild Issues',
  needs_attention: 'Needs Attention',
  critical: 'Critical',
};

export function HealthDiagnosis({ diagnosis }: HealthDiagnosisProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <RNView style={styles.container}>
      <RNView style={[styles.healthBadge, { backgroundColor: healthColors[diagnosis.overallHealth] + '20' }]}>
        <Text style={[styles.healthText, { color: healthColors[diagnosis.overallHealth] }]}>
          {healthLabels[diagnosis.overallHealth]}
        </Text>
      </RNView>

      {diagnosis.issues.length > 0 && (
        <RNView style={styles.section}>
          <Text style={styles.sectionTitle}>Issues Found</Text>
          {diagnosis.issues.map((issue, index) => (
            <RNView key={index} style={[styles.issueCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <RNView style={styles.issueHeader}>
                <Text style={styles.issueName}>{issue.name}</Text>
                <Text style={[styles.confidence, { color: colors.secondaryText }]}>
                  {Math.round(issue.confidence * 100)}% confidence
                </Text>
              </RNView>
              <Text style={[styles.issueText, { color: colors.secondaryText }]}>{issue.description}</Text>
              <Text style={[styles.treatmentLabel, { color: colors.tint }]}>Treatment:</Text>
              <Text style={[styles.issueText, { color: colors.secondaryText }]}>{issue.treatment}</Text>
            </RNView>
          ))}
        </RNView>
      )}

      {diagnosis.careRecommendations.length > 0 && (
        <RNView style={styles.section}>
          <Text style={styles.sectionTitle}>Care Recommendations</Text>
          {diagnosis.careRecommendations.map((rec, index) => (
            <RNView key={index} style={styles.recommendation}>
              <Text style={[styles.bullet, { color: colors.tint }]}>•</Text>
              <Text style={[styles.recText, { color: colors.secondaryText }]}>{rec}</Text>
            </RNView>
          ))}
        </RNView>
      )}
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  healthBadge: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  healthText: { fontSize: 16, fontWeight: '700' },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  issueCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  issueName: { fontSize: 15, fontWeight: '600' },
  confidence: { fontSize: 12 },
  issueText: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  treatmentLabel: { fontSize: 13, fontWeight: '600', marginTop: 8 },
  recommendation: { flexDirection: 'row', marginBottom: 6, paddingRight: 16 },
  bullet: { fontSize: 16, marginRight: 8, lineHeight: 20 },
  recText: { fontSize: 13, lineHeight: 20, flex: 1 },
});
