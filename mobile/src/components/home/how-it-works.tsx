import React from 'react';
import { View, Text } from 'react-native';
import { Camera, Search, CookingPot, ArrowRight } from 'lucide-react-native';

const steps = [
  {
    icon: Camera,
    number: '01',
    title: 'Scan',
    description: 'Point your camera at ingredients\nin your kitchen.',
    bgColor: 'bg-[#e6f4ea]',
    iconColor: '#0fa958',
  },
  {
    icon: Search,
    number: '02',
    title: 'Match',
    description: 'AI detects items and finds\ncompatible recipes.',
    bgColor: 'bg-[#fdf3e1]',
    iconColor: '#f59e0b',
  },
  {
    icon: CookingPot,
    number: '03',
    title: 'Cook',
    description: 'Follow step-by-step\ninstructions and enjoy.',
    bgColor: 'bg-[#fce8ef]',
    iconColor: '#ef4444',
  },
];

export function HowItWorks() {
  return (
    <View className="px-6 py-2">
      <Text className="text-lg font-bold text-foreground mb-3">How It Works</Text>

      <View className="flex-row items-start justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.title}>
            {/* Step Item */}
            <View className="flex-1 items-center">
              {/* Icon Circle */}
              <View className={`w-10 h-10 rounded-full ${step.bgColor} items-center justify-center mb-1`}>
                <step.icon size={18} color={step.iconColor} />
              </View>
              
              {/* Number and Title */}
              <Text style={{ color: step.iconColor }} className="font-bold text-sm mb-1">
                {step.number}
              </Text>
              <Text className="font-bold text-foreground mb-2">
                {step.title}
              </Text>
              
              {/* Description */}
              <Text className="text-xs text-muted-foreground text-center leading-relaxed">
                {step.description}
              </Text>
            </View>

            {/* Arrow separator (not after the last item) */}
            {index < steps.length - 1 && (
              <View className="pt-3 px-1">
                <ArrowRight size={14} className="text-muted-foreground" />
              </View>
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}
