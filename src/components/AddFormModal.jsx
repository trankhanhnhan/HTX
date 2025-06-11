import React, { useState } from 'react';

function AddFormModal({ productForm, setProductForm, setShowAddForm, editIndex, setEditIndex, setProducts }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('productionDate', productForm.productionDate);
      formData.append('expiryDate', productForm.expiryDate);
      formData.append('index', editIndex);

      const url = editIndex 
        ? `http://192.168.5.119:3001/api/products/${editIndex}` 
        : 'http://192.168.5.119:3001/api/products';

      // Chuyển sang dùng JSON thay vì FormData để gửi dữ liệu
      const res = await fetch(url, {
        method: editIndex ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productionDate: productForm.productionDate,
          expiryDate: productForm.expiryDate, 
          index: editIndex
        })
      });

      const data = await res.json();
      
      if (data.success) {
        // Refresh products list
        const productsRes = await fetch('http://192.168.5.119:3001/api/products');
        const products = await productsRes.json();
        setProducts(products);
        setShowAddForm(false);
        setEditIndex(null);
        setProductForm({
          productionDate: '',
          expiryDate: ''
        });
      } else {
        throw new Error(data.message || 'Thao tác thất bại');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <form onSubmit={handleSubmit} className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editIndex ? 'Chỉnh sửa thông tin sản phẩm' : 'Thêm sản phẩm mới'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ngày sản xuất</label>
              <input
                type="date"
                value={productForm.productionDate}
                onChange={e => setProductForm({...productForm, productionDate: e.target.value})}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Hạn sử dụng</label>
              <input
                type="text" 
                value={productForm.expiryDate}
                onChange={e => setProductForm({...productForm, expiryDate: e.target.value})}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setEditIndex(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : (editIndex ? 'Cập nhật' : 'Lưu')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddFormModal;
