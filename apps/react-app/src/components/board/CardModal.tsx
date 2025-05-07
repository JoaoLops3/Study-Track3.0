import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  X,
  Calendar,
  Tag,
  Trash2,
  Edit2,
  Pen,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  CheckSquare,
  Link,
  Image,
  Code,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import RichTextEditor from "../editor/RichTextEditor";
import type { Database } from "../../lib/database.types";

type Card = Database["public"]["Tables"]["cards"]["Row"];
type Column = Database["public"]["Tables"]["columns"]["Row"];

interface CardModalProps {
  card: Card;
  column: Column | undefined;
  onClose: () => void;
  onCardUpdate: (card: Card) => void;
  onCardDelete: (cardId: string) => void;
}

const CardModal = ({
  card,
  column,
  onClose,
  onCardUpdate,
  onCardDelete,
}: CardModalProps) => {
  const [title, setTitle] = useState(card.title);
  const [editingTitle, setEditingTitle] = useState(false);
  const [content, setContent] = useState(card.description || "");
  const [dueDate, setDueDate] = useState<string | null>(card.due_date || null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tags, setTags] = useState<string[]>(card.tags || []);
  const [newTag, setNewTag] = useState("");
  const [addingTag, setAddingTag] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [manualDate, setManualDate] = useState("");
  const [isManualInput, setIsManualInput] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const updateCardTitle = async () => {
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("cards")
        .update({ title: title.trim(), updated_at: new Date().toISOString() })
        .eq("id", card.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        onCardUpdate(data);
      }

      setEditingTitle(false);
    } catch (error) {
      console.error("Error updating card title:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateCardContent = async (newContent: any) => {
    setContent(newContent);

    try {
      const { data, error } = await supabase
        .from("cards")
        .update({
          description: newContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", card.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        onCardUpdate(data);
      }
    } catch (error) {
      console.error("Error updating card content:", error);
    }
  };

  const updateDueDate = async (date: string | null) => {
    setDueDate(date);
    setShowDatePicker(false);

    try {
      const { data, error } = await supabase
        .from("cards")
        .update({ updated_at: date })
        .eq("id", card.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        onCardUpdate(data);
      }
    } catch (error) {
      console.error("Error updating due date:", error);
    }
  };

  const addTag = async () => {
    if (!newTag.trim()) return;

    const updatedTags = [...tags, newTag.trim()];
    setTags(updatedTags);
    setNewTag("");
    setAddingTag(false);

    try {
      const { data, error } = await supabase
        .from("cards")
        .update({ tags: updatedTags })
        .eq("id", card.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        onCardUpdate(data);
      }
    } catch (error) {
      console.error("Error adding tag:", error);
    }
  };

  const removeTag = async (tagToRemove: string) => {
    const updatedTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(updatedTags);

    try {
      const { data, error } = await supabase
        .from("cards")
        .update({ tags: updatedTags })
        .eq("id", card.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        onCardUpdate(data);
      }
    } catch (error) {
      console.error("Error removing tag:", error);
    }
  };

  const deleteCard = async () => {
    if (!confirm("Tem certeza que deseja excluir este cartão?")) return;

    try {
      const { error } = await supabase.from("cards").delete().eq("id", card.id);

      if (error) throw error;

      onCardDelete(card.id);
    } catch (error) {
      console.error("Erro ao excluir cartão:", error);
    }
  };

  const handleManualDateChange = (value: string) => {
    // Remove todas as barras primeiro
    let numbers = value.replace(/\//g, "");

    // Remove qualquer caractere que não seja número
    numbers = numbers.replace(/\D/g, "");

    // Formata a data com as barras
    let formatted = "";
    if (numbers.length > 0) {
      formatted = numbers.slice(0, 2);
      if (numbers.length > 2) {
        formatted += "/" + numbers.slice(2, 4);
      }
      if (numbers.length > 4) {
        formatted += "/" + numbers.slice(4, 8);
      }
    }

    // Atualiza apenas se o valor for válido ou vazio
    setManualDate(formatted);
  };

  const handleManualDateSubmit = () => {
    const [day, month, year] = manualDate.split("/");
    if (day && month && year && year.length === 4) {
      const date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      updateDueDate(`${date}T12:00:00Z`);
      setIsManualInput(false);
      setManualDate("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full my-8">
        <div className="flex justify-between items-start p-4 border-b dark:border-gray-700">
          <div className="flex-1 mr-4">
            <h2
              className="text-xl font-bold text-gray-900 dark:text-gray-100 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 group flex items-center"
              onClick={() => setEditingTitle(true)}
            >
              {editingTitle ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={updateCardTitle}
                  onKeyDown={(e) => e.key === "Enter" && updateCardTitle()}
                  className="w-full bg-white dark:bg-gray-700 border-b-2 border-primary-500 focus:outline-none"
                  autoFocus
                />
              ) : (
                <>
                  {title}
                  <Pen className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </>
              )}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Na coluna: {column?.title}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateCardContent(content)}
              className="p-2 rounded-full bg-primary-600 hover:bg-primary-700 text-white transition-colors"
              title="Salvar anotações"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-save w-5 h-5"
              >
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="mb-6">
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                Descrição
              </h3>
              <div className="border dark:border-gray-700 rounded-md overflow-hidden">
                <div className="prose max-w-none dark:prose-invert">
                  {/*
                  <RichTextEditor
                    content={content}
                    onChange={setContent}
                  />
                  */}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                Adicionar ao cartão
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center w-full p-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                >
                  <Calendar className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" />
                  {dueDate
                    ? "Alterar data de entrega"
                    : "Adicionar data de entrega"}
                </button>

                {showDatePicker && (
                  <div className="bg-white dark:bg-gray-800 rounded border dark:border-gray-700 shadow-sm p-3">
                    {isManualInput ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={manualDate}
                          onChange={(e) =>
                            handleManualDateChange(e.target.value)
                          }
                          placeholder="DD/MM/AAAA"
                          className="w-full p-2 border dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleManualDateSubmit()
                          }
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setIsManualInput(false)}
                            className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleManualDateSubmit}
                            disabled={manualDate.length !== 10}
                            className="px-3 py-1 bg-primary-600 text-white rounded disabled:opacity-50 hover:bg-primary-700 dark:hover:bg-primary-500"
                          >
                            Confirmar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="date"
                          value={dueDate ? dueDate.split("T")[0] : ""}
                          onChange={(e) =>
                            updateDueDate(
                              e.target.value
                                ? `${e.target.value}T12:00:00Z`
                                : null
                            )
                          }
                          className="w-full p-2 border dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                        <button
                          onClick={() => setIsManualInput(true)}
                          className="w-full p-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          Digitar manualmente
                        </button>
                      </div>
                    )}
                    {dueDate && (
                      <button
                        onClick={() => updateDueDate(null)}
                        className="mt-2 w-full p-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        Remover data de entrega
                      </button>
                    )}
                  </div>
                )}

                <button
                  onClick={() => setAddingTag(!addingTag)}
                  className="flex items-center w-full p-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                >
                  <Tag className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" />
                  Adicionar etiqueta
                </button>

                {addingTag && (
                  <div className="bg-white dark:bg-gray-800 rounded border dark:border-gray-700 shadow-sm p-3">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Adicionar uma etiqueta..."
                      className="w-full p-2 border dark:border-gray-700 rounded mb-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                      onKeyDown={(e) => e.key === "Enter" && addTag()}
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={addTag}
                        disabled={!newTag.trim()}
                        className="px-3 py-1 bg-primary-600 text-white rounded disabled:opacity-50 hover:bg-primary-700 dark:hover:bg-primary-500"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={deleteCard}
                  className="flex items-center w-full p-2 text-red-600 bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  Excluir cartão
                </button>
              </div>
            </div>

            {/* Due Date Display */}
            {dueDate && (
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Data de Entrega
                </h3>
                <div className="flex items-center p-2 bg-blue-50 text-blue-700 rounded">
                  <Calendar className="w-5 h-5 mr-2" />
                  {format(new Date(dueDate), "d 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </div>
              </div>
            )}

            {/* Tags Display */}
            {tags.length > 0 && (
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Etiquetas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <div
                      key={index}
                      className="flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 p-1 text-purple-800 hover:text-purple-900 rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardModal;
