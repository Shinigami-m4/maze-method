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

type WorkoutModalProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function WorkoutModal({ visible, title, onClose, children }: WorkoutModalProps) {
  return (
    <Modal animationType="slide" presentationStyle="pageSheet" visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalRoot}
      >
        <View style={styles.header}>
          <IconButton accessibilityLabel="Close" icon="close" onPress={onClose} />
          <AppText variant="heading">{title}</AppText>
          <View style={styles.headerSpacer} />
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.md
  },
  headerSpacer: {
    width: 40
  },
  modalRoot: {
    backgroundColor: theme.colors.background,
    flex: 1
  }
});
