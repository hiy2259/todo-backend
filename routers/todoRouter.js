const express = require('express');
const mongoose = require('mongoose');
const Todo = require('../models/Todo');

const router = express.Router();

// 월별 일자별 할일 목록 조회 라우터 (달력용)
router.get('/calendar', async (req, res) => {
  try {
    const { year, month } = req.query;

    // 파라미터 검증
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: '년도와 월 파라미터가 필요합니다. (예: ?year=2024&month=1)',
      });
    }

    // 년도, 월 유효성 검증
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        message: '유효한 년도(숫자)와 월(1-12)을 입력해주세요.',
      });
    }

    // 해당 월의 시작일과 종료일 계산
    const startDate = new Date(Date.UTC(yearNum, monthNum - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(yearNum, monthNum, 0, 23, 59, 59, 999));

    // 해당 월의 모든 할일 조회
    const todos = await Todo.find({
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ date: 1, time: 1 }); // 날짜, 시간 순으로 정렬

    // 일자별로 그룹화
    const calendarData = {};
    
    todos.forEach(todo => {
      const todoDate = new Date(todo.date);
      const day = todoDate.getUTCDate(); // 일자 추출
      
      if (!calendarData[day]) {
        calendarData[day] = [];
      }
      
      calendarData[day].push(todo);
    });

    res.status(200).json({
      success: true,
      message: '월별 할일 목록을 성공적으로 조회했습니다.',
      year: yearNum,
      month: monthNum,
      totalCount: todos.length,
      data: calendarData,
    });
  } catch (error) {
    console.error('월별 할일 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '월별 할일 목록 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
});

// 날짜별 할일 목록 조회 라우터
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;

    // 날짜 파라미터 검증
    if (!date) {
      return res.status(400).json({
        success: false,
        message: '날짜 파라미터가 필요합니다. (예: ?date=2024-01-15)',
      });
    }

    // 날짜 유효성 검증
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: '유효한 날짜 형식이 아닙니다. (예: 2024-01-15)',
      });
    }

    // 해당 날짜의 시작일시와 종료일시 계산 (UTC 기준)
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // 해당 날짜의 할일 목록 조회 (시간 순으로 정렬)
    const todos = await Todo.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).sort({ time: 1 }); // 시간 오름차순 정렬

    res.status(200).json({
      success: true,
      message: '할일 목록을 성공적으로 조회했습니다.',
      date: date,
      count: todos.length,
      data: todos,
    });
  } catch (error) {
    console.error('할일 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '할일 목록 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
});

// 할일 생성 라우터
router.post('/', async (req, res) => {
  try {
    const { date, content, color, time } = req.body;

    // 필수 필드 검증
    if (!date || !content || !time) {
      return res.status(400).json({
        success: false,
        message: '날짜, 할일 내용, 시간은 필수 입력 항목입니다.',
      });
    }

    // 날짜 유효성 검증
    const todoDate = new Date(date);
    if (isNaN(todoDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: '유효한 날짜 형식이 아닙니다.',
      });
    }

    // 시간 형식 검증 (HH:MM)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return res.status(400).json({
        success: false,
        message: '시간 형식이 올바르지 않습니다. (예: 14:30)',
      });
    }

    // 할일 생성
    const newTodo = new Todo({
      date: todoDate,
      content: content.trim(),
      color: color || '#3B82F6',
      time: time,
    });

    const savedTodo = await newTodo.save();

    res.status(201).json({
      success: true,
      message: '할일이 성공적으로 생성되었습니다.',
      data: savedTodo,
    });
  } catch (error) {
    console.error('할일 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '할일 생성 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
});

// 할일 수정 라우터
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, content, color, time } = req.body;

    // ID 유효성 검증
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 할일 ID입니다.',
      });
    }

    // 할일 존재 여부 확인
    const todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({
        success: false,
        message: '해당 할일을 찾을 수 없습니다.',
      });
    }

    // 업데이트할 데이터 객체 생성
    const updateData = {};

    // 날짜 업데이트
    if (date !== undefined) {
      const todoDate = new Date(date);
      if (isNaN(todoDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: '유효한 날짜 형식이 아닙니다.',
        });
      }
      updateData.date = todoDate;
    }

    // 할일 내용 업데이트
    if (content !== undefined) {
      if (!content.trim()) {
        return res.status(400).json({
          success: false,
          message: '할일 내용은 비어있을 수 없습니다.',
        });
      }
      updateData.content = content.trim();
    }

    // 컬러 업데이트
    if (color !== undefined) {
      updateData.color = color;
    }

    // 시간 업데이트
    if (time !== undefined) {
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(time)) {
        return res.status(400).json({
          success: false,
          message: '시간 형식이 올바르지 않습니다. (예: 14:30)',
        });
      }
      updateData.time = time;
    }

    // 업데이트할 데이터가 없는 경우
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: '수정할 데이터가 없습니다.',
      });
    }

    // 할일 수정
    const updatedTodo = await Todo.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: '할일이 성공적으로 수정되었습니다.',
      data: updatedTodo,
    });
  } catch (error) {
    console.error('할일 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '할일 수정 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
});

// 할일 삭제 라우터
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // ID 유효성 검증
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 할일 ID입니다.',
      });
    }

    // 할일 존재 여부 확인 및 삭제
    const todo = await Todo.findByIdAndDelete(id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: '해당 할일을 찾을 수 없습니다.',
      });
    }

    res.status(200).json({
      success: true,
      message: '할일이 성공적으로 삭제되었습니다.',
      data: todo,
    });
  } catch (error) {
    console.error('할일 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '할일 삭제 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
});

module.exports = router;

