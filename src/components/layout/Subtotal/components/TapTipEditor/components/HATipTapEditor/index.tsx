import styles from './style.module.scss';
import { useEffect, useState } from 'react';
import { EDITOR_TOOLS } from '@/constants/config.ts/editor-tools';
import { Tooltip } from 'antd';
import MDEditor from '@uiw/react-md-editor';
import { getCommands, getExtraCommands } from '@uiw/react-md-editor/commands-cn';

const HATipTapEditor = () => {
  const [value, setValue] = useState('');

  useEffect(() => {}, []);
  return (
    <div className={styles['ha-tip-tap-editor']}>
      <div className={styles['editor-tools']}>
        {EDITOR_TOOLS.map((item) => {
          return (
            <div className={styles['editor-tool-item']} key={item.name}>
              <Tooltip title={item.title}>
                <i className={['iconfont cursor-pointer', item.icon].join(' ')}></i>
              </Tooltip>
            </div>
          );
        })}
      </div>
      <div className={styles['content']}>
        <MDEditor
          commands={[...getCommands()]}
          enableScroll={false}
          extraCommands={[...getExtraCommands()]}
          height="40vh"
          onChange={(val) => {
            if (val) setValue(val);
          }}
          preview="preview"
          value={value}
        />
      </div>{' '}
    </div>
  );
};

export default HATipTapEditor;
