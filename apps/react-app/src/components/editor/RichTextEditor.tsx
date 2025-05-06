import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { 
  Bold, Italic, List, ListOrdered, Heading1, Heading2, Link as LinkIcon, 
  CheckSquare, Image as ImageIcon, Code 
} from 'lucide-react';

interface RichTextEditorProps {
  initialContent: any;
  onChange: (content: any) => void;
  placeholder?: string;
}

const RichTextEditor = ({ initialContent, onChange, placeholder = 'Write something...' }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      StarterKit.configure({
        document: false,
        paragraph: false,
        text: false,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Highlight,
      Link.configure({
        openOnClick: true,
      }),
      Image,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
  });

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  const addImage = () => {
    const url = prompt('Enter image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = prompt('URL', previousUrl);
    
    if (url === null) {
      return;
    }
    
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="border dark:border-gray-700 rounded-md overflow-hidden">
      <div className="flex flex-wrap items-center p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
          title="Bold"
        >
          <Bold className="w-5 h-5" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
          title="Italic"
        >
          <Italic className="w-5 h-5" />
        </button>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
        
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
          title="Heading 1"
        >
          <Heading1 className="w-5 h-5" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
          title="Heading 2"
        >
          <Heading2 className="w-5 h-5" />
        </button>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
        
        <button
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${editor.isActive('taskList') ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
          title="Task List"
        >
          <CheckSquare className="w-5 h-5" />
        </button>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
        
        <button
          onClick={setLink}
          className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${editor.isActive('link') ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
          title="Link"
        >
          <LinkIcon className="w-5 h-5" />
        </button>
        
        <button
          onClick={addImage}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Image"
        >
          <ImageIcon className="w-5 h-5" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${editor.isActive('codeBlock') ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
          title="Code Block"
        >
          <Code className="w-5 h-5" />
        </button>
      </div>
      
      <EditorContent editor={editor} className="prose max-w-none dark:prose-invert" />
    </div>
  );
};

export default RichTextEditor;