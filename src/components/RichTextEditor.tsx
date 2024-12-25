// RichTextEditor.tsx
import React, { useState } from 'react'
import { Editor, EditorState, RichUtils } from 'draft-js'
import 'draft-js/dist/Draft.css'

const RichTextEditor = ({ editorState, setEditorState }) => {
  const handleKeyCommand = (command) => {
    const newState = RichUtils.handleKeyCommand(editorState, command)
    if (newState) {
      setEditorState(newState)
      return 'handled'
    }
    return 'not-handled'
  }

  const toggleInlineStyle = (style) => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, style))
  }

  return (
    <div>
      <div className="editor-toolbar">
        <button onClick={() => toggleInlineStyle('BOLD')}>Bold</button>
        <button onClick={() => toggleInlineStyle('ITALIC')}>Italic</button>
        <button onClick={() => toggleInlineStyle('UNDERLINE')}>Underline</button>
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
  )
}

export default RichTextEditor