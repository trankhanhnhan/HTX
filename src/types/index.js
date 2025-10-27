/**
 * @typedef {Object} Product
 * @property {string} index - Mã số index
 * @property {string} productId - Mã sản phẩm
 * @property {string} name - Tên sản phẩm
 * @property {string} batchCode - Mã lô
 * @property {string} origin - Nguồn gốc
 * @property {string} productionDate - Ngày sản xuất
 * @property {string} expiryDate - Hạn sử dụng
 * @property {string} outputQty - Sản lượng
 * @property {string} image - URL hình ảnh
 * @property {string} qrImage - URL QR code
 */

/**
 * @typedef {Object} CropDiary
 * @property {string} index - Mã số index
 * @property {string} batchCode - Mã lô
 * @property {string} productId - Mã sản phẩm
 * @property {string} name - Tên cây trồng
 * @property {string} origin - Nguồn gốc
 * @property {string} season - Mùa vụ
 * @property {string} sowingDate - Ngày gieo trồng
 * @property {number} area - Diện tích
 * @property {string} stage - Giai đoạn
 * @property {Array} updates - Lịch sử cập nhật
 */

/**
 * @typedef {Object} Plot
 * @property {string} batchCode - Mã lô
 * @property {number} area - Diện tích
 * @property {number} areaFree - Diện tích trống
 */
