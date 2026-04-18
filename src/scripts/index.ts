// src/scripts/seed-manager.ts
import { seedRepositories } from './seed-repositories';
import { seedDocuments } from './seed-docs';
import { seedBrowseHistory, seedEditHistory } from './seed-activity';
import { seedFavoriteCollections } from './seed-collections';
import { seedAiChat } from './seed-ai-chat';

const rawArg = process.argv[2] || '';
const task = rawArg.replace(/^-+/, ''); // 兼容 --docs 和 docs

async function run() {
  console.log('🚀 启动任务:', task);

  try {
    switch (task) {
      case 'repos':
        await seedRepositories();
        break;
      case 'docs':
        await seedDocuments();
        break;
      case 'docs-detail':
        await seedDocuments();
        break;
      case 'docs-detail':
        await seedDocuments();
        break;
      case 'activity': // 新增：一次性填充所有活动数据
        await seedEditHistory();
        await seedBrowseHistory();
        break;
      case 'favorite': // 新增收藏任务
        await seedFavoriteCollections();
        break;
      case 'ai-chat':
        await seedAiChat();
        break;
      case 'all':
        await seedRepositories();
        await seedDocuments();
        await seedEditHistory();
        await seedBrowseHistory();
        await seedFavoriteCollections();
        await seedAiChat();
        break;
      default:
        console.log(
          '❌ 请指定任务名称: repos, docs, docs-detail, activity, favorite, ai-chat, docs-detail, activity, favorite, 或 all'
        );
        process.exit(1);
    }
    console.log('✅ 选定任务执行完毕');
    process.exit(0); // 运行成功后退出
  } catch (error) {
    console.error('💥 脚本运行出错:', error);
    process.exit(1);
  }
}

run();
