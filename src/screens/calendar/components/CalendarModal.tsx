import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  View
} from "react-native";

import { AppText } from "../../../components/AppText";
import { IconButton } from "../../../components/IconButton";
import { theme } from "../../../theme/theme";

type CalendarModalProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function CalendarModal({ visible, title, onClose, children }: CalendarModalProps) {
  return (
    <Modal animationType="slide" presentationStyle="pageSheet" visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.root}
      >
        <View style={styles.header}>
          <IconButton accessibilityLabel="Close" icon="close" onPress={onClose} />
          <AppText variant="heading">{title}</AppText>
          <View style={styles.spacer} />
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg
  },
  header: {
    alignItems: "center",
    backgroundColor: theme.colors.background,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxl
  },
  root: {
    backgroundColor: theme.colors.background,
    flex: 1
  },
  spacer: {
    width: 40
  }
});
