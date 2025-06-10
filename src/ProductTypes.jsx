import React from "react";
import { Edit, Trash2, Search } from "lucide-react";

function ProductTypes({
  productTypes,
  searchTerm,
  setSearchTerm,
  setShowAddTypeForm,
  setEditTypeForm,
  setShowEditTypeForm,
  setProducts
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
                          : `http://192.168.5.119:3001${product.image?.startsWith('/') ? product.image : '/' + product.image}`
                      }
                      alt="Hình ảnh"
                      className="w-12 h-12 object-cover rounded border"
                    />
                  )}
                </td>
                <td className="px-4 py-3 text-sm">{product.productId}</td>
                <td className="px-4 py-3 text-sm font-medium">{product.name}</td>
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
                          const res = await fetch(`http://192.168.5.119:3001/api/products/batch/${product.productId}`, {
                            method: 'DELETE'
                          });
                          const data = await res.json();
                          if (data.success) {
                            const productsRes = await fetch('http://192.168.5.119:3001/api/products');
                            const newProducts = await productsRes.json();
                            setProducts(newProducts);
                            alert('Xóa sản phẩm thành công!');
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
    </div>
  );
}

export default ProductTypes;