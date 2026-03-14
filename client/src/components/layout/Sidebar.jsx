import { useAppContext } from '../../context/AppContext';
import { NavLink } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import LowStockBadge from '../ui/LowStockBadge';

const links = [
  { name: 'Dashboard', path: '/' },
  { name: 'Products', path: '/products' },
  { name: 'Bulk Import', path: '/products/bulk-import', nested: true },
  { name: 'Receipts', path: '/receipts' },
  { name: 'Deliveries', path: '/deliveries' },
  { name: 'Transfers', path: '/transfers' },
  { name: 'Move History', path: '/moves' },
  { name: 'Low Stock', path: '/low-stock' },
  { name: 'Warehouses', path: '/warehouses' },
  { name: 'Valuation Report', path: '/valuation' },
];

export default function Sidebar() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const { lowStockAlerts } = useAppContext();

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  const name = user?.fullName || user?.firstName || 'User';
  const email = user?.primaryEmailAddress?.emailAddress || '';

  const navClass = ({ isActive }) =>
    `block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 ${isActive
      ? 'bg-indigo-50 dark:bg-gray-800 border-l-4 border-indigo-600'
      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
    }`;

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="p-4 text-lg font-bold text-gray-900 dark:text-gray-100">CoreInventory</div>
      <nav className="space-y-1 px-2 pb-4">
        {links.map((link) => (
          <NavLink key={link.path} to={link.path} className={navClass}>
            <div className="flex items-center justify-between">
              <span className={`${link.nested ? 'ml-4' : ''}`}>{link.name}</span>
              {link.path === '/low-stock' && <LowStockBadge count={lowStockAlerts.length} />}
            </div>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto border-t border-gray-200 p-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-300">
        <div className="mb-2 font-semibold">{name}</div>
        <div className="mb-4 truncate text-xs">{email}</div>
        <button
          onClick={handleLogout}
          className="w-full rounded bg-red-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}