/**
 * 领域类型定义（JSDoc 形式，纯 JS 项目）
 * 结构与 docs/DEV.md §3 一一对应，改字段先改文档
 */

/** @typedef {string} 期号，如 "2025041" */

/**
 * 一期开奖
 * @typedef {Object} SSQDraw
 * @property {string} issue   期号，如 "2025041"
 * @property {string} date    开奖日期 "YYYY-MM-DD"
 * @property {number[]} reds  6 个升序红球 1–33
 * @property {number} blue    蓝球 1–16
 */

/**
 * 一组生成结果
 * @typedef {Object} SSQPick
 * @property {number[]} reds  6 个升序红球
 * @property {number} blue    蓝球
 */
 
 /**
  * 卦签夹中收藏的一签
  * @typedef {Object} StoredPick
  * @property {string} id      唯一标识
  * @property {number[]} reds  6 个升序红球
  * @property {number} blue    蓝球
  * @property {string} algo    生成算法 'math' | 'oracle' | 'destiny'
  * @property {string} savedAt 收藏时间 ISO 字符串
  */

/**
 * 幸运号约束（锁定 + 排除）
 * @typedef {Object} NumberLocks
 * @property {number[]} redLocks      锁定红球，0–6 个
 * @property {number|null} blueLock   锁定蓝球，最多 1 个
 * @property {number[]} redExcludes   排除红球
 * @property {number[]} blueExcludes  排除蓝球
 */

/**
 * 卦象推演盘面（oracle 算法专属产出）
 * @typedef {Object} OracleReading
 * @property {{year: string, day: string, hour: string}} ganzhi  干支标注
 * @property {string} liurenPalace    小六壬落宫名
 * @property {string} liurenMeaning   宫位断语
 * @property {string} guaName         本卦卦名，如 "水火既济"
 * @property {string} guaText         卦辞摘录
 * @property {string} guaTemper       卦性：进取/守成/变通/静守
 * @property {{element: string, weight: number}[]} wuxingWeights 五行旺衰
 */

/**
 * 算法统一上下文
 * @typedef {Object} AlgoContext
 * @property {SSQDraw[]} history    最近 45 期（降序）
 * @property {NumberLocks} locks    锁定号
 * @property {NumberLocks} excludes 排除号
  * @property {Date} now             起局时刻
  * @property {string|null} [birth]  生日 YYYY-MM-DD，命理盘算法必填
  */
/**
 * 算法统一输出
 * @typedef {Object} AlgoResult
 * @property {SSQPick[]} groups           1–5 组
 * @property {OracleReading|null} reading 推演盘面，仅 oracle 算法有
 */

export {};
