import { NavLink } from 'react-router-dom';

/** 顶部导航：三个主路由 + 明暗主题切换 */
export default function NavBar({ theme, onToggleTheme }) {
  return (
    <nav className="nav-bar">
      <h1 className="nav-title">双色球玄机台</h1>
      <div className="nav-links">
        <NavLink to="/generate" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          号码生成
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          往期号码
        </NavLink>
        <NavLink to="/about" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          关于
        </NavLink>
      </div>
      <button className="nav-theme-btn" onClick={onToggleTheme}>
        {theme === 'dark' ? '☀ 明堂' : '☾ 暗堂'}
      </button>
    </nav>
  );
}
