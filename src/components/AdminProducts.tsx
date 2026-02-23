import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Loader2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  stock: number;
  active: boolean;
}

interface RentalItem {
  id: string;
  name: string;
  description: string | null;
  daily_price: number;
  image_url: string | null;
  category: string | null;
  active: boolean;
}

const AdminProducts = () => {
  const [tab, setTab] = useState<"products" | "rentals">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [rentalItems, setRentalItems] = useState<RentalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("Geral");
  const [stock, setStock] = useState("0");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [pRes, rRes] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("rental_items").select("*").order("created_at", { ascending: false }),
    ]);
    setProducts((pRes.data as Product[]) || []);
    setRentalItems((rRes.data as RentalItem[]) || []);
    setLoading(false);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setName("");
    setDescription("");
    setPrice("");
    setImageUrl("");
    setCategory("Geral");
    setStock("0");
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const table = tab === "products" ? "products" : "rental_items";
    const priceField = tab === "products" ? "price" : "daily_price";

    const record: any = {
      name: name.trim(),
      description: description.trim() || null,
      [priceField]: parseFloat(price) || 0,
      image_url: imageUrl.trim() || null,
      category: category.trim() || "Geral",
    };
    if (tab === "products") record.stock = parseInt(stock) || 0;

    if (editingId) {
      const { error } = await supabase.from(table).update(record).eq("id", editingId);
      if (error) toast.error("Erro ao atualizar");
      else toast.success("Atualizado!");
    } else {
      const { error } = await supabase.from(table).insert(record);
      if (error) toast.error("Erro ao criar: " + error.message);
      else toast.success("Criado!");
    }
    resetForm();
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    const table = tab === "products" ? "products" : "rental_items";
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Excluído!"); fetchAll(); }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setName(item.name);
    setDescription(item.description || "");
    setPrice(String(item.price ?? item.daily_price ?? 0));
    setImageUrl(item.image_url || "");
    setCategory(item.category || "Geral");
    setStock(String(item.stock ?? 0));
    setShowForm(true);
  };

  const currentItems = tab === "products" ? products : rentalItems;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-secondary rounded-lg p-1">
        <button
          onClick={() => { setTab("products"); resetForm(); }}
          className={`flex-1 py-1.5 text-xs font-medium rounded ${tab === "products" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          Produtos
        </button>
        <button
          onClick={() => { setTab("rentals"); resetForm(); }}
          className={`flex-1 py-1.5 text-xs font-medium rounded ${tab === "rentals" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          Locação
        </button>
      </div>

      <Button onClick={() => { resetForm(); setShowForm(true); }} className="w-full gap-2">
        <Plus className="w-4 h-4" /> {tab === "products" ? "Novo Produto" : "Novo Item de Locação"}
      </Button>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-sm text-foreground">
            {editingId ? "Editar" : "Novo"} {tab === "products" ? "Produto" : "Item de Locação"}
          </h3>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição"
            rows={2}
            className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none border border-input"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={tab === "products" ? "Preço (R$)" : "Preço/dia (R$)"}
            />
            {tab === "products" && (
              <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Estoque" />
            )}
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Categoria" />
          </div>
          <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="URL da imagem (opcional)" />
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={!name.trim()} className="flex-1">
              {editingId ? "Salvar" : "Criar"}
            </Button>
            <Button variant="outline" onClick={resetForm}>Cancelar</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {currentItems.map((item: any) => (
          <div key={item.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                <Package className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
              <p className="text-xs text-primary font-semibold">
                R$ {(item.price ?? item.daily_price ?? 0).toFixed(2)}
                {tab === "rentals" && "/dia"}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => handleEdit(item)} className="p-1.5 text-muted-foreground hover:text-foreground">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(item.id)} className="p-1.5 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {currentItems.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nenhum item cadastrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
