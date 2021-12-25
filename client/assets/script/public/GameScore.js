// --------------------------------------------------------
// 游戏分数相关方法
// --------------------------------------------------------
// 
// --------------------------------------------------------
"use strict";

const config = require('../Config');
const utility = require('./Utility');

const gameScore = {
    // 获取历史最大得分
    GetMaxScore: function () {
        let name = config.itemName.score;
        let score = cc.sys.localStorage.getItem(name);
        return !score ? 0 : score;
    },

    // 获得今日最大得分
    GetTodayScore: function () {
        let today = utility.FormatDate('YYYY-mm-dd');
        let score = cc.sys.localStorage.getItem(today);
        return !score ? 0 : score;
    },

    // 设置历史最大得分，返回是否更新
    SetMaxScore: function (score, force) {
        let scoreMax = this.GetMaxScore();
        let scoreNew = force ? score : Math.max(score, scoreMax);
        let name = config.itemName.score;
        cc.sys.localStorage.setItem(name, scoreNew);
        return (scoreNew != scoreMax);
    },

    // 设置今日最大得分，返回是否更新
    SetTodayScore: function (score, force) {
        let scoreToday = this.GetTodayScore();
        let scoreNew = force ? score : Math.max(score, scoreToday);
        let today = utility.FormatDate('YYYY-mm-dd');
        cc.sys.localStorage.setItem(today, scoreNew);
        return (scoreNew != scoreToday);
    },
};

module.exports = gameScore;