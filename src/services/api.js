export const API_BASE_URL = 'http://172.16.0.119:3001/api';

// Crop Diary Services
export const fetchCropDiaries = () => fetch(`${API_BASE_URL}/crop-diaries`).then(res => res.json());
export const fetchCompleteDiaries = () => fetch(`${API_BASE_URL}/complete-diaries`).then(res => res.json());
export const createCropDiary = (data) => fetch(`${API_BASE_URL}/crop-diaries`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const updateCropDiary = (id, data) => fetch(`${API_BASE_URL}/crop-diaries/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const deleteCropDiary = (id) => fetch(`${API_BASE_URL}/crop-diaries/${id}`, {
  method: 'DELETE'
});

// Plot Services
export const fetchPlots = () => fetch(`${API_BASE_URL}/plots`).then(res => res.json());
export const createPlot = (data) => fetch(`${API_BASE_URL}/plots`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const updatePlot = (batchCode, data) => fetch(`${API_BASE_URL}/plots/${batchCode}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const deletePlot = (batchCode) => fetch(`${API_BASE_URL}/plots/${batchCode}`, {
  method: 'DELETE'
});

// Product Type Services
export const fetchProductTypes = () => fetch(`${API_BASE_URL}/product-types`).then(res => res.json());
export const createProductType = (formData) => fetch(`${API_BASE_URL}/product-types`, {
  method: 'POST',
  body: formData
});
export const updateProductType = (id, formData) => fetch(`${API_BASE_URL}/product-types/${id}`, {
  method: 'PUT',
  body: formData
});
export const deleteProductType = (id) => fetch(`${API_BASE_URL}/product-types/${id}`, {
  method: 'DELETE'
});

// Product Services
export const fetchProducts = () => fetch(`${API_BASE_URL}/products`).then(res => res.json());
export const createProduct = (data) => fetch(`${API_BASE_URL}/products`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const updateProduct = (index, data) => fetch(`${API_BASE_URL}/products/${index}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const deleteProduct = (index) => fetch(`${API_BASE_URL}/products/${index}`, {
  method: 'DELETE'
});

// User Services
export const fetchUsers = () => fetch(`${API_BASE_URL}/users`).then(res => res.json());
export const createUser = (data) => fetch(`${API_BASE_URL}/users`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const updateUser = (username, data) => fetch(`${API_BASE_URL}/users/${username}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
export const deleteUser = (username) => fetch(`${API_BASE_URL}/users/${username}`, {
  method: 'DELETE'
});

// Process Stages
export const fetchProcessStages = () => fetch(`${API_BASE_URL}/prod-process`).then(res => res.json());
