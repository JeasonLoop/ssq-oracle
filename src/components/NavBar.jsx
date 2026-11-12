import { NavLink } from 'react-router-dom';
import { Sparkles, Sunrise, Bookmark, ScrollText, Info, Sun, Moon } from 'lucide-react';

/** 顶部导航：五个主路由（Lucide 图标点缀）+ 明暗主题切换 */
export default function NavBar({ theme, onToggleTheme }) {
  return (
    <nav className="nav-bar">
      <h1 className="nav-title">双色球玄机台</h1>
      <div className="nav-links">
        <NavLink to="/generate" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          <Sparkles size={15} /> 号码生成
        </NavLink>
        <NavLink to="/today" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          <Sunrise size={15} /> 今日一卦
        </NavLink>
        <NavLink to="/picks" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          <Bookmark size={15} /> 卦签夹
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          <ScrollText size={15} /> 往期号码
        </NavLink>
        <NavLink to="/about" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          <Info size={15} /> 关于
        </NavLink>
      </div>
      <button className="nav-theme-btn" onClick={onToggleTheme}>
        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        {theme === 'dark' ? '明堂' : '暗堂'}
      </button>
    </nav>
  );
}
