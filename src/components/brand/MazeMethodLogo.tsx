import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Svg, {
  Defs,
  G,
  LinearGradient,
  Path,
  Stop
} from "react-native-svg";

import { AppText } from "../AppText";
import { theme } from "../../theme/theme";

type MazeMethodLogoProps = {
  markOnly?: boolean;
  showTagline?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
  wordmarkLayout?: "stacked" | "horizontal";
};

/**
 * Reusable coded Maze Method logo.
 *
 * The mark is intentionally built as SVG strokes instead of a raster image so it
 * can scale cleanly across the splash screen, headers, auth screens, and future
 * app icon reference work.
 */
export function MazeMethodLogo({
  markOnly = false,
  showTagline = true,
  size = 160,
  style,
  wordmarkLayout = "stacked"
}: MazeMethodLogoProps) {
  const markHeight = size * 0.86;

  return (
    <View style={[styles.container, style]}>
      <MazeMethodMark height={markHeight} width={size} />
      {!markOnly ? (
        <View style={styles.wordmarkBlock}>
          <View
            style={[
              styles.wordmarkRow,
              wordmarkLayout === "stacked" && styles.wordmarkStack
            ]}
          >
            <AppText style={[styles.wordmark, styles.mazeText]}>MAZE</AppText>
            <AppText style={[styles.wordmark, styles.methodText]}>METHOD</AppText>
          </View>
          {showTagline ? (
            <AppText muted style={styles.tagline} variant="caption">
              Every Rep Has Direction
            </AppText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function MazeMethodMark({ height, width }: { height: number; width: number }) {
  return (
    <Svg height={height} viewBox="0 0 220 190" width={width}>
      <Defs>
        <LinearGradient id="mazeMethodPurple" x1="24" x2="196" y1="18" y2="176">
          <Stop offset="0" stopColor="#A855F7" />
          <Stop offset="0.52" stopColor={theme.colors.accent} />
          <Stop offset="1" stopColor="#5B21B6" />
        </LinearGradient>
      </Defs>

      <G
        fill="none"
        opacity={0.32}
        stroke={theme.colors.accent}
        strokeLinecap="square"
        strokeLinejoin="miter"
      >
        <Path d="M34 166 V30 L110 89 L186 30 V166" strokeWidth={30} />
        <Path d="M64 166 V75 L110 116 L156 75 V166" strokeWidth={24} />
      </G>

      <G
        fill="none"
        stroke="url(#mazeMethodPurple)"
        strokeLinecap="square"
        strokeLinejoin="miter"
      >
        <Path
          d="M34 166 V30 L110 89 L186 30 V166"
          opacity={0.96}
          strokeWidth={18}
        />
        <Path
          d="M64 166 V75 L110 116 L156 75 V166"
          opacity={0.9}
          strokeWidth={16}
        />
        <Path
          d="M92 166 V126 L110 145 L128 126 V166"
          opacity={0.86}
          strokeWidth={14}
        />
      </G>
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center"
  },
  mazeText: {
    color: theme.colors.text
  },
  methodText: {
    color: theme.colors.accent
  },
  tagline: {
    fontStyle: "italic",
    marginTop: theme.spacing.xs,
    textAlign: "center"
  },
  wordmark: {
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 32,
    textAlign: "center"
  },
  wordmarkBlock: {
    alignItems: "center",
    marginTop: theme.spacing.sm
  },
  wordmarkRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  wordmarkStack: {
    flexDirection: "column",
    gap: 0
  }
});
