const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const upload = multer({ dest: path.join(__dirname, 'public', 'uploads') });
const QRCode = require('qrcode');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Kết nối MongoDB Atlas
const MONGO_URI = 'mongodb+srv://bloguser:khanhnhan200402%40%40@cluster0.mmb1ikc.mongodb.net/demoHTX?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Đã kết nối MongoDB Cloud'))
  .catch(err => console.error('Lỗi kết nối MongoDB:', err));

// Schemas
const ProductTypeSchema = new mongoose.Schema({
  image: String,
  productId: { type: String, unique: true },
  name: String
});
const ProductType = mongoose.model('ProductType', ProductTypeSchema);

const PlotSchema = new mongoose.Schema({
  batchCode: { type: String, unique: true },
  area: Number,
  areaFree: Number
});
const Plot = mongoose.model('Plot', PlotSchema);

const CropDiarySchema = new mongoose.Schema({
  batchCode: String,
  productId: String,
  name: String,
  origin: String,
  season: String,
  plantDate: String,
  area: Number,
  stage: String,
  updates: Array,
  note: String,
  index: { type: String, unique: true },
  outputQty: String,
  tracingStatus: String // Thêm trường trạng thái truy xuất
});
const CropDiary = mongoose.model('CropDiary', CropDiarySchema);

const ProductSchema = new mongoose.Schema({
  image: String,
  productId: String,
  batchCode: String,
  name: String,
  origin: String,
  productionDate: String,
  expiryDate: String,
  outputQty: String,
  qrImage: String,
  index: { type: String, unique: true }
});
const Product = mongoose.model('Product', ProductSchema);

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  role: String,
  created_at: String
});
const User = mongoose.model('User', UserSchema);

const TraceSchema = new mongoose.Schema({
  image: String,
  productId: String,
  batchCode: String,
  name: String,
  origin: String,
  productionDate: String,
  outputQty: String,
  qrImage: String,
  index: { type: String, unique: true }
});
const Trace = mongoose.model('Trace', TraceSchema);

const ExportedQRs = new mongoose.Schema({
  index: { type: String, unique: true },
  qrImage: String,
  weight: String,
  phone: String,
  expiryDate: String,
  batchCode: String,
  name: String,
  productionDate: String
});
const ExportedQR = mongoose.model('ExportedQR', ExportedQRs);

// Schema cho ProductionProcess
const ProductionProcessSchema = new mongoose.Schema({
  index: String,
  stage: String,
  content: String,
  date: String,
  imageProd: String,
  name: String,
  productId: String,
});
const ProductionProcess = mongoose.model('ProductionProcess', ProductionProcessSchema);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.listen(3001, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:3001 (LAN)`);
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
  if (Number.isInteger(num)) return num.toString();prod-process
  return Number(num).toString();
}

// API thêm loại sản phẩm
app.post('/api/product-types', upload.single('image'), async (req, res) => {
  const { id, name } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : '';
  if (!id || !name) return res.status(400).json({ success: false, message: 'Thiếu thông tin' });
  try {
    const isExist = await ProductType.findOne({ productId: id });
    if (isExist) {
      return res.status(400).json({ success: false, message: 'Mã sản phẩm đã tồn tại!' });
    }
    await ProductType.create({ image: imagePath, productId: id, name });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
//////////////////////////////////////////////////////////////////////////////////////////

// API thêm mã lô đất mới
app.post('/api/plots', async (req, res) => {
  const { batchCode, area } = req.body;
  if (!batchCode || !area) {
    return res.status(400).json({ success: false, message: 'Thiếu batchCode hoặc area' });
  }
  try {
    const isExist = await Plot.findOne({ batchCode });
    if (isExist) {
      return res.status(400).json({ success: false, message: 'Mã lô đã tồn tại!' });
    }
    await Plot.create({ batchCode, area, areaFree: area });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
////////////////////////////////////////////////////////////////////////////////////////

// API thêm nhật ký mới
app.post('/api/crop-diaries', async (req, res) => {
  try {
    let {
      batchCode, productId, name, origin, season, plantDate, sowingDate, area, stage, outputQty, imageProd
    } = req.body;
    plantDate = plantDate || sowingDate;
    if (!plantDate) {
      return res.status(400).json({ success: false, error: 'Thiếu ngày gieo trồng' });
    }
    // --- Cập nhật areaFree ---
    const plot = await Plot.findOne({ batchCode });
    if (!plot) {
      return res.status(400).json({ success: false, error: 'Không tìm thấy lô đất' });
    }
    if (plot.areaFree < parseFloat(area)) {
      return res.status(400).json({ success: false, error: 'Diện tích trống không đủ!' });
    }
    plot.areaFree = (plot.areaFree - parseFloat(area));
    await plot.save();
    // --- hết cập nhật areaFree ---
    const index = randomIndex(10);
    const now = new Date();
    const dateString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const updates = [{ date: dateString, stage: stage || '', note: `Khởi tạo: ${stage || ''}` }];
    await CropDiary.create({ batchCode, productId, name, origin, season, plantDate, area, stage, updates, note: `Khởi tạo: ${stage || ''}`, index, outputQty });
    // Lưu vào ProductionProcess khi khởi tạo
    await ProductionProcess.create({
      index,
      stage: stage || '',
      content: `Khởi tạo: ${stage || ''}`,
      date: dateString,
      imageProd: imageProd || ''
    });
    res.json({ success: true, index, batchCode });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
///////////////////////////////////////////////////////////////////////////////////////

// API Thêm sản phẩm
app.post('/api/products', async (req, res) => {
  try {
    const newProduct = req.body;
    await Product.create(newProduct);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
////////////////////////////////////////////////////////////////////////////////////////

// API thêm truy xuất nguồn gốc
app.post('/api/trace', async (req, res) => {
  try {
    let traceData = req.body;
    // Lấy thông tin sản phẩm từ ProductType
    const productType = await ProductType.findOne({ productId: traceData.productId });
    if (productType && productType.image) {
      traceData.image = productType.image;
    }
    // Lấy sản lượng từ CropDiary (outputQty)
    const diary = await CropDiary.findOne({ index: traceData.index });
    if (diary && diary.outputQty) {
      traceData.outputQty = diary.outputQty || '';
    } 
    // Nếu chưa có mã QR thì tự động sinh
    if (!traceData.qrImage) {
      const qrContentValue = `SP:${traceData.productId};LO:${traceData.batchCode};NAME:${traceData.name};DATE:${traceData.productionDate}`;
      traceData.qrImage = await QRCode.toDataURL(qrContentValue);
    }
    const exist = await Trace.findOne({ index: traceData.index });
    if (exist) {
      await Trace.findOneAndUpdate({ index: traceData.index }, traceData, { new: true });
    } else {
      await Trace.create(traceData);
    }
    // Cập nhật trạng thái trong CropDiary
    await CropDiary.findOneAndUpdate({ index: traceData.index }, { tracingStatus: 'Đã thêm vào truy xuất' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
////////////////////////////////////////////////////////////////////////////////////////

// API xuất mã QR cho sản phẩm truy xuất nguồn gốc
app.post('/api/trace/export-qr', async (req, res) => {
  try {
    const { index } = req.body;
    const trace = await Trace.findOne({ index });
    if (!trace) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm truy xuất' });
    // Nếu chưa có mã QR thì sinh mới
    if (!trace.qrImage) {
      const qrContent = `SP:${trace.productId};LO:${trace.batchCode};NAME:${trace.name};DATE:${trace.productionDate}`;
      trace.qrImage = await QRCode.toDataURL(qrContent);
      await trace.save();
    }
    res.json({ success: true, qrImage: trace.qrImage, index: trace.index });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
////////////////////////////////////////////////////////////////////////////////////////

// API xuất mã QR cho sản phẩm (lưu vào ExportedQR)
app.post('/api/export-qr', async (req, res) => {
  try {
    const { index, weight, phone, expiryDate } = req.body;
    // Lấy qrImage từ Trace
    const trace = await Trace.findOne({ index });
    if (!trace) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm truy xuất' });
    // Lưu vào ExportedQR
    await ExportedQR.findOneAndUpdate(
      { index },
      {
        index,
        qrImage: trace.qrImage,
        weight: weight || '',
        phone: phone || '',
        expiryDate: expiryDate || ''
      },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
////////////////////////////////////////////////////////////////////////////////////////

// API lấy danh sách loại sản phẩm
app.get('/api/product-types', async (req, res) => {
  try {
    const results = await ProductType.find();
    res.json(results);
  } catch (err) {
    res.json([]);
  }
});

// API lấy danh sách lô đất
app.get('/api/plots', async (req, res) => {
  try {
    const results = await Plot.find();
    res.json(results);
  } catch (err) {
    res.json([]);
  }
});

// API lấy danh sách nhật ký trồng trọt
app.get('/api/crop-diaries', async (req, res) => {
  try {
    const results = await CropDiary.find();
    res.json(results);
  } catch (err) {
    res.json([]);
  }
});

// API lấy danh sách nhật ký hoàn thành
app.get('/api/complete-diaries', async (req, res) => {
  try {
    // Giả sử nhật ký hoàn thành có stage là 'Hoàn thành'
    const results = await CropDiary.find({ stage: 'Hoàn thành' });
    res.json(results);
  } catch (err) {
    res.json([]);
  }
});

// API lấy danh sách sản phẩm
app.get('/api/products', async (req, res) => {
  try {
    const results = await Product.find();
    res.json(results);
  } catch (err) {
    res.json([]);
  }
});

// API lấy danh sách lô đất kèm cây trồng
app.get('/api/plots-with-crops', async (req, res) => {
  try {
    const plots = await Plot.find();
    const crops = await CropDiary.find();
    const plotsWithCrops = plots.map(plot => ({
      ...plot.toObject(),
      crops: crops.filter(crop => crop.batchCode === plot.batchCode)
    }));
    res.json(plotsWithCrops);
  } catch (err) {
    res.json([]);
  }
});

// API lấy danh sách truy xuất nguồn gốc
app.get('/api/trace', async (req, res) => {
  try {
    const results = await Trace.find();
    res.json(results);
  } catch (err) {
    res.json([]);
  }
});

// API lấy danh sách QR đã xuất (chỉ trả về các ExportedQR)
app.get('/api/exported-qr', async (req, res) => {
  try {
    const results = await ExportedQR.find();
    res.json(results);
  } catch (err) {
    res.json([]);
  }
});

// API lấy thông tin sản phẩm theo index cho QR
app.get('/api/product-info', async (req, res) => {
  const { index } = req.query;
  try {
    const trace = await Trace.findOne({ index });
    if (!trace) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    res.json(trace);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API thêm công đoạn sản xuất (có thể upload ảnh)
app.post('/api/prod-process', upload.array('imageProd', 10), async (req, res) => {
  try {
    const { index, stage, content, date } = req.body;
    let imageProd = '';
    if (req.files && req.files.length > 0) {
      imageProd = req.files.map(f => `/uploads/${f.filename}`).join(',');
    } else if (req.body.imageProd) {
      imageProd = req.body.imageProd;
    }
    await ProductionProcess.create({ index, stage, content, date, imageProd });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API lấy danh sách công đoạn sản xuất (gộp theo index, trả về mảng object: {index, stages, name, productId})
app.get('/api/prod-process', async (req, res) => {
  try {
    const results = await ProductionProcess.find();
    const cropDiaries = await CropDiary.find();
    // Gộp các công đoạn theo index
    const grouped = {};
    results.forEach(item => {
      if (!item.index) return;
      if (!grouped[item.index]) grouped[item.index] = { index: item.index, stages: [], name: '', productId: '' };
      // Format date nếu là ISO
      let formattedDate = item.date;
      if (formattedDate && formattedDate.includes('T')) {
        const d = new Date(formattedDate);
        formattedDate = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      }
      grouped[item.index].stages.push({
        stage: item.stage,
        content: item.content,
        date: formattedDate,
        imageProd: item.imageProd
      });
    });
    // Gán thêm tên sản phẩm và mã sản phẩm từ CropDiary
    Object.values(grouped).forEach(group => {
      const diary = cropDiaries.find(d => d.index === group.index);
      if (diary) {
        group.name = diary.name || '';
        group.productId = diary.productId || '';
      }
    });
    res.json(Object.values(grouped));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Đăng nhập: kiểm tra user trong MongoDB trước, nếu không có thì check admin mặc định
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  // 1. Kiểm tra trong MongoDB
  const user = await User.findOne({ username });
  if (user) {
    const ok = await bcrypt.compare(password, user.password);
    if (ok) {
      return res.json({
        success: true,
        user: {
          username: user.username,
          role: user.role,
          token: 'dummy-token'
        }
      });
    } else {
      return res.json({ success: false, message: 'Sai tài khoản hoặc mật khẩu' });
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
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // Ẩn password
    res.json({ success: true, users });
  } catch (err) {
    res.json({ success: true, users: [] });
  }
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
  const isExist = await User.findOne({ username });
  if (isExist) {
    return res.json({ success: false, message: 'Tên đăng nhập đã tồn tại' });
  }
  // Hash password
  const hash = await bcrypt.hash(password, 8);
  await User.create({ username, password: hash, role, created_at: new Date().toISOString() });
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

// --- PRODUCT TYPES ---
app.put('/api/product-types/:id', upload.single('image'), async (req, res) => {
  const { name, type, expiryDate } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : undefined;
  try {
    const update = { name, type, expiryDate };
    if (imagePath) update.image = imagePath;
    const result = await ProductType.findOneAndUpdate({ productId: req.params.id }, update, { new: true });
    if (!result) return res.status(404).json({ success: false, message: 'Không tìm thấy loại sản phẩm' });
    res.json({ success: true, productType: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
app.delete('/api/product-types/:id', async (req, res) => {
  try {
    const result = await ProductType.findOneAndDelete({ productId: req.params.id });
    if (!result) return res.status(404).json({ success: false, message: 'Không tìm thấy loại sản phẩm' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- PLOTS ---
app.put('/api/plots/:batchCode', async (req, res) => {
  const { area, areaFree } = req.body;
  try {
    const result = await Plot.findOneAndUpdate({ batchCode: req.params.batchCode }, { area, areaFree }, { new: true });
    if (!result) return res.status(404).json({ success: false, message: 'Không tìm thấy lô đất' });
    res.json({ success: true, plot: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
app.delete('/api/plots/:batchCode', async (req, res) => {
  try {
    const result = await Plot.findOneAndDelete({ batchCode: req.params.batchCode });
    if (!result) return res.status(404).json({ success: false, message: 'Không tìm thấy lô đất' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- CROP DIARIES ---
// API cập nhật giai đoạn nhật ký (cập nhật stage, content, date, imageProd vào ProductionProcess)
app.put('/api/crop-diaries/:index', upload.array('imageProd', 10), async (req, res) => {
  try {
    const update = req.body;
    let imageProd = '';
    if (req.files && req.files.length > 0) {
      imageProd = req.files.map(f => `/uploads/${f.filename}`).join(',');
    } else if (req.body.imageProd) {
      imageProd = req.body.imageProd;
    }
    // Chỉ cập nhật CropDiary
    const result = await CropDiary.findOneAndUpdate({ index: req.params.index }, update, { new: true });
    if (!result) return res.status(404).json({ success: false, message: 'Không tìm thấy nhật ký' });
    // Lưu vào ProductionProcess chỉ khi thực sự có thay đổi và có nội dung (stage hoặc content hoặc imageProd)
    if ((update.stage || update.content || imageProd) && (update.content || imageProd)) {
      const lastProcess = await ProductionProcess.findOne({ index: req.params.index }).sort({ _id: -1 });
      if (!lastProcess || lastProcess.stage !== update.stage || lastProcess.content !== update.content || lastProcess.imageProd !== imageProd) {
        await ProductionProcess.create({
          index: req.params.index,
          stage: update.stage || '',
          content: update.content || '',
          date: update.date || new Date().toISOString(),
          imageProd: imageProd || ''
        });
      }
    }
    res.json({ success: true, cropDiary: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
app.delete('/api/crop-diaries/:index', async (req, res) => {
  try {
    const result = await CropDiary.findOneAndDelete({ index: req.params.index });
    if (!result) return res.status(404).json({ success: false, message: 'Không tìm thấy nhật ký' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- PRODUCTS ---
app.put('/api/products/:index', async (req, res) => {
  try {
    const update = req.body;
    const result = await Product.findOneAndUpdate({ index: req.params.index }, update, { new: true });
    if (!result) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    res.json({ success: true, product: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
app.delete('/api/products/:index', async (req, res) => {
  try {
    const result = await Product.findOneAndDelete({ index: req.params.index });
    if (!result) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- USERS ---
app.put('/api/users/:username', checkWritePermission, async (req, res) => {
  const { password, role } = req.body;
  try {
    const update = {};
    if (password) update.password = await bcrypt.hash(password, 8);
    if (role) update.role = role;
    const result = await User.findOneAndUpdate({ username: req.params.username }, update, { new: true });
    if (!result) return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    res.json({ success: true, user: { username: result.username, role: result.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
app.delete('/api/users/:username', checkWritePermission, async (req, res) => {
  try {
    const result = await User.findOneAndDelete({ username: req.params.username });
    if (!result) return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- COMPLETE DIARIES ---
app.put('/api/complete-diaries/:index', async (req, res) => {
  try {
    const update = req.body;
    const result = await CropDiary.findOneAndUpdate({ index: req.params.index }, update, { new: true });
    if (!result) return res.status(404).json({ success: false, message: 'Không tìm thấy nhật ký' });
    res.json({ success: true, cropDiary: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- TRACE ---
app.delete('/api/trace/:index', async (req, res) => {
  try {
    const result = await Trace.findOneAndDelete({ index: req.params.index });
    if (!result) return res.status(404).json({ success: false, message: 'Không tìm thấy truy xuất' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Thêm/sửa loại sản phẩm nhận thêm trường type
app.post('/api/product-types', upload.none(), (req, res) => {
  const { productId, name, type, expiryDate, image } = req.body;
  const newType = { productId, name, type, expiryDate, image };
});

app.put('/api/product-types/:id', upload.none(), (req, res) => {
  const { name, type, expiryDate, image } = req.body;
});