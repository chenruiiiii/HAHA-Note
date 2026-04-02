'use client';
import './style.scss';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import HALoading from '../HALoading';

type EditorMode = 'ir' | 'sv' | 'wysiwyg';
const HAEditor = () => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Hello World! 🌎️</p>',
    immediatelyRender: true,
  });
  return <EditorContent editor={editor}></EditorContent>;
};

export default HAEditor;
