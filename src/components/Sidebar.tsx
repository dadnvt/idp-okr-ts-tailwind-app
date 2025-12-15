import { NavLink } from 'react-router-dom';
import {
  FaThLarge,
  FaFlag,
  FaClipboardList,
  FaCalendarAlt,
  FaSignOutAlt 
} from 'react-icons/fa';
import { useAuth } from '../common/AuthContext';

export default function Sidebar() {
  const navItems = [
    { label: 'Dashboard', icon: FaThLarge, path: '/dashboard' },
    { label: 'Goals', icon: FaFlag, path: '/goals' },
    { label: 'Action Plans', icon: FaClipboardList, path: '/action-plans' },
    { label: 'Weekly Reports', icon: FaCalendarAlt, path: '/weekly-reports' },
  ];

  const { logout } = useAuth();

  return (
    <aside className="w-64 bg-brand text-white min-h-screen p-6 flex flex-col">
      <h1 className="text-3xl font-bold mb-10 tracking-wide">IDP</h1>
      <nav className="flex flex-col space-y-4 flex-grow">
        {navItems.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={label}
            to={path}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 rounded-lg transition duration-200 ${
                isActive ? 'bg-blue-700' : 'hover:bg-blue-600'
              }`
            }
          >
            <Icon className="mr-3 w-5 h-5" />
            <span className="text-base font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

      <button
        onClick={logout}
        className="flex items-center mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition duration-200"
      >
        <FaSignOutAlt className="mr-3 w-5 h-5" />
        <span className="text-base font-medium">Logout</span>
      </button>
    </aside>
  );
}
