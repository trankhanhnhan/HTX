import React from 'react';
import { API_BASE_URL } from '../services/api';

function QRExportModal({ qrEdit, setQrEdit, handleExportQR }) {
  // Hàm xuất QR sẽ gọi API lưu dữ liệu vào MongoDB
  const exportQR = async (data) => {
    try {
      // Đảm bảo truyền đúng index để backend xác định sản phẩm truy xuất
      const res = await fetch(`${API_BASE_URL}/export-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          index: data.index,
          weight: data.weight,
          phone: data.phone,
          expiryDate: data.expiryDate
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Lỗi khi lưu dữ liệu QR!');
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi lưu dữ liệu QR!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold mb-4">Xuất mã QR</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Khối lượng (kg)</label>
            <input
              type="text"
              className="w-full border px-3 py-2 rounded"
              value={qrEdit.weight}
              onChange={e => setQrEdit({ ...qrEdit, weight: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Liên hệ</label>
            <input
              type="text"
              className="w-full border px-3 py-2 rounded"
              value={qrEdit.phone}
              onChange={e => setQrEdit({ ...qrEdit, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hạn sử dụng</label>
            <input
              type="text"
              className="w-full border px-3 py-2 rounded"
              value={qrEdit.expiryDate}
              onChange={e => setQrEdit({ ...qrEdit, expiryDate: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2 mt-6">
          <button
            className="px-4 py-2 border rounded text-gray-700"
            onClick={() => setQrEdit(null)}
          >
            Hủy
          </button>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded"
            onClick={async () => {
              await exportQR(qrEdit);
              if (handleExportQR) handleExportQR(qrEdit);
              setQrEdit(null);
            }}
          >
            Xuất mã QR
          </button>
        </div>
      </div>
    </div>
  );
}

export default QRExportModal;
