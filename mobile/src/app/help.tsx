import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, BackHandler, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Camera, Search, BookOpen, Users, Award, ChevronRight } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';

export default function HelpScreen() {
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        router.navigate('/');
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const handleBack = () => {
    router.navigate('/');
  };

  const steps = [
    {
      icon: Camera,
      title: '1. Scan Ingredients',
      desc: 'Open Scan in the bottom bar and point your camera at raw food ingredients.',
    },
    {
      icon: Search,
      title: '2. Review Detected Ingredients',
      desc: 'Check detected ingredients, estimated per-100g nutrition, and total macro balance with the doughnut chart.',
    },
    {
      icon: BookOpen,
      title: '3. Suggested Recipes & Ingredients',
      desc: 'Tap Suggested Recipes to discover matched Filipino dishes and check off ingredients as you prepare.',
    },
    {
      icon: Award,
      title: '4. Estimated DOST Nutritional Facts',
      desc: 'View estimated per-serving calories, protein, carbs, and fat referenced from the FNRI-DOST database.',
      link: 'https://i.fnri.dost.gov.ph/fct/library/starting_pg',
    },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.page}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={handleBack} style={styles.iconAction} activeOpacity={0.75}>
          <ChevronLeft size={20} color="#303440" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Help & Guide</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.kicker}>A QUICK GUIDE</Text>
        <Text style={styles.heading}>How Palayok works</Text>
        <Text style={styles.lead}>
          Follow this quick guide to scan ingredients, view nutrition estimates, and cook Filipino dishes.
        </Text>

        <View style={styles.stepList}>
          {steps.map((s) => (
            <View key={s.title} style={styles.stepCard}>
              <View style={styles.iconBadge}>
                <s.icon size={20} color="#ed5108" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
                {'link' in s && s.link ? (
                  <Text style={styles.stepLink} onPress={() => Linking.openURL(s.link!)}>
                    Visit FNRI-DOST Food Composition Table ›
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => router.push('/about')}
          style={styles.linkCard}
          activeOpacity={0.8}
        >
          <View style={styles.linkIconBadge}>
            <Users size={18} color="#ed5108" />
          </View>
          <Text style={styles.linkText}>About Us</Text>
          <ChevronRight size={18} color="#ed5108" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/terms')}
          style={styles.linkCard}
          activeOpacity={0.8}
        >
          <View style={styles.linkIconBadge}>
            <BookOpen size={18} color="#ed5108" />
          </View>
          <Text style={styles.linkText}>Terms of Service</Text>
          <ChevronRight size={18} color="#ed5108" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#fffaf4',
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  iconAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ecdfd4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#303440',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 40,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#ed5108',
    marginBottom: 4,
  },
  heading: {
    fontSize: 22,
    fontWeight: '900',
    color: '#303440',
    marginBottom: 6,
  },
  lead: {
    fontSize: 13,
    lineHeight: 19,
    color: '#696c77',
    marginBottom: 16,
  },
  stepList: {
    gap: 10,
    marginBottom: 18,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1e6dd',
    padding: 13,
    gap: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#fff0e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#303440',
    marginBottom: 3,
  },
  stepDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#737682',
  },
  stepLink: {
    marginTop: 6,
    fontSize: 12.5,
    fontWeight: '800',
    color: '#ed5108',
    textDecorationLine: 'underline',
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1e6dd',
    padding: 13,
    marginBottom: 10,
    gap: 12,
  },
  linkIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#fff0e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#303440',
  },
});
