function BottomBar() {
  return (
    <footer className="flex h-7 items-center justify-between border-t border-gray-800 bg-[#161b22] px-3 text-xs text-gray-400">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Connected
        </span>
        <span>Java</span>
      </div>

      <div className="flex items-center gap-4">
        <span>UTF-8</span>
        <span>LF</span>
        <span>Ln 1, Col 1</span>
      </div>
    </footer>
  );
}

export default BottomBar;