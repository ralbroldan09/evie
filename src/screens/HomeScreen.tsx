import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationProps } from '@/types/navigation';
import { colors, componentStyles, textStyles, spacing } from '@/utils/theme';

type HomeScreenProps = NavigationProps<'Home'>;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, route }) => {
  return (
    <View style={[componentStyles.container, styles.container]}>
      <View style={styles.content}>
        <Text
          style={textStyles.h1}
          accessibilityRole="header"
          accessibilityLabel="Evie Voice Assistant"
          accessibilityHint="Main interface for voice commands"
        >
          Welcome to Evie
        </Text>
        
        <Text
          style={[textStyles.body, styles.subtitle]}
          accessibilityLabel="Voice-activated messaging assistant"
        >
          Your voice-activated messaging assistant
        </Text>
        
        <View style={styles.listeningArea}>
          <Text
            style={textStyles.bodyLarge}
            accessibilityLabel="Say Hey Evie to start listening"
            accessibilityHint="Wake word activation prompt"
          >
            Say "Hey Evie" to start
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.base,
  },
  
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  subtitle: {
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing['3xl'],
  },
  
  listeningArea: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
});

export default HomeScreen;