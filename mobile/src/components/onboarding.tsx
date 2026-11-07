import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Check } from 'lucide-react-native';

interface OnboardingProps {
  onComplete: (dontShowAgain: boolean) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const steps = [
    {
      num: '1',
      title: '1. Scan ingredients',
      desc: 'Use Scan in the bottom bar to point your camera at raw food ingredients.',
    },
    {
      num: '2',
      title: '2. Review ingredients',
      desc: 'Check detected ingredients and estimated nutrition on the results screen.',
    },
    {
      num: '3',
      title: '3. Pick a recipe',
      desc: 'Open suggested Filipino dishes and check off ingredients as you prepare.',
    },
  ];

  return (
    <Modal visible={true} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Text style={styles.kicker}>A QUICK GUIDE</Text>
          <Text style={styles.title}>How Palayok works</Text>
          <Text style={styles.lead}>
            Scan ingredients, view nutrition estimates, and find recipes in three quick steps.
          </Text>

          <View style={styles.stepsList}>
            {steps.map((s) => (
              <View key={s.num} style={styles.stepCard}>
                <View style={styles.stepNumBadge}>
                  <Text style={styles.stepNumText}>{s.num}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>{s.title}</Text>
                  <Text style={styles.stepDesc}>{s.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.optoutRow}
            activeOpacity={0.75}
            onPress={() => setDontShowAgain((prev) => !prev)}
          >
            <View style={[styles.checkbox, dontShowAgain && styles.checkboxChecked]}>
              {dontShowAgain && <Check size={12} color="#ffffff" strokeWidth={3} />}
            </View>
            <Text style={styles.optoutText}>Don’t show this again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => onComplete(dontShowAgain)}
          >
            <Text style={styles.primaryBtnText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(29, 25, 22, 0.56)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#fffaf4',
    borderRadius: 19,
    padding: 20,
    borderWidth: 1,
    borderColor: '#eadfd4',
    shadowColor: '#1f1812',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.24,
    shadowRadius: 24,
    elevation: 10,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: '#ed5108',
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#303440',
    marginBottom: 8,
  },
  lead: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#696c77',
    marginBottom: 14,
  },
  stepsList: {
    gap: 10,
    marginBottom: 14,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#efe4d9',
    borderRadius: 14,
    padding: 12,
    gap: 11,
  },
  stepNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#fff0e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    color: '#ed5108',
    fontWeight: '900',
    fontSize: 13,
  },
  stepTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#303440',
    marginBottom: 3,
  },
  stepDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: '#737682',
  },
  optoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 14,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#b7aba0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#ed5108',
    borderColor: '#ed5108',
  },
  optoutText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#5f626d',
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#ed5108',
    paddingVertical: 14,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ed5108',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '800',
  },
});
