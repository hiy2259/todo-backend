// Todo Backend Server
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const todoRouter = require('./routers/todoRouter');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB 연결
const MONGODB_URI = 'mongodb://localhost:27017/todo-db';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB 연결 성공');
  })
  .catch((err) => {
    console.error('MongoDB 연결 실패:', err.message);
    console.error('MongoDB 서버가 실행 중인지 확인하세요: brew services start mongodb-community');
  });

// CORS 설정 (모든 미들웨어보다 먼저 설정)
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false,
};

app.use(cors());

// Express 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ message: 'Todo Backend 서버가 실행 중입니다!' });
});

// 할일 라우터
app.use('/api/todos', todoRouter);

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}번에서 실행 중입니다.`);
  console.log('Node.js 버전:', process.version);
});
