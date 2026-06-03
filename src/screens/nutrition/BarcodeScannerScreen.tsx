import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { CameraView, BarcodeScanningResult, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppText } from "../../components/AppText";
import { Card } from "../../components/Card";
import { IconButton } from "../../components/IconButton";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { lookupFoodByBarcode } from "../../services/foodLookupService";
import { normalizeBarcodeValue } from "../../services/barcodeService";
import { theme } from "../../theme/theme";
import { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "BarcodeScanner">;

const supportedBarcodeTypes = ["ean13", "ean8", "upc_a", "upc_e"] as const;

export function BarcodeScannerScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsProcessing(false);
    }, [])
  );

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      // Camera permission is requested before rendering CameraView so iOS never opens
      // the scanner until the user explicitly grants access.
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarcodeScanned = useCallback(
    async (result: BarcodeScanningResult) => {
      const barcode = normalizeBarcodeValue(result.data);
      if (isProcessing || !barcode) {
        return;
      }

      // CameraView can report the same barcode several times per second. Turning off
      // the callback while this state is true prevents duplicate API lookups and saves.
      setIsProcessing(true);

      try {
        const food = await lookupFoodByBarcode(barcode);
        navigation.navigate("FoodConfirmation", { food });
      } catch {
        Alert.alert("Scan failed", "Try scanning again or enter the food manually.");
        setIsProcessing(false);
      }
    },
    [isProcessing, navigation]
  );

  const hasPermission = permission?.granted;

  return (
    <Screen scroll={false} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <IconButton
          accessibilityLabel="Close scanner"
          icon="close"
          onPress={() => navigation.goBack()}
        />
        <View style={styles.headerText}>
          <AppText muted variant="caption">
            Maze Method
          </AppText>
          <AppText variant="heading">Scan Food</AppText>
        </View>
      </View>

      {!permission ? (
        <ScannerStateCard
          icon="scan-outline"
          title="Preparing camera"
          body="Camera permission status is loading."
        />
      ) : null}

      {permission && !hasPermission ? (
        <ScannerStateCard
          icon="camera-outline"
          title="Camera permission needed"
          body="Maze Method uses the camera only to scan food barcodes for nutrition logging."
          actionLabel="Allow Camera"
          onAction={() => void requestPermission()}
        />
      ) : null}

      {hasPermission ? (
        <View style={styles.cameraShell}>
          <CameraView
            active={!isProcessing}
            barcodeScannerSettings={{ barcodeTypes: [...supportedBarcodeTypes] }}
            facing="back"
            onBarcodeScanned={isProcessing ? undefined : handleBarcodeScanned}
            style={styles.camera}
          />
          <View style={styles.overlay}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
            <Card accent style={styles.instructionCard}>
              <View style={styles.instructionRow}>
                <Ionicons color={theme.colors.accent} name="barcode-outline" size={22} />
                <View style={styles.flex}>
                  <AppText variant="subheading">
                    {isProcessing ? "Looking up food" : "Center the barcode"}
                  </AppText>
                  <AppText muted>
                    {isProcessing
                      ? "Scanning is paused so this barcode is only submitted once."
                      : "Use a UPC or EAN food barcode. You can edit values before saving."}
                  </AppText>
                </View>
                {isProcessing ? <ActivityIndicator color={theme.colors.accent} /> : null}
              </View>
            </Card>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

function ScannerStateCard({
  icon,
  title,
  body,
  actionLabel,
  onAction
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Card style={styles.stateCard}>
      <Ionicons color={theme.colors.accent} name={icon} size={32} />
      <AppText style={styles.stateTitle} variant="heading">
        {title}
      </AppText>
      <AppText muted style={styles.stateBody}>
        {body}
      </AppText>
      {actionLabel && onAction ? (
        <PrimaryButton icon="camera-outline" label={actionLabel} onPress={onAction} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1
  },
  cameraShell: {
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    marginTop: theme.spacing.lg,
    overflow: "hidden"
  },
  content: {
    paddingBottom: theme.spacing.lg
  },
  corner: {
    borderColor: theme.colors.accent,
    height: 44,
    position: "absolute",
    width: 44
  },
  cornerBottomLeft: {
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    bottom: 0,
    left: 0
  },
  cornerBottomRight: {
    borderBottomWidth: 3,
    borderRightWidth: 3,
    bottom: 0,
    right: 0
  },
  cornerTopLeft: {
    borderLeftWidth: 3,
    borderTopWidth: 3,
    left: 0,
    top: 0
  },
  cornerTopRight: {
    borderRightWidth: 3,
    borderTopWidth: 3,
    right: 0,
    top: 0
  },
  flex: {
    flex: 1
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md
  },
  headerText: {
    flex: 1
  },
  instructionCard: {
    bottom: theme.spacing.md,
    left: theme.spacing.md,
    position: "absolute",
    right: theme.spacing.md
  },
  instructionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.16)",
    justifyContent: "center"
  },
  scanFrame: {
    height: 190,
    position: "relative",
    width: "78%"
  },
  stateBody: {
    marginBottom: theme.spacing.lg,
    textAlign: "center"
  },
  stateCard: {
    alignItems: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xl
  },
  stateTitle: {
    textAlign: "center"
  }
});
