import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { LinearGradient } from 'expo-linear-gradient';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuthStore } from '@/stores/authStore';
import { sendPasswordReset } from '@/services/firebase';

export default function SignInScreen() {
  const scheme = useColorScheme();
  const palette = Colors[scheme];
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { signInWithEmail, signUpWithEmail, signInWithApple, signInWithGoogle } =
    useAuthStore();

  const handleForgotPassword = () => {
    const sendReset = async (target: string) => {
      const trimmed = target.trim();
      if (!trimmed) {
        Alert.alert('Email required', 'Enter your email so we know where to send the reset link.');
        return;
      }
      try {
        await sendPasswordReset(trimmed);
        Alert.alert(
          'Check your email',
          `We've sent a password reset link to ${trimmed}. Follow the link to set a new password.`
        );
      } catch (err) {
        Alert.alert('Reset failed', err instanceof Error ? err.message : 'Could not send reset email.');
      }
    };

    if (email.trim()) {
      sendReset(email);
      return;
    }

    Alert.prompt(
      'Reset password',
      'Enter the email address for your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send link', onPress: (input) => sendReset(input ?? '') },
      ],
      'plain-text',
      '',
      'email-address'
    );
  };

  const handleEmail = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signIn') await signInWithEmail(email, password);
      else await signUpWithEmail(email, password);
    } catch (err) {
      Alert.alert(
        mode === 'signIn' ? 'Sign-in failed' : 'Sign-up failed',
        err instanceof Error ? err.message : 'Unknown error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApple = async () => {
    setLoading(true);
    try {
      await signInWithApple();
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Apple Sign-In failed', err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      Alert.alert('Google Sign-In failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <LinearGradient
        colors={
          scheme === 'dark'
            ? ['#0D2912', '#1B5E20', '#0D2912']
            : ['#FFFFFF', '#E8F5E9', '#A5D6A7']
        }
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: 'transparent' }]}>
          <Image
            source={require('../assets/images/sign-in-hero.png')}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)']}
            locations={[0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.heroTitle}>Petalwise</Text>
        </View>

        <View style={[styles.container, { backgroundColor: 'transparent' }]}>
          <TextInput
          placeholder="Email"
          placeholderTextColor={palette.secondaryText}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={[
            styles.input,
            { borderColor: palette.border, color: palette.text, backgroundColor: palette.card },
          ]}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={palette.secondaryText}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={[
            styles.input,
            { borderColor: palette.border, color: palette.text, backgroundColor: palette.card },
          ]}
        />

        {mode === 'signIn' && (
          <Pressable onPress={handleForgotPassword} style={styles.forgotRow}>
            <Text style={[styles.forgotText, { color: palette.tint }]}>Forgot password?</Text>
          </Pressable>
        )}

        <Pressable
          onPress={handleEmail}
          disabled={loading}
          style={[styles.primaryButton, { backgroundColor: palette.tint, opacity: loading ? 0.6 : 1 }]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {mode === 'signIn' ? 'Sign In' : 'Sign Up'}
            </Text>
          )}
        </Pressable>

        <Pressable onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}>
          <Text style={[styles.toggle, { color: palette.tint }]}>
            {mode === 'signIn' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
          </Text>
        </Pressable>

        <View style={[styles.divider, { backgroundColor: palette.border }]} />

        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={
              scheme === 'dark'
                ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={8}
            style={styles.appleButton}
            onPress={handleApple}
          />
        )}

        <Pressable
          onPress={handleGoogle}
          disabled={loading}
          style={({ pressed }) => [
            styles.googleButton,
            {
              backgroundColor: palette.card,
              borderColor: palette.border,
              opacity: pressed || loading ? 0.6 : 1,
            },
          ]}>
          <Image
            source={require('../assets/images/google-logo.png')}
            style={styles.googleLogo}
            resizeMode="contain"
          />
          <Text style={[styles.googleText, { color: palette.text }]}>Sign in with Google</Text>
        </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
  hero: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  heroTitle: {
    fontSize: 44,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  primaryButton: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggle: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 12,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 24,
  },
  appleButton: {
    height: 48,
    marginBottom: 12,
  },
  googleButton: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  googleLogo: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  googleText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
