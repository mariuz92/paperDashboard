import React from "react";
import { useLink, useRefineOptions } from "@refinedev/core";
import { Typography, theme, Space } from "antd";
import type { RefineLayoutThemedTitleProps } from "@refinedev/antd";

interface ExtendedThemedTitleProps extends RefineLayoutThemedTitleProps {
  /**
   * Optional image URL (png, svg, etc.).
   * If provided, it overrides the icon and displays an image at 24×24.
   */
  image?: string;

  /**
   * Hide icon/image completely
   */
  hideIcon?: boolean;
}

export const ThemedTitle: React.FC<ExtendedThemedTitleProps> = ({
  collapsed,
  icon: iconFromProps,
  text: textFromProps,
  wrapperStyles,
  image,
  hideIcon = false,
}) => {
  const { title: { icon: defaultIcon, text: defaultText } = {} } =
    useRefineOptions();

  const { token } = theme.useToken();
  const Link = useLink();

  const textToDisplay =
    typeof textFromProps === "undefined" ? defaultText : textFromProps;

  // Build the icon node only if not hidden
  let iconNode: React.ReactNode = null;
  if (!hideIcon) {
    iconNode = image ? (
      <img src={image} alt="title icon" style={{ width: 24, height: 24, borderRadius:"50%" }} />
    ) : (
      iconFromProps ?? defaultIcon
    );
  }

  return (
    <Link to="/" style={{ display: "inline-block", textDecoration: "none" }}>
      <Space
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: "inherit",
          ...wrapperStyles,
        }}
      >
        {/* Show icon/image only if provided and not hidden */}
        {!hideIcon && iconNode && (
          <div
            style={{
              height: 24,
              width: 24,
              color: token.colorPrimary,
            }}
          >
            {iconNode}
          </div>
        )}

        {/* Show text only if not collapsed */}
        {!collapsed && (
          <Typography.Title
            style={{
              fontSize: "inherit",
              marginBottom: 0,
              fontWeight: 700,
            }}
          >
            {textToDisplay}
          </Typography.Title>
        )}
      </Space>
    </Link>
  );
};
