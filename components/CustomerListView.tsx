
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Users, 
  ShoppingBag, 
  Phone, 
  Mail, 
  MoreVertical, 
  MessageSquare,
  ChevronRight,
  User,
  Filter,
  Star,
  Zap,
  Award,
  DollarSign
} from 'lucide-react';
import { Customer } from '../types';

interface CustomerListViewProps {
  customers: Customer[];
  onNavigateToSMS: (phone: string) => void;
}

const LoyaltyBadge: React.FC<{ count: number }> = ({ count }) => {
  if (count >= 5) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-600 border border-orange-200 shadow-sm animate-pulse">
      <Award size={10} /> VIP Member
    </span>
  );
  if (count > 1) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100">
      <Star size={10} /> Returning
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-50 text-gray-400 border border-gray-100">
      New Client
    </span>
  );
};

export const CustomerListView: React.FC<CustomerListViewProps> = ({ customers, onNavigateToSMS }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = useMemo(() => {
    return (customers || []).filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.phone.includes(searchTerm) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0));
  }, [customers, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Customer Management</h2>
          <p className="text-sm text-gray-500">Analyze purchase frequency and reward your loyal buyers.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Total Database</p>
              <p className="text-xl font-black text-gray-800">{customers.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <input 
            type="text" 
            placeholder="Search by name, phone or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/10 transition-all shadow-inner"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-orange-600 transition-all flex items-center justify-center gap-2 text-sm font-bold shadow-sm">
            <Filter size={16} /> Advanced Filter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Profile</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Information</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Order History</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Lifetime Value</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCustomers.length > 0 ? filteredCustomers.map((customer, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-all group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img 
                          src={customer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=random`} 
                          alt={customer.name} 
                          className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white shadow-md group-hover:scale-110 transition-transform"
                        />
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${customer.orderCount > 1 ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-black text-gray-800 group-hover:text-orange-600 transition-colors leading-none">{customer.name}</p>
                        <LoyaltyBadge count={customer.orderCount} />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-600 font-bold">
                        <Phone size={12} className="text-gray-400" />
                        {customer.phone}
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
                          <Mail size={12} />
                          {customer.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-black shadow-sm border ${
                        customer.orderCount >= 5 
                          ? 'bg-orange-600 text-white border-orange-700' 
                          : customer.orderCount > 1 
                            ? 'bg-blue-600 text-white border-blue-700'
                            : 'bg-white text-gray-800 border-gray-100'
                      }`}>
                        <ShoppingBag size={14} />
                        {customer.orderCount}
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">Total Orders</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                         <DollarSign size={14} />
                       </div>
                       <p className="text-sm font-black text-gray-800">
                         ৳{(customer.totalSpent || 0).toLocaleString()}
                       </p>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => onNavigateToSMS(customer.phone)}
                        className="p-3 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-2xl transition-all shadow-sm hover:shadow-md"
                        title="Send SMS"
                      >
                        <MessageSquare size={18} />
                      </button>
                      <button className="p-3 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-2xl transition-all shadow-sm">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center opacity-30">
                      <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-200 mb-4">
                        <Users size={40} className="text-gray-400" />
                      </div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 italic">No matching client found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
