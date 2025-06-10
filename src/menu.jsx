import React from 'react';
import { BarChart3, QrCode, Camera, LandPlot, Package, Calendar, MapPin, Sprout, Shield, Truck, UserCheck, Users, FileText, Settings, HelpCircle } from "lucide-react";

export const menuItems = [
  { id: 'overview', label: 'Tổng quan', icon: BarChart3 },
  { id: 'products', label: 'Loại sản phẩm', icon: Sprout },
  { id: 'plot', label: 'Lô đất', icon: LandPlot },
  { id: 'crop-diary', label: 'Nhật ký trồng trọt', icon: Calendar },
  { id: 'traceability', label: 'Truy xuất nguồn gốc', icon: Package },
  // { id: 'camera', label: 'Camera', icon: Camera },
  { id: 'reports', label: 'Báo cáo thống kê', icon: FileText },
  { id: 'weather', label: 'Thông tin thời tiết', icon: MapPin },
  // { id: 'storage', label: 'Bảo quản tối', icon: Shield },
  // { id: 'transport', label: 'Vận chuyển', icon: Truck },
  // { id: 'staff', label: 'Lễ nhân viên', icon: UserCheck },
  // { id: 'customers', label: 'Người mua xuất', icon: Users },
  { id: 'settings', label: 'Cài đặt hệ thống', icon: Settings },
  { id: 'help', label: 'Trợ giúp hướng dẫn', icon: HelpCircle }
];

function SidebarMenu({ activeMenu, setActiveMenu, setActiveTab, sidebarCollapsed }) {
  return (
    <nav className="p-2">
      {menuItems.map((item) => {
        const IconComponent = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => {
              setActiveMenu(item.id);
              localStorage.setItem('activeMenu', item.id);
              if (item.id === 'traceability' || item.id === 'crop-diary') {
                setActiveTab(item.id);
              }
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg mb-1 transition-colors ${
              activeMenu === item.id
                ? 'bg-green-600 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <IconComponent className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-sm truncate">{item.label}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

export default SidebarMenu;