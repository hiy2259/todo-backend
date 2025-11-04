// Todo Backend Server
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const todoRouter = require('./routers/todoRouter');

const app = express();
const PORT = 3000;

// MongoDB 연결
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/todo-db';

if (!process.env.MONGODB_URI) {
  console.warn('⚠️  MONGODB_URI 환경 변수가 설정되지 않아 기본값을 사용합니다.');
}

// URI에서 비밀번호 마스킹 (로그 출력용)
const maskedURI = MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
console.log('MongoDB 연결 시도 중...');
console.log('MONGODB_URI:', maskedURI);

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 10000, // 10초 타임아웃
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log('✅ MongoDB 연결 성공');
    console.log('연결된 데이터베이스:', mongoose.connection.name);
  })
  .catch((err) => {
    console.error('❌ MongoDB 연결 실패:', err.message);
    
    if (err.message.includes('whitelist') || err.message.includes('IP address')) {
      console.error('\n📌 IP 주소가 whitelist에 등록되지 않았습니다.');
      console.error('MongoDB Atlas에서 다음을 확인하세요:');
      console.error('1. MongoDB Atlas 대시보드 접속: https://cloud.mongodb.com/');
      console.error('2. Network Access (또는 IP Access List) 메뉴로 이동');
      console.error('3. "Add IP Address" 또는 "+ ADD IP ADDRESS" 클릭');
      console.error('4. 현재 IP 주소 추가 또는 "Allow Access from Anywhere" (0.0.0.0/0) 선택');
      console.error('   ⚠️  개발 환경에서만 "Allow Access from Anywhere" 사용 권장');
      console.error('\n현재 IP 주소를 확인하려면: curl https://api.ipify.org');
    } else if (err.message.includes('authentication failed') || err.message.includes('bad auth')) {
      console.error('\n📌 인증 실패: 사용자 이름 또는 비밀번호를 확인하세요.');
      console.error('.env 파일의 MONGODB_URI에 올바른 인증 정보가 포함되어 있는지 확인하세요.');
    } else if (MONGODB_URI.includes('localhost')) {
      console.error('\n📌 로컬 MongoDB 서버 연결 문제:');
      console.error('MongoDB 서버가 실행 중인지 확인하세요: brew services start mongodb-community');
    } else {
      console.error('\n📌 연결 문제 해결 방법:');
      console.error('1. MongoDB Atlas 클러스터가 실행 중인지 확인');
      console.error('2. 연결 문자열이 올바른지 확인');
      console.error('3. 네트워크 연결 상태 확인');
    }
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
