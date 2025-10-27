import React from 'react';
import { Package, Calendar, QrCode, MapPin } from 'lucide-react';

function Overview() {
  const [stats, setStats] = React.useState({
    totalProducts: 0,
    totalDiaries: 0,
    totalCompletedDiaries: 0,
    totalArea: 0,
    totalQRCodes: 0
  });

  React.useEffect(() => {
    async function fetchStats() {
      try {
        const products = await fetch('/api/products').then(r => r.json());
        const diaries = await fetch('/api/crop-diaries').then(r => r.json());
        const completedDiaries = await fetch('/api/complete-diaries').then(r => r.json());
        const plots = await fetch('/api/plots').then(r => r.json());
        const qrs = await fetch('/api/products').then(r => r.json());
        setStats({
          totalProducts: products.length,
          totalDiaries: diaries.length,
          totalCompletedDiaries: completedDiaries.length,
          totalArea: plots.reduce((sum, p) => sum + (p.area || 0), 0),
          totalQRCodes: qrs.length
        });
      } catch {
        setStats({
          totalProducts: 0,
          totalDiaries: 0,
          totalCompletedDiaries: 0,
          totalArea: 0,
          totalQRCodes: 0
        });
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Tổng quan hệ thống</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sản phẩm đã thêm vào truy xuất</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalProducts}</p>
            </div>
            <Package className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Nhật ký đã tạo</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalDiaries}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Nhật ký đã hoàn thành</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.totalCompletedDiaries}</p>
            </div>
            <Calendar className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Diện tích canh tác</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalArea} ha</p>
            </div>
            <MapPin className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Mã QR đã xuất</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.totalQRCodes}</p>
            </div>
            <QrCode className="w-8 h-8 text-indigo-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Overview;