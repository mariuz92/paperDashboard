import type { ThemeConfig } from "antd";

/**
 * Bold & Distinctive Ant Design 5 Theme
 * Features vibrant colors, strong contrasts, and modern typography
 * Compatible with Ant Design 5.x (current version: 5.27.4)
 */
export const boldTheme: ThemeConfig = {
  token: {
    // Color Palette - Vibrant & Decisive
    colorPrimary: "#6366f1",
    colorSuccess: "#10b981",
    colorWarning: "#f59e0b",
    colorError: "#ef4444",
    colorInfo: "#3b82f6",

    // Typography - Modern & Readable
    fontFamily:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 15,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    fontWeightStrong: 600,

    // Border Radius - Modern & Soft
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    borderRadiusXS: 4,

    // Spacing
    padding: 16,
    paddingLG: 24,
    paddingXL: 32,

    // Shadows - Deeper & More Dramatic
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
    boxShadowSecondary: "0 2px 8px rgba(0, 0, 0, 0.08)",

    // Motion - Snappier
    motionDurationFast: "0.15s",
    motionDurationMid: "0.25s",
    motionDurationSlow: "0.35s",

    // Background Colors
    colorBgContainer: "#ffffff",
    colorBgLayout: "#f8fafc",
    colorBgElevated: "#ffffff",

    // Text Colors
    colorText: "#0f172a",
    colorTextSecondary: "#475569",
    colorTextTertiary: "#94a3b8",

    // Border Colors
    colorBorder: "#e2e8f0",
    colorBorderSecondary: "#f1f5f9",

    // Control Heights
    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,
  },

  components: {
    Button: {
      primaryShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
      dangerShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
      fontWeight: 600,
      paddingContentHorizontal: 24,
      controlHeight: 42,
      controlHeightLG: 50,
      algorithm: true,
    },

    Input: {
      activeShadow: "0 0 0 3px rgba(99, 102, 241, 0.1)",
      controlHeight: 42,
      paddingBlock: 10,
      paddingInline: 14,
      activeBorderColor: "#6366f1",
      hoverBorderColor: "#818cf8",
      algorithm: true,
    },

    Select: {
      optionActiveBg: "#eef2ff",
      optionSelectedBg: "#e0e7ff",
      controlHeight: 42,
      algorithm: true,
    },

    Card: {
      headerFontSize: 18,
      headerFontSizeSM: 16,
      paddingLG: 24,
      algorithm: true,
    },

    Table: {
      headerBg: "#f8fafc",
      headerColor: "#0f172a",
      headerSplitColor: "#e2e8f0",
      rowHoverBg: "#f1f5f9",
      borderColor: "#e2e8f0",
      fontWeightStrong: 600,
      algorithm: true,
    },

    Modal: {
      titleFontSize: 20,
      fontWeightStrong: 600,
      algorithm: true,
    },

    Tabs: {
      itemActiveColor: "#6366f1",
      itemHoverColor: "#818cf8",
      itemSelectedColor: "#6366f1",
      inkBarColor: "#6366f1",
      titleFontSize: 15,
      algorithm: true,
    },

    Menu: {
      itemActiveBg: "#eef2ff",
      itemSelectedBg: "#e0e7ff",
      itemSelectedColor: "#6366f1",
      itemHoverColor: "#4f46e5",
      itemBorderRadius: 6,
      fontWeightStrong: 500,
      algorithm: true,
    },

    Tag: {
      defaultBg: "#f1f5f9",
      defaultColor: "#475569",
      algorithm: true,
    },

    Alert: {
      fontWeightStrong: 600,
      withDescriptionPadding: 16,
      algorithm: true,
    },

    Message: {
      contentBg: "#ffffff",
      algorithm: true,
    },

    Notification: {
      paddingContentHorizontal: 20,
      algorithm: true,
    },

    Progress: {
      defaultColor: "#6366f1",
      remainingColor: "#e2e8f0",
      circleTextColor: "#0f172a",
      algorithm: true,
    },

    Switch: {
      trackHeight: 24,
      trackMinWidth: 48,
      handleSize: 20,
      algorithm: true,
    },

    Badge: {
      textFontSize: 600,
      algorithm: true,
    },

    Layout: {
      headerBg: "#ffffff",
      bodyBg: "#f8fafc",
      siderBg: "#ffffff",
      algorithm: true,
    },

    Dropdown: {
      controlItemBgHover: "#f1f5f9",
      controlItemBgActive: "#e0e7ff",
      algorithm: true,
    },

    Drawer: {
      algorithm: true,
    },

    Pagination: {
      itemActiveBg: "#6366f1",
      algorithm: true,
    },

    Breadcrumb: {
      itemColor: "#475569",
      lastItemColor: "#0f172a",
      linkColor: "#6366f1",
      linkHoverColor: "#4f46e5",
      separatorColor: "#94a3b8",
      algorithm: true,
    },

    Steps: {
      colorPrimary: "#6366f1",
      algorithm: true,
    },

    Timeline: {
      tailColor: "#e2e8f0",
      dotBg: "#ffffff",
      algorithm: true,
    },

    Collapse: {
      headerBg: "#f8fafc",
      contentBg: "#ffffff",
      algorithm: true,
    },

    Descriptions: {
      labelBg: "#f8fafc",
      titleColor: "#0f172a",
      algorithm: true,
    },

    Result: {
      titleFontSize: 24,
      algorithm: true,
    },

    Statistic: {
      titleFontSize: 16,
      contentFontSize: 28,
      algorithm: true,
    },

    Empty: {
      fontSize: 14,
      algorithm: true,
    },

    Skeleton: {
      algorithm: true,
    },

    Anchor: {
      linkPaddingBlock: 4,
      linkPaddingInlineStart: 12,
      algorithm: true,
    },

    Segmented: {
      itemSelectedBg: "#6366f1",
      itemSelectedColor: "#ffffff",
      algorithm: true,
    },

    Carousel: {
      dotWidth: 16,
      dotHeight: 3,
      dotActiveWidth: 24,
      algorithm: true,
    },

    Cascader: {
      optionSelectedBg: "#e0e7ff",
      controlHeight: 42,
      algorithm: true,
    },

    DatePicker: {
      cellActiveWithRangeBg: "#eef2ff",
      cellHoverBg: "#f1f5f9",
      controlHeight: 42,
      algorithm: true,
    },

    Calendar: {
      itemActiveBg: "#eef2ff",
      fullBg: "#ffffff",
      algorithm: true,
    },

    Rate: {
      starColor: "#f59e0b",
      algorithm: true,
    },

    Radio: {
      algorithm: true,
    },

    Checkbox: {
      algorithm: true,
    },

    TreeSelect: {
      nodeSelectedBg: "#e0e7ff",
      nodeHoverBg: "#f1f5f9",
      controlHeight: 42,
      algorithm: true,
    },

    Tree: {
      nodeSelectedBg: "#e0e7ff",
      nodeHoverBg: "#f1f5f9",
      algorithm: true,
    },

    Upload: {
      actionsColor: "#475569",
      algorithm: true,
    },

    Avatar: {
      containerSize: 32,
      containerSizeLG: 40,
      containerSizeSM: 24,
      algorithm: true,
    },

    Transfer: {
      algorithm: true,
    },

    Tour: {
      algorithm: true,
    },

    FloatButton: {
      algorithm: true,
    },

    QRCode: {
      algorithm: true,
    },

    Mentions: {
      controlHeight: 42,
      algorithm: true,
    },

    ColorPicker: {
      algorithm: true,
    },

    Flex: {
      algorithm: true,
    },

    Splitter: {
      algorithm: true,
    },

    Image: {
      previewOperationColor: "#ffffff",
      algorithm: true,
    },

    Typography: {
      titleMarginBottom: "0.5em",
      titleMarginTop: "1.2em",
      algorithm: true,
    },

    Divider: {
      algorithm: true,
    },

    Space: {
      algorithm: true,
    },

    Grid: {
      algorithm: true,
    },

    Form: {
      labelFontSize: 15,
      algorithm: true,
    },

    Slider: {
      algorithm: true,
    },

    InputNumber: {
      controlHeight: 42,
      algorithm: true,
    },

    Tooltip: {
      algorithm: true,
    },

    Popover: {
      algorithm: true,
    },

    Popconfirm: {
      algorithm: true,
    },

    Spin: {
      algorithm: true,
    },

    List: {
      algorithm: true,
    },
  },
};

/**
 * Bold Dark Theme for Ant Design 5
 * Complete dark mode configuration
 */
export const boldDarkTheme: ThemeConfig = {
  token: {
    // Color Palette - Adjusted for dark mode
    colorPrimary: "#818cf8",
    colorSuccess: "#34d399",
    colorWarning: "#fbbf24",
    colorError: "#f87171",
    colorInfo: "#60a5fa",

    // Typography
    fontFamily:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 15,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    fontWeightStrong: 600,

    // Border Radius
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    borderRadiusXS: 4,

    // Spacing
    padding: 16,
    paddingLG: 24,
    paddingXL: 32,

    // Shadows - Darker
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
    boxShadowSecondary: "0 2px 8px rgba(0, 0, 0, 0.4)",

    // Motion
    motionDurationFast: "0.15s",
    motionDurationMid: "0.25s",
    motionDurationSlow: "0.35s",

    // Dark Backgrounds
    colorBgContainer: "#1e293b",
    colorBgLayout: "#0f172a",
    colorBgElevated: "#1e293b",
    colorBgSpotlight: "#334155",

    // Dark Text
    colorText: "#f1f5f9",
    colorTextSecondary: "#cbd5e1",
    colorTextTertiary: "#94a3b8",
    colorTextQuaternary: "#64748b",

    // Dark Borders
    colorBorder: "#334155",
    colorBorderSecondary: "#475569",

    // Dark Fills
    colorFill: "#334155",
    colorFillSecondary: "#475569",
    colorFillTertiary: "#64748b",

    // Control Heights
    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,
  },

  components: {
    Button: {
      primaryShadow: "0 2px 8px rgba(129, 140, 248, 0.4)",
      dangerShadow: "0 2px 8px rgba(248, 113, 113, 0.4)",
      fontWeight: 600,
      paddingContentHorizontal: 24,
      defaultBg: "#334155",
      defaultBorderColor: "#475569",
      defaultColor: "#f1f5f9",
      controlHeight: 42,
      controlHeightLG: 50,
      algorithm: true,
    },

    Input: {
      activeShadow: "0 0 0 3px rgba(129, 140, 248, 0.2)",
      colorBgContainer: "#1e293b",
      colorText: "#f1f5f9",
      colorTextPlaceholder: "#94a3b8",
      activeBorderColor: "#818cf8",
      hoverBorderColor: "#6366f1",
      controlHeight: 42,
      paddingBlock: 10,
      paddingInline: 14,
      algorithm: true,
    },

    Select: {
      optionActiveBg: "#334155",
      optionSelectedBg: "#475569",
      colorBgContainer: "#1e293b",
      colorBgElevated: "#334155",
      selectorBg: "#1e293b",
      controlHeight: 42,
      algorithm: true,
    },

    Card: {
      headerFontSize: 18,
      headerFontSizeSM: 16,
      colorBgContainer: "#1e293b",
      colorBorderSecondary: "#334155",
      paddingLG: 24,
      algorithm: true,
    },

    Table: {
      headerBg: "#334155",
      headerColor: "#f1f5f9",
      headerSplitColor: "#475569",
      rowHoverBg: "#334155",
      borderColor: "#475569",
      fontWeightStrong: 600,
      colorBgContainer: "#1e293b",
      algorithm: true,
    },

    Modal: {
      titleFontSize: 20,
      fontWeightStrong: 600,
      contentBg: "#1e293b",
      headerBg: "#1e293b",
      algorithm: true,
    },

    Tabs: {
      itemActiveColor: "#818cf8",
      itemHoverColor: "#a5b4fc",
      itemSelectedColor: "#818cf8",
      inkBarColor: "#818cf8",
      titleFontSize: 15,
      cardBg: "#1e293b",
      algorithm: true,
    },

    Menu: {
      itemActiveBg: "#334155",
      itemSelectedBg: "#475569",
      itemSelectedColor: "#818cf8",
      itemHoverColor: "#a5b4fc",
      itemBorderRadius: 6,
      fontWeightStrong: 500,
      darkItemBg: "#1e293b",
      darkSubMenuItemBg: "#1e293b",
      algorithm: true,
    },

    Tag: {
      defaultBg: "#334155",
      defaultColor: "#cbd5e1",
      algorithm: true,
    },

    Alert: {
      fontWeightStrong: 600,
      withDescriptionPadding: 16,
      colorInfoBg: "#1e3a5f",
      colorSuccessBg: "#1a3d2e",
      colorWarningBg: "#4a3414",
      colorErrorBg: "#4a1d1d",
      algorithm: true,
    },

    Message: {
      contentBg: "#1e293b",
      algorithm: true,
    },

    Notification: {
      colorBgElevated: "#1e293b",
      paddingContentHorizontal: 20,
      algorithm: true,
    },

    Tooltip: {
      colorBgSpotlight: "#334155",
      algorithm: true,
    },

    Progress: {
      defaultColor: "#818cf8",
      remainingColor: "#334155",
      circleTextColor: "#f1f5f9",
      algorithm: true,
    },

    Switch: {
      trackHeight: 24,
      trackMinWidth: 48,
      handleSize: 20,
      colorPrimary: "#818cf8",
      colorPrimaryHover: "#a5b4fc",
      algorithm: true,
    },

    Badge: {
      textFontSize: 600,
      algorithm: true,
    },

    Layout: {
      headerBg: "#1e293b",
      bodyBg: "#0f172a",
      siderBg: "#1e293b",
      triggerBg: "#334155",
      algorithm: true,
    },

    Dropdown: {
      colorBgElevated: "#1e293b",
      controlItemBgHover: "#334155",
      controlItemBgActive: "#475569",
      algorithm: true,
    },

    Drawer: {
      colorBgElevated: "#1e293b",
      algorithm: true,
    },

    Pagination: {
      itemActiveBg: "#818cf8",
      itemBg: "#1e293b",
      itemLinkBg: "#1e293b",
      algorithm: true,
    },

    Breadcrumb: {
      itemColor: "#cbd5e1",
      lastItemColor: "#f1f5f9",
      linkColor: "#818cf8",
      linkHoverColor: "#a5b4fc",
      separatorColor: "#64748b",
      algorithm: true,
    },

    Steps: {
      colorPrimary: "#818cf8",
      algorithm: true,
    },

    Timeline: {
      tailColor: "#475569",
      dotBg: "#1e293b",
      algorithm: true,
    },

    Collapse: {
      headerBg: "#334155",
      contentBg: "#1e293b",
      algorithm: true,
    },

    Descriptions: {
      labelBg: "#334155",
      titleColor: "#f1f5f9",
      algorithm: true,
    },

    Result: {
      titleFontSize: 24,
      algorithm: true,
    },

    Statistic: {
      titleFontSize: 16,
      contentFontSize: 28,
      algorithm: true,
    },

    Empty: {
      fontSize: 14,
      algorithm: true,
    },

    Skeleton: {
      algorithm: true,
    },

    Anchor: {
      linkPaddingBlock: 4,
      linkPaddingInlineStart: 12,
      algorithm: true,
    },

    Segmented: {
      itemSelectedBg: "#818cf8",
      itemSelectedColor: "#ffffff",
      itemColor: "#1e293b",
      trackBg: "#334155",
      algorithm: true,
    },

    Carousel: {
      dotWidth: 16,
      dotHeight: 3,
      dotActiveWidth: 24,
      algorithm: true,
    },

    Cascader: {
      optionSelectedBg: "#475569",
      controlHeight: 42,
      algorithm: true,
    },

    DatePicker: {
      cellActiveWithRangeBg: "#334155",
      cellHoverBg: "#334155",
      cellBgDisabled: "#475569",
      controlHeight: 42,
      algorithm: true,
    },

    Calendar: {
      itemActiveBg: "#334155",
      fullBg: "#1e293b",
      fullPanelBg: "#1e293b",
      algorithm: true,
    },

    Rate: {
      starColor: "#fbbf24",
      algorithm: true,
    },

    Radio: {
      algorithm: true,
    },

    Checkbox: {
      algorithm: true,
    },

    TreeSelect: {
      nodeSelectedBg: "#475569",
      nodeHoverBg: "#334155",
      controlHeight: 42,
      algorithm: true,
    },

    Tree: {
      nodeSelectedBg: "#475569",
      nodeHoverBg: "#334155",
      algorithm: true,
    },

    Upload: {
      actionsColor: "#cbd5e1",
      algorithm: true,
    },

    Avatar: {
      containerSize: 32,
      containerSizeLG: 40,
      containerSizeSM: 24,
      algorithm: true,
    },

    Transfer: {
      algorithm: true,
    },

    Tour: {
      algorithm: true,
    },

    FloatButton: {
      algorithm: true,
    },

    QRCode: {
      algorithm: true,
    },

    Mentions: {
      controlHeight: 42,
      algorithm: true,
    },

    ColorPicker: {
      algorithm: true,
    },

    Flex: {
      algorithm: true,
    },

    Splitter: {
      algorithm: true,
    },

    Image: {
      previewOperationColor: "#f1f5f9",
      algorithm: true,
    },

    Popover: {
      colorBgElevated: "#1e293b",
      algorithm: true,
    },

    Popconfirm: {
      colorBgElevated: "#1e293b",
      algorithm: true,
    },

    Typography: {
      titleMarginBottom: "0.5em",
      titleMarginTop: "1.2em",
      algorithm: true,
    },

    Divider: {
      algorithm: true,
    },

    Space: {
      algorithm: true,
    },

    Grid: {
      algorithm: true,
    },

    Form: {
      labelFontSize: 15,
      algorithm: true,
    },

    Slider: {
      algorithm: true,
    },

    InputNumber: {
      controlHeight: 42,
      colorBgContainer: "#1e293b",
      algorithm: true,
    },

    Spin: {
      algorithm: true,
    },

    List: {
      algorithm: true,
    },
  },
};

// Usage in your App.tsx:
// import { boldTheme, boldDarkTheme } from './config/theme';
// <ConfigProvider theme={boldTheme}>
//   <App />
// </ConfigProvider>
