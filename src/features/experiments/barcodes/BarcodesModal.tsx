import {
  Badge,
  Button,
  Checkbox,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Table,
  Text,
  UnstyledButton,
} from "@mantine/core";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { BarcodeMetadata } from "../../../backend/contract";

interface BarcodesModalProps {
  opened: boolean;
  onClose: () => void;
  metadata: BarcodeMetadata[];
  /** Currently applied barcodes, in order. */
  selected: string[];
  onApply: (selected: string[]) => void;
}

export function BarcodesModal({
  opened,
  onClose,
  metadata,
  selected,
  onApply,
}: BarcodesModalProps) {
  const { t } = useTranslation();
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      title={t("experiments.barcodes.title")}
    >
      <BarcodesEditor
        metadata={metadata}
        selected={selected}
        onCancel={onClose}
        onApply={(next) => {
          onApply(next);
          onClose();
        }}
      />
    </Modal>
  );
}

interface EditorProps {
  metadata: BarcodeMetadata[];
  selected: string[];
  onCancel: () => void;
  onApply: (selected: string[]) => void;
}

// Mounted only while the modal is open, so the draft restarts from the applied state.
function BarcodesEditor({
  metadata,
  selected,
  onCancel,
  onApply,
}: EditorProps) {
  const { t } = useTranslation();
  const byBarcode = new Map(metadata.map((row) => [row.barcode, row]));
  const [order, setOrder] = useState(() => {
    const picked = new Set(selected);
    return [
      ...selected,
      ...metadata.map((row) => row.barcode).filter((b) => !picked.has(b)),
    ];
  });
  const [checked, setChecked] = useState(() => new Set(selected));

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over === null || active.id === over.id) return;
    setOrder((current) =>
      arrayMove(
        current,
        current.indexOf(String(active.id)),
        current.indexOf(String(over.id)),
      ),
    );
  };

  const toggle = (barcode: string) =>
    setChecked((current) => {
      const next = new Set(current);
      if (!next.delete(barcode)) next.add(barcode);
      return next;
    });

  return (
    <Stack>
      <Group justify="space-between">
        <Text size="sm" c="dimmed" aria-live="polite">
          {t("experiments.barcodes.count", {
            selected: checked.size,
            total: order.length,
          })}
        </Text>
        <Group gap="xs">
          <Button
            size="xs"
            variant="default"
            onClick={() => setChecked(new Set(order))}
          >
            {t("experiments.barcodes.selectAll")}
          </Button>
          <Button
            size="xs"
            variant="default"
            onClick={() => setChecked(new Set())}
          >
            {t("experiments.barcodes.selectNone")}
          </Button>
          <Button
            size="xs"
            variant="default"
            onClick={() => setOrder(metadata.map((row) => row.barcode))}
          >
            {t("experiments.barcodes.resetOrder")}
          </Button>
        </Group>
      </Group>
      <ScrollArea.Autosize mah="60vh">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            <Table stickyHeader>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={40} />
                  <Table.Th w={40} />
                  <Table.Th>{t("experiments.barcodes.barcode")}</Table.Th>
                  <Table.Th>{t("experiments.barcodes.sampleName")}</Table.Th>
                  <Table.Th>{t("experiments.barcodes.sampleType")}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {order.map((barcode) => {
                  const row = byBarcode.get(barcode);
                  if (row === undefined) return null;
                  return (
                    <BarcodeRow
                      key={barcode}
                      row={row}
                      checked={checked.has(barcode)}
                      onToggle={() => toggle(barcode)}
                    />
                  );
                })}
              </Table.Tbody>
            </Table>
          </SortableContext>
        </DndContext>
      </ScrollArea.Autosize>
      <Group justify="flex-end">
        <Button variant="default" onClick={onCancel}>
          {t("experiments.barcodes.cancel")}
        </Button>
        <Button
          onClick={() =>
            onApply(order.filter((barcode) => checked.has(barcode)))
          }
        >
          {t("experiments.barcodes.apply")}
        </Button>
      </Group>
    </Stack>
  );
}

interface RowProps {
  row: BarcodeMetadata;
  checked: boolean;
  onToggle: () => void;
}

function BarcodeRow({ row, checked, onToggle }: RowProps) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.barcode });

  return (
    <Table.Tr
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        position: "relative",
        zIndex: isDragging ? 1 : undefined,
        background: isDragging ? "var(--mantine-color-body)" : undefined,
      }}
    >
      <Table.Td>
        <UnstyledButton
          ref={setActivatorNodeRef}
          aria-label={t("experiments.barcodes.drag", { barcode: row.barcode })}
          style={{ cursor: "grab", touchAction: "none" }}
          {...attributes}
          {...listeners}
        >
          ⠿
        </UnstyledButton>
      </Table.Td>
      <Table.Td>
        <Checkbox
          checked={checked}
          onChange={onToggle}
          aria-label={t("experiments.barcodes.select", {
            barcode: row.barcode,
          })}
        />
      </Table.Td>
      <Table.Td>{row.barcode}</Table.Td>
      <Table.Td>{row.sampleId}</Table.Td>
      <Table.Td>
        {row.sampleType === "positive" ? (
          <Badge color="green" variant="light">
            {t("experiments.readMapping.positiveControl")}
          </Badge>
        ) : row.sampleType === "negative" ? (
          <Badge color="gray" variant="light">
            {t("experiments.readMapping.negativeControl")}
          </Badge>
        ) : (
          t("experiments.barcodes.typeSample")
        )}
      </Table.Td>
    </Table.Tr>
  );
}
