import { useState, useEffect } from "react";
import { ArrowLeft, ShoppingCart, Plus, Minus, Trash2, Loader2, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  stock: number;
}

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product?: Product;
}

const Loja = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    fetchProducts();
    if (user) fetchCart();
  }, [user]);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });
    setProducts((data as Product[]) || []);
    setLoading(false);
  };

  const fetchCart = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", user.id);
    setCart((data as CartItem[]) || []);
  };

  const addToCart = async (product: Product) => {
    if (!user) return;
    const existing = cart.find((c) => c.product_id === product.id);
    if (existing) {
      await supabase
        .from("cart_items")
        .update({ quantity: existing.quantity + 1 })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("cart_items")
        .insert({ user_id: user.id, product_id: product.id, quantity: 1 });
    }
    fetchCart();
    toast.success("Adicionado ao carrinho!");
  };

  const updateQuantity = async (cartItem: CartItem, delta: number) => {
    const newQty = cartItem.quantity + delta;
    if (newQty <= 0) {
      await supabase.from("cart_items").delete().eq("id", cartItem.id);
    } else {
      await supabase.from("cart_items").update({ quantity: newQty }).eq("id", cartItem.id);
    }
    fetchCart();
  };

  const removeFromCart = async (id: string) => {
    await supabase.from("cart_items").delete().eq("id", id);
    fetchCart();
  };

  const checkout = async () => {
    if (!user || cart.length === 0) return;
    const cartProducts = cart.map((c) => ({
      ...c,
      product: products.find((p) => p.id === c.product_id),
    }));
    const total = cartProducts.reduce((s, c) => s + (c.product?.price || 0) * c.quantity, 0);

    const { data: order, error } = await supabase
      .from("orders")
      .insert({ user_id: user.id, total, status: "pending" })
      .select()
      .single();

    if (error || !order) {
      toast.error("Erro ao criar pedido");
      return;
    }

    const orderItems = cartProducts.map((c) => ({
      order_id: order.id,
      product_id: c.product_id,
      quantity: c.quantity,
      unit_price: c.product?.price || 0,
    }));

    await supabase.from("order_items").insert(orderItems);
    await supabase.from("cart_items").delete().eq("user_id", user.id);

    setCart([]);
    setShowCart(false);
    toast.success("Pedido realizado com sucesso!");
  };

  const cartTotal = cart.reduce((s, c) => {
    const p = products.find((p) => p.id === c.product_id);
    return s + (p?.price || 0) * c.quantity;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="flex items-center justify-between px-4 pt-10 pb-4 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Loja</h1>
            <p className="text-xs text-muted-foreground">Produtos disponíveis</p>
          </div>
        </div>
        <button onClick={() => setShowCart(!showCart)} className="relative p-2">
          <ShoppingCart className="w-5 h-5 text-foreground" />
          {cart.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </button>
      </header>

      {showCart ? (
        <div className="p-4 space-y-3">
          <h2 className="text-sm font-bold text-foreground">Carrinho</h2>
          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Carrinho vazio</p>
          ) : (
            <>
              {cart.map((item) => {
                const product = products.find((p) => p.id === item.product_id);
                return (
                  <div key={item.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                    {product?.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-14 h-14 rounded-lg object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-secondary flex items-center justify-center">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{product?.name}</p>
                      <p className="text-xs text-primary font-semibold">
                        R$ {((product?.price || 0) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQuantity(item, -1)} className="p-1 text-muted-foreground hover:text-foreground">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-medium text-foreground w-5 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item, 1)} className="p-1 text-muted-foreground hover:text-foreground">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => removeFromCart(item.id)} className="p-1 text-muted-foreground hover:text-destructive ml-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold text-foreground">R$ {cartTotal.toFixed(2)}</span>
                </div>
                <Button onClick={checkout} className="w-full">Finalizar Pedido</Button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="p-4 grid grid-cols-2 gap-3">
          {products.map((product) => (
            <div key={product.id} className="bg-card border border-border rounded-xl overflow-hidden">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-28 object-cover" />
              ) : (
                <div className="w-full h-28 bg-secondary flex items-center justify-center">
                  <Package className="w-10 h-10 text-muted-foreground/40" />
                </div>
              )}
              <div className="p-3 space-y-1.5">
                <h3 className="text-xs font-semibold text-foreground line-clamp-2">{product.name}</h3>
                {product.description && (
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{product.description}</p>
                )}
                <p className="text-sm font-bold text-primary">R$ {product.price.toFixed(2)}</p>
                <Button size="sm" className="w-full text-xs gap-1" onClick={() => addToCart(product)}>
                  <ShoppingCart className="w-3 h-3" /> Adicionar
                </Button>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="col-span-2 text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Nenhum produto disponível</p>
            </div>
          )}
        </div>
      )}
      <BottomNav activeTab="home" onTabChange={() => navigate("/")} />
    </div>
  );
};

export default Loja;
