import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

// Values point at the tokens in app/main.css (@theme static), which mirror docs/design-tokens.md.
// Change a colour or radius there, not here.
export const presets = definePreset(Aura, {
  semantic: {
    primary: {
      50: "var(--color-brand-subtle)",
      100: "var(--color-brand-soft)",
      200: "color-mix(in srgb, var(--color-brand) 25%, white)",
      300: "color-mix(in srgb, var(--color-brand) 50%, white)",
      400: "color-mix(in srgb, var(--color-brand) 75%, white)",
      500: "var(--color-brand)",
      600: "var(--color-brand-hover)",
      700: "var(--color-brand-active)",
      800: "color-mix(in srgb, var(--color-brand-active) 80%, black)",
      900: "color-mix(in srgb, var(--color-brand-active) 60%, black)",
      950: "color-mix(in srgb, var(--color-brand-active) 40%, black)",
    },
    colorScheme: {
      light: {
        surface: {
          0: "#FFFFFF",
          50: "var(--color-neutral-50)",
          100: "var(--color-neutral-100)",
          200: "var(--color-neutral-200)",
          300: "var(--color-neutral-300)",
          400: "var(--color-neutral-400)",
          500: "var(--color-neutral-500)",
          600: "var(--color-neutral-600)",
          700: "var(--color-neutral-700)",
          800: "var(--color-neutral-800)",
          900: "var(--color-neutral-900)",
          950: "color-mix(in srgb, var(--color-neutral-900) 80%, black)",
        },
        primary: {
          color: "{primary.500}",
          contrastColor: "#FFFFFF",
          hoverColor: "{primary.600}",
          activeColor: "{primary.700}",
        },
        content: {
          background: "{surface.0}",
          hoverBackground: "{surface.50}",
          borderColor: "{surface.200}",
          color: "{surface.900}",
          hoverColor: "{surface.900}",
        },
        text: {
          color: "{surface.900}",
          hoverColor: "{surface.900}",
          mutedColor: "{surface.600}",
          hoverMutedColor: "{surface.700}",
        },
        formField: {
          background: "{surface.0}",
          disabledBackground: "{surface.200}",
          filledBackground: "{surface.100}",
          filledHoverBackground: "{surface.100}",
          filledFocusBackground: "{surface.0}",
          borderColor: "{surface.400}",
          hoverBorderColor: "{primary.color}",
          focusBorderColor: "{primary.color}",
          invalidBorderColor: "var(--color-danger)",
          color: "{surface.900}",
          disabledColor: "{surface.500}",
          placeholderColor: "{surface.600}",
          invalidPlaceholderColor: "var(--color-danger)",
          floatLabelColor: "{surface.600}",
          floatLabelFocusColor: "{primary.600}",
          floatLabelInvalidColor: "var(--color-danger)",
          iconColor: "{surface.600}",
          shadow: "none",
          // 16px text, 24px line, 16px padding top and bottom = 56px, the merchant touch target.
          paddingX: "0.75rem",
          paddingY: "1rem",
          borderRadius: "var(--radius-md)",
        },
        highlight: {
          background: "var(--color-accent-soft)",
          focusBackground: "var(--color-accent)",
          color: "{surface.900}",
          focusColor: "{surface.900}",
        },
      },
    },
    focusRing: {
      width: "2px",
      style: "solid",
      color: "{primary.color}",
      offset: "2px",
      shadow: "none",
    },
  },
  components: {
    button: {
      root: {
        borderRadius: "var(--radius-md)",
        // Same arithmetic as the inputs: 56px for the main button, sm below is about 44px for chips and tabs.
        paddingX: "1rem",
        paddingY: "1rem",
        gap: "0.5rem",
        transitionDuration: "150ms",
        sm: {
          paddingY: "0.625rem",
        },
        primary: {
          background: "{primary.500}",
          hoverBackground: "{primary.600}",
          activeBackground: "{primary.700}",
          borderColor: "{primary.500}",
          hoverBorderColor: "{primary.600}",
          activeBorderColor: "{primary.700}",
          color: "#FFFFFF",
          hoverColor: "#FFFFFF",
          activeColor: "#FFFFFF",
          focusRing: {
            color: "{primary.200}",
            shadow: "none",
          },
        },
        // Neutral second action. Yellow is reserved for deal and time signals (see warn).
        secondary: {
          background: "{primary.100}",
          hoverBackground: "{primary.200}",
          activeBackground: "{primary.300}",
          borderColor: "{primary.100}",
          hoverBorderColor: "{primary.200}",
          activeBorderColor: "{primary.300}",
          color: "{primary.700}",
          hoverColor: "{primary.700}",
          activeColor: "{primary.700}",
          focusRing: {
            color: "{primary.300}",
            shadow: "none",
          },
        },
        // success is the brand green, same as primary (color.status.success = color.brand.primary).
        success: {
          background: "{primary.500}",
          hoverBackground: "{primary.600}",
          activeBackground: "{primary.700}",
          borderColor: "{primary.500}",
          hoverBorderColor: "{primary.600}",
          activeBorderColor: "{primary.700}",
          color: "#FFFFFF",
          hoverColor: "#FFFFFF",
          activeColor: "#FFFFFF",
          focusRing: {
            color: "{primary.200}",
            shadow: "none",
          },
        },
        // Accent action for deals; dark text because white on #F7B23B fails contrast.
        warn: {
          background: "var(--color-accent)",
          hoverBackground: "var(--color-accent-hover)",
          activeBackground: "color-mix(in srgb, var(--color-accent-hover) 85%, black)",
          borderColor: "var(--color-accent)",
          hoverBorderColor: "var(--color-accent-hover)",
          activeBorderColor: "color-mix(in srgb, var(--color-accent-hover) 85%, black)",
          color: "var(--color-accent-contrast)",
          hoverColor: "var(--color-accent-contrast)",
          activeColor: "var(--color-accent-contrast)",
          focusRing: {
            color: "var(--color-accent)",
            shadow: "none",
          },
        },
        danger: {
          background: "var(--color-danger)",
          hoverBackground: "color-mix(in srgb, var(--color-danger) 85%, black)",
          activeBackground: "color-mix(in srgb, var(--color-danger) 70%, black)",
          borderColor: "var(--color-danger)",
          hoverBorderColor: "color-mix(in srgb, var(--color-danger) 85%, black)",
          activeBorderColor: "color-mix(in srgb, var(--color-danger) 70%, black)",
          color: "#FFFFFF",
          hoverColor: "#FFFFFF",
          activeColor: "#FFFFFF",
          focusRing: {
            color: "color-mix(in srgb, var(--color-danger) 40%, white)",
            shadow: "none",
          },
        },
      },
    },
    // Flat card: a thin border separates white from the cream canvas, shadows are for sheets and popovers.
    card: {
      root: {
        background: "{surface.0}",
        color: "{text.color}",
        borderRadius: "var(--radius-md)",
        shadow: "none",
      },
      css: ({ dt }) => `.p-card { border: 1px solid ${dt("content.border.color")}; }`,
      subtitle: {
        color: "{text.muted.color}",
      },
    },
    tabs: {
      tablist: {
        background: "{surface.0}",
        borderColor: "{surface.200}",
      },
      tab: {
        color: "{text.muted.color}",
        hoverColor: "{primary.600}",
        activeColor: "{primary.600}",
        activeBorderColor: "{primary.500}",
      },
      tabpanel: {
        background: "{surface.0}",
        color: "{text.color}",
      },
    },
  },
});
