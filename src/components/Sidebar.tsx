import { NavLink } from 'react-router-dom';
import {
  FaThLarge,
  FaFlag,
  FaClipboardList,
  FaCalendarAlt,
  FaSignOutAlt, 
  FaTeamspeak
} from 'react-icons/fa';
import { useAuth } from '../common/AuthContext';
import { Button } from './Button';

export default function Sidebar() {
  const navItems = [
    { label: 'Dashboard', icon: FaThLarge, path: '/dashboard' },
    { label: 'Goals', icon: FaFlag, path: '/goals' },
    { label: 'Action Plans', icon: FaClipboardList, path: '/action-plans' },
    { label: 'Verification', icon: FaTeamspeak, path: '/verify-test' }
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

      <Button onClick={logout} variant="danger" className="flex items-center mt-6">
        <FaSignOutAlt className="mr-3 w-5 h-5" />
        <span className="text-base font-medium">Logout</span>
      </Button>
    </aside>
  );
}
