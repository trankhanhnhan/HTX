import React from 'react';

function EditTypeModal({ editTypeForm, setEditTypeForm, setShowEditTypeForm, setProductTypes }) {
  const userRole = JSON.parse(localStorage.getItem('user'))?.role;

  const handleSave = async () => {
    try {
      if (!editTypeForm.productId || !editTypeForm.name) {
        alert('Vui lòng nhập đủ thông tin!');
        return;
      }
      const formData = new FormData();
      formData.append('productId', editTypeForm.productId);
      formData.append('name', editTypeForm.name);
      if (editTypeForm.image instanceof File) {
        formData.append('image', editTypeForm.image);
      }
      const res = await fetch(`http://192.168.5.119:3001/api/product-types/${editTypeForm.oldProductId || editTypeForm.productId}`, {
        method: 'PUT',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        fetch('http://192.168.5.119:3001/api/product-types')
          .then(res => res.json())
          .then(data => setProductTypes(data));
        setShowEditTypeForm(false);
        alert('Cập nhật thành công!');
      } else {
        throw new Error(data.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      alert('Lỗi khi cập nhật: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Chỉnh sửa loại sản phẩm</h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Mã sản phẩm"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={editTypeForm.productId}
              onChange={e => setEditTypeForm({ ...editTypeForm, productId: e.target.value })}
            />
            <input
              type="text"
              placeholder="Tên sản phẩm"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={editTypeForm.name}
              onChange={e => setEditTypeForm({ ...editTypeForm, name: e.target.value })}
            />
            <input
              type="file"
              accept="image/*"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              onChange={e => setEditTypeForm({ ...editTypeForm, image: e.target.files[0] })}
            />
            {typeof editTypeForm.image === 'string' && (
              <img
                src={
                  editTypeForm.image.startsWith('http')
                    ? editTypeForm.image
                    : `http://192.168.5.119:3001${editTypeForm.image.startsWith('/') ? editTypeForm.image : '/' + editTypeForm.image}`
                }
                alt="Ảnh hiện tại"
                className="w-16 h-16 object-cover rounded border"
              />
            )}
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowEditTypeForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
            {(userRole === 'admin' || userRole === 'manager') && (
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Lưu
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditTypeModal;
