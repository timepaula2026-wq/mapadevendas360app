import { useState } from "react";
import { X } from "lucide-react";

interface CreateTrainingModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { title: string; description: string; category: string }) => void;
}

const categories = ["Desenvolvimento", "Design", "Marketing", "Vendas"];

const CreateTrainingModal = ({ open, onClose, onCreate }: CreateTrainingModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!title.trim()) return;
    onCreate({ title: title.trim(), description: description.trim(), category });
    setTitle("");
    setDescription("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 animate-fade-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">Novo Treinamento</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do treinamento"
              className="w-full bg-secondary rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sobre o que é este treinamento?"
              rows={3}
              className="w-full bg-secondary rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Categoria</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    category === cat
                      ? "gradient-gold text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="w-full gradient-gold text-primary-foreground font-semibold py-3 rounded-lg transition-opacity disabled:opacity-40 mt-2"
          >
            Criar Treinamento
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTrainingModal;
