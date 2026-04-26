import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSigninButton } from '@react-native-google-signin/google-signin';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuthStore } from '@/stores/authStore';

export default function SignInScreen() {
  const scheme = useColorScheme();
  const palette = Colors[scheme];
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { signInWithEmail, signUpWithEmail, signInWithApple, signInWithGoogle } =
    useAuthStore();

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
      style={{ flex: 1, backgroundColor: palette.background }}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Petalwise</Text>
        <Text style={[styles.subtitle, { color: palette.secondaryText }]}>
          {mode === 'signIn' ? 'Sign in to continue' : 'Create an account'}
        </Text>

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

        <GoogleSigninButton
          size={GoogleSigninButton.Size.Wide}
          color={
            scheme === 'dark'
              ? GoogleSigninButton.Color.Light
              : GoogleSigninButton.Color.Dark
          }
          onPress={handleGoogle}
          disabled={loading}
          style={styles.googleButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
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
  divider: {
    height: 1,
    marginVertical: 24,
  },
  appleButton: {
    height: 48,
    marginBottom: 12,
  },
  googleButton: {
    width: '100%',
    height: 48,
  },
});
