import { Router } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = Router();

// GET /api/v1/wardrobes - 获取所有衣柜
router.get('/', async (req, res, next) => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('wardrobes')
      .select('id, name, layout, created_at, updated_at')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`查询失败: ${error.message}`);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/wardrobes/:id - 获取单个衣柜（含衣服列表）
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('wardrobes')
      .select('id, name, layout, created_at, updated_at')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`查询失败: ${error.message}`);
    if (!data) {
      res.status(404).json({ error: '衣柜不存在' });
      return;
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/wardrobes - 创建衣柜
// Body: name: string, layout: object
router.post('/', async (req, res, next) => {
  try {
    const { name, layout } = req.body;
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: '衣柜名称不能为空' });
      return;
    }
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('wardrobes')
      .insert({ name, layout: layout || { rows: 2, cols: 3, slots: [] } })
      .select()
      .single();
    if (error) throw new Error(`创建失败: ${error.message}`);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/wardrobes/:id - 更新衣柜
// Body: name?: string, layout?: object
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updateData: Record<string, unknown> = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.layout) updateData.layout = req.body.layout;
    updateData.updated_at = new Date().toISOString();

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('wardrobes')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw new Error(`更新失败: ${error.message}`);
    if (!data) {
      res.status(404).json({ error: '衣柜不存在' });
      return;
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/wardrobes/:id - 删除衣柜（级联删除衣服）
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const client = getSupabaseClient();
    const { error } = await client
      .from('wardrobes')
      .delete()
      .eq('id', id);
    if (error) throw new Error(`删除失败: ${error.message}`);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
