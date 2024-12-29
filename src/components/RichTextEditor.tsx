// RichTextEditor.tsx
import React from "react";
import { Editor, EditorState, RichUtils, DraftEditorCommand } from "draft-js";
import "draft-js/dist/Draft.css";

interface RichTextEditorProps {
  editorState: EditorState;
  setEditorState: (editorState: EditorState) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  editorState,
  setEditorState,
}) => {
  const handleKeyCommand = (
    command: DraftEditorCommand,
  ): "handled" | "not-handled" => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return "handled";
    }
    return "not-handled";
  };

  const toggleInlineStyle = (style: string) => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, style));
  };

  return (
    <div>
      <div className="editor-toolbar">
        <button onClick={() => toggleInlineStyle("BOLD")}>Bold</button>
        <button onClick={() => toggleInlineStyle("ITALIC")}>Italic</button>
        <button onClick={() => toggleInlineStyle("UNDERLINE")}>
          Underline
        </button>
        {/* Add more buttons for different styles */}
      </div>
      <div className="editor-container">
        <Editor
          editorState={editorState}
          handleKeyCommand={handleKeyCommand}
          onChange={setEditorState}
        />
      </div>
    </div>
  );
};

export default RichTextEditor;
