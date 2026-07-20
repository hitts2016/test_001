import { Router } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = Router();

// GET /api/v1/clothes - 获取衣服列表
// Query: wardrobe_id?: number, slot_id?: string, type?: string, season?: string
router.get('/', async (req, res, next) => {
  try {
    const { wardrobe_id, slot_id, type, season } = req.query;
    const client = getSupabaseClient();
    let query = client
      .from('clothes')
      .select('id, wardrobe_id, slot_id, name, type, season, image_key, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (wardrobe_id) {
      query = query.eq('wardrobe_id', parseInt(wardrobe_id as string, 10));
    }
    if (slot_id) {
      query = query.eq('slot_id', slot_id as string);
    }
    if (type && type !== 'all') {
      query = query.eq('type', type as string);
    }
    if (season && season !== 'all') {
      query = query.eq('season', season as string);
    }

    const { data, error } = await query;
    if (error) throw new Error(`查询失败: ${error.message}`);
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/clothes/:id - 获取单个衣服
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('clothes')
      .select('id, wardrobe_id, slot_id, name, type, season, image_key, created_at, updated_at')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`查询失败: ${error.message}`);
    if (!data) {
      res.status(404).json({ error: '衣服不存在' });
      return;
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/clothes - 添加衣服
// Body: wardrobe_id: number, slot_id?: string, name: string, type: string, season: string, image_key?: string
router.post('/', async (req, res, next) => {
  try {
    const { wardrobe_id, slot_id, name, type, season, image_key } = req.body;
    if (!name || !wardrobe_id) {
      res.status(400).json({ error: '衣服名称和衣柜ID不能为空' });
      return;
    }
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('clothes')
      .insert({
        wardrobe_id,
        slot_id: slot_id || null,
        name,
        type: type || 'other',
        season: season || 'all',
        image_key: image_key || null,
      })
      .select()
      .single();
    if (error) throw new Error(`创建失败: ${error.message}`);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/clothes/:id - 更新衣服
// Body: slot_id?: string, name?: string, type?: string, season?: string, image_key?: string
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updateData: Record<string, unknown> = {};
    if (req.body.slot_id !== undefined) updateData.slot_id = req.body.slot_id;
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.type) updateData.type = req.body.type;
    if (req.body.season) updateData.season = req.body.season;
    if (req.body.image_key !== undefined) updateData.image_key = req.body.image_key;
    updateData.updated_at = new Date().toISOString();

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('clothes')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw new Error(`更新失败: ${error.message}`);
    if (!data) {
      res.status(404).json({ error: '衣服不存在' });
      return;
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/clothes/:id - 删除衣服
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const client = getSupabaseClient();
    const { error } = await client
      .from('clothes')
      .delete()
      .eq('id', id);
    if (error) throw new Error(`删除失败: ${error.message}`);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
