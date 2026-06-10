import React from "react";
import { Alert, Linking, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppText } from "../../components/AppText";
import { Card } from "../../components/Card";
import { IconButton } from "../../components/IconButton";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { theme } from "../../theme/theme";
import { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Support">;

const supportEmail = "support@mazemethod.app";

export function SupportScreen({ navigation }: Props) {
  const handleEmailSupport = async () => {
    const mailtoUrl = `mailto:${supportEmail}?subject=Maze%20Method%20TestFlight%20Feedback`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);

      if (!canOpen) {
        Alert.alert("Email unavailable", `Send feedback to ${supportEmail} from your email app.`);
        return;
      }

      await Linking.openURL(mailtoUrl);
    } catch {
      Alert.alert("Email unavailable", `Send feedback to ${supportEmail} from your email app.`);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton
          accessibilityLabel="Go back"
          icon="chevron-back"
          onPress={() => navigation.goBack()}
        />
        <AppText variant="heading">Support</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <Card accent>
        <View style={styles.titleRow}>
          <View style={styles.iconBadge}>
            <Ionicons color={theme.colors.text} name="mail-outline" size={22} />
          </View>
          <View style={styles.flex}>
            <AppText variant="subheading">Maze Method Support</AppText>
            <AppText muted>{supportEmail}</AppText>
          </View>
        </View>
        <AppText muted style={styles.cardText}>
          This is a placeholder support address for TestFlight readiness. Replace it with a real monitored email before inviting external testers.
        </AppText>
        <PrimaryButton
          icon="mail-outline"
          label="Email support"
          onPress={handleEmailSupport}
          style={styles.button}
        />
      </Card>

      <SectionHeader title="Tester notes" />
      <Card style={styles.stack}>
        <Bullet text="Include your iPhone model, iOS version, app build number, and what you were doing before the issue." />
        <Bullet text="Screenshots or screen recordings help confirm layout, navigation, photo, and sync bugs." />
        <Bullet text="Maze Coach provides general fitness and nutrition guidance only. It is not medical advice." />
        <Bullet text="Test data may be reset during TestFlight builds. Do not enter sensitive medical information." />
      </Card>
    </Screen>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.dot} />
      <AppText muted style={styles.flex}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  bulletRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  button: {
    marginTop: theme.spacing.md
  },
  cardText: {
    marginTop: theme.spacing.md
  },
  dot: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.pill,
    height: 7,
    marginTop: 8,
    width: 7
  },
  flex: {
    flex: 1
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.lg
  },
  headerSpacer: {
    width: 40
  },
  iconBadge: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.md,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  stack: {
    gap: theme.spacing.md
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md
  }
});
