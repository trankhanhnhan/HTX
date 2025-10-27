import React, { useState } from 'react';
import { API_BASE_URL } from '../services/api';

function AddTypeModal({ productForm, setProductForm, setShowAddTypeForm, setProductTypes }) {
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!productForm.id || !productForm.name || !productForm.image) {
      alert('Vui lòng nhập đủ thông tin!');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('id', productForm.id);
    formData.append('name', productForm.name);
    formData.append('image', productForm.image);

    let res = await fetch(`${API_BASE_URL}/product-types`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      fetch(`${API_BASE_URL}/product-types`)
        .then(res => res.json())
        .then(data => setProductTypes(data));
      setShowAddTypeForm(false);
      setProductForm({ id: '', name: '', image: null });
    } else {
      alert('Thêm loại sản phẩm thất bại!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Thêm loại sản phẩm</h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Mã sản phẩm"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={productForm.id}
              onChange={e => setProductForm({ ...productForm, id: e.target.value })}
            />
            <input
              type="text"
              placeholder="Tên sản phẩm"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={productForm.name}
              onChange={e => setProductForm({ ...productForm, name: e.target.value })}
            />
            <input
              type="file"
              accept="image/*"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              onChange={e => setProductForm({ ...productForm, image: e.target.files[0] })}
            />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowAddTypeForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddTypeModal;
