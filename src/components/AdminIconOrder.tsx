import { useState, useEffect } from "react";
import { GripVertical, Loader2, Eye, EyeOff, Pencil, Trash2, Check, X, Plus, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DYNAMIC_ICONS, pickIconFromName, slugify } from "@/lib/iconPicker";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Same labels as IconGrid
const ICON_LABELS: Record<string, string> = {
  trilha: "Trilha do Iniciante",
  vendas: "Central de Vendas & CRM",
  ferramentas: "Acessos de Ferramentas",
  treinamentos: "Treinamentos",
  carreira: "Plano de Carreira",
  apresentacao: "Apresentação de Produtos",
  sorteios: "Sorteios & Comunicados",
  credito: "Liberação de Crédito",
  jornada: "Jornada Impacto",
  equipe: "Gestão de Equipe",
  cliente: "Área do Cliente",
  analise: "Plataforma de Análise",
  loja: "Loja",
  locacao: "Locação de Materiais",
  presenca: "Presença Treinamentos",
  administrativo: "Gestão de Performance 360",
  agenda: "Agenda Online",
  paula: "Fale com a Paula",
  comissao: "Comissão",
  lideres: "Escola de Líderes",
};

interface IconOrder {
  id: string;
  sort_order: number;
  visible: boolean;
  custom_label?: string | null;
  icon_name?: string | null;
  route?: string | null;
  is_custom?: boolean | null;
}

const SortableIconItem = ({
  item,
  onToggleVisibility,
  onRename,
  onDelete,
}: {
  item: IconOrder;
  onToggleVisibility: (id: string) => void;
  onRename: (id: string, label: string) => Promise<void>;
  onDelete: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(item.custom_label || ICON_LABELS[item.id] || item.id);
  const PreviewIcon = (item.icon_name && DYNAMIC_ICONS[item.icon_name]) || null;

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 py-2.5 px-3 bg-card border border-border rounded-lg mb-1.5">
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 touch-none">
        <GripVertical className="w-4 h-4" />
      </button>
      {PreviewIcon && (
        <div className="w-7 h-7 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
          <PreviewIcon className="w-4 h-4 text-primary" />
        </div>
      )}
      {editing ? (
        <>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-8 text-sm flex-1"
            autoFocus
          />
          <button
            onClick={async () => {
              await onRename(item.id, value.trim());
              setEditing(false);
            }}
            className="text-primary hover:opacity-80 shrink-0"
            title="Salvar"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setValue(item.custom_label || ICON_LABELS[item.id] || item.id);
              setEditing(false);
            }}
            className="text-muted-foreground hover:text-foreground shrink-0"
            title="Cancelar"
          >
            <X className="w-4 h-4" />
          </button>
        </>
      ) : (
        <>
          <span className={`text-sm flex-1 ${item.visible ? "text-foreground" : "text-muted-foreground line-through"}`}>
            {item.custom_label || ICON_LABELS[item.id] || item.id}
            {item.is_custom && <span className="ml-2 text-[10px] uppercase tracking-wide text-primary">novo</span>}
          </span>
          <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground shrink-0" title="Renomear">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => onToggleVisibility(item.id)} className="text-muted-foreground hover:text-foreground shrink-0" title={item.visible ? "Ocultar" : "Mostrar"}>
            {item.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button onClick={() => onDelete(item.id)} className="text-destructive hover:opacity-80 shrink-0" title="Excluir da grade">
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
};

const AdminIconOrder = () => {
  const [items, setItems] = useState<IconOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const suggestedIcon = pickIconFromName(newName);
  const SuggestedIconCmp = DYNAMIC_ICONS[suggestedIcon] || Sparkles;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchOrder();
  }, []);

  const fetchOrder = async () => {
    const { data, error } = await supabase
      .from("icon_grid_order")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error("Erro ao carregar ordem");
    else setItems((data as IconOrder[]) || []);
    setLoading(false);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);

    setItems(reordered);

    const updates = reordered.map((item, index) =>
      supabase.from("icon_grid_order").update({ sort_order: index }).eq("id", item.id)
    );
    await Promise.all(updates);
    toast.success("Ordem salva!");
  };

  const handleToggleVisibility = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const newVisible = !item.visible;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, visible: newVisible } : i)));

    const { error } = await supabase
      .from("icon_grid_order")
      .update({ visible: newVisible })
      .eq("id", id);
    if (error) toast.error("Erro ao atualizar visibilidade");
    else toast.success(newVisible ? "Ícone visível" : "Ícone oculto");
  };

  const handleRename = async (id: string, label: string) => {
    const newLabel = label || null;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, custom_label: newLabel } : i)));
    const { error } = await supabase
      .from("icon_grid_order")
      .update({ custom_label: newLabel })
      .eq("id", id);
    if (error) toast.error("Erro ao renomear");
    else toast.success("Nome atualizado!");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este ícone da grade? Você poderá restaurá-lo recriando o registro.")) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    const { error } = await supabase.from("icon_grid_order").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir");
      fetchOrder();
    } else {
      toast.success("Ícone removido da grade");
    }
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error("Digite um nome para a nova aba");
      return;
    }
    setSaving(true);
    const baseSlug = slugify(name);
    // Garante slug único
    let slug = baseSlug;
    let suffix = 1;
    while (items.some((i) => i.id === slug)) {
      slug = `${baseSlug}-${suffix++}`;
    }
    const nextOrder = items.length;
    const icon_name = pickIconFromName(name);
    const { error } = await supabase.from("icon_grid_order").insert({
      id: slug,
      sort_order: nextOrder,
      visible: true,
      custom_label: name,
      icon_name,
      route: `/c/${slug}`,
      is_custom: true,
    });
    setSaving(false);
    if (error) {
      toast.error("Erro ao criar: " + error.message);
      return;
    }
    toast.success("Aba criada na tela inicial!");
    setNewName("");
    setCreating(false);
    fetchOrder();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-3">
        Arraste para reordenar os ícones da tela inicial. Use o ícone de olho para ocultar/mostrar.
      </p>

      {/* Criar nova aba */}
      <div className="border border-dashed border-border rounded-lg p-3 mb-3 bg-card/50">
        {!creating ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCreating(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova aba na tela inicial
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Digite o nome — o ícone ideal é sugerido automaticamente.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-md bg-primary/15 flex items-center justify-center shrink-0" title={`Ícone sugerido: ${suggestedIcon}`}>
                <SuggestedIconCmp className="w-5 h-5 text-primary" />
              </div>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Campanhas, Cursos Externos, Ofertas..."
                className="h-9 text-sm flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
              />
              <Button type="button" size="sm" onClick={handleCreate} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setCreating(false);
                  setNewName("");
                }}
              >
                Cancelar
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              A nova aba aparece na grade e abre uma página onde você pode adicionar conteúdos (em "Seções").
            </p>
          </div>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <SortableIconItem
              key={item.id}
              item={item}
              onToggleVisibility={handleToggleVisibility}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default AdminIconOrder;
