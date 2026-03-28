import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Link as LinkIcon, Image as ImageIcon, Type,
  Heading1, Heading2, Code, Eye, Loader2, Palette, Minus
} from "lucide-react";

interface RichEmailComposerProps {
  value: string;
  onChange: (html: string) => void;
  senderName: string;
}

export function RichEmailComposer({ value, onChange, senderName }: RichEmailComposerProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"visual" | "code">("visual");
  const [codeValue, setCodeValue] = useState(value);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const savedSelection = useRef<Range | null>(null);

  // Sync code value when switching modes
  useEffect(() => {
    if (mode === "code") {
      setCodeValue(editorRef.current?.innerHTML || value);
    }
  }, [mode]);

  const exec = useCallback((command: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    syncContent();
  }, []);

  const syncContent = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleCodeChange = (newCode: string) => {
    setCodeValue(newCode);
    onChange(newCode);
  };

  const switchToVisual = () => {
    setMode("visual");
    // Apply code to visual editor after render
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = codeValue;
        syncContent();
      }
    }, 0);
  };

  const switchToCode = () => {
    if (editorRef.current) {
      setCodeValue(editorRef.current.innerHTML);
    }
    setMode("code");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `dispatch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const filePath = `email-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("book-covers")
        .upload(filePath, file, { contentType: file.type, upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("book-covers")
        .getPublicUrl(filePath);

      const imageUrl = urlData.publicUrl;

      if (mode === "visual" && editorRef.current) {
        editorRef.current.focus();
        document.execCommand(
          "insertHTML",
          false,
          `<img src="${imageUrl}" alt="Email image" style="max-width:100%;height:auto;border-radius:8px;margin:12px 0;" />`
        );
        syncContent();
      } else {
        const imgTag = `<img src="${imageUrl}" alt="Email image" style="max-width:100%;height:auto;border-radius:8px;margin:12px 0;" />`;
        handleCodeChange(codeValue + "\n" + imgTag);
      }

      toast.success("Image uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelection.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    if (savedSelection.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedSelection.current);
    }
  };

  const openLinkDialog = () => {
    saveSelection();
    const sel = window.getSelection();
    setLinkText(sel?.toString() || "");
    setLinkUrl("");
    setLinkDialogOpen(true);
  };

  const insertLink = () => {
    if (!linkUrl.trim()) { toast.error("URL is required"); return; }
    const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;

    if (mode === "visual" && editorRef.current) {
      editorRef.current.focus();
      restoreSelection();
      const text = linkText.trim() || url;
      document.execCommand(
        "insertHTML",
        false,
        `<a href="${url}" style="color:#2563eb;text-decoration:underline;" target="_blank">${text}</a>`
      );
      syncContent();
    } else {
      const text = linkText.trim() || url;
      const linkHtml = `<a href="${url}" style="color:#2563eb;text-decoration:underline;" target="_blank">${text}</a>`;
      handleCodeChange(codeValue + linkHtml);
    }
    setLinkDialogOpen(false);
  };

  const insertColor = (color: string) => {
    exec("foreColor", color);
  };

  const getPreviewHtml = () => {
    const content = mode === "visual" ? (editorRef.current?.innerHTML || value) : codeValue;
    return `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #d4a843;">
          <h2 style="color: #1a1a1a; margin: 0; font-size: 20px;">${senderName}</h2>
        </div>
        <div style="color: #333333; line-height: 1.7; font-size: 15px;">
          ${content}
        </div>
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">Sent from ISM Prayer Network</p>
        </div>
      </div>
    `;
  };

  const colors = ["#000000", "#e53e3e", "#dd6b20", "#d69e2e", "#38a169", "#2563eb", "#805ad5", "#d53f8c"];

  const ToolbarButton = ({
    onClick, title, active, children, disabled
  }: { onClick: () => void; title: string; active?: boolean; children: React.ReactNode; disabled?: boolean }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-1.5 rounded hover:bg-accent/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        active ? "bg-accent/30 text-accent-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Email Body</Label>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setPreviewOpen(true)}
          >
            <Eye size={14} /> Preview
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border border-border rounded-t-lg bg-muted/30 px-2 py-1.5 flex flex-wrap items-center gap-0.5">
        {/* Mode toggle */}
        <div className="flex items-center border-r border-border pr-2 mr-1">
          <ToolbarButton
            onClick={() => mode === "code" ? switchToVisual() : null}
            title="Visual Editor"
            active={mode === "visual"}
          >
            <Type size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => mode === "visual" ? switchToCode() : null}
            title="HTML Code"
            active={mode === "code"}
          >
            <Code size={15} />
          </ToolbarButton>
        </div>

        {/* Text formatting */}
        <ToolbarButton onClick={() => exec("bold")} title="Bold" disabled={mode === "code"}>
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("italic")} title="Italic" disabled={mode === "code"}>
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("underline")} title="Underline" disabled={mode === "code"}>
          <Underline size={15} />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Headings */}
        <ToolbarButton onClick={() => exec("formatBlock", "h1")} title="Heading 1" disabled={mode === "code"}>
          <Heading1 size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("formatBlock", "h2")} title="Heading 2" disabled={mode === "code"}>
          <Heading2 size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("formatBlock", "p")} title="Normal Text" disabled={mode === "code"}>
          <Type size={15} />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Alignment */}
        <ToolbarButton onClick={() => exec("justifyLeft")} title="Align Left" disabled={mode === "code"}>
          <AlignLeft size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("justifyCenter")} title="Align Center" disabled={mode === "code"}>
          <AlignCenter size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("justifyRight")} title="Align Right" disabled={mode === "code"}>
          <AlignRight size={15} />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Lists */}
        <ToolbarButton onClick={() => exec("insertUnorderedList")} title="Bullet List" disabled={mode === "code"}>
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("insertOrderedList")} title="Numbered List" disabled={mode === "code"}>
          <ListOrdered size={15} />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Horizontal rule */}
        <ToolbarButton onClick={() => exec("insertHorizontalRule")} title="Horizontal Line" disabled={mode === "code"}>
          <Minus size={15} />
        </ToolbarButton>

        {/* Link */}
        <ToolbarButton onClick={openLinkDialog} title="Insert Link">
          <LinkIcon size={15} />
        </ToolbarButton>

        {/* Image */}
        <ToolbarButton
          onClick={() => imageInputRef.current?.click()}
          title="Upload Image"
          disabled={uploading}
        >
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Colors */}
        <div className="flex items-center gap-0.5 relative group">
          <ToolbarButton onClick={() => {}} title="Text Color" disabled={mode === "code"}>
            <Palette size={15} />
          </ToolbarButton>
          <div className="absolute top-full left-0 mt-1 hidden group-hover:flex bg-popover border border-border rounded-lg p-2 gap-1 shadow-lg z-50">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => insertColor(color)}
                className="w-5 h-5 rounded-full border border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Editor area */}
      {mode === "visual" ? (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncContent}
          onBlur={syncContent}
          className="border border-border border-t-0 rounded-b-lg p-4 min-h-[250px] max-h-[500px] overflow-y-auto focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground prose prose-sm max-w-none [&_img]:rounded-lg [&_img]:max-w-full [&_a]:text-blue-600 [&_a]:underline"
          style={{ lineHeight: 1.7, fontSize: "14px" }}
          dangerouslySetInnerHTML={{ __html: value }}
        />
      ) : (
        <Textarea
          value={codeValue}
          onChange={(e) => handleCodeChange(e.target.value)}
          className="border-t-0 rounded-t-none min-h-[250px] max-h-[500px] font-mono text-xs"
          placeholder="<h1>Hello!</h1>\n<p>Your HTML code here...</p>"
          spellCheck={false}
        />
      )}

      {/* Hidden file input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Link dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="link-text">Display Text</Label>
              <Input
                id="link-text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Click here"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="mt-1"
                onKeyDown={(e) => e.key === "Enter" && insertLink()}
              />
            </div>
            <Button onClick={insertLink} className="w-full">Insert Link</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye size={18} /> Email Preview
            </DialogTitle>
          </DialogHeader>
          <div className="border border-border rounded-lg overflow-hidden bg-gray-100 p-4">
            <div
              className="bg-white rounded shadow-sm"
              dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            This is how the email will appear in recipients' inboxes.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
