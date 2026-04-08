# idle-empire 品牌赞助合作指南

> 最后更新：2026-04-07

## 合作模式

**B2B2C 三角模型**：企业支付赞助费 → 游戏内植入品牌事件 → 玩家观看获得游戏金币

## 赞助事件示例

### 品牌发布事件
在游戏内触发"某科技公司新品发布"事件，玩家观看 30 秒直播后获得 5,000 金币奖励。

```
品牌：科技星
事件：新品发布直播
时长：120 秒
金币奖励：5,000
```

## 赞助配置

编辑 `brands/config.json` 添加品牌和活动：

```json
{
  "sponsored_events": [
    {
      "id": "brand_xxx",
      "brand": "品牌名",
      "name": "活动名称",
      "description": "活动描述",
      "coin_reward": 5000,
      "duration_seconds": 120,
      "active": true,
      "campaign_start": "2026-04-01T00:00:00Z",
      "campaign_end": "2026-12-31T23:59:59Z"
    }
  ]
}
```

## 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识 |
| brand | string | 品牌名 |
| name | string | 活动名称 |
| description | string | 活动描述 |
| coin_reward | number | 完成后奖励金币数 |
| duration_seconds | number | 事件持续时间（秒） |
| active | boolean | 是否激活 |
| campaign_start | string | 活动开始时间（ISO 8601） |
| campaign_end | string | 活动结束时间（ISO 8601） |

## 联系方式

商务合作：bd@idle-empire.example
