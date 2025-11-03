const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  color: {
    type: String,
    required: true,
    default: '#3B82F6', // 기본 파란색
  },
  time: {
    type: String,
    required: true,
    // 시간 형식: "HH:MM" (예: "14:30")
  },
}, {
  timestamps: true, // createdAt, updatedAt 자동 생성
});

const Todo = mongoose.model('Todo', todoSchema);

module.exports = Todo;

