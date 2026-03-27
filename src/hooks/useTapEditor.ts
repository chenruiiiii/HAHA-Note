import {
  Attachment,
  Task,
  TagType,
} from '@/components/layout/Subtotal/components/TapTipEditor/types';
import { successMessage, warningMessage } from '@/utils/message_reminder';
import { useEffect, useRef, useState } from 'react';

export default function useTipTapEditor() {
  // 文本内容
  const [content, setContent] = useState('');
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  // 任务列表
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: '学习React', completed: false },
    { id: 2, text: '完成项目', completed: true },
  ]);

  // 标签
  const [tags, setTags] = useState<TagType[]>([
    { id: 1, name: '工作', color: 'blue' },
    { id: 2, name: '学习', color: 'green' },
    { id: 3, name: '生活', color: 'orange' },
  ]);
  const [newTag, setNewTag] = useState('');
  const [newTagColor, setNewTagColor] = useState('#1890ff');

  // 附件
  const [attachments, setAttachments] = useState<Attachment[]>([
    { id: 1, name: '文档.pdf', size: '2.4MB', type: 'pdf' },
    { id: 2, name: '截图.png', size: '1.8MB', type: 'image' },
  ]);

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 1. 添加任务
  const addTask = () => {
    const text = window.prompt('输入任务内容：');
    if (text && text.trim()) {
      const newTask: Task = {
        id: Date.now(),
        text: text.trim(),
        completed: false,
      };
      setTasks([...tasks, newTask]);
      successMessage('任务已添加');
    }
  };

  // 2. 切换任务状态
  const toggleTask = (id: number) => {
    setTasks(
      tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task))
    );
  };

  // 3. 删除任务
  const deleteTask = (id: number) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  // 4. 添加标签
  const addTag = () => {
    if (!newTag.trim()) {
      warningMessage('请输入标签名称');
      return;
    }

    const newTagItem: TagType = {
      id: Date.now(),
      name: newTag.trim(),
      color: newTagColor,
    };

    setTags([...tags, newTagItem]);
    setNewTag('');
    successMessage('标签已添加');
  };

  // 5. 删除标签
  const deleteTag = (id: number) => {
    setTags(tags.filter((tag) => tag.id !== id));
  };

  // 6. 上传附件
  const uploadAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSize = (file.size / 1024 / 1024).toFixed(2) + 'MB';
    const fileType = file.type.split('/')[0] || 'file';

    const newAttachment: Attachment = {
      id: Date.now(),
      name: file.name,
      size: fileSize,
      type: fileType,
    };

    setAttachments([...attachments, newAttachment]);
    successMessage(`已添加附件: ${file.name}`);

    // 重置input
    e.target.value = '';
  };

  // 7. 删除附件
  const deleteAttachment = (id: number) => {
    setAttachments(attachments.filter((att) => att.id !== id));
  };

  // 8. 保存全部
  const saveAll = () => {
    const data = {
      content,
      tasks,
      tags,
      attachments,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('final-note-data', JSON.stringify(data));
    successMessage('✅ 已保存到本地');
  };

  // 9. 加载数据
  useEffect(() => {
    const saved = localStorage.getItem('final-note-data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setContent(data.content || '');
        setTasks(data.tasks || []);
        setTags(data.tags || []);
        setAttachments(data.attachments || []);
      } catch (err) {
        console.log('无保存数据');
      }
    }
  }, []);

  // 10. 检查placeholder
  useEffect(() => {
    if (editorRef.current) {
      const isEmpty = !editorRef.current.innerText.trim();
      setShowPlaceholder(isEmpty);
    }
  }, [content]);

  return {
    content,
    setContent,
    showPlaceholder,
    editorRef,
    fileInputRef,
    tasks,
    tags,
    newTag,
    newTagColor,
    attachments,
    addTask,
    toggleTask,
    deleteTask,
    addTag,
    deleteTag,
    uploadAttachment,
    deleteAttachment,
    saveAll,
    setNewTag,
    setNewTagColor,
  };
}
