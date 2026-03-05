import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CoverUploadProps {
  currentUrl: string;
  onUploaded: (url: string) => void;
}

export function CoverUpload({ currentUrl, onUploaded }: CoverUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("book-covers").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("book-covers").getPublicUrl(path);
      onUploaded(publicUrl);
      toast.success("Cover uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [onUploaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  }, [upload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
  };

  const clearImage = () => {
    onUploaded("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      {currentUrl ? (
        <div className="relative group w-fit">
          <img
            src={currentUrl}
            alt="Book cover"
            className="h-36 w-auto rounded-xl object-cover border border-border shadow-sm"
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 py-8 px-4
            ${dragOver
              ? "border-accent bg-accent/10 scale-[1.02]"
              : "border-border hover:border-accent/60 hover:bg-accent/5"
            }
            ${uploading ? "pointer-events-none opacity-60" : ""}
          `}
        >
          {uploading ? (
            <Loader2 size={28} className="animate-spin text-accent" />
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <ImageIcon size={22} className="text-accent" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  <span className="text-accent">Click to upload</span> or drag & drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP up to 5MB</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                <Upload size={12} />
                Browse files
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
