const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const cors = require('cors');
const multer = require('multer');
const upload = multer({ dest: path.join(__dirname, 'public', 'uploads') });
const QRCode = require('qrcode');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));


// Constants 
const PORT = 3001;
const PRODUCT_TYPE_CSV = path.join(__dirname, 'csv', 'productTypes.csv');
const USERS_CSV = path.join(__dirname, 'csv', 'users.csv');

app.listen(3001, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

function randomIndex(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Định dạng tự động: nếu là số nguyên thì để nguyên, số thực thì giữ phần thập phân
function formatNumberAuto(num) {
  if (Number.isInteger(num)) return num.toString();
  return Number(num).toString();
}

// API thêm loại sản phẩm
app.post('/api/product-types', upload.single('image'), (req, res) => {
  const { id, name } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : '';
  if (!id || !name) return res.status(400).json({ success: false, message: 'Thiếu thông tin' });

  // Đọc file CSV kiểm tra trùng id
  const rows = fs.readFileSync(PRODUCT_TYPE_CSV, 'utf8').split('\n');
  const isExist = rows.some(row => {
    const cols = row.split(',');
    return cols[1] && cols[1].trim() === id.trim();
  });
  if (isExist) {
    return res.status(400).json({ success: false, message: 'Mã sản phẩm đã tồn tại!' });
  }

  // Ghi mới nếu không trùng
  const row = `${imagePath},${id},${name}\n`;
  fs.appendFileSync(PRODUCT_TYPE_CSV, row, 'utf8');
  res.json({ success: true });
});
//////////////////////////////////////////////////////////////////////////////////////////

// API thêm mã lô đất mới
app.post('/api/plots', (req, res) => {
  const { batchCode, area } = req.body;
  if (!batchCode || !area) {
    return res.status(400).json({ success: false, message: 'Thiếu batchCode hoặc area' });
  }
  const filePath = path.join(__dirname, 'csv', 'addPlot.csv');
  let needHeader = false;
  if (!fs.existsSync(filePath) || fs.readFileSync(filePath, 'utf8').trim() === '') {
    needHeader = true;
  }
  // Kiểm tra trùng mã lô
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      if (cols[0] === batchCode) {
        return res.status(400).json({ success: false, message: 'Mã lô đã tồn tại!' });
      }
    }
  }
  const row = `${batchCode},${area},${area}\n`;
  if (needHeader) {
    fs.writeFileSync(filePath, 'batchCode,area,areaFree\n' + row, 'utf8');
  } else {
    fs.appendFileSync(filePath, row, 'utf8');
  }
  res.json({ success: true });
});
////////////////////////////////////////////////////////////////////////////////////////

// API thêm nhật ký mới
app.post('/api/crop-diaries', (req, res) => {
  try {
    const filePath = path.join(__dirname, 'csv', 'addNK.csv');
    let {
      batchCode, productId, name, origin, season, plantDate, sowingDate, area, stage
    } = req.body;

    plantDate = plantDate || sowingDate;

    if (!plantDate) {
      return res.status(400).json({ success: false, error: 'Thiếu ngày gieo trồng' });
    }

    // --- Cập nhật areaFree ---
    const plotPath = path.join(__dirname, 'csv', 'addPlot.csv');
    if (!fs.existsSync(plotPath)) {
      return res.status(400).json({ success: false, error: 'Không tìm thấy lô đất' });
    }
    let plotLines = fs.readFileSync(plotPath, 'utf8').split('\n');
    const header = plotLines[0];
    plotLines = plotLines.filter(Boolean);
    let updated = false;
    for (let i = 1; i < plotLines.length; i++) {
      const cols = plotLines[i].split(',');
      if (cols[0] === batchCode) {
        const areaFree = parseFloat(cols[2] || cols[1] || 0);
        if (areaFree < parseFloat(area)) {
          return res.status(400).json({ success: false, error: 'Diện tích trống không đủ!' });
        }
        cols[2] = (areaFree - parseFloat(area)).toFixed(2);
        plotLines[i] = cols.join(',');
        updated = true;
        break;
      }
    }
    if (!updated) {
      return res.status(400).json({ success: false, error: 'Không tìm thấy lô đất' });
    }
    fs.writeFileSync(plotPath, plotLines.join('\n'), 'utf8');
    // --- hết cập nhật areaFree ---

    // Tạo bản ghi nhật ký như cũ
    const index = randomIndex(10);
    const now = new Date();
    const dateString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const updates = [{
      date: dateString,
      stage: stage || '',
      note: `Khởi tạo: ${stage || ''}`
    }];
    const updatesString = `"${JSON.stringify(updates).replace(/"/g, '""')}"`;

    const newLine = [
      batchCode, productId, name, origin, season, plantDate, area, stage, updatesString, `Khởi tạo: ${stage || ''}`, index
    ].join(',');

    let content = '';
    if (!fs.existsSync(filePath) || fs.readFileSync(filePath, 'utf8').trim() === '') {
      content = 'batchCode,productId,name,origin,season,plantDate,area,stage,updates,note,index\n';
    } else {
      content = fs.readFileSync(filePath, 'utf8');
      if (!content.endsWith('\n')) content += '\n';
    }
    content += newLine + '\n';
    fs.writeFileSync(filePath, content, 'utf8');

    res.json({ success: true, index, batchCode });
  } catch (error) {
    console.error('Error creating diary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
///////////////////////////////////////////////////////////////////////////////////////

// API Thêm sản phẩm
app.post('/api/products', (req, res) => {
  try {
    const newProduct = req.body;
    const row = [
      newProduct.image || '',
      newProduct.productId || '',
      newProduct.batchCode || '',
      newProduct.name || '',
      newProduct.origin || '',
      newProduct.productionDate || '',
      newProduct.expiryDate || '',
      newProduct.outputQty || '',
      newProduct.qrImage || ''
    ].join(',');

    const filePath = path.join(__dirname, 'csv', 'addSP.csv');
    let content = '';

    // Thêm header nếu file rỗng
    if (!fs.existsSync(filePath) || fs.readFileSync(filePath, 'utf8').trim() === '') {
      content = 'image,productId,batchCode,name,origin,productionDate,outputQty,qrImage,index\n';
    } else {
      content = fs.readFileSync(filePath, 'utf8').trim() + '\n';
    }

    // Xuống dòng mỗi khi thêm mới
    content += row + '\n';
    fs.writeFileSync(filePath, content, 'utf8');

    res.json({ success: true });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
////////////////////////////////////////////////////////////////////////////////////////

// API thêm vào truy xuất nguồn gốc
app.post('/api/trace', async (req, res) => {
  const { batchCode, name, origin, productionDate, qrImage } = req.body;
  const index = req.body.index || '';
  let productId = req.body.productId;

  try {
    // Lấy image từ productTypes.csv (nếu cần)
    const productTypesPath = path.join(__dirname, 'csv', 'productTypes.csv');
    let image = '';
    if (fs.existsSync(productTypesPath)) {
      const lines = fs.readFileSync(productTypesPath, 'utf8').split('\n').filter(Boolean);
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols[1] === productId) {
          image = cols[0] || '';
          break;
        }
      }
    }

    // Lấy sản lượng từ addCompleteNK.csv
    const completeNKPath = path.join(__dirname, 'csv', 'addCompleteNK.csv');
    let outputQty = '';
    if (fs.existsSync(completeNKPath)) {
      const lines = fs.readFileSync(completeNKPath, 'utf8').split('\n');
      const header = lines[0].split(',');
      const batchCodeIdx = header.indexOf('batchCode');
      const indexIdx = header.indexOf('index');
      const outputQtyIdx = header.indexOf('outputQty');
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols[batchCodeIdx] === batchCode && cols[indexIdx] === index) {
          outputQty = cols[outputQtyIdx] || '';
          break;
        }
      }
    }

    // Tạo mã QR code với kích thước 500x500
    const qrData = `http://192.168.5.119:5173/product/${index}`;
    const qrImageData = await QRCode.toDataURL(qrData, { width: 450, margin: 2 });

    const addSPPath = path.join(__dirname, 'csv', 'addSP.csv');
    let needHeader = false;
    if (!fs.existsSync(addSPPath) || fs.readFileSync(addSPPath, 'utf8').trim() === '') {
      needHeader = true;
    }
    if (needHeader) {
      fs.writeFileSync(addSPPath, 'image,productId,batchCode,name,origin,productionDate,expiryDate,outputQty,qrImage,index\n', 'utf8');
    }

    // Lấy ngày hoàn thành từ addCompleteNK.csv (nếu cần)
    let productionDateValue = productionDate || '';
    if (fs.existsSync(completeNKPath)) {
      const lines = fs.readFileSync(completeNKPath, 'utf8').split('\n');
      const header = lines[0].split(',');
      const batchCodeIdx = header.indexOf('batchCode');
      const noteIdx = header.indexOf('note');
      const indexIdx = header.indexOf('index');
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols[batchCodeIdx] === batchCode && cols[indexIdx] === index) {
          // Tìm ngày hoàn thành trong note
          const match = cols[noteIdx] && cols[noteIdx].match(/Ngày hoàn thành: ([^|]+)/);
          if (match) {
            productionDateValue = match[1].trim();
          }
          break;
        }
      }
    }

    const row = [
      image || '',
      productId || '',
      batchCode || '',
      name || '',
      origin || '',
      productionDateValue || '',
      '',
      outputQty || '', // <-- lấy từ addCompleteNK.csv
      `"${qrImageData || ''}"`,
      index || ''
    ].join(',');

    // Thêm dòng mới
    let content = fs.readFileSync(addSPPath, 'utf8');
    if (!content.endsWith('\n')) content += '\n';
    content += row + '\n';
    fs.writeFileSync(addSPPath, content, 'utf8');

    // Cập nhật trạng thái truy xuất trong addCompleteNK.csv
    if (fs.existsSync(completeNKPath)) {
      const lines = fs.readFileSync(completeNKPath, 'utf8').split('\n');
      const header = lines[0];
      const indexIdx = header.split(',').indexOf('index');
      const newLines = lines.map((line, idx) => {
        if (idx === 0) return line;
        const cols = line.split(',');
        if (cols[indexIdx] === (req.body.index || '')) {
          cols[9] = 'Đã truy xuất'; 
        }
        return cols.join(',');
      });
      fs.writeFileSync(completeNKPath, newLines.join('\n'), 'utf8');
    }
    res.json({ success: true });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
/////////////////////////////////////////////////////////////////////////////////////////

//API xuất mã QR
app.post('/api/export-qr', (req, res) => {
  const filePath = path.join(__dirname, 'csv', 'addQR.csv');
  const { productId, batchCode, name, productionDate, expiryDate, weight, phone, qrImage, index } = req.body;
  let needHeader = false;
  if (!fs.existsSync(filePath) || fs.readFileSync(filePath, 'utf8').trim() === '') {
    needHeader = true;
  }
  const ws = fs.createWriteStream(filePath, { flags: 'a' });
  if (needHeader) {
    ws.write('productId,batchCode,name,productionDate,expiryDate,weight,phone,qrImage,index\n');
  }
  ws.write([productId, batchCode, name, productionDate, expiryDate, weight, phone, qrImage, index].map(x => `"${(x||'').replace(/"/g, '""')}"`).join(',') + '\n');
  ws.end();
  ws.on('finish', () => res.json({ success: true }));
  ws.on('error', () => res.status(500).json({ success: false }));
});
///////////////////////////////////////////////////////////////////////////////////////

// API cập nhật thông tin lô đất và đồng bộ batchCode ở các file liên quan
app.put('/api/plots/:batchCode', (req, res) => {
  const oldBatchCode = req.params.batchCode;
  const { batchCode, area } = req.body;
  const filePath = path.join(__dirname, 'csv', 'addPlot.csv');
  if (!batchCode || !area) {
    return res.status(400).json({ success: false, message: 'Thiếu batchCode hoặc area' });
  }
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy file lô đất' });
  }
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const header = lines[0];
  let found = false;
  const newLines = lines.map((line, idx) => {
    if (idx === 0) return line;
    if (!line.trim()) return '';
    const cols = line.split(',');
    if (cols[0] === oldBatchCode) {
      found = true;
      const oldArea = parseFloat(cols[1]);
      const oldAreaFree = parseFloat(cols[2]);
      const usedArea = oldArea - oldAreaFree;
      const newArea = parseFloat(area);
      if (isNaN(newArea) || newArea <= 0) {
        return res.status(400).json({ success: false, message: 'Diện tích không hợp lệ!' });
      }
      if (newArea < usedArea) {
        return res.status(400).json({ success: false, message: `Diện tích mới (${area}) nhỏ hơn diện tích đã sử dụng (${usedArea})!` });
      }
      let newAreaFree = newArea - usedArea;
      if (newAreaFree < 0) newAreaFree = 0;
      return [batchCode, newArea.toFixed(3), newAreaFree.toFixed(3)].join(',');
    }
    return line;
  });
  if (!found) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy lô đất cần sửa' });
  }
  if (!Array.isArray(newLines)) return;
  fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');

  // --- Đồng bộ batchCode ở các file liên quan ---
  const syncFiles = [
    { path: path.join(__dirname, 'csv', 'addNK.csv'), batchCodeIdx: 0 },
    { path: path.join(__dirname, 'csv', 'addCompleteNK.csv'), batchCodeIdx: 0 },
    { path: path.join(__dirname, 'csv', 'addSP.csv'), batchCodeIdx: 2 }
  ];
  syncFiles.forEach(file => {
    if (!fs.existsSync(file.path)) return;
    const lines = fs.readFileSync(file.path, 'utf8').split('\n');
    const synced = lines.map((line, idx) => {
      if (idx === 0) return line;
      if (!line.trim()) return '';
      // Tách trường CSV an toàn
      const cols = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        if (char === ',' && !inQuotes) {
          cols.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      cols.push(current);
      // So sánh batchCode sau khi trim và bỏ dấu nháy
      const oldVal = (cols[file.batchCodeIdx] || '').replace(/^"|"$/g, '').trim();
      if (oldVal === oldBatchCode) {
        cols[file.batchCodeIdx] = batchCode;
      }
      return cols.join(',');
    });
    fs.writeFileSync(file.path, synced.join('\n'), 'utf8');
  });

  res.json({ success: true, message: 'Cập nhật lô đất và đồng bộ thành công' });
});
/////////////////////////////////////////////////////////////////////////////////////////

// API sửa thông tin loại sản phẩm
app.put('/api/product-types/:oldProductId', upload.single('image'), async (req, res) => {
  try {
    const oldProductId = req.params.oldProductId;
    const newProductId = req.body.productId;
    const newName = req.body.name;
    const filePath = path.join(__dirname, 'csv', 'productTypes.csv');

    // Đọc nội dung file
    let content = fs.readFileSync(filePath, 'utf8');
    let lines = content.split('\n').filter(Boolean);
    const header = lines[0];

    // Cập nhật trong productTypes.csv
    const updatedLines = lines.map((line, idx) => {
      if (idx === 0) return line;

      const cols = line.split(',');
      if (cols[1] === oldProductId) {
        // Cập nhật thông tin
        if (req.file) {
          cols[0] = `/uploads/${req.file.filename}`;
        }
        cols[1] = newProductId; // Cập nhật mã sản phẩm mới
        cols[2] = newName; // Cập nhật tên mới
      }
      return cols.join(',');
    });

    // Ghi file productTypes.csv
    fs.writeFileSync(filePath, updatedLines.join('\n') + '\n', 'utf8');

    // Cập nhật trong addNK.csv
    const nkPath = path.join(__dirname, 'csv', 'addNK.csv');
    if (fs.existsSync(nkPath)) {
      content = fs.readFileSync(nkPath, 'utf8');
      lines = content.split('\n').filter(Boolean);
      const updatedNK = lines.map((line, idx) => {
        if (idx === 0) return line;
        const cols = line.split(',');
        if (cols[1] === oldProductId) {
          cols[1] = newProductId;
          cols[2] = newName;
        }
        return cols.join(',');
      });
      fs.writeFileSync(nkPath, updatedNK.join('\n') + '\n', 'utf8');
    }

    // Cập nhật trong addNK.csv
    const completeNKPath = path.join(__dirname, 'csv', 'addCompleteNK.csv');
    if (fs.existsSync(completeNKPath)) {
      content = fs.readFileSync(completeNKPath, 'utf8');
      lines = content.split('\n').filter(Boolean);
      const updatedaddCompleteNK = lines.map((line, idx) => {
        if (idx === 0) return line;
        const cols = line.split(',');
        if (cols[1] === oldProductId) {
          cols[1] = newProductId;
          cols[2] = newName;
        }
        return cols.join(',');
      });
      fs.writeFileSync(completeNKPath, updatedaddCompleteNK.join('\n') + '\n', 'utf8');
    }

    // Cập nhật trong addSP.csv
    const spPath = path.join(__dirname, 'csv', 'addSP.csv');
    if (fs.existsSync(spPath)) {
      content = fs.readFileSync(spPath, 'utf8');
      lines = content.split('\n').filter(Boolean);
      const updatedSP = lines.map((line, idx) => {
        if (idx === 0) return line;
        const cols = line.split(',');
        if (cols[1] === oldProductId) {
          cols[1] = newProductId;
          cols[3] = newName;
        }
        return cols.join(',');
      });
      fs.writeFileSync(spPath, updatedSP.join('\n') + '\n', 'utf8');
    }

    res.json({
      success: true,
      message: 'Cập nhật thành công',
      image: req.file ? `/uploads/${req.file.filename}` : undefined
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
///////////////////////////////////////////////////////////////////////////////////////

// API sửa thông tin nhật ký
app.put('/api/crop-diaries/:index', async (req, res) => {
try {
    const index = req.params.index;
    const filePath = path.join(__dirname, 'csv', 'addNK.csv');
    const updates = req.body.updates || [];
    let content = fs.readFileSync(filePath, 'utf8');
    let lines = content.split('\n').filter(Boolean);

    // Lấy header
    const header = lines[0];
    const headers = header.split(',');

    let oldArea = null;
    let batchCode = null;
    let newArea = null;

    const updatedLines = lines.map((line, idx) => {
      if (idx === 0) return line;

      const cols = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        if (char === ',' && !inQuotes) {
          cols.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      cols.push(current);
      while (cols.length < 11) cols.push('');

      if (cols[10] === index) {
        // Lưu lại diện tích cũ và batchCode để cập nhật areaFree
        oldArea = parseFloat(cols[6]) || 0;
        batchCode = cols[0];

         if (typeof req.body.updates !== 'undefined') {
          cols[8] = `"${JSON.stringify(updates).replace(/"/g, '""')}"`;
        }

        // Nếu có cập nhật diện tích
        if (typeof req.body.area !== 'undefined' && req.body.area !== cols[6]) {
          newArea = parseFloat(req.body.area) || 0;
          cols[6] = req.body.area;
        }

        // Nếu là cập nhật giai đoạn (có trường stage)
        if (req.body.stage) {
          cols[7] = req.body.stage;
          cols[9] = req.body.note || "Cập nhật giai đoạn";
        }

        // Nếu là chỉnh sửa thông tin
        const changes = [];
        if (typeof req.body.origin !== 'undefined' && req.body.origin !== cols[3]) {
          changes.push(`Nguồn gốc: ${cols[3]} → ${req.body.origin}`);
          cols[3] = req.body.origin;
        }
        if (typeof req.body.season !== 'undefined' && req.body.season !== cols[4]) {
          changes.push(`Mùa vụ: ${cols[4]} → ${req.body.season}`);
          cols[4] = req.body.season;
        }
        if (typeof req.body.sowingDate !== 'undefined' && req.body.sowingDate !== cols[5]) {
          changes.push(`Ngày gieo trồng: ${cols[5]} → ${req.body.sowingDate}`);
          cols[5] = req.body.sowingDate;
        }
        if (typeof req.body.area !== 'undefined' && req.body.area !== cols[6]) {
          changes.push(`Diện tích: ${cols[6]} → ${req.body.area}`);
          cols[6] = req.body.area;
        }

        // Ghi lịch sử đổi loại sản phẩm
        if (typeof req.body.productId !== 'undefined' && req.body.productId !== cols[1]) {
          // Lấy thông tin sản phẩm mới từ productTypes.csv
          const productTypesPath = path.join(__dirname, 'csv', 'productTypes.csv');
          let newProductId = '', newName = '', newImage = '', newExpiry = '';
          if (fs.existsSync(productTypesPath)) {
            const ptLines = fs.readFileSync(productTypesPath, 'utf8').split('\n').filter(Boolean);
            for (let i = 1; i < ptLines.length; i++) {
              const ptCols = ptLines[i].split(',');
              if (ptCols[1] === req.body.productId) {
                newImage = ptCols[0] || '';
                newProductId = ptCols[1] || '';
                newName = ptCols[2] || '';
                newExpiry = ptCols[3] || '';
                break;
              }
            }
          }
          changes.push(`Đổi loại sản phẩm: ${cols[2]} → ${req.body.name}`);
          cols[1] = req.body.productId;
          cols[2] = req.body.name;
          if (newName) cols[2] = newName;
        }

        // Ghi lại updates dạng mảng phẳng
        const updatesString = `"${JSON.stringify(updates).replace(/"/g, '""')}"`;
        cols[8] = updatesString;

        // Chỉ join đúng 11 trường
        return cols.slice(0, 11).join(',');
      }
      return line;
    });

    fs.writeFileSync(filePath, updatedLines.join('\n') + '\n', 'utf8');

    // --- Cập nhật areaFree nếu diện tích thay đổi ---
    if (batchCode && oldArea !== null && newArea !== null && oldArea !== newArea) {
      const plotPath = path.join(__dirname, 'csv', 'addPlot.csv');
      if (fs.existsSync(plotPath)) {
        let plotLines = fs.readFileSync(plotPath, 'utf8').split('\n');
        plotLines = plotLines.map((line, idx) => {
          if (idx === 0) return line;
          const cols = line.split(',');
          if (cols[0] === batchCode) {
            // Cộng lại diện tích cũ, trừ đi diện tích mới
            const newAreaFree = parseFloat(cols[2]) + oldArea - newArea;
            cols[2] = formatNumberAuto(newAreaFree);
            return cols.join(',');
          }
          return line;
        });
        fs.writeFileSync(plotPath, plotLines.join('\n'), 'utf8');
      }
    }
    
    if (req.body.stage === 'Hoàn thành') {
  const completePath = path.join(__dirname, 'csv', 'addCompleteNK.csv');
  let needHeader = false;
  if (!fs.existsSync(completePath) || fs.readFileSync(completePath, 'utf8').trim() === '') {
    needHeader = true;
  }
  // Lấy dòng vừa hoàn thành từ addNK.csv
  const completedLine = updatedLines.find((line, idx) => {
    if (idx === 0) return false;
    const cols = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') inQuotes = !inQuotes;
      if (char === ',' && !inQuotes) {
        cols.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    cols.push(current);
    return cols[10] === req.params.index;
  });
  if (completedLine) {
    let cols = completedLine.split(',');
    // Đảm bảo có đủ 12 trường (outputQty là cột số 7, index 7)
    while (cols.length < 12) cols.push('');
    // Ghi sản lượng vào cột outputQty (index 7)
    if (typeof req.body.outputQty !== 'undefined') {
      cols[7] = req.body.outputQty;
    }
    cols[8] = 'Hoàn thành'; // stage
    cols[9] = 'Chưa truy xuất'; // tracingStatus
    // Thêm ngày hoàn thành vào note
    const now = new Date();
    const completeDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    let note = cols[10];
    if (!note || note.trim().startsWith('{') || note.trim().startsWith('"')) {
      note = `Hoàn thành: ${cols[8] || ''}`;
    }
    note += ` | Ngày hoàn thành: ${completeDate}`;
    cols[10] = note;
    cols[11] = req.params.index; // index
    let newLine = cols.slice(0, 12).join(',');
    let content = '';
    if (needHeader) {
      content = 'batchCode,productId,name,origin,season,plantDate,area,outputQty,stage,tracingStatus,note,index\n';
    } else {
      content = fs.readFileSync(completePath, 'utf8');
      if (!content.endsWith('\n')) content += '\n';
    }
    content += newLine + '\n';
    fs.writeFileSync(completePath, content, 'utf8');
  } else {
    console.warn('[Hoàn thành] Không tìm thấy dòng với index:', req.params.index);
  }
}

    // Nếu có cập nhật productId, đồng bộ lại các trường liên quan từ productTypes.csv
    if (typeof req.body.productId !== 'undefined') {
    const productTypesPath = path.join(__dirname, 'csv', 'productTypes.csv');
    if (fs.existsSync(productTypesPath)) {
      const lines = fs.readFileSync(productTypesPath, 'utf8').split('\n').filter(Boolean);
      // Giả sử header: image,productId,name,expiryDate
      let newProductId = '', newName = '', newExpiry = '', newImage = '';
     for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      if (cols[1] === req.body.productId) {
        newImage = cols[0] || '';
        newProductId = cols[1] || '';
        newName = cols[2] || '';
        newExpiry = cols[3] || '';
        break;
      }
    }

    // Đồng bộ addNK.csv
    const filePath = path.join(__dirname, 'csv', 'addNK.csv');
    if (fs.existsSync(filePath)) {
      const lines = fs.readFileSync(filePath, 'utf8').split('\n');
      const header = lines[0].split(',');
      const productIdIdx = header.indexOf('productId');
      const nameIdx = header.indexOf('name');
      const imageIdx = header.indexOf('image');
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols[10] === req.params.index) {
          if (newName) cols[nameIdx] = newName;
          if (req.body.productId) cols[productIdIdx] = req.body.productId;
          if (imageIdx !== -1 && newImage) cols[imageIdx] = newImage; // cập nhật image
          lines[i] = cols.join(',');
        }
      }
      fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    }

    // Đồng bộ addCompleteNK.csv
    const completeNKPath = path.join(__dirname, 'csv', 'addCompleteNK.csv');
    if (fs.existsSync(completeNKPath)) {
      const lines = fs.readFileSync(completeNKPath, 'utf8').split('\n');
      const header = lines[0].split(',');
      const productIdIdx = header.indexOf('productId');
      const nameIdx = header.indexOf('name');
      const imageIdx = header.indexOf('image');
      const originIdx = header.indexOf('origin');
      const seasonIdx = header.indexOf('season');
      const plantDateIdx = header.indexOf('plantDate');
      const areaIdx = header.indexOf('area');
      const indexIdx = header.indexOf('index');
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols[indexIdx] === req.params.index) {
          if (newName) cols[nameIdx] = newName;
          if (req.body.productId) cols[productIdIdx] = req.body.productId;
          if (req.body.origin) cols[originIdx] = req.body.origin;
          if (req.body.season) cols[seasonIdx] = req.body.season;
          if (req.body.plantDate) cols[plantDateIdx] = req.body.plantDate;
          if (req.body.area) cols[areaIdx] = req.body.area;
          if (imageIdx !== -1 && newImage) cols[imageIdx] = newImage; // cập nhật image
          lines[i] = cols.join(',');
        }
      }
      fs.writeFileSync(completeNKPath, lines.join('\n'), 'utf8');
    }

   // Trong route PUT /api/crop-diaries/:index, sửa lại phần đồng bộ addSP.csv:
const addSPPath = path.join(__dirname, 'csv', 'addSP.csv');
if (fs.existsSync(addSPPath)) {
  const lines = fs.readFileSync(addSPPath, 'utf8').split('\n');
  const header = lines[0].split(',');
  
  // Lấy index của các cột
  const imageIdx = header.indexOf('image');
  const productIdIdx = header.indexOf('productId');
  const batchCodeIdx = header.indexOf('batchCode');
  const nameIdx = header.indexOf('name');
  const originIdx = header.indexOf('origin');
  const productionDateIdx = header.indexOf('productionDate');
  const expiryDateIdx = header.indexOf('expiryDate');
  const outputQtyIdx = header.indexOf('outputQty');
  const qrImageIdx = header.indexOf('qrImage');
  const indexIdx = header.indexOf('index');
  const qrCodeIdx = header.indexOf('qrCode');

  const updatedLines = lines.map((line, idx) => {
    if (idx === 0) return line;
    
    // Parse CSV line an toàn
    const cols = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') inQuotes = !inQuotes;
      if (char === ',' && !inQuotes) {
        cols.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    cols.push(current);

    if (cols[indexIdx]?.trim() === req.params.index) {
      // Cập nhật các trường
      if (newProductId) cols[productIdIdx] = newProductId;
      if (newName) cols[nameIdx] = newName;
      if (req.body.origin) cols[originIdx] = req.body.origin;
      if (newImage) cols[imageIdx] = newImage;
      
      // Giữ nguyên các trường khác
      return cols.join(',');
    }
    return line;
  });

  // Ghi file với đúng số cột và format
  fs.writeFileSync(addSPPath, updatedLines.join('\n'), 'utf8');
}}}

    res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (error) {
    console.error('Error updating diary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
/////////////////////////////////////////////////////////////////////////////////////////

// API sửa thông tin sản phẩm đã thêm vào truy xuất
app.put('/api/products/:index', (req, res) => {
  const index = req.params.index;
  const updated = req.body;
  const filePath = path.join(__dirname, 'csv', 'addSP.csv');
  const results = [];
  let headers = [];
  fs.createReadStream(filePath)
    .pipe(csv.parse({ headers: true }))
    .on('headers', h => { headers = h; })
    .on('data', row => {
      if (row.index === index) {
        results.push({ ...row, ...updated });
      } else {
        results.push(row);
      }
    })
    .on('end', () => {
      const ws = fs.createWriteStream(filePath);
      csv.write(results, { headers: true }).pipe(ws)
        .on('finish', () => res.json({ success: true }))
        .on('error', err => res.status(500).json({ success: false, error: err.message }));
    });
});
/////////////////////////////////////////////////////////////////////////////////////////

// API cập nhật trạng thái truy xuất của nhật ký đã hoàn thành
app.put('/api/complete-diaries/:index', (req, res) => {

  if (req.body.stage === 'Hoàn thành') {
    const completePath = path.join(__dirname, 'csv', 'addCompleteNK.csv');
    const index = req.params.index;
    let found = false;
    let results = [];
    const header = 'batchCode,productId,name,origin,season,plantDate,area,stage,tracingStatus,note,index';

    try {
      // Đọc file hiện tại
      if (fs.existsSync(completePath)) {
        const lines = fs.readFileSync(completePath, 'utf8').split('\n').filter(Boolean);
        results = lines.length === 0 ? [header] : lines;
        
        // Cập nhật nếu tìm thấy
        results = results.map((line, idx) => {
          if (idx === 0) return line;
          const cols = line.split(',');
          if (cols[10] === index) {
            found = true;
            cols[7] = 'Hoàn thành';
            cols[8] = 'Đã truy xuất';
            cols[9] = req.body.note || cols[9];
          }
          return cols.join(',');
        });
      } else {
        results = [header];
      }

      // Nếu chưa có thì lấy từ addNK.csv
      if (!found) {
        const nkPath = path.join(__dirname, 'csv', 'addNK.csv');
        if (fs.existsSync(nkPath)) {
          const nkLines = fs.readFileSync(nkPath, 'utf8').split('\n').filter(Boolean);
          
          for (let i = 1; i < nkLines.length; i++) {
            const cols = nkLines[i].split(',');
            if (cols[10] === index) {
              const newRow = [
                cols[0], // batchCode
                cols[1], // productId
                cols[2], // name
                cols[3], // origin
                cols[4], // season
                cols[5], // plantDate
                cols[6], // area
                'Hoàn thành',
                'Chưa truy xuất', // tracingStatus
                req.body.note || cols[9] || '',
                cols[10] // index
              ].join(',');
              results.push(newRow);
              found = true;
              break;
            }
          }
        }
      }

      // Ghi file
      fs.writeFileSync(completePath, results.join('\n'), 'utf8');

      // Trả về kết quả chi tiết
      res.json({ 
        success: true,
        message: found ? 'Cập nhật thành công' : 'Thêm mới thành công',
        data: {
          found,
          totalLines: results.length,
          path: completePath,
        }
      });

    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        details: {
          batchCode,
          stage: req.body.stage,
          path: completePath
        }
      });
    }
  } else {
    res.json({
      success: false,
      message: 'Stage không phải Hoàn thành',
      stage: req.body.stage
    });
  }
});
/////////////////////////////////////////////////////////////////////////////////////////

// XÓA loại sản phẩm theo productId
app.delete('/api/product-types/:productId', (req, res) => {
  const productId = req.params.productId;
  const filePath = path.join(__dirname, 'csv', 'productTypes.csv');
  const results = [];
  let headers = [];
  fs.createReadStream(filePath)
    .pipe(csv.parse({ headers: true }))
    .on('headers', h => { headers = h; })
    .on('data', row => {
      if (row.productId !== productId) results.push(row);
    })
    .on('end', () => {
      const ws = fs.createWriteStream(filePath);
      csv.write(results, { headers: true }).pipe(ws)
        .on('finish', () => res.json({ success: true }))
        .on('error', err => res.status(500).json({ success: false, error: err.message }));
    });
});
/////////////////////////////////////////////////////////////////////////////////////////

// XÓA sản phẩm đã thêm vào truy xuất theo index
app.delete('/api/products/:index', (req, res) => {
  const index = req.params.index;
  const filePath = path.join(__dirname, 'csv', 'addSP.csv');
  const results = [];
  let headers = [];
  fs.createReadStream(filePath)
    .pipe(csv.parse({ headers: true }))
    .on('headers', h => { headers = h; })
    .on('data', row => {
      if (row.index !== index) results.push(row);
    })
    .on('end', () => {
      const ws = fs.createWriteStream(filePath);
      csv.write(results, { headers: true }).pipe(ws)
        .on('finish', () => res.json({ success: true }))
        .on('error', err => res.status(500).json({ success: false, error: err.message }));
    });
});
/////////////////////////////////////////////////////////////////////////////////////////

// API xóa sản phẩm để đánh dấu trong nhật ký hoàn thành
app.delete('/api/products/batch/:index', (req, res) => {
  const index = req.params.index;
  const filePath = path.join(__dirname, 'csv', 'addSP.csv');
  const completeNKPath = path.join(__dirname, 'csv', 'addCompleteNK.csv');
  const results = [];
  let headers = [];

  // 1. Xóa từ addSP.csv
  fs.createReadStream(filePath)
    .pipe(csv.parse({ headers: true }))
    .on('headers', h => { headers = h; })
    .on('data', row => {
      if (row.index !== index) {
        results.push(row);
      }
    })
    .on('end', () => {
      const ws = fs.createWriteStream(filePath);
      csv.write(results, { headers: true })
        .pipe(ws)
        .on('finish', async () => {
          try {
            // 2. Cập nhật trạng thái trong addCompleteNK.csv
            if (fs.existsSync(completeNKPath)) {
              const lines = fs.readFileSync(completeNKPath, 'utf8').split('\n').filter(Boolean);
              const newLines = lines.map((line, idx) => {
                if (idx === 0) return line;
                const cols = line.split(',');
                if (cols[10] === index) {  
                  cols[8] = '(Đã xóa khỏi truy xuất nguồn gốc)';
                  return cols.join(',');
                }
                return line;
              });

              // Ghi file với \n ở cuối
              fs.writeFileSync(completeNKPath, newLines.join('\n') + '\n', 'utf8');
            }

            res.json({ 
              success: true,
              message: 'Đã xóa sản phẩm và cập nhật trạng thái thành công'
            });
          } catch (error) {
            res.status(500).json({ 
              success: false, 
              error: error.message 
            });
          }
        });
    });
});
/////////////////////////////////////////////////////////////////////////////////////////

// API xóa nhật ký trồng trọt theo index
const parse = require('csv-parse/sync').parse;

app.delete('/api/crop-diaries/:index', (req, res) => {
  try {
    // Kiểm tra index có hợp lệ không
    const index = req.params.index;
    if (!index) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu index của nhật ký cần xóa'
      });
    }

    // Loại bỏ bất kỳ ký tự đường dẫn không hợp lệ
    const sanitizedIndex = index.replace(/[\/\\]/g, '');
    
    const filePath = path.join(__dirname, 'csv', 'addNK.csv');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy file nhật ký'
      });
    }

    // Đọc và xử lý file CSV
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    const header = lines[0];
    
    let deletedDiary = null;
    let newLines = lines.map((line, idx) => {
      if (idx === 0) return line;
      
      const cols = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        if (char === ',' && !inQuotes) {
          cols.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      cols.push(current);

      // Tìm nhật ký cần xóa theo index
      if (cols[10] === sanitizedIndex) {
        deletedDiary = {
          batchCode: cols[0],
          area: parseFloat(cols[6]) || 0
        };
        return null;
      }
      return line;
    }).filter(Boolean);

    if (!deletedDiary) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhật ký cần xóa'
      });
    }

    // Ghi lại file
    fs.writeFileSync(filePath, newLines.join('\n') + '\n', 'utf8');

    // Cập nhật diện tích trống
    const plotPath = path.join(__dirname, 'csv', 'addPlot.csv');
    if (fs.existsSync(plotPath)) {
      const plotLines = fs.readFileSync(plotPath, 'utf8').split('\n');
      const updatedPlotLines = plotLines.map((line, idx) => {
        if (idx === 0) return line;
        const cols = line.split(',');
        if (cols[0] === deletedDiary.batchCode) {
          const currentAreaFree = parseFloat(cols[2]) || 0;
          cols[2] = (currentAreaFree + deletedDiary.area).toString();
          return cols.join(',');
        }
        return line;
      });
      fs.writeFileSync(plotPath, updatedPlotLines.join('\n') + '\n', 'utf8');
    }

    res.json({
      success: true,
      message: 'Đã xóa nhật ký thành công',
      deletedDiary
    });

  } catch (error) {
    console.error('Error deleting diary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
/////////////////////////////////////////////////////////////////////////////////////////

// API lấy danh sách lô đất
app.get('/api/plots', (req, res) => {
  const filePath = path.join(__dirname, 'csv', 'addPlot.csv');
  if (!fs.existsSync(filePath)) return res.json([]);
  const results = [];
  fs.createReadStream(filePath)
    .pipe(csv.parse({ headers: true }))
    .on('data', row => results.push(row))
    .on('end', () => res.json(results))
    .on('error', () => res.json([]));
});

// Đọc sản phẩm từ CSV
app.get('/api/products', (req, res) => {
  const results = [];
  fs.createReadStream(path.join(__dirname, 'csv', 'addSP.csv'))
    .pipe(csv.parse({ headers: true }))
    .on('error', error => res.status(500).json({ error: error.message }))
    .on('data', row => results.push(row))
    .on('end', () => res.json(results));
});

// Đọc nhật ký trồng trọt từ CSV
app.get('/api/crop-diaries', (req, res) => {
  try {
    const filePath = path.join(__dirname, 'csv', 'addNK.csv');
    if (!fs.existsSync(filePath)) {
      return res.json([]);
    }

    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv.parse({ headers: true }))
      .on('error', error => {
        console.error('Error reading CSV:', error);
        res.status(500).json({ error: error.message });
      })
      .on('data', row => {
        // Parse updates if exists
        if (row.updates) {
          try {
            // Clean up the JSON string
            const jsonStr = row.updates
              .replace(/^"|"$/g, '')
              .replace(/""/g, '"')
              .trim();
            row.updates = JSON.parse(jsonStr);
          } catch (e) {
            console.error('Error parsing updates:', e);
            row.updates = [];
          }
        } else {
          row.updates = [];
        }
        results.push(row);
      })
      .on('end', () => {
        res.json(results);
      });
  } catch (error) {
    console.error('Error in GET /api/crop-diaries:', error);
    res.status(500).json({ error: error.message });
  }
});

// API lấy danh sách loại sản phẩm
app.get('/api/product-types', (req, res) => {
  const results = [];
  fs.createReadStream(PRODUCT_TYPE_CSV)
    .pipe(csv.parse({ headers: true }))
    .on('data', row => {
      results.push(row);
    })
    .on('end', () => {
      res.json(results);
    })
    .on('error', () => res.json([]));
});


// API lấy danh sách nhật ký hoàn thành
app.get('/api/complete-diaries', (req, res) => {
  const filePath = path.join(__dirname, 'csv', 'addCompleteNK.csv');
  if (!fs.existsSync(filePath)) return res.json([]);
  
  const results = [];
  fs.createReadStream(filePath)
    .pipe(csv.parse({ headers: true }))
    .on('data', row => {
      row.isDeleted = row.note?.includes('(Đã xóa khỏi truy xuất nguồn gốc)');
      results.push(row);
    })
    .on('end', () => res.json(results))
    .on('error', err => res.status(500).json({ error: err.message }));
});

app.get('/api/crop-logs', (req, res) => {
  res.json([]);
});

// API lấy danh sách QR đã xuất
app.get('/api/exported-qr', (req, res) => {
  const filePath = path.join(__dirname, 'csv', 'addQR.csv');
  if (!fs.existsSync(filePath)) return res.json([]);
  const results = [];
  fs.createReadStream(filePath)
    .pipe(csv.parse({ headers: true }))
    .on('data', row => results.push(row))
    .on('end', () => res.json(results))
    .on('error', () => res.json([]));
});

app.get('/api/product-info', (req, res) => {
  const { index } = req.query;
  const filePath = path.join(__dirname, 'csv', 'addSP.csv');
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  const results = [];
  fs.createReadStream(filePath)
    .pipe(csv.parse({ headers: true }))
    .on('data', row => {
      if (
        (index && row.index === index)
      ) {
        results.push(row);
      }
    })
    .on('end', () => {
      if (results.length > 0) res.json(results[0]);
      else res.status(404).json({ error: 'Not found' });
    });
});

const processUpload = multer({ dest: path.join(__dirname, 'public', 'uploads') });

app.post('/api/prod-process', processUpload.array('imageProd', 10), (req, res) => {
  const { stage, date, content, index } = req.body;
  let imageProd = '';
  if (req.files && req.files.length > 0) {
    // Lưu nhiều đường dẫn, phân cách bằng dấu phẩy
    imageProd = req.files.map(f => `/uploads/${f.filename}`).join(',');
  }
  const filePath = path.join(__dirname, 'csv', 'prodProcess.csv');
  let needHeader = false;
  if (!fs.existsSync(filePath) || fs.readFileSync(filePath, 'utf8').trim() === '') {
    needHeader = true;
  }
  const row = [
    `"${(stage || '').replace(/"/g, '""')}"`,
    `"${(date || '').replace(/"/g, '""')}"`,
    `"${(content || '').replace(/"/g, '""')}"`,
    `"${imageProd}"`,
    `"${(index || '').replace(/"/g, '""')}"`
  ].join(',') + '\n';
  if (needHeader) {
    fs.writeFileSync(filePath, 'stage,date,content,imageProd,index\n' + row, 'utf8');
  } else {
    fs.appendFileSync(filePath, row, 'utf8');
  }
  res.json({ success: true, message: 'Đã lưu quá trình sản xuất', imageProd });
});

app.get('/api/prod-process', (req, res) => {
  const filePath = path.join(__dirname, 'csv', 'prodProcess.csv');
  const results = [];
  if (!fs.existsSync(filePath)) return res.json([]);
  fs.createReadStream(filePath)
    .pipe(csv.parse({ headers: true }))
    .on('data', row => results.push(row))
    .on('end', () => res.json(results));
});

// Đăng nhập: kiểm tra users.csv trước, nếu không có thì check admin mặc định
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  // 1. Kiểm tra trong users.csv
  if (fs.existsSync(USERS_CSV)) {
    const lines = fs.readFileSync(USERS_CSV, 'utf8').split('\n').filter(Boolean);
    const header = lines[0].split(',');
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      if (cols[0] === username) {
        const hash = cols[1];
        const role = cols[2];
        // So sánh password
        const ok = await require('bcryptjs').compare(password, hash);
        if (ok) {
          return res.json({
            success: true,
            user: {
              username,
              role,
              token: 'dummy-token'
            }
          });
        } else {
          return res.json({ success: false, message: 'Sai tài khoản hoặc mật khẩu' });
        }
      }
    }
  }
  // 2. Nếu không có user, check admin mặc định
  if (username === 'admin' && password === 'admin123') {
    return res.json({
      success: true,
      user: {
        username: 'admin',
        role: 'admin',
        token: 'dummy-token'
      }
    });
  }
  res.json({ success: false, message: 'Sai tài khoản hoặc mật khẩu' });
});

// Lấy danh sách user (chỉ cho admin)
app.get('/api/users', (req, res) => {
  // Đơn giản: không xác thực token, chỉ demo
  if (!fs.existsSync(USERS_CSV)) return res.json({ success: true, users: [] });
  const results = [];
  fs.createReadStream(USERS_CSV)
    .pipe(csv.parse({ headers: true }))
    .on('data', row => results.push(row))
    .on('end', () => res.json({ success: true, users: results }))
    .on('error', () => res.json({ success: true, users: [] }));
});

// Thêm user mới (chỉ cho admin và manager)
app.post('/api/users', checkWritePermission, async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.json({ success: false, message: 'Thiếu thông tin' });
  }
  if (!['admin', 'manager', 'user'].includes(role)) {
    return res.json({ success: false, message: 'Quyền không hợp lệ' });
  }
  // Kiểm tra trùng username
  let users = [];
  if (fs.existsSync(USERS_CSV)) {
    users = fs.readFileSync(USERS_CSV, 'utf8').split('\n').filter(Boolean);
    // Bỏ header
    users = users.slice(1).map(line => line.split(',')[0]);
    if (users.includes(username)) {
      return res.json({ success: false, message: 'Tên đăng nhập đã tồn tại' });
    }
  }
  // Hash password
  const hash = await bcrypt.hash(password, 8);
  const needHeader = !fs.existsSync(USERS_CSV) || fs.readFileSync(USERS_CSV, 'utf8').trim() === '';
  const row = `${username},${hash},${role},${new Date().toISOString()}\n`;
  if (needHeader) {
    fs.writeFileSync(USERS_CSV, 'username,password,role,created_at\n' + row, 'utf8');
  } else {
    fs.appendFileSync(USERS_CSV, row, 'utf8');
  }
  res.json({ success: true, user: { username, role } });
});

// Middleware kiểm tra quyền ghi (admin hoặc manager hoặc user)
function checkWritePermission(req, res, next) {
  const role = req.headers['x-role'] || req.body.role || req.query.role || 'user';
  if (role !== 'admin' && role !== 'manager' && role !== 'user') {
    return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện thao tác này' });
  }
  next();
}