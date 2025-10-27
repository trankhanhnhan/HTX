import React, { useEffect } from 'react';
import { Edit, Trash2, QrCode, Search } from 'lucide-react';
import { displayDate, displayExpiryDate } from '../utils/Utils';
import { API_BASE_URL } from '../services/api';

/**
 * Component hiển thị bảng truy xuất nguồn gốc sản phẩm
 * @component
 * @param {Object} props - Component properties
 * @param {Array} props.products - Danh sách tất cả sản phẩm
 * @param {string} props.searchTerm - Từ khóa tìm kiếm
 * @param {function} props.setSearchTerm - Hàm cập nhật từ khóa tìm kiếm
 * @param {function} props.setEditIndex - Hàm cập nhật index sản phẩm đang chỉnh sửa
 * @param {function} props.setProductForm - Hàm cập nhật form thông tin sản phẩm
 * @param {function} props.setShowAddForm - Hàm hiển thị/ẩn form thêm sản phẩm
 * @param {function} props.setQrImage - Hàm cập nhật ảnh QR code
 * @param {function} props.setQrEdit - Hàm chỉnh sửa QR code
 * @param {number} props.rowsPerPage - Số dòng hiển thị trên mỗi trang
 * @param {function} props.setRowsPerPage - Hàm cập nhật số dòng trên mỗi trang
 * @param {number} props.page - Trang hiện tại
 * @param {function} props.setPage - Hàm cập nhật trang hiện tại
 * @param {Array} props.filteredProductList - Danh sách sản phẩm đã được lọc
 * @param {function} props.setProducts - Hàm cập nhật danh sách sản phẩm
 */
function TraceabilityTable({
  products, searchTerm, setSearchTerm, setEditIndex, setProductForm, setShowAddForm,
  setQrImage, setQrEdit, rowsPerPage, setRowsPerPage, page, setPage, filteredProductList, setProducts
}) {
  // Lấy lại dữ liệu truy xuất nguồn gốc khi mount
  useEffect(() => {
    async function fetchTraceList() {
      const res = await fetch(`${API_BASE_URL}/trace`);
      const data = await res.json();
      setProducts(data);
    }
    fetchTraceList();
  }, [setProducts]);

  // Phân trang
  const paginatedProducts = filteredProductList.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleDelete = async (product) => {
    if (window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      try {
        // 1. Update diary status first
        const diaryRes = await fetch(`${API_BASE_URL}/complete-diaries/${product.index}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            tracingStatus: '(Đã xóa khỏi truy xuất nguồn gốc)'
          })
        });

        if (!diaryRes.ok) throw new Error('Lỗi khi cập nhật trạng thái nhật ký');

        // 2. Delete from products
        const deleteRes = await fetch(`${API_BASE_URL}/products/${product.index}`, {
          method: 'DELETE'
        });

        if (!deleteRes.ok) throw new Error('Lỗi khi xóa sản phẩm');

        // 3. Refresh products list
        const refreshRes = await fetch(`${API_BASE_URL}/products`);
        const newProducts = await refreshRes.json();
        setProducts(newProducts);

        alert('Đã xóa sản phẩm thành công');

      } catch (err) {
        alert('Lỗi khi xóa: ' + err.message);
      }
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-1/3">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            className="pl-10 pr-4 py-2 w-full rounded-full border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition outline-none shadow-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Hình ảnh</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Mã lô</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Mã sản phẩm</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tên sản phẩm</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nguồn gốc</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ngày sản xuất</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Sản lượng</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Mã QR</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedProducts.map((product) => (
              <tr key={product.index} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">
                  {product.image && (
                    <img
                      src={
                        product.image.startsWith('http')
                          ? product.image
                          : `${API_BASE_URL.replace('/api', '')}${product.image}`
                      }
                      alt="Hình ảnh"
                      className="w-12 h-12 object-cover rounded border"
                    />
                  )}
                </td>
                <td className="px-4 py-3 text-sm">{product.batchCode}</td>
                <td className="px-4 py-3 text-sm">{product.productId}</td>
                <td className="px-4 py-3 text-sm font-bold">{product.name}</td>
                <td className="px-4 py-3 text-sm">{product.origin}</td>
                <td className="px-4 py-3 text-sm">{displayDate(product.productionDate)}</td>
                <td className="px-4 py-3 text-sm">{displayExpiryDate(product.outputQty)} kg</td>
                <td className="flex flex-col px-4 py-3 text-sm">
                  {product.qrImage ? (
                    <>
                      <img
                        src={product.qrImage}
                        alt="QR Code"
                        className="w-12 h-12 object-contain border rounded bg-white cursor-pointer"
                        onClick={() => setQrImage(product.qrImage)}
                        title="Nhấn để xem lớn"
                      />
                      <div>{product.index}</div>
                    </>
                  ) : (
                    <span className="text-gray-400 italic">Chưa có</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex space-x-2">
                    <button
                      className="text-green-600 hover:text-green-800"
                      onClick={() => {
                        setEditIndex(product.index);
                        setProductForm({
                          ...product,
                          productionDate: product.productionDate && product.productionDate.includes('/')
                            ? (() => {
                              const [d, m, y] = product.productionDate.split('/');
                              return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                            })()
                            : product.productionDate,
                          expiryDate: product.expiryDate && product.expiryDate.includes('/')
                            ? (() => {
                              const [d, m, y] = product.expiryDate.split('/');
                              return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                            })()
                            : product.expiryDate
                        });
                        setShowAddForm(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800"
                      onClick={() => handleDelete(product)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      className="text-indigo-600 hover:text-indigo-800"
                      onClick={() => {
                        setQrEdit({
                          index: product.index,
                          name: product.name,
                          batchCode: product.batchCode,
                          productId: product.productId,
                          qrImage: product.qrImage,
                          weight: '',
                          phone: '',
                          expiryDate: ''
                        });
                      }}
                      title="Xuất mã QR"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <label className="mr-2 text-sm">Số dòng/trang:</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={rowsPerPage}
            onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
          >
            {[20, 50, 100, 200].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="px-2 py-1 border rounded text-sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >{"<"}</button>
          {Array.from({ length: Math.ceil(filteredProductList.length / rowsPerPage) }, (_, i) => (
            <button
              key={i}
              className={`px-2 py-1 border rounded text-sm ${page === i + 1 ? 'bg-green-100 font-bold' : ''}`}
              onClick={() => setPage(i + 1)}
            >{i + 1}</button>
          ))}
          <button
            className="px-2 py-1 border rounded text-sm"
            disabled={page === Math.ceil(filteredProductList.length / rowsPerPage) || filteredProductList.length === 0}
            onClick={() => setPage(page + 1)}
          >{">"}</button>
        </div>
      </div>
    </div>
  );
}

export default TraceabilityTable;
