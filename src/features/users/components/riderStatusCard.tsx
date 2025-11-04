import React from "react";
import {
  Card,
  Steps,
  Space,
  Avatar,
  Typography,
  Tag,
  Badge,
  Divider,
} from "antd";
import {
  UserOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { IUser } from "../../../types/interfaces/IUser";
import { IRiderStatus } from "../../../types/interfaces/IRIderStatus";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/it";

dayjs.extend(relativeTime);
dayjs.locale("it");

const { Text } = Typography;

interface RiderStatusCardProps {
  rider: IUser;
  status: IRiderStatus;
}

// Pickup statuses
const PICKUP_STATUSES = ["Assegnato", "Attesa ritiro", "In Ritiro", "Ritirato"];

// Delivery statuses
const DELIVERY_STATUSES = [
  "Assegnato",
  "Presa in Carico",
  "In Consegna",
  "Consegnato",
];

// Check if status is pickup or delivery
const isPickupStatus = (status: string): boolean => {
  return PICKUP_STATUSES.includes(status);
};

const isDeliveryStatus = (status: string): boolean => {
  return DELIVERY_STATUSES.includes(status);
};

// Map status to step index for PICKUP flow
const getPickupStepIndex = (status: string): number => {
  const statusMap: Record<string, number> = {
    Assegnato: 0,
    "Attesa ritiro": 1,
    "In Ritiro": 2,
    Ritirato: 3,
  };
  return statusMap[status] ?? 0;
};

// Map status to step index for DELIVERY flow
const getDeliveryStepIndex = (status: string): number => {
  const statusMap: Record<string, number> = {
    Assegnato: 0,
    "Presa in Carico": 1,
    "In Consegna": 2,
    Consegnato: 3,
  };
  return statusMap[status] ?? 0;
};
// Get color for status tag
const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    Assegnato: "geekblue",
    "Attesa ritiro": "orange",
    "In Ritiro": "purple",
    Ritirato: "cyan",
    "Presa in Carico": "gold",
    "In Consegna": "blue",
    Consegnato: "green",
    Annullato: "red",
  };
  return colorMap[status] || "default";
};

// Get description for each step
const getStepDescription = (
  stepIndex: number,
  currentStep: number,
  status: IRiderStatus
): string => {
  if (stepIndex < currentStep) {
    return "Completato";
  } else if (stepIndex === currentStep) {
    return status.headingTo || "In corso";
  } else {
    return "In attesa";
  }
};

const RiderStatusCard: React.FC<RiderStatusCardProps> = ({ rider, status }) => {
  let isPickup: boolean;
  let isDelivery: boolean;

  if (status.lastStatus === "Assegnato") {
    // For "Assegnato" status, check the headingTo field or destination
    // to determine if it's heading to pickup or delivery
    // If headingTo contains pickup location keywords, it's a pickup flow
    // Otherwise default to delivery flow

    // Option A: Check headingTo field
    const headingToLower = status.headingTo?.toLowerCase() || "";
    isPickup =
      headingToLower.includes("ritiro") || headingToLower.includes("pickup");
    isDelivery = !isPickup;

    // Option B: Or default to delivery if no clear indication
    // isDelivery = true;
    // isPickup = false;
  } else {
    isPickup = isPickupStatus(status.lastStatus);
    isDelivery = isDeliveryStatus(status.lastStatus);
  }

  const isCancelled = status.lastStatus === "Annullato";

  // Determine current step based on type
  const currentStep = isPickup
    ? getPickupStepIndex(status.lastStatus)
    : getDeliveryStepIndex(status.lastStatus);

  const isCompleted =
    status.lastStatus === "Consegnato" || status.lastStatus === "Ritirato";
  const timeAgo = dayjs(status.lastUpdate.toDate()).fromNow();

  // Define steps based on type
  const pickupSteps = [
    {
      title: "Assegnato",
      description: getStepDescription(0, currentStep, status),
      subTitle: currentStep === 0 ? timeAgo : undefined,
    },
    {
      title: "Attesa Ritiro",
      description: getStepDescription(1, currentStep, status),
      subTitle: currentStep === 1 ? timeAgo : undefined,
    },
    {
      title: "In Ritiro",
      description: getStepDescription(2, currentStep, status),
      subTitle: currentStep === 2 ? timeAgo : undefined,
    },
    {
      title: "Ritirato",
      description: getStepDescription(3, currentStep, status),
      subTitle: currentStep === 3 ? timeAgo : undefined,
    },
  ];
  const deliverySteps = [
    {
      title: "Assegnato",
      description: getStepDescription(0, currentStep, status),
      subTitle: currentStep === 0 ? timeAgo : undefined,
    },
    {
      title: "Presa in Carico",
      description: getStepDescription(1, currentStep, status),
      subTitle: currentStep === 1 ? timeAgo : undefined,
    },
    {
      title: "In Consegna",
      description: getStepDescription(2, currentStep, status),
      subTitle: currentStep === 2 ? timeAgo : undefined,
    },
    {
      title: "Consegnato",
      description: getStepDescription(3, currentStep, status),
      subTitle: currentStep === 3 ? timeAgo : undefined,
    },
  ];

  // Choose steps based on status type
  const steps = isPickup ? pickupSteps : deliverySteps;
  const flowType = isPickup ? "Ritiro" : "Consegna";

  return (
    <Card
      style={{
        marginBottom: 16,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        borderRadius: 8,
      }}
      bodyStyle={{ padding: "24px" }}
      hoverable
    >
      {/* Header with Rider Info */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Space align='center' size={12}>
          <div>
            <Text strong style={{ fontSize: 18, display: "block" }}>
              {rider.displayName}
            </Text>
            {rider.phoneNumber && (
              <Text type='secondary' style={{ fontSize: 13 }}>
                {rider.phoneNumber}
              </Text>
            )}
          </div>
        </Space>

        <Space direction='vertical' align='end' size={4}>
          <Tag
            color={getStatusColor(status.lastStatus)}
            style={{
              margin: 0,
              padding: "6px 16px",
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 6,
            }}
          >
            {status.lastStatus}
          </Tag>
        </Space>
      </div>

      <Divider style={{ margin: "16px 0 24px 0" }} />

      {/* Steps Component - Full Width Horizontal */}
      <div style={{ width: "100%", marginBottom: 24 }}>
        <Steps
          current={currentStep}
          status={isCancelled ? "error" : isCompleted ? "finish" : "process"}
          size='default'
          items={steps}
        />
      </div>

      <Divider style={{ margin: "24px 0 16px 0" }} />

      {/* Footer with destination and timestamp */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {status.headingTo ? (
          <Space size={8}>
            <EnvironmentOutlined style={{ color: "#1890ff", fontSize: 16 }} />
            <div>
              <Text
                type='secondary'
                style={{ fontSize: 12, display: "block", lineHeight: 1.2 }}
              >
                Destinazione
              </Text>
              <Text strong style={{ fontSize: 14 }}>
                {status.headingTo}
              </Text>
            </div>
          </Space>
        ) : (
          <div />
        )}

        <Space size={4}>
          <ClockCircleOutlined style={{ color: "#8c8c8c", fontSize: 14 }} />
          <Text type='secondary' style={{ fontSize: 12 }}>
            {dayjs(status.lastUpdate.toDate()).format("DD/MM/YYYY HH:mm:ss")}
          </Text>
        </Space>
      </div>
    </Card>
  );
};

export default RiderStatusCard;
