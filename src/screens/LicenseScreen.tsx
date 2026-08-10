import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Linking } from 'react-native';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, Card, Button } from '@/components/UI';
import { colors, space, type, radius } from '@/theme/theme';

const REPO_URL = 'https://github.com/GromGets/iron-log';
const CC_LICENSE_URL = 'https://creativecommons.org/licenses/by-nc-sa/4.0';
const RELEASES_API_URL = 'https://api.github.com/repos/GromGets/iron-log/releases/latest';

type UpdateState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'upToDate' }
  | { status: 'available'; version: string; downloadUrl: string }
  | { status: 'error'; message: string };

function isNewerVersion(latest: string, current: string): boolean {
  const a = latest.split('.').map((n) => parseInt(n, 10) || 0);
  const b = current.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}

export default function LicenseScreen() {
  const insets = useSafeAreaInsets();
  const [updateState, setUpdateState] = useState<UpdateState>({ status: 'idle' });
  const currentVersion = Constants.expoConfig?.version ?? '0.0.0';

  const handleCheckUpdates = async () => {
    setUpdateState({ status: 'checking' });
    try {
      const res = await fetch(RELEASES_API_URL);
      if (!res.ok) throw new Error(`GitHub respondió ${res.status}`);
      const release = await res.json();
      const latestVersion = String(release.tag_name ?? '').replace(/^v/, '');
      const apkAsset = (release.assets ?? []).find((a: any) => a.name?.endsWith('.apk'));
      if (apkAsset && isNewerVersion(latestVersion, currentVersion)) {
        setUpdateState({ status: 'available', version: latestVersion, downloadUrl: apkAsset.browser_download_url });
      } else {
        setUpdateState({ status: 'upToDate' });
      }
    } catch {
      setUpdateState({
        status: 'error',
        message: 'No se pudo comprobar si hay actualizaciones. Revisá tu conexión e intentá de nuevo.',
      });
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: space.xxl * 2 + insets.bottom }]}>
        <Card>
          <View style={styles.titleRow}>
            <View style={styles.titleBar} />
            <Text style={styles.title}>LICENCIA DE USO</Text>
          </View>

          <Text style={styles.paragraph}>
            Idea, diseño, estructura y modelo de datos de esta app son obra original de:
          </Text>
          <Text style={styles.author}>Agustín Diano</Text>

          <Text style={[styles.paragraph, { marginTop: space.md }]}>
            © {new Date().getFullYear()} Agustín Diano. Distribuido bajo licencia{' '}
            <Text style={{ color: colors.accent, fontWeight: '700' }}>
              Creative Commons Atribución-NoComercial-CompartirIgual 4.0 Internacional (CC BY-NC-SA 4.0)
            </Text>
            .
          </Text>

          <LicenseSection label="Permitido:" color={colors.positive}>
            usar, copiar, estudiar y modificar libremente esta aplicación, siempre dando crédito a Agustín
            Diano como autor original de la idea.
          </LicenseSection>

          <LicenseSection label="Prohibido:" color={colors.danger}>
            vender esta aplicación o cualquier versión modificada de ella, o darle cualquier uso comercial
            (cobrar por su acceso, uso o distribución).
          </LicenseSection>

          <LicenseSection label="Si publicás una versión modificada:" color={colors.accent}>
            debe seguir siendo gratuita, mantener el crédito al autor original y compartirse bajo esta misma
            licencia (CC BY-NC-SA 4.0).
          </LicenseSection>

          <Text style={[styles.paragraph, styles.legalText]}>
            Texto legal completo de la licencia:{' '}
            <Text style={styles.link} onPress={() => Linking.openURL(CC_LICENSE_URL)}>
              creativecommons.org/licenses/by-nc-sa/4.0
            </Text>
            . El código fuente completo está en{' '}
            <Text style={styles.link} onPress={() => Linking.openURL(REPO_URL)}>
              github.com/GromGets/iron-log
            </Text>
            , con el archivo LICENSE correspondiente.
          </Text>

          <View style={styles.divider} />

          <Text style={type.bodySecondary}>Versión instalada: {currentVersion}</Text>

          <View style={{ marginTop: space.md }}>
            <Button
              label={updateState.status === 'checking' ? 'Buscando…' : 'Buscar actualizaciones'}
              variant="secondary"
              disabled={updateState.status === 'checking'}
              onPress={handleCheckUpdates}
            />
          </View>

          {updateState.status === 'upToDate' && (
            <Text style={[type.bodySecondary, { marginTop: space.sm }]}>Ya tenés la última versión.</Text>
          )}
          {updateState.status === 'error' && (
            <Text style={[type.bodySecondary, { marginTop: space.sm, color: colors.danger }]}>
              {updateState.message}
            </Text>
          )}
          {updateState.status === 'available' && (
            <View style={{ marginTop: space.sm }}>
              <Text style={[type.bodySecondary, { marginBottom: space.sm }]}>
                Hay una versión nueva disponible: {updateState.version}
              </Text>
              <Button label="Descargar actualización" onPress={() => Linking.openURL(updateState.downloadUrl)} />
            </View>
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}

function LicenseSection({
  label,
  color,
  children,
}: {
  label: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginTop: space.md }}>
      <Text style={styles.paragraph}>
        <Text style={{ color, fontWeight: '700' }}>{label}</Text> {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space.lg,
    paddingBottom: space.xxl * 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  titleBar: {
    width: 4,
    height: 22,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  title: {
    fontFamily: type.title.fontFamily,
    fontWeight: '700',
    fontSize: 17,
    color: colors.accent,
    letterSpacing: 0.5,
  },
  paragraph: {
    ...type.body,
    marginTop: space.md,
    lineHeight: 21,
  },
  author: {
    fontFamily: type.title.fontFamily,
    fontWeight: '700',
    fontSize: 22,
    color: colors.accent,
    textAlign: 'center',
    marginTop: space.sm,
  },
  legalText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  link: {
    color: colors.accent,
    textDecorationLine: 'underline',
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: space.lg,
    marginBottom: space.md,
  },
});
