import React from "react";
import { Edit, Trash2, Search } from "lucide-react";
import { API_BASE_URL } from '../services/api';

function ProductTypes({
  productTypes,
  searchTerm,
  setSearchTerm,
  setShowAddTypeForm,
  setEditTypeForm,
  setShowEditTypeForm,
  setProducts,
  showAddTypeForm,
  setProductTypes
}) {
  return (
    <div className="overflow-x-auto">
      {/* Ô tìm kiếm cho danh sách sản phẩm đã thêm */}
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
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddTypeForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Thêm sản phẩm mới
          </button>
        </div>
      </div>
      <table className="w-full table-auto">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Hình ảnh</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Mã sản phẩm</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tên sản phẩm</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Loại sản phẩm</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {productTypes
            .filter(product =>
              !searchTerm ||
              product.productId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              product.expiryDate?.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map(product => (
              <tr key={product.productId} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">
                  {product.image && (
                    <img
                      src={
                        product.image?.startsWith('http')
                          ? product.image
                          : `${API_BASE_URL.replace('/api', '')}${product.image?.startsWith('/') ? product.image : '/' + product.image}`
                      }
                      alt="Hình ảnh"
                      className="w-12 h-12 object-cover rounded border"
                    />
                  )}
                </td>
                <td className="px-4 py-3 text-sm">{product.productId}</td>
                <td className="px-4 py-3 text-sm font-medium">{product.name}</td>
                <td className="px-4 py-3 text-sm">{product.type || 'Trái cây'}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex space-x-2">
                    <button
                      className="text-green-600 hover:text-green-800"
                      onClick={async () => {
                        try {
                          setEditTypeForm({
                            ...product,
                            oldProductId: product.productId, // Lưu mã sản phẩm cũ
                            productId: product.productId
                          });
                          setShowEditTypeForm(true);
                        } catch (error) {
                          console.error('Error:', error);
                          alert('Không thể sửa sản phẩm: ' + error.message);
                        }
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800"
                      onClick={async () => {
                        try {
                          if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
                          // Thay đổi endpoint API từ products sang product-types
                          const res = await fetch(`${API_BASE_URL}/product-types/${product.productId}`, {
                            method: 'DELETE'
                          });
                          const data = await res.json();
                          if (data.success) {
                            // Fetch lại danh sách loại sản phẩm
                            const typesRes = await fetch(`${API_BASE_URL}/product-types`);
                            const newTypes = await typesRes.json();
                            setProductTypes(newTypes);
                            alert('Xóa loại sản phẩm thành công!');
                          } else {
                            throw new Error(data.message || 'Xóa thất bại');
                          }
                        } catch (error) {
                          console.error('Error:', error);
                          alert('Xóa thất bại: ' + error.message);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      {/* Form thêm loại sản phẩm */}
      {showAddTypeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-lg font-bold mb-4">Thêm loại sản phẩm mới</h2>
            <form onSubmit={async e => {
              e.preventDefault();
              const form = e.target;
              const newProduct = {
                productId: form.productId.value,
                name: form.name.value,
                type: form.type.value,
                expiryDate: form.expiryDate.value,
                image: form.image.value
              };
              // ...existing code thêm sản phẩm...
            }}>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Mã sản phẩm</label>
                <input name="productId" className="w-full border rounded px-3 py-2" required />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Tên sản phẩm</label>
                <input name="name" className="w-full border rounded px-3 py-2" required />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Loại sản phẩm</label>
                <select name="type" className="w-full border rounded px-3 py-2" defaultValue="Trái cây">
                  <option value="Trái cây">Trái cây</option>
                  <option value="Rau củ">Rau củ</option>
                  <option value="Hoa quả">Hoa quả</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Hạn sử dụng</label>
                <input name="expiryDate" className="w-full border rounded px-3 py-2" />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Hình ảnh (URL)</label>
                <input name="image" className="w-full border rounded px-3 py-2" />
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Thêm</button>
                <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={() => setShowAddTypeForm(false)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductTypes;