import React from "react";
import {
  useRouterContext,
  useRouterType,
  useLink,
  useRefineOptions,
} from "@refinedev/core";
import { Typography, theme, Space } from "antd";
import type { RefineLayoutThemedTitleProps } from "@refinedev/antd";

interface ExtendedThemedTitleProps extends RefineLayoutThemedTitleProps {
  /**
   * Optional image URL (png, svg, etc.).
   * If provided, it overrides the icon and displays an image at 24×24.
   */
  image?: string;
}

export const ThemedTitleV2: React.FC<ExtendedThemedTitleProps> = ({
  collapsed,
  icon: iconFromProps,
  text: textFromProps,
  wrapperStyles,
  image,
}) => {
  // Extract default icon/text from refine options (if any)
  const { title: { icon: defaultIcon, text: defaultText } = {} } =
    useRefineOptions();

  /**
   * Decide which icon to display:
   * 1. If `image` is provided, use <img>.
   * 2. Else if `iconFromProps` is provided, use it.
   * 3. Else fallback to `defaultIcon`.
   */
  const iconNode = image ? (
    <img
      src={image}
      alt='title icon'
      style={{ width: "24px", height: "24px" }}
    />
  ) : (
    iconFromProps ?? defaultIcon
  );

  // Decide which text to display
  const textToDisplay =
    typeof textFromProps === "undefined" ? defaultText : textFromProps;

  const { token } = theme.useToken();
  const routerType = useRouterType();
  const Link = useLink();
  const { Link: LegacyLink } = useRouterContext();

  const ActiveLink = routerType === "legacy" ? LegacyLink : Link;

  return (
    <ActiveLink
      to='/'
      style={{
        display: "inline-block",
        textDecoration: "none",
      }}
    >
      <Space
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: "inherit",
          ...wrapperStyles,
        }}
      >
        <div
          style={{
            height: "24px",
            width: "24px",
            color: token.colorPrimary,
          }}
        >
          {iconNode}
        </div>

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
    </ActiveLink>
  );
};
