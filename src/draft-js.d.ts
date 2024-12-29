declare module "draft-js" {
  import * as React from "react";

  type DraftEditorCommand = "bold" | "italic" | "underline";

  export interface EditorProps {
    editorState: EditorState;
    onChange: (editorState: EditorState) => void;
    handleKeyCommand?: (
      command: DraftEditorCommand,
      editorState: EditorState,
    ) => "handled" | "not-handled";
  }

  export class Editor extends React.Component<EditorProps> {}

  export class EditorState {
    static createEmpty(): EditorState;
  }

  export class RichUtils {
    static handleKeyCommand(
      editorState: EditorState,
      command: DraftEditorCommand,
    ): EditorState | void;
    static toggleInlineStyle(
      editorState: EditorState,
      inlineStyle: string,
    ): EditorState;
  }
}
