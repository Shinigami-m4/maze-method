import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  View
} from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Stop
} from "react-native-svg";

import { AppText } from "../AppText";
import { theme } from "../../theme/theme";
import { MazeMethodLogo } from "./MazeMethodLogo";

type MazeSplashAnimationProps = {
  durationMs?: number;
  onFinish: () => void;
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

const mazeViewBox = { height: 180, width: 240 };
const mazePathLength = 680;
const mazePath =
  "M20 106 H70 V66 H116 V96 H162 V142 H102 V120 H76 V154 H126 V124 H188 V82 H216 V22";

const routePoints = [
  { x: 20, y: 106 },
  { x: 70, y: 106 },
  { x: 70, y: 66 },
  { x: 116, y: 66 },
  { x: 116, y: 96 },
  { x: 162, y: 96 },
  { x: 162, y: 142 },
  { x: 102, y: 142 },
  { x: 102, y: 120 },
  { x: 76, y: 120 },
  { x: 76, y: 154 },
  { x: 126, y: 154 },
  { x: 126, y: 124 },
  { x: 188, y: 124 },
  { x: 188, y: 82 },
  { x: 216, y: 82 },
  { x: 216, y: 22 }
];

const routeProgress = routePoints.map((_, index) => index / (routePoints.length - 1));

const particles = [
  { x: 0.14, y: 0.35, scale: 0.6 },
  { x: 0.23, y: 0.28, scale: 0.4 },
  { x: 0.3, y: 0.62, scale: 0.5 },
  { x: 0.48, y: 0.18, scale: 0.45 },
  { x: 0.62, y: 0.66, scale: 0.6 },
  { x: 0.72, y: 0.3, scale: 0.35 },
  { x: 0.82, y: 0.48, scale: 0.5 }
];

/**
 * Premium launch animation for Maze Method.
 *
 * Sections:
 * 1. Subtle particles and maze fragments appear.
 * 2. Purple light draws the route through the maze.
 * 3. The route fades into the geometric MM mark.
 * 4. The wordmark and tagline fade in before the app transition.
 */
export function MazeSplashAnimation({
  durationMs = 3900,
  onFinish
}: MazeSplashAnimationProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
  const mazeWidth = Math.min(width * 0.78, 300);
  const mazeHeight = (mazeWidth / mazeViewBox.width) * mazeViewBox.height;
  const dotScale = mazeWidth / mazeViewBox.width;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      duration: durationMs,
      easing: Easing.bezier(0.2, 0.82, 0.18, 1),
      toValue: 1,
      useNativeDriver: false
    });

    animation.start(({ finished }) => {
      if (finished) {
        onFinish();
      }
    });

    return () => animation.stop();
  }, [durationMs, onFinish, progress]);

  const dotPosition = useMemo(() => ({
    translateX: progress.interpolate({
      inputRange: routeProgress.map((value) => 0.12 + value * 0.42),
      outputRange: routePoints.map((point) => point.x * dotScale - 7),
      extrapolate: "clamp"
    }),
    translateY: progress.interpolate({
      inputRange: routeProgress.map((value) => 0.12 + value * 0.42),
      outputRange: routePoints.map((point) => point.y * dotScale - 7),
      extrapolate: "clamp"
    })
  }), [dotScale, progress]);

  const screenOpacity = progress.interpolate({
    inputRange: [0, 0.92, 1],
    outputRange: [1, 1, 0]
  });
  const particleOpacity = progress.interpolate({
    inputRange: [0, 0.12, 0.48],
    outputRange: [0, 1, 0.25]
  });
  const mazeOpacity = progress.interpolate({
    inputRange: [0, 0.12, 0.56, 0.72],
    outputRange: [0, 1, 1, 0]
  });
  const pathDashOffset = progress.interpolate({
    inputRange: [0.12, 0.54],
    outputRange: [mazePathLength, 0],
    extrapolate: "clamp"
  });
  const logoOpacity = progress.interpolate({
    inputRange: [0.52, 0.72],
    outputRange: [0, 1],
    extrapolate: "clamp"
  });
  const logoScale = progress.interpolate({
    inputRange: [0.52, 0.72],
    outputRange: [0.92, 1],
    extrapolate: "clamp"
  });
  const wordmarkOpacity = progress.interpolate({
    inputRange: [0.72, 0.9],
    outputRange: [0, 1],
    extrapolate: "clamp"
  });
  const wordmarkTranslate = progress.interpolate({
    inputRange: [0.72, 0.9],
    outputRange: [12, 0],
    extrapolate: "clamp"
  });
  const dotOpacity = progress.interpolate({
    inputRange: [0.1, 0.14, 0.58, 0.66],
    outputRange: [0, 1, 1, 0],
    extrapolate: "clamp"
  });

  return (
    <Animated.View style={[styles.screen, { opacity: screenOpacity }]}>
      <View style={[styles.mazeStage, { height: mazeHeight, width: mazeWidth }]}>
        <Animated.View style={[styles.particleLayer, { opacity: particleOpacity }]}>
          {particles.map((particle) => (
            <View
              key={`${particle.x}-${particle.y}`}
              style={[
                styles.particle,
                {
                  left: particle.x * mazeWidth,
                  top: particle.y * mazeHeight,
                  transform: [{ scale: particle.scale }]
                }
              ]}
            />
          ))}
        </Animated.View>

        <Animated.View style={[styles.absoluteFill, { opacity: mazeOpacity }]}>
          <Svg height={mazeHeight} viewBox="0 0 240 180" width={mazeWidth}>
            <Defs>
              <LinearGradient id="splashPathGradient" x1="20" x2="216" y1="106" y2="22">
                <Stop offset="0" stopColor="#5B21B6" />
                <Stop offset="0.5" stopColor={theme.colors.accent} />
                <Stop offset="1" stopColor="#C084FC" />
              </LinearGradient>
            </Defs>
            <G opacity={0.32} stroke={theme.colors.accent} strokeWidth={1.1}>
              <Path d="M20 24 H216 V156 H26 V42 H140 V76 H198" fill="none" />
              <Path d="M48 50 H104 V132 H52 V82 H134" fill="none" />
              <Path d="M136 34 H192 V110 H118 V154" fill="none" />
              <Line x1="22" x2="98" y1="106" y2="106" />
              <Line x1="116" x2="182" y1="66" y2="66" />
            </G>
            <AnimatedPath
              d={mazePath}
              fill="none"
              opacity={0.34}
              stroke={theme.colors.accent}
              strokeDasharray={mazePathLength}
              strokeDashoffset={pathDashOffset as unknown as number}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={15}
            />
            <AnimatedPath
              d={mazePath}
              fill="none"
              stroke="url(#splashPathGradient)"
              strokeDasharray={mazePathLength}
              strokeDashoffset={pathDashOffset as unknown as number}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={5}
            />
            <Circle cx={20} cy={106} fill={theme.colors.accent} opacity={0.7} r={2.5} />
          </Svg>
        </Animated.View>

        <Animated.View
          style={[
            styles.trackerDot,
            {
              opacity: dotOpacity,
              transform: [
                { translateX: dotPosition.translateX },
                { translateY: dotPosition.translateY }
              ]
            }
          ]}
        />

        <Animated.View
          style={[
            styles.logoReveal,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }]
            }
          ]}
        >
          <MazeMethodLogo markOnly size={mazeWidth * 0.72} />
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.wordmark,
          {
            opacity: wordmarkOpacity,
            transform: [{ translateY: wordmarkTranslate }]
          }
        ]}
      >
        <AppText style={styles.mazeText}>MAZE</AppText>
        <AppText style={styles.methodText}>METHOD</AppText>
        <View style={styles.taglineRow}>
          <View style={styles.taglineRule} />
          <AppText muted style={styles.tagline} variant="caption">
            Every Rep Has Direction
          </AppText>
          <View style={styles.taglineRule} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  absoluteFill: {
    ...StyleSheet.absoluteFillObject
  },
  logoReveal: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center"
  },
  mazeStage: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.lg
  },
  mazeText: {
    color: theme.colors.text,
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 39,
    textAlign: "center"
  },
  methodText: {
    color: theme.colors.accent,
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 31,
    textAlign: "center"
  },
  particle: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.pill,
    height: 5,
    position: "absolute",
    shadowColor: theme.colors.accent,
    shadowOpacity: 0.9,
    shadowRadius: 10,
    width: 5
  },
  particleLayer: {
    ...StyleSheet.absoluteFillObject
  },
  screen: {
    alignItems: "center",
    backgroundColor: theme.colors.background,
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xl
  },
  tagline: {
    fontStyle: "italic",
    textAlign: "center"
  },
  taglineRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs
  },
  taglineRule: {
    backgroundColor: theme.colors.accent,
    height: StyleSheet.hairlineWidth,
    opacity: 0.7,
    width: 42
  },
  trackerDot: {
    backgroundColor: theme.colors.text,
    borderColor: theme.colors.accent,
    borderRadius: theme.radii.pill,
    borderWidth: 3,
    height: 14,
    left: 0,
    position: "absolute",
    shadowColor: theme.colors.accent,
    shadowOpacity: 1,
    shadowRadius: 16,
    top: 0,
    width: 14
  },
  wordmark: {
    alignItems: "center",
    minHeight: 102
  }
});
