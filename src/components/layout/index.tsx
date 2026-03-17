function index() {
  return (
    <div className="card group hover:shadow-card-hover transition-shadow">
      <div className="card-header flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 truncate">笔记标题</h3>
        <span className="text-xs text-gray-500">昨天</span>
      </div>
      <div className="card-body">
        <p className="text-gray-600 line-clamp-3">笔记内容预览...</p>
      </div>
      <div className="card-footer flex items-center gap-2">
        <button className="btn btn-ghost btn-sm">编辑</button>
        <button className="btn btn-primary btn-sm">分享</button>
      </div>
    </div>
  );
}

export default index;
