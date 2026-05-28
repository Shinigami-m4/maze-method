import { colors } from "./colors";
import { spacing } from "./spacing";

export const theme = {
  colors,
  spacing,
  radii: {
    sm: 6,
    md: 8,
    lg: 12,
    pill: 999
  },
  typography: {
    title: {
      fontSize: 32,
      fontWeight: "800" as const,
      lineHeight: 38
    },
    heading: {
      fontSize: 22,
      fontWeight: "800" as const,
      lineHeight: 28
    },
    subheading: {
      fontSize: 17,
      fontWeight: "700" as const,
      lineHeight: 22
    },
    body: {
      fontSize: 15,
      fontWeight: "500" as const,
      lineHeight: 21
    },
    caption: {
      fontSize: 12,
      fontWeight: "600" as const,
      lineHeight: 16
    }
  }
} as const;
