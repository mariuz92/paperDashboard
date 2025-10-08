import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Modal,
  Card,
  Row,
  Col,
  InputNumber,
  Button,
  Tag,
  Tooltip,
  Divider,
  Badge,
  Space,
  message,
} from "antd";
import { SaveOutlined, ReloadOutlined } from "@ant-design/icons";
// ⬇️ adjust these paths
import { updateFreeChannels } from "../helper/channelsSync";
import { updateTenantById } from "../../users/api/userApi";

// ---- helpers from your code (kept identical to your storage keys) ----
const getChannelDataFromStorage = (): {
  totalChannels: number;
  iddleChannels: number[];
  disabledChannels: number[];
} => {
  const storedChannels = localStorage.getItem("channels");
  const totalChannels: number = storedChannels
    ? Number(JSON.parse(storedChannels))
    : 0;

  const storedIddleChannels = localStorage.getItem("Iddlechannels");
  const iddleChannels: number[] = storedIddleChannels
    ? JSON.parse(storedIddleChannels)
    : [];

  const storedDisabledChannels = localStorage.getItem("disabledChannels");
  const disabledChannels: number[] = storedDisabledChannels
    ? JSON.parse(storedDisabledChannels)
    : [];

  return { totalChannels, iddleChannels, disabledChannels };
};

type ChannelState = "free" | "iddle" | "disabled";

interface ManageChannelsProps {
  tenantId: string;
  visible: boolean; // antd v2 prop
  onClose: () => void; // called on cancel/after save
  onSaved?: () => void; // optional callback after successful save
  startFromZero?: boolean; // default true, if false builds channels from 1..N
}

const asSet = (arr: number[]) => new Set<number>(arr);
const toSortedArray = (s: Set<number>) => Array.from(s).sort((a, b) => a - b);

const ManageChannels: React.FC<ManageChannelsProps> = ({
  tenantId,
  visible,
  onClose,
  onSaved,
}) => {
  // ---- state ----
  const [totalChannels, setTotalChannels] = useState<number>(0);
  const [iddleSet, setIddleSet] = useState<Set<number>>(new Set());
  const [disabledSet, setDisabledSet] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  // ---- load initial from storage ----
  useEffect(() => {
    if (!visible) return; // load fresh when modal opens
    const { totalChannels, iddleChannels, disabledChannels } =
      getChannelDataFromStorage();
    setTotalChannels(totalChannels);
    setIddleSet(asSet(iddleChannels));
    setDisabledSet(asSet(disabledChannels));
  }, [visible]);

  // ---- derive channels list [0..N] inclusive (you asked in past to include 0) ----
  const allChannels = useMemo(
    () => Array.from({ length: Math.max(totalChannels + 1, 0) }, (_, i) => i),
    [totalChannels]
  );

  // ---- compute freeChannels & persist to localStorage whenever sets/total change ----
  const freeChannels = useMemo(() => {
    const free = allChannels.filter(
      (ch) => !iddleSet.has(ch) && !disabledSet.has(ch)
    );
    return free;
  }, [allChannels, iddleSet, disabledSet]);

  useEffect(() => {
    if (!visible) return; // only persist while editing in modal
    localStorage.setItem("channels", JSON.stringify(totalChannels));
    localStorage.setItem(
      "Iddlechannels",
      JSON.stringify(toSortedArray(iddleSet))
    );
    localStorage.setItem(
      "disabledChannels",
      JSON.stringify(toSortedArray(disabledSet))
    );

    try {
      updateFreeChannels(
        totalChannels,
        toSortedArray(iddleSet),
        toSortedArray(disabledSet),
        []
      );
    } catch {
      // ignore — function writes to localStorage in your impl
    }
  }, [visible, totalChannels, iddleSet, disabledSet]);

  // ---- channel state & toggling ----
  const getState = (ch: number): ChannelState => {
    if (disabledSet.has(ch)) return "disabled";
    if (iddleSet.has(ch)) return "iddle";
    return "free";
  };

  // cycle: free → iddle → disabled → free
  const toggleChannel = (ch: number) => {
    const state = getState(ch);
    setIddleSet((prev) => {
      const next = new Set(prev);
      setDisabledSet((prevD) => {
        const nextD = new Set(prevD);
        if (state === "free") {
          next.add(ch); // to iddle
          nextD.delete(ch);
        } else if (state === "iddle") {
          next.delete(ch);
          nextD.add(ch); // to disabled
        } else {
          // disabled -> free
          next.delete(ch);
          nextD.delete(ch);
        }
        return nextD;
      });
      return next;
    });
  };

  const resetFromStorage = () => {
    const { totalChannels, iddleChannels, disabledChannels } =
      getChannelDataFromStorage();
    setTotalChannels(totalChannels);
    setIddleSet(asSet(iddleChannels));
    setDisabledSet(asSet(disabledChannels));
    message.info("Valori ripristinati");
  };

  const saveToTenant = useCallback(async () => {
    if (!tenantId) {
      message.error("Errore.");
      return;
    }
    setSaving(true);
    try {
      await updateTenantById(tenantId, {
        channelsNum: totalChannels,
        iddleChannels: toSortedArray(iddleSet),
        disabledChannels: toSortedArray(disabledSet),
      } as any);
      message.success("Canali aggiornati.");
      onSaved?.();
      onClose();
    } catch (e) {
      console.error(e);
      message.error("Errore durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  }, [tenantId, totalChannels, iddleSet, disabledSet, onSaved, onClose]);

  // ---- UI helpers ----
  // types: type ChannelState = "free" | "iddle" | "disabled";

  const stateTag = (state: ChannelState, count?: number) => {
    const color =
      state === "free" ? "green" : state === "iddle" ? "gold" : "red";
    const label =
      state === "free"
        ? "Libero"
        : state === "iddle"
        ? "Non utilizzabile"
        : "Disabilitato";

    return (
      <Tag color={color}>
        {label}
        {typeof count === "number" ? (
          <strong style={{ marginLeft: 6 }}>{count}</strong>
        ) : null}
      </Tag>
    );
  };

  const counters = (
    <Space size='large' wrap>
      {stateTag("free", freeChannels.length)}
      {stateTag("iddle", iddleSet.size)}
      {stateTag("disabled", disabledSet.size)}
    </Space>
  );

  return (
    <Modal
      title='Gestione Canali'
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      destroyOnHidden
      maskClosable={!saving}
      confirmLoading={saving}
    >
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Card title='Impostazioni canali'>
            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 6 }}>Numero totale di canali</div>
              <InputNumber
                min={0}
                value={totalChannels}
                onChange={(val) => setTotalChannels(Number(val || 0))}
                style={{ width: "100%" }}
              />
            </div>

            <Divider />

            <div style={{ marginBottom: 16 }}>{counters}</div>
            <Divider />
            <Space>
              <Button icon={<ReloadOutlined />} onClick={resetFromStorage}>
                Ripristina
              </Button>
              <Button
                type='primary'
                icon={<SaveOutlined />}
                loading={saving}
                onClick={saveToTenant}
              >
                Salva
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card
            title='Canali'
            extra={
              <span>
                Clicca un canale per cambiare stato (Libero → Utilizzato →
                Disabilitato)
              </span>
            }
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {allChannels.map((ch) => {
                const state = getState(ch);
                const color =
                  state === "free"
                    ? "green"
                    : state === "iddle"
                    ? "gold"
                    : "red";
                const label =
                  state === "free"
                    ? "Libero"
                    : state === "iddle"
                    ? "Non utilizzabile"
                    : "Disabilitato";
                return (
                  <Tooltip key={ch} title={`Canale ${ch} — ${label}`}>
                    <Tag
                      color={color}
                      style={{
                        cursor: "pointer",
                        margin: 0,
                        padding: "4px 10px",
                        userSelect: "none",
                      }}
                      onClick={() => toggleChannel(ch)}
                    >
                      {ch}
                    </Tag>
                  </Tooltip>
                );
              })}
            </div>
          </Card>
        </Col>
      </Row>
    </Modal>
  );
};

export default ManageChannels;
