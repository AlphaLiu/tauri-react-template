import { WindowTitlebar } from '@/components/controls';

const AppTitleBar = () => {
  return (
    <WindowTitlebar className="bg-transparent flex justify-between flex-shrink-0">
      <div className="flex-1" data-tauri-drag-region />
      <div className="flex items-center pr-2"></div>
    </WindowTitlebar>
  );
};

export default AppTitleBar;
